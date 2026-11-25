# Architecture (initial)

N19 starts as a modular monolith with a Bun workspace, Next.js/React/TypeScript frontend and existing shadcn UI. SQLite is the default on Windows localhost, with a planned PostgreSQL deployment target and a portable data access boundary. The initial implementation uses Bun's built-in database drivers and shared SQL migrations; no ORM dependency is required. Separate infrastructure and workers only when justified.

## Planned modules

| Module | Responsibility |
| --- | --- |
| identity | Server-generated public handles, immutable account IDs |
| auth | Registration, verified contact, sessions and recovery |
| database | SQLite/PostgreSQL portable schema, migrations and transactional persistence |
| social | Posts, replies, follows, likes, reposts and feed access |
| moderation | Content classification, reporting, visibility enforcement and appeals |
| media | Private upload quarantine, validation, approved media delivery |
| notifications | In-app notifications |
| billing | Optional premium entitlements without preferential speech or reach |

The local prototype implements identity, authentication, sessions, profiles and schema upgrades. The web frontend uses same-origin Next.js rewrites to a loopback-only Bun API; the native SQLite driver stays outside Next.js bundling. Both processes start with one root command. This is a local runtime boundary, not a production microservice architecture. New workspaces should be introduced when they have working code.

## Trust boundaries

Generate handles server-side with cryptographic randomness. Store the stable account ID separately. Enforce a case-normalized unique database constraint and retry insertion on handle collisions. Never derive a public handle from private account data. Display names may repeat. Account ownership and administrative permissions must not depend on display name.

Enforce content visibility in every read path (feed, direct link, search, replies, notifications, media delivery and caches). Do not publish unclassified sensitive media before moderation completes. Public code may describe the rules, but private operational secrets and real user data never enter Git.
