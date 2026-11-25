# N19

**Freedom of expression. By design.**

N19 (Net + Article 19) is an independent social network in development by @m1nsook. It aims for a familiar, conversation-first experience, equal treatment, pseudonymous identities and publicly inspectable development.

This repository is source-available for inspection under the [Security Audit License](LICENSE), not an open-source distribution. No production credentials, private deployment configuration or user data belong here.

## Repository

- `apps/web` — Next.js web application and existing shadcn components.
- `packages/identity` — shared, server-side public-handle generation and tests.
- `docs` — architecture and planned product behavior.

## Maintainer development

Bun 1.4.0 is specified in the root package manifest. The repository uses a single workspace lockfile.

```sh
bun install --frozen-lockfile
bun run dev
bun run test
bun run lint
```

The existing Next.js development/build configuration is retained. Production deployment is separate and private. N19 is not yet a live social network; no account, moderation or persistence service is operational.

See [architecture](docs/architecture.md) and [principles](docs/principles.md).
