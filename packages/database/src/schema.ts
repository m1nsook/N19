export const SCHEMA_VERSION = 1;

// SQL used by both SQLite and PostgreSQL. Add ordered migrations, never edit
// a released migration in place.
export const SCHEMA_V1 = [
  "CREATE TABLE IF NOT EXISTS n19_schema_version (version INTEGER PRIMARY KEY)",
  `CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY NOT NULL,
    handle TEXT NOT NULL UNIQUE CHECK (handle = lower(handle)),
    display_name TEXT NOT NULL CHECK (length(display_name) BETWEEN 1 AND 80),
    created_at TEXT NOT NULL
  )`,
] as const;

export interface AccountRow {
  id: string;
  handle: string;
  display_name: string;
  created_at: string;
}
