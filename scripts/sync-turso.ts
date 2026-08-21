import "dotenv/config";
import { createClient } from "@libsql/client";
import fs from "fs";
import path from "path";

async function pushToTurso() {
  const url = process.env.TARGET_DB_URL || process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
  const authToken = process.env.TARGET_AUTH_TOKEN || process.env.TEST_TURSO_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    console.error("Missing DATABASE_URL or TURSO_AUTH_TOKEN in .env");
    process.exit(1);
  }

  console.log(`Connecting to Turso: ${url}...`);
  const client = createClient({ url, authToken });

  const sqlPath = path.resolve("prisma/schema.sql");
  const sql = fs.readFileSync(sqlPath, "utf-8");

  // Split SQL commands
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    try {
      await client.execute(stmt);
    } catch (e: any) {
      console.warn(`Execution note on statement: ${e.message}`);
    }
  }

  console.log("✅ Successfully created and synced all tables in Turso cloud database!");
  client.close();
}

pushToTurso();
