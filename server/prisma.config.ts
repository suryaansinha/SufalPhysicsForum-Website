import "dotenv/config";
import { defineConfig } from "prisma/config";
import { buildMysqlDatabaseUrl } from "./src/lib/mysql-url";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: buildMysqlDatabaseUrl(),
  },
});
