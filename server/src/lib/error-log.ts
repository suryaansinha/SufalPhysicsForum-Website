import { inspect } from 'util';

export function stringifyError(err: unknown): string {
  if (err == null) {
    return String(err);
  }
  if (typeof err !== 'object') {
    return String(err);
  }
  try {
    return JSON.stringify(err, Object.getOwnPropertyNames(err), 2);
  } catch {
    return inspect(err, { depth: null, showHidden: true });
  }
}

export function logFullError(err: unknown, source?: string): void {
  if (source) {
    console.error(`FULL ERROR SOURCE: ${source}`);
  }
  console.error('FULL ERROR:', stringifyError(err));
  const rec = err as { cause?: unknown; constructor?: { name?: string } } | null;
  console.error('ERROR CAUSE:', rec?.cause);
  if (rec?.cause && typeof rec.cause === 'object') {
    console.error('ERROR CAUSE FULL:', stringifyError(rec.cause));
  }
  console.error('ERROR CONSTRUCTOR:', rec?.constructor?.name);
}
