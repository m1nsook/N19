# N19

**Freedom of expression. By design.**

N19 (Net + Article 19) is an independent social network in development by @m1nsook. It aims for a familiar, conversation-first experience, equal treatment, pseudonymous identities and publicly inspectable development.

Source-available under the [Security Audit License](LICENSE).

## Repository

- `apps/web` — Next.js web application.
- `apps/api` — local Bun API.
- `packages/` — shared platform modules.
- `docs/` — architecture and development documentation.

## Development

Bun 1.4.0 · Windows localhost · SQLite

```sh
bun install --frozen-lockfile
bun run db:init
bun run dev
```

Open http://127.0.0.1:3000. Local development only.

See [architecture](docs/architecture.md) and [principles](docs/principles.md).
