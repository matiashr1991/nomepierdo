# Proposal: Migrate Database Engine from PostgreSQL to MySQL

## Status
Draft

## Why

The user wants to consolidate on MySQL, using the host-level MySQL 8.0 instance already running on the production VPS (`72.61.134.65`) instead of a containerized PostgreSQL, specifically for operational control (backups, direct access, one engine to manage instead of two). This is safe to do now because **the project is still in testing — there is no production data to preserve**, which turns what would otherwise be a high-risk live migration into a schema-recreation with no data-migration step.

Verified during this session (read-only + one scoped write, see design.md): the schema itself is highly portable (no Postgres-only types), the app already uses Prisma's driver-adapter pattern (so swapping engines is a contained change, not a rewrite), and — critically — **network connectivity from a Swarm service to the host MySQL was tested end-to-end and works**, but not via the path initially assumed (see design.md's correction).

## What Changes

1. **Prisma schema**: `datasource db { provider = "postgresql" }` → `"mysql"`. No model/field changes needed — verified no Postgres-only types (arrays, citext, `@db.Uuid`) are in use.
2. **Query layer**: remove `mode: "insensitive"` from the 6 sites that use it (`src/actions/tags.ts`, `src/app/dashboard/admin/tags/page.tsx`) — this Prisma option is Postgres-only. Case-insensitive search still works because the new MySQL database was created with `utf8mb4_unicode_ci` collation (case-insensitive by default).
3. **Driver adapter**: swap `pg` + `@prisma/adapter-pg` for `mariadb` + `@prisma/adapter-mariadb` in `src/lib/prisma.ts` and `package.json` (MySQL and MariaDB share wire protocol; `@prisma/adapter-mariadb` is Prisma's official adapter for both).
4. **Production infra** (`stack.yml`, `DEPLOY.md`, `/opt/deploy/nomepierdo/.env-prod`): remove the `db` Swarm service and `db_net` network entirely — the database is no longer a container, it's the host MySQL. Update `DATABASE_URL` to point at `172.18.0.1:3306` (see design.md for why this specific address, not the one initially assumed).
5. **Local dev** (`docker-compose.yml`): swap the `db` service's image from `postgres:15` to `mysql:8.0` — local dev stays fully disposable via Docker, no host MySQL install needed on the dev machine. (Assumption, not explicitly confirmed by the user — flagged for confirmation at apply time.)

## Already done this session (do not redo)

- Database `nomepierdo` created on the VPS's host MySQL (`utf8mb4`/`utf8mb4_unicode_ci`).
- Dedicated user `nomepierdo`@`172.18.%` created, scoped to `GRANT ... ON nomepierdo.* ` only (verified: **not** `*.*` — does not have access to the 13 other databases on that shared MySQL instance).
- Connectivity verified end-to-end from a real Swarm service on `matdevnet` to `172.18.0.1:3306` with these credentials — confirmed working (`SELECT 1` succeeded).

`tasks.md` should re-verify these still hold (cheap, idempotent checks) rather than blindly trust a prior session, but should not recreate the user/database from scratch.

## Impact

- **Files touched**: `prisma/schema.prisma`, `src/lib/prisma.ts`, `src/actions/tags.ts`, `src/app/dashboard/admin/tags/page.tsx`, `package.json`, `stack.yml`, `docker-compose.yml`, `DEPLOY.md`, `.env-prod.example`.
- **VPS-side**: `/opt/deploy/nomepierdo/.env-prod` (already exists, gets edited — real secrets, not touched by any commit), and the running `nomepierdo_db` Postgres Swarm service gets removed once the new stack is deployed.
- **Data**: none preserved — per Why, there is nothing in the current Postgres database worth carrying over. `prisma db push` recreates the schema fresh against the new empty MySQL database.

## Out of Scope

- Any data migration/ETL from the existing Postgres data — explicitly not needed (test phase, no real data).
- Changing `prisma db push` to `prisma migrate` — orthogonal to the engine change, already flagged as a separate future item in `ci-and-auth-types`.
- Removing the old `nomepierdo_db` Postgres Swarm service from the VPS before the MySQL cutover is confirmed working — sequencing this safely is a `tasks.md` concern, not a scope question.

## Risks & Rollback

- **Risk**: the driver adapter swap (`pg`→`mariadb`) is the least-verified part of this plan — `@prisma/adapter-mariadb`'s exact constructor API wasn't inspected in this session (only confirmed the package exists on npm, version 7.10.0, depends on the `mariadb` driver package). `tasks.md` requires checking its actual type definitions after `npm install`, not guessing the API.
- **Risk**: `mode: "insensitive"` removal changes search behavior if the assumption about MySQL collation defaulting to case-insensitive doesn't hold for some column type. `tasks.md` requires an explicit manual test of the affected search UI (tag list search by code/name/notes) after migration, not just a passing build.
- **Rollback**: since there's no data to lose, rollback is simple — revert this change's commit(s), redeploy the reverted `stack.yml` (brings back the Postgres `db` service and old `DATABASE_URL`), the old `nomepierdo_db` Postgres volume is untouched as long as it isn't explicitly deleted (`tasks.md` should not delete it until the MySQL cutover has run in production for a reasonable period).
