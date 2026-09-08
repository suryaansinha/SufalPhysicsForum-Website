# MySQL portability notes

Guardrails added so this backend can move back to PostgreSQL without hunting vendor SQL. Current `schema.prisma` in this repo still declares `provider = "postgresql"` and `pg` / `@prisma/adapter-pg`; treat that as a local checkout mismatch if production already runs MySQL.

## What was moved / changed

### Raw SQL isolation

- Created `server/src/db/raw-queries.ts`.
- Moved the only application `$queryRaw` (`SELECT 1` health ping) out of `server/src/index.ts`.
- `GET /api/health` now calls `pingDatabase()`.
- No `$executeRaw` calls existed in application code.

### Explicit email case-folding

Emails are lowercased on write and on lookup so uniqueness/login does not depend on MySQL's default case-insensitive collation (which PostgreSQL does not share).

| File | Change |
|------|--------|
| `server/src/utils/email.ts` | New `normalizeEmail()` helper (`trim` + `toLowerCase`) |
| `server/src/controllers/auth.controller.ts` | Register / login / Google signup+lookup |
| `server/src/controllers/student.controller.ts` | Student create uniqueness check + write |
| `server/src/controllers/institute.controller.ts` | Institute email update |
| `server/prisma/seed.ts` | Seed teacher / student / institute emails |

Login still uses the same Prisma `findUnique` / `findFirst` paths; only the email string is normalized.

### UTC month bounds

- `server/src/controllers/fee.controller.ts` `getFeeStats` now uses `Date.UTC(...)` for start/end of month instead of the Node process local timezone.

## What was flagged but left alone

### Vendor driver / schema (this checkout)

- `schema.prisma` `datasource db { provider = "postgresql" }`
- `server/src/lib/prisma.ts` still uses `pg` + `@prisma/adapter-pg`
- `server/prisma/seed.ts` still constructs `PrismaPg`
- `server/package.json` still lists `pg` and `@prisma/adapter-pg`

Do not swap these here: production is reported working on MySQL, and changing the provider in this checkout would break local Postgres unless credentials/adapters are also switched.

### Schema native types (portable)

- `@db.Text` on `Institute.aboutDescription`, `Institute.experienceText`, `Testimonial.content`, `ForumQuestion.body`, `ForumAnswer.body` — valid on MySQL and PostgreSQL. Leave as-is.
- `Attendance.date DateTime @db.Date` — date-only column; both engines support `@db.Date`. Keep.
- Prisma `enum Role` / `enum AttendanceStatus` blocks — not raw MySQL `ENUM()` columns.
- No `@db.Year`, `@db.TinyText`, `@@fulltext`, or `MATCH/AGAINST`.
- No array fields (`String[]` / `Int[]`).
- No `@default(dbgenerated(...))`.

### Integer autoincrement IDs

No `Int @id @default(autoincrement())`. All models already use `String @id @default(cuid())`. No ID-format change needed.

### DateTime usage

All timestamp fields are Prisma `DateTime`. Writes use `new Date()` / `Date.now()` (UTC epoch) except:

- `attendance.controller.ts` already parses calendar dates as `YYYY-MM-DDT00:00:00.000Z`.
- `homework.controller.ts` / `live-class.controller.ts` / `fee.controller.ts` parse client-supplied ISO/date strings via `new Date(...)` — depends on the client sending UTC or an offset. Left unchanged to avoid login/auth regressions; review if homework/live-class times look timezone-shifted after a Postgres move.

## Future Postgres migration checklist

1. Change `schema.prisma` `provider` to `"postgresql"` if production is currently `"mysql"`.
2. Swap `mysql2` / `@prisma/adapter-mysql` (if present in production) back to `pg` / `@prisma/adapter-pg` (already in this checkout).
3. Point `DATABASE_URL` / `DATABASE_URL_V2` at a Postgres URI (`postgresql://...`).
4. Re-run `prisma migrate` / `db push` against empty Postgres; dump/restore data separately (MySQL dump is not a Postgres restore).
5. Rewrite anything in `server/src/db/raw-queries.ts` that has a `MYSQL-SPECIFIC` flag. Current query (`SELECT 1`) needs no rewrite.
6. Confirm emails were stored lowercased (this change). Existing mixed-case rows in MySQL would miss lookups on Postgres until a one-time `UPDATE ... SET email = LOWER(email)`.
7. Set MySQL session timezone is irrelevant after the move; keep writing UTC `Date` objects as this app already does for auth tokens.

## Final grep checklist

Application / schema / seed only (generated Prisma client and Prisma skill docs omitted).

### `$queryRaw` / `$executeRaw`

| File | Line | Notes |
|------|------|-------|
| `server/src/db/raw-queries.ts` | 22 | Isolated health ping `SELECT 1`. Portable. |
| `server/src/generated/prisma/internal/class.ts` | 127, 132, 139, 144, 150, 155, 162, 167 | Generated Prisma client API. Ignore. |
| `server/src/generated/prisma/internal/prismaNamespace.ts` | 1399, 1403, 1407, 1411 | Generated. Ignore. |

No remaining `$queryRaw` / `$executeRaw` in controllers or routes.

### `AUTO_INCREMENT`

No matches in application, schema, or migrations.

### `ENGINE=`

No matches.

### `LIKE BINARY`

No matches.

### `ON DUPLICATE KEY`

No matches.

### Other MySQL-ish hits

| File | Line | Notes |
|------|------|-------|
| `server/.agents/skills/prisma-client-api/references/raw-queries.md` | 160 | Skill doc example `MATCH(...) AGAINST(...)`. Not used by the app. |
