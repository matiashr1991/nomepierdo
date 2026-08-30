# Spec: Migrate Database Engine from PostgreSQL to MySQL

Change: `migrate-postgres-to-mysql`
Proposal: `./proposal.md`

## Requirements

### R1 — Application MUST connect to MySQL instead of PostgreSQL

**Scenario: Prisma client targets MySQL**
- Given `prisma/schema.prisma`'s datasource provider is `mysql`
- When `npx prisma generate` runs
- Then the generated client MUST target MySQL's wire protocol/type mapping, not PostgreSQL's

**Scenario: Schema pushes cleanly to the new database**
- Given the `nomepierdo` MySQL database exists (already provisioned) and is empty
- When `npx prisma db push` runs against it with the migrated schema
- Then it MUST succeed and create all tables matching every model in `schema.prisma`

### R2 — No Postgres-only query features remain

**Scenario: Case-insensitive search still works without `mode: "insensitive"`**
- Given a tag search by code, pet name, or notes (the 3 fields using `contains` search)
- When a user searches with mixed-case input against mixed-case stored data
- Then results MUST match case-insensitively, relying on the database's collation (`utf8mb4_unicode_ci`) rather than a Prisma query-mode option that doesn't exist for the MySQL provider

### R3 — Database credentials MUST be scoped, not shared with SSH or other projects

**Scenario: Application DB user has no access beyond its own database**
- Given the `nomepierdo` MySQL user
- When its grants are inspected (`SHOW GRANTS`)
- Then they MUST be limited to the `nomepierdo` database only — never `ON *.*` — and the connection host restriction MUST NOT be a wildcard `%` open to any source

### R4 — Production Swarm service MUST reach the host MySQL over the correct network path

**Scenario: `nomepierdo_web` connects successfully in production**
- Given `nomepierdo_web` runs as a Swarm service (not a standalone container) on the `matdevnet` overlay network
- When it connects to `DATABASE_URL`
- Then the host in that URL MUST be the address actually reachable from a Swarm-service network namespace (verified this session: `172.18.0.1`, the `docker_gwbridge` gateway — NOT the overlay network's own internal gateway, which is not host-routable)

### R5 — No behavior change beyond what the engine swap requires

**Scenario: Feature parity after migration**
- Given any feature that worked against PostgreSQL (auth, pet registration, tag activation, orders, admin panel)
- When exercised against the new MySQL database
- Then it MUST behave identically from a user's perspective — this is an infrastructure change, not a feature change

### R6 — Rollback path stays viable until the migration is confirmed stable

**Scenario: Old Postgres data isn't destroyed prematurely**
- Given the MySQL cutover has just been deployed
- When any step of this change is executed
- Then the old `nomepierdo_db` Postgres Swarm service and its volume MUST NOT be deleted until the user explicitly confirms the MySQL version is working correctly in production

## Out of Scope (non-requirements)

- Data migration/ETL from Postgres (no data to preserve).
- `prisma migrate` adoption (separate future change).
- Local dev environment engine choice beyond a reasonable default (flagged as an assumption in proposal.md, not a hard requirement — confirm with the user at apply time if it matters to them).
