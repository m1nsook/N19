# N19

**Freedom of expression. By design.**

N19 (Net + Article 19) is an independent social network in development by @m1nsook. It aims for a familiar, conversation-first experience, equal treatment, pseudonymous identities and publicly inspectable development.

This repository is source-available for inspection under the [Security Audit License](LICENSE), not an open-source distribution. No production credentials, private deployment configuration or user data belong here.

## Repository

- `apps/web` — Next.js web application and existing shadcn components.
- `packages/identity` — shared, server-side public-handle generation and tests.
- `packages/database` — SQLite-first persistence and PostgreSQL migration tooling.
- `docs` — architecture and planned product behavior.

## Maintainer development — Windows localhost

Bun 1.4.0 is specified in the root package manifest. The repository uses a single workspace lockfile.

```sh
bun install --frozen-lockfile
bun run db:init
bun run dev
bun run test
bun run lint
```

Open http://127.0.0.1:3000. No VPS, Docker, database server or cloud account is required. The local SQLite file lives in `.local/n19.sqlite` at the repository root and is ignored by Git. The initial database schema exists, but registration and web persistence are not connected yet. See [database migration](docs/database.md). Production deployment is deferred.

See [architecture](docs/architecture.md) and [principles](docs/principles.md).
