export const SCHEMA_VERSION = 2;

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

export const SCHEMA_V2 = [
  `CREATE TABLE IF NOT EXISTS credentials (
    account_id TEXT PRIMARY KEY NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE CHECK (email = lower(email)),
    password_hash TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS profiles (
    account_id TEXT PRIMARY KEY NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    bio TEXT NOT NULL DEFAULT '' CHECK (length(bio) <= 500)
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY NOT NULL,
    account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL
  )`,
  "CREATE INDEX IF NOT EXISTS sessions_account_idx ON sessions(account_id)",
] as const;

export interface CredentialRow {
  account_id: string;
  email: string;
  password_hash: string;
}
export interface ProfileRow {
  account_id: string;
  bio: string;
}
