import "dotenv/config";
import path from "path";
import fs from "fs";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

function getDbPath(): string {
  if (process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL?.startsWith("libsql:")) {
    return process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL!;
  }
  
  // On Vercel / AWS Lambda, the project directory is read-only.
  // We copy dev.db to /tmp so SQLite write operations succeed.
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NODE_ENV === "production") {
    const tmpDbPath = "/tmp/dev.db";
    const srcDbPath = path.resolve(process.cwd(), "prisma/dev.db");
    
    try {
      if (!fs.existsSync(tmpDbPath) && fs.existsSync(srcDbPath)) {
        fs.copyFileSync(srcDbPath, tmpDbPath);
      }
    } catch (e) {
      console.warn("Could not copy sqlite db to /tmp:", e);
    }
    return `file:${tmpDbPath}`;
  }

  return `file:${path.resolve(process.cwd(), "prisma/dev.db")}`;
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrisma() {
  const url = getDbPath();
  const adapter = new PrismaLibSql({ 
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
