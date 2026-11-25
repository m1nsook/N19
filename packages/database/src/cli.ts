import { Database } from "bun:sqlite";
import { SQL } from "bun";
import { openLocalDatabase, readDatabaseSnapshot, sqlitePath } from "./index";
import { SCHEMA_V1, SCHEMA_V2, SCHEMA_VERSION } from "./schema";

async function migratePostgres() {
  const url = process.env.N19_POSTGRES_URL;
  if (!url || !/^postgres(?:ql)?:\/\//.test(url)) throw new Error("Set PostgreSQL URL");
  const source = new Database(sqlitePath(), { readonly: true, strict: true });
  const rows = (() => { try { return readDatabaseSnapshot(source); } finally { source.close(); } })();
  const target = new SQL(url);
  try {
    await target.begin(async (tx) => {
      for (const statement of [...SCHEMA_V1, ...SCHEMA_V2]) await tx.unsafe(statement);
      await tx.unsafe("LOCK TABLE n19_schema_version, accounts, credentials, profiles, sessions IN ACCESS EXCLUSIVE MODE");
      const versions = await tx`SELECT version FROM n19_schema_version`;
      if (versions.length === 0) await tx`INSERT INTO n19_schema_version (version) VALUES (${SCHEMA_VERSION})`;
      else if (versions.length !== 1 || ![1, SCHEMA_VERSION].includes(Number(versions[0].version))) throw new Error("Unsupported PostgreSQL schema version");
      const existing = await tx`SELECT (SELECT COUNT(*) FROM accounts) + (SELECT COUNT(*) FROM credentials) + (SELECT COUNT(*) FROM profiles) + (SELECT COUNT(*) FROM sessions) AS count`;
      if (Number(existing[0].count) !== 0) throw new Error("Target must be empty");
      for (const row of rows.accounts) await tx`INSERT INTO accounts (id, handle, display_name, created_at) VALUES (${row.id}, ${row.handle}, ${row.display_name}, ${row.created_at})`;
      for (const row of rows.credentials) await tx`INSERT INTO credentials (account_id, email, password_hash) VALUES (${row.account_id}, ${row.email}, ${row.password_hash})`;
      for (const row of rows.profiles) await tx`INSERT INTO profiles (account_id, bio) VALUES (${row.account_id}, ${row.bio})`;
      const counts = (await tx`SELECT (SELECT COUNT(*) FROM accounts) AS accounts, (SELECT COUNT(*) FROM credentials) AS credentials, (SELECT COUNT(*) FROM profiles) AS profiles`)[0];
      for (const key of ["accounts", "credentials", "profiles"] as const) if (Number(counts[key]) !== rows[key].length) throw new Error("Transfer count mismatch");
      await tx`UPDATE n19_schema_version SET version = ${SCHEMA_VERSION}`;
    });
    console.log(`Transferred ${rows.accounts.length} accounts and associated credentials/profiles. Sessions intentionally invalidated; source unchanged.`);
  } finally { await target.close(); }
}

try {
  switch (process.argv[2]) {
    case "init": { const db = openLocalDatabase(); db.close(); console.log("N19 SQLite database ready."); break; }
    case "migrate-postgres": await migratePostgres(); break;
    default: throw new Error("Use init or migrate-postgres.");
  }
} catch {
  console.error("Database operation failed. Check database paths, schema, connectivity and target emptiness.");
  process.exitCode = 1;
}
