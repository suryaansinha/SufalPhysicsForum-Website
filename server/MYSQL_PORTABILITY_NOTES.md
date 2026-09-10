# MySQL portability notes

This file records the MySQL switch and what still needs a live GoDaddy confirmation. Signup/login are **not** marked working here.

## Completed in code (not live-verified)

- `schema.prisma` `datasource db { provider = "mysql" }`
- Prisma runtime uses `@prisma/adapter-mariadb` with `connectionLimit: 5` from GoDaddy `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME`
- `mysql2` remains for the one-off `GET /api/diag/mysql` / startup `SELECT 1` probe
- `pg` and `@prisma/adapter-pg` removed from `server/package.json`
- Postgres init migration SQL replaced with MySQL SQL from `prisma migrate diff --from-empty`
- `migration_lock.toml` provider is `mysql`
- `postbuild` still runs `cd server && npx prisma migrate deploy || true`
- Runtime `applyMigrations()` now builds `DATABASE_URL` from `DB_*` for Prisma CLI
- Startup now logs `Startup Prisma+MySQL query probe:` after `prisma.institute.findFirst()`
- Emails still lowercased on write/lookup (`normalizeEmail`) so uniqueness does not depend on MySQL collation
- Raw SQL still isolated in `server/src/db/raw-queries.ts` (`SELECT 1` only; portable)

## Schema choices left as-is (portable)

- IDs remain `String @id @default(cuid())` (already not Int autoincrement)
- `@db.Text` on long text fields
- `Attendance.date DateTime @db.Date`
- Prisma `enum` blocks (MySQL maps these to native ENUM in generated SQL; Prisma enums stay in schema)
- No array fields, no `@db.Uuid`, no `@default(dbgenerated(...))`, no `@db.Year` / `@db.TinyText` / fulltext

## Live verification still required

Do not treat this migration as working until GoDaddy logs show:

1. `prisma migrate deploy` creating MySQL tables (not P1001)
2. `Startup MySQL probe: { ok: true, ... }`
3. `Startup Prisma+MySQL query probe: { ok: true, ... }`
4. A real signup and login on the live site

## Future Postgres move

1. Switch `provider` back to `"postgresql"`
2. Replace `@prisma/adapter-mariadb` with `@prisma/adapter-pg` / `pg`
3. Replace the MySQL migration history with a fresh Postgres migration
4. Keep `normalizeEmail` and `server/src/db/raw-queries.ts`
5. Existing mixed-case emails (if any were stored before lowercasing) would miss lookups on Postgres until `UPDATE ... SET email = LOWER(email)`
