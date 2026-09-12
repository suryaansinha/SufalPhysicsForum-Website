import mysql from 'mysql2/promise';
import type {
  ArgType,
  ConnectionInfo,
  IsolationLevel,
  SqlDriverAdapter,
  SqlDriverAdapterFactory,
  SqlQuery,
  SqlQueryable,
  SqlResultSet,
  Transaction,
  TransactionOptions,
} from '@prisma/driver-adapter-utils';
import { ColumnTypeEnum, DriverAdapterError } from '@prisma/driver-adapter-utils';
import { logFullError } from './error-log';

const ADAPTER_NAME = 'prisma-mysql2-adapter';
const UNSIGNED_FLAG = 1 << 5;
const BINARY_COLLATION_INDEX = 63;

type Mysql2Error = Error & {
  errno?: number;
  sqlMessage?: string | null;
  sqlState?: string | null;
  code?: string;
  cause?: { message?: string };
};

type QueryClient = {
  query: mysql.Connection['query'];
  execute: mysql.Connection['execute'];
};

function isDriverError(error: unknown): error is Mysql2Error {
  const err = error as Mysql2Error;
  return typeof err?.errno === 'number';
}

function mapDriverError(error: Mysql2Error) {
  switch (error.errno) {
    case 1062: {
      const index = error.sqlMessage?.split(' ').pop()?.split("'").at(1)?.split('.').pop();
      return { kind: 'UniqueConstraintViolation' as const, constraint: index !== undefined ? { index } : undefined };
    }
    case 1451:
    case 1452: {
      const field = error.sqlMessage?.split(' ').at(17)?.split('`').at(1);
      return {
        kind: 'ForeignKeyConstraintViolation' as const,
        constraint: field !== undefined ? { fields: [field] } : undefined,
      };
    }
    case 1263: {
      const index = error.sqlMessage?.split(' ').pop()?.split("'").at(1);
      return { kind: 'NullConstraintViolation' as const, constraint: index !== undefined ? { index } : undefined };
    }
    case 1264:
      return { kind: 'ValueOutOfRange' as const, cause: error.sqlMessage ?? 'N/A' };
    case 1364:
    case 1048: {
      const field = error.sqlMessage?.split(' ').at(1)?.split("'").at(1);
      return {
        kind: 'NullConstraintViolation' as const,
        constraint: field !== undefined ? { fields: [field] } : undefined,
      };
    }
    case 1049: {
      const db = error.sqlMessage?.split(' ').pop()?.split("'").at(1);
      return { kind: 'DatabaseDoesNotExist' as const, db };
    }
    case 1007: {
      const db = error.sqlMessage?.split(' ').at(3)?.split("'").at(1);
      return { kind: 'DatabaseAlreadyExists' as const, db };
    }
    case 1044: {
      const db = error.sqlMessage?.split(' ').pop()?.split("'").at(1);
      return { kind: 'DatabaseAccessDenied' as const, db };
    }
    case 1045: {
      const user = error.sqlMessage?.split(' ').at(4)?.split('@').at(0)?.split("'").at(1);
      return { kind: 'AuthenticationFailed' as const, user };
    }
    case 1146: {
      const table = error.sqlMessage?.split(' ').at(1)?.split("'").at(1)?.split('.').pop();
      return { kind: 'TableDoesNotExist' as const, table };
    }
    case 1054: {
      const column = error.sqlMessage?.split(' ').at(2)?.split("'").at(1);
      return { kind: 'ColumnNotFound' as const, column };
    }
    case 1406: {
      const column = error.sqlMessage?.split(' ').flatMap((part) => part.split("'")).at(6);
      return { kind: 'LengthMismatch' as const, column };
    }
    case 1191:
      return { kind: 'MissingFullTextSearchIndex' as const };
    case 1213:
      return { kind: 'TransactionWriteConflict' as const };
    case 1040:
    case 1203:
      return { kind: 'TooManyConnections' as const, cause: error.sqlMessage ?? error.message ?? 'N/A' };
    default:
      return {
        kind: 'mysql' as const,
        code: error.errno ?? 0,
        message: error.sqlMessage ?? error.message ?? 'N/A',
        state: error.sqlState ?? 'N/A',
        cause: error.cause?.message,
      };
  }
}

function convertDriverError(error: unknown) {
  if (isDriverError(error)) {
    return {
      originalCode: error.errno?.toString(),
      originalMessage: error.sqlMessage ?? error.message ?? 'N/A',
      ...mapDriverError(error),
    };
  }
  throw error;
}

function flagValue(flags: number | string[] | undefined): number {
  if (typeof flags === 'number') return flags;
  return 0;
}

function mapColumnType(field: mysql.FieldPacket) {
  const type = field.columnType ?? field.type ?? 0;
  switch (type) {
    case 0x01:
    case 0x02:
    case 0x09:
    case 0x0d:
      return ColumnTypeEnum.Int32;
    case 0x03:
      return flagValue(field.flags) & UNSIGNED_FLAG ? ColumnTypeEnum.Int64 : ColumnTypeEnum.Int32;
    case 0x08:
      return ColumnTypeEnum.Int64;
    case 0x04:
      return ColumnTypeEnum.Float;
    case 0x05:
      return ColumnTypeEnum.Double;
    case 0x07:
    case 0x0c:
      return ColumnTypeEnum.DateTime;
    case 0x0a:
    case 0x0e:
      return ColumnTypeEnum.Date;
    case 0x0b:
      return ColumnTypeEnum.Time;
    case 0x00:
    case 0xf6:
      return ColumnTypeEnum.Numeric;
    case 0x0f:
    case 0xfd:
    case 0xfe:
    case 0xfc:
    case 0xf9:
    case 0xfa:
    case 0xfb:
      if (field.extendedFormat === 'json') return ColumnTypeEnum.Json;
      if ((field.charsetNr ?? field.characterSet) === BINARY_COLLATION_INDEX) return ColumnTypeEnum.Bytes;
      return ColumnTypeEnum.Text;
    case 0xf7:
      return ColumnTypeEnum.Enum;
    case 0xf5:
      return ColumnTypeEnum.Json;
    case 0xf8:
      return ColumnTypeEnum.Set;
    case 0x10:
    case 0xff:
      return ColumnTypeEnum.Bytes;
    case 0x06:
      return ColumnTypeEnum.Int32;
    default:
      return ColumnTypeEnum.Text;
  }
}

function pad(n: number, z = 2): string {
  return String(n).padStart(z, '0');
}

function formatDateTime(date: Date): string {
  const ms = date.getUTCMilliseconds();
  return (
    pad(date.getUTCFullYear(), 4) +
    '-' +
    pad(date.getUTCMonth() + 1) +
    '-' +
    pad(date.getUTCDate()) +
    ' ' +
    pad(date.getUTCHours()) +
    ':' +
    pad(date.getUTCMinutes()) +
    ':' +
    pad(date.getUTCSeconds()) +
    (ms ? '.' + String(ms).padStart(3, '0') : '')
  );
}

function formatDate(date: Date): string {
  return pad(date.getUTCFullYear(), 4) + '-' + pad(date.getUTCMonth() + 1) + '-' + pad(date.getUTCDate());
}

function formatTime(date: Date): string {
  const ms = date.getUTCMilliseconds();
  return (
    pad(date.getUTCHours()) +
    ':' +
    pad(date.getUTCMinutes()) +
    ':' +
    pad(date.getUTCSeconds()) +
    (ms ? '.' + String(ms).padStart(3, '0') : '')
  );
}

function mapArg(arg: unknown, argType: ArgType): unknown {
  if (arg === null || arg === undefined) return null;
  if (typeof arg === 'string' && argType.scalarType === 'bigint') return BigInt(arg);
  let value: unknown = arg;
  if (typeof arg === 'string' && argType.scalarType === 'datetime') {
    value = new Date(arg);
  }
  if (value instanceof Date) {
    switch (argType.dbType) {
      case 'TIME':
        return formatTime(value);
      case 'DATE':
      case 'NEWDATE':
        return formatDate(value);
      default:
        return formatDateTime(value);
    }
  }
  if (typeof arg === 'string' && argType.scalarType === 'bytes') {
    return Buffer.from(arg, 'base64');
  }
  if (ArrayBuffer.isView(arg)) {
    return Buffer.from(arg.buffer, arg.byteOffset, arg.byteLength);
  }
  return value;
}

function mapRow(row: unknown[], fields: mysql.FieldPacket[]): unknown[] {
  return row.map((value, i) => {
    if (value === null || value === undefined) return null;
    const type = fields[i]?.columnType ?? fields[i]?.type;
    if (type === 0x07 || type === 0x0c) {
      return new Date(`${value}Z`).toISOString().replace(/(\.000)?Z$/, '+00:00');
    }
    if (typeof value === 'bigint') return value.toString();
    if (Buffer.isBuffer(value)) return value;
    return value;
  });
}

class Mysql2Queryable implements SqlQueryable {
  readonly provider = 'mysql' as const;
  readonly adapterName = ADAPTER_NAME;

  constructor(protected readonly client: QueryClient) {}

  async queryRaw(query: SqlQuery): Promise<SqlResultSet> {
    const result = await this.performIO(query);
    return {
      columnNames: result.fields.map((field) => field.name),
      columnTypes: result.fields.map(mapColumnType),
      rows: result.rows.map((row) => mapRow(row, result.fields)),
      lastInsertId: result.insertId?.toString(),
    };
  }

  async executeRaw(query: SqlQuery): Promise<number> {
    return (await this.performIO(query)).affectedRows ?? 0;
  }

  protected async performIO(query: SqlQuery): Promise<{
    rows: unknown[][];
    fields: mysql.FieldPacket[];
    affectedRows?: number;
    insertId?: number;
  }> {
    try {
      const values = query.args.map((arg, i) =>
        mapArg(arg, query.argTypes[i] ?? { scalarType: 'unknown', arity: 'scalar' })
      );
      const [rows, fields] = await this.client.query({
        sql: query.sql,
        values,
        rowsAsArray: true,
        dateStrings: true,
      });
      if (Array.isArray(rows)) {
        return { rows: rows as unknown[][], fields };
      }
      const header = rows as mysql.ResultSetHeader;
      return {
        rows: [],
        fields: fields ?? [],
        affectedRows: header.affectedRows,
        insertId: header.insertId,
      };
    } catch (error) {
      this.onError(error);
    }
  }

  protected onError(error: unknown): never {
    logFullError(error, 'prisma-mysql2-adapter');
    throw new DriverAdapterError(convertDriverError(error));
  }
}

class Mysql2Transaction extends Mysql2Queryable implements Transaction {
  readonly options: TransactionOptions = { usePhantomQuery: true };

  constructor(
    private readonly conn: mysql.PoolConnection,
    private readonly cleanup: () => void
  ) {
    super(conn);
  }

  async commit(): Promise<void> {
    try {
      await this.conn.query('COMMIT');
    } catch (error) {
      this.onError(error);
    } finally {
      this.cleanup();
      this.conn.release();
    }
  }

  async rollback(): Promise<void> {
    try {
      await this.conn.query('ROLLBACK');
    } catch (error) {
      this.onError(error);
    } finally {
      this.cleanup();
      this.conn.release();
    }
  }
}

class PrismaMysql2Adapter extends Mysql2Queryable implements SqlDriverAdapter {
  constructor(
    private readonly pool: mysql.Pool,
    private readonly database?: string
  ) {
    super(pool);
  }

  async executeScript(script: string): Promise<void> {
    try {
      await this.pool.query(script);
    } catch (error) {
      this.onError(error);
    }
  }

  getConnectionInfo(): ConnectionInfo {
    return {
      schemaName: this.database,
      supportsRelationJoins: true,
    };
  }

  async startTransaction(isolationLevel?: IsolationLevel): Promise<Transaction> {
    const conn = await this.pool.getConnection();
    conn.on('error', (error) => {
      logFullError(error, 'prisma-mysql2-adapter connection error');
    });
    const cleanup = () => {
      conn.removeAllListeners('error');
    };
    try {
      const tx = new Mysql2Transaction(conn, cleanup);
      if (isolationLevel) {
        await conn.query(`SET TRANSACTION ISOLATION LEVEL ${isolationLevel}`);
      }
      await conn.query('BEGIN');
      return tx;
    } catch (error) {
      cleanup();
      conn.release();
      this.onError(error);
    }
  }

  async dispose(): Promise<void> {
    await this.pool.end();
  }
}

export class PrismaMysql2 implements SqlDriverAdapterFactory {
  readonly provider = 'mysql' as const;
  readonly adapterName = ADAPTER_NAME;

  constructor(
    private readonly config: mysql.PoolOptions,
    private readonly database?: string
  ) {}

  async connect(): Promise<SqlDriverAdapter> {
    const pool = mysql.createPool(this.config);
    pool.on('connection', (conn) => {
      conn.on('error', (error) => {
        logFullError(error, 'prisma-mysql2-adapter pool connection error');
      });
    });
    return new PrismaMysql2Adapter(pool, this.database ?? this.config.database);
  }
}
