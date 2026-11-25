# Local database and migration

N19 develops on Windows with Bun 1.4 and SQLite. No external database or VPS is needed.

From the repository root:

```powershell
bun install --frozen-lockfile
bun run db:init
bun run dev
```

SQLite defaults to `.local/n19.sqlite`. The directory and database files are excluded from Git. Set `N19_SQLITE_PATH` to override it. Store only test accounts locally; do not commit or publish the file.

## Portability rules

- Keep versioned schema migrations in the database package and test them against both engines.
- Use application-generated UUIDs, canonical lowercase handles, explicit unique constraints, parameterized queries, foreign keys and UTC ISO timestamp strings in the shared schema.
- Keep provider-specific SQL inside the database package.
- Do not use SQLite-only row IDs, dynamic column types, or implicit collation assumptions.
- Before adding any table, extend the transfer tool to include it, preserve IDs and verify counts and relationships.
- Keep application database access behind a provider-independent repository interface as registration is implemented. Do not import SQLite directly into UI or business logic.

## Future PostgreSQL transfer

For the current version-2 accounts, credentials and profiles schema, an explicit one-way transfer tool is included. Stop local writes and back up the SQLite file before running it. Use a fresh PostgreSQL database; the command refuses a nonempty target application tables and an unrecognized source schema, and imports in one target transaction.

```powershell
$env:N19_POSTGRES_URL = "postgresql://USER:PASSWORD@HOST:5432/DATABASE"
bun run db:migrate:postgres
Remove-Item Env:N19_POSTGRES_URL
```

The source is opened read-only. Account, credential and profile counts are verified before commit. Password hashes transfer without plaintext; sessions are deliberately excluded so users sign in again. Run db:init to upgrade an old local database before transferring. Do not delete the source after transfer until the target is verified. The PostgreSQL import requires a reachable PostgreSQL server and has not yet been exercised against a live server. Switching the future application to PostgreSQL will also require the PostgreSQL repository adapter; the migration command alone does not switch the web app.
