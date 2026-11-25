# Architecture (initial)

N19 starts as a modular monolith with a Bun workspace, Next.js/React/TypeScript frontend and existing shadcn UI. PostgreSQL is the planned persistence layer; Prisma is a candidate, not installed yet. Separate infrastructure and workers only when justified.

## Planned modules

| Module | Responsibility |
| --- | --- |
| identity | Server-generated public handles, immutable account IDs |
| auth | Registration, verified contact, sessions and recovery |
| database | PostgreSQL schema, migrations and transactional persistence |
| social | Posts, replies, follows, likes, reposts and feed access |
| moderation | Content classification, reporting, visibility enforcement and appeals |
| media | Private upload quarantine, validation, approved media delivery |
| notifications | In-app notifications |
| billing | Optional premium entitlements without preferential speech or reach |

Only the identity helper and pre-existing web scaffold exist now. New workspaces should be introduced when they have working code.

## Trust boundaries

Generate handles server-side with cryptographic randomness. Store the stable account ID separately. Enforce a case-normalized unique database constraint and retry insertion on handle collisions. Never derive a public handle from private account data. Display names may repeat. Account ownership and administrative permissions must not depend on display name.

Enforce content visibility in every read path (feed, direct link, search, replies, notifications, media delivery and caches). Do not publish unclassified sensitive media before moderation completes. Public code may describe the rules, but private operational secrets and real user data never enter Git.
