import "dotenv/config";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

function getLibSqlConfig() {
  const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (url && (url.startsWith("libsql:") || url.startsWith("https:") || authToken)) {
    return {
      url,
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


