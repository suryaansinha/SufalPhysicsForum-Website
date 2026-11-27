import { prisma } from '../lib/prisma';

/**
 * Central home for every prisma.$queryRaw / prisma.$executeRaw call.
 *
 * Keep vendor-specific SQL here (and only here) so a future Postgres
 * migration has one file to rewrite. Do not scatter raw SQL in controllers.
 *
 * MYSQL-SPECIFIC FLAG KEY:
 *   None of the queries below currently use backticks, LIKE BINARY,
 *   ON DUPLICATE KEY, or GROUP_CONCAT. Re-check this file if new raw
 *   SQL is added.
 */

/**
 * Health-check ping used by GET /api/health.
 *
 * Portable: `SELECT 1` is valid in both MySQL and PostgreSQL.
 * MYSQL-SPECIFIC: none.
 */
export async function pingDatabase(): Promise<unknown> {
  return prisma.$queryRaw`SELECT 1`;
}
