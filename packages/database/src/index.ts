import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { SCHEMA_V1, SCHEMA_V2, SCHEMA_VERSION, type AccountRow, type CredentialRow, type ProfileRow } from "./schema";

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
      if (versions.length > 1) throw new Error("Unsupported SQLite schema version");
      let version = versions[0]?.version ?? 0;
      if (version === 0 && versions.length === 0) {
        db.exec(SCHEMA_V1[1]);
        db.query("INSERT INTO n19_schema_version (version) VALUES (1)").run();
        version = 1;
      }
      if (version === 1) {
        for (const statement of SCHEMA_V2) db.exec(statement);
        db.exec("UPDATE n19_schema_version SET version = 2");
        version = 2;
      }
      if (version !== SCHEMA_VERSION) throw new Error("Unsupported SQLite schema version");
    }).immediate();
    return db;
  } catch (error) {
    db.close();
    throw error;
  }
}

export function readDatabaseSnapshot(db: Database) {
  return db.transaction(() => {
    const versions = db.query<{ version: number }, []>("SELECT version FROM n19_schema_version").all();
    if (versions.length !== 1 || versions[0].version !== SCHEMA_VERSION) throw new Error("Unsupported source schema version");
    const tables = db.query<{ name: string }, []>(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    ).all().map((row) => row.name);
    if (tables.join(",") !== "accounts,credentials,n19_schema_version,profiles,sessions") throw new Error("Unsupported source tables");
    if (db.query("PRAGMA foreign_key_check").all().length) throw new Error("Invalid source relationships");
    return {
      accounts: db.query<AccountRow, []>("SELECT id, handle, display_name, created_at FROM accounts ORDER BY id").all(),
      credentials: db.query<CredentialRow, []>("SELECT account_id, email, password_hash FROM credentials ORDER BY account_id").all(),
      profiles: db.query<ProfileRow, []>("SELECT account_id, bio FROM profiles ORDER BY account_id").all(),
    };
  })();
}

// Preserve the existing helper for callers. Sessions are deliberately never exported.
export function readAccountSnapshot(db: Database): AccountRow[] {
  return readDatabaseSnapshot(db).accounts;
}
