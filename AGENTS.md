# N19 development rules

- Preserve the source-available license and public development history.
- Never commit credentials, private deployment configuration, real user data or sensitive moderation detection thresholds.
- Use Bun workspaces and one root lockfile. Do not add Docker or independent services without a demonstrated need.
- Keep account identity distinct from editable display names; never offer paid handles.
- Enforce permissions on the server; do not rely on UI hiding.
- Treat proposed policies as drafts until approved by the maintainer.
- For Next.js changes, follow apps/web/AGENTS.md and read the installed framework docs first.
- Keep changes focused and add tests for security-sensitive behavior.

- Target Windows localhost with SQLite by default; keep all migrations and data models portable to PostgreSQL. No production deployment in this phase.
- Never commit SQLite databases, WAL files or migration exports. Keep the SQLite-to-PostgreSQL migration path updated whenever tables are added.
