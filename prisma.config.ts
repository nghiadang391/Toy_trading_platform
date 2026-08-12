import "dotenv/config";
import path from "path";
import { defineConfig } from "prisma/config";

const DB_PATH = `file:${path.resolve("prisma/dev.db")}`;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: DB_PATH,
  },
});
