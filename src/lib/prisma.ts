import "dotenv/config";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

function getLibSqlConfig() {
  // If running in Jest test runner, strictly use the dedicated test database
  if (process.env.NODE_ENV === "test" && process.env.TEST_DATABASE_URL) {
    return {
      url: process.env.TEST_DATABASE_URL,
      authToken: process.env.TEST_TURSO_AUTH_TOKEN,
    };
  }

  // Prefer TURSO_DATABASE_URL or libsql/file URLs; ignore postgres strings that don't match SQLite/LibSQL adapter
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const dbUrl = process.env.DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (tursoUrl && (tursoUrl.startsWith("libsql:") || tursoUrl.startsWith("https:"))) {
    return {
      url: tursoUrl,
      authToken,
    };
  }

  if (dbUrl && (dbUrl.startsWith("libsql:") || dbUrl.startsWith("file:"))) {
    return {
      url: dbUrl,
      authToken,
    };
  }

  // Local SQLite file fallback
  const filePath = path.resolve(process.cwd(), "prisma/dev.db");
  return {
    url: `file:${filePath}`,
  };
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrisma() {
  const config = getLibSqlConfig();
  const adapter = new PrismaLibSql(config);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;


