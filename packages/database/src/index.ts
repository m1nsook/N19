import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { SCHEMA_V1, SCHEMA_VERSION, type AccountRow } from "./schema";

export const defaultSQLitePath = resolve(import.meta.dir, "../../../.local/n19.sqlite");

export function sqlitePath(): string {
  return process.env.N19_SQLITE_PATH || defaultSQLitePath;
}

export function openLocalDatabase(path = sqlitePath()): Database {
  if (path !== ":memory:") mkdirSync(dirname(resolve(path)), { recursive: true });
  const db = new Database(path, { create: true, strict: true });
  try {
    db.exec("PRAGMA foreign_keys = ON");
    db.exec("PRAGMA busy_timeout = 5000");
    if (path !== ":memory:") db.exec("PRAGMA journal_mode = WAL");
    db.transaction(() => {
      db.exec(SCHEMA_V1[0]);
      const versions = db.query<{ version: number }, []>("SELECT version FROM n19_schema_version").all();
      if (versions.length === 0) {
        db.exec(SCHEMA_V1[1]);
        db.query("INSERT INTO n19_schema_version (version) VALUES (?)").run(SCHEMA_VERSION);
      } else if (versions.length !== 1 || versions[0].version !== SCHEMA_VERSION) {
        throw new Error("Unsupported SQLite schema version");
      }
    })();
    return db;
  } catch (error) {
    db.close();
    throw error;
  }
}

export function readAccountSnapshot(db: Database): AccountRow[] {
  return db.transaction(() => {
    const versions = db.query<{ version: number }, []>("SELECT version FROM n19_schema_version").all();
    if (versions.length !== 1 || versions[0].version !== SCHEMA_VERSION) {
      throw new Error("Unsupported source schema version");
    }
    // Fail closed if a new application table was added without transfer support.
    const tables = db.query<{ name: string }, []>(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    ).all().map((row) => row.name);
    if (tables.join(",") !== "accounts,n19_schema_version") throw new Error("Unsupported source tables");
    return db.query<AccountRow, []>("SELECT id, handle, display_name, created_at FROM accounts ORDER BY id").all();
  })();
}
