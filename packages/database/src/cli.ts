import { Database } from "bun:sqlite";
import { SQL } from "bun";
import { openLocalDatabase, readAccountSnapshot, sqlitePath } from "./index";
import { SCHEMA_V1, SCHEMA_VERSION } from "./schema";

async function migratePostgres() {
  const url = process.env.N19_POSTGRES_URL;
  if (!url || !/^postgres(?:ql)?:\/\//.test(url)) throw new Error("Set N19_POSTGRES_URL to a PostgreSQL connection URL");
  const source = new Database(sqlitePath(), { readonly: true, strict: true });
  const rows = (() => {
    try { return readAccountSnapshot(source); }
    finally { source.close(); }
  })();
  const target = new SQL(url);
  try {
    await target.begin(async (tx) => {
      for (const statement of SCHEMA_V1) await tx.unsafe(statement);
      await tx.unsafe("LOCK TABLE n19_schema_version, accounts IN ACCESS EXCLUSIVE MODE");
      const versions = await tx`SELECT version FROM n19_schema_version`;
      if (versions.length === 0) {
        await tx`INSERT INTO n19_schema_version (version) VALUES (${SCHEMA_VERSION})`;
      } else if (versions.length !== 1 || Number(versions[0].version) !== SCHEMA_VERSION) {
        throw new Error("Unsupported PostgreSQL schema version");
      }
      const existing = await tx`SELECT COUNT(*) AS count FROM accounts`;
      if (Number(existing[0].count) !== 0) throw new Error("Target accounts table must be empty");
      for (const row of rows) {
        await tx`INSERT INTO accounts (id, handle, display_name, created_at)
          VALUES (${row.id}, ${row.handle}, ${row.display_name}, ${row.created_at})`;
      }
      const imported = await tx`SELECT COUNT(*) AS count FROM accounts`;
      if (Number(imported[0].count) !== rows.length) throw new Error("Transfer count mismatch");
    });
    console.log(`Transferred ${rows.length} accounts. Source remains unchanged.`);
  } finally {
    await target.close();
  }
}

try {
  switch (process.argv[2]) {
    case "init": {
      const db = openLocalDatabase();
      db.close();
      console.log("N19 SQLite database ready.");
      break;
    }
    case "migrate-postgres":
      await migratePostgres();
      break;
    default:
      throw new Error("Use init or migrate-postgres.");
  }
} catch {
  // Driver errors may include credentials or personal data. Never print them here.
  console.error("Database operation failed. Check database paths, schema, connectivity and target emptiness.");
  process.exitCode = 1;
}
