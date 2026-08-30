# Design: Migrate Database Engine from PostgreSQL to MySQL

Change: `migrate-postgres-to-mysql`
Proposal: `./proposal.md` · Spec: `./spec.md`

## Network path correction (important — verified empirically this session)

The initial plan assumed a Swarm service could reach the host's MySQL via `matdevnet`'s own gateway IP (`10.0.1.1`). **This does not work** — confirmed by testing: `10.0.1.1` is not a real interface on the host at all (`ip addr show` shows no such address), it's purely internal to the overlay network's own isolated namespace. A connection attempt from a real throwaway Swarm service to `10.0.1.1:3306` returned `Connection refused`.

The correct path, confirmed working end-to-end: **`docker_gwbridge`**, the bridge Docker Swarm automatically attaches to every container for egress to the host/outside world. Its gateway, `172.18.0.1`, **is** a real host interface (`ip addr show` confirms `inet 172.18.0.1/16`), and MySQL (bound to `0.0.0.0:3306`) is reachable through it. This matches the existing pattern already used by another project on this same VPS (`rrhh@172.18.%` in `mysql.user`) — this isn't a novel workaround, it's the established correct approach for this specific server.

**Use `172.18.0.1:3306` as the DB host in every `DATABASE_URL` from here on, not `10.0.1.1`.**

## Already-provisioned VPS state (verify, don't recreate)

```sql
-- Already exists, created and grant-verified this session:
CREATE DATABASE nomepierdo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'nomepierdo'@'172.18.%' IDENTIFIED BY '<already set>';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES, DROP,
      CREATE TEMPORARY TABLES, LOCK TABLES ON nomepierdo.* TO 'nomepierdo'@'172.18.%';
```
Verify with `SHOW GRANTS FOR 'nomepierdo'@'172.18.%';` — must show privileges scoped to `nomepierdo.*` only, never `*.*`. If missing (e.g. dropped since this session), recreate exactly as above; do not use a wildcard host or `*.*` grant as a shortcut.

The password from this session is available to whoever runs `tasks.md` via the user directly (not repeated here — this file is committed to the repo and must not contain the real password in plaintext).

## Code changes

### `prisma/schema.prisma`
```diff
 datasource db {
-  provider = "postgresql"
+  provider = "mysql"
 }
```

### `src/lib/prisma.ts`
```ts
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter: new PrismaMariaDb({ connectionString: process.env.DATABASE_URL }),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```
**Unverified**: `@prisma/adapter-mariadb`'s exact constructor signature (`{ connectionString }` vs individual `{ host, port, user, password, database }` fields vs a raw `mariadb` pool instance, mirroring how `adapter-pg` takes a `pg.Pool`). Confirmed only that the package exists (npm, v7.10.0) and depends on the `mariadb` driver package. `tasks.md` requires checking `node_modules/@prisma/adapter-mariadb`'s type definitions after install and adjusting this snippet to match the real API — do not assume the sketch above is correct as-is.

### Query sites — remove `mode: "insensitive"`
In `src/actions/tags.ts` and `src/app/dashboard/admin/tags/page.tsx` (3 occurrences each, 6 total):
```diff
- { code: { contains: filters.search, mode: "insensitive" } },
+ { code: { contains: filters.search } },
```
Same pattern for the `pet.name` and `notes` conditions. Relies on the database's `utf8mb4_unicode_ci` collation (already set) for case-insensitivity — no code-level substitute needed.

### `package.json`
Remove: `pg`, `@prisma/adapter-pg`, `@types/pg`.
Add: `mariadb`, `@prisma/adapter-mariadb` (pin to whatever version `npm install` resolves against the project's `prisma`/`@prisma/client` version — check for a version mismatch warning, Prisma driver adapters are usually pinned close to the core `prisma` version).

## Infra changes

### `stack.yml` — remove the `db` service and `db_net` network entirely
```diff
 services:
   web:
     image: nomepierdo:latest
     environment:
       NODE_ENV: ${NODE_ENV}
       DATABASE_URL: ${DATABASE_URL}
       ...
     networks:
       - matdevnet
-      - db_net
     volumes:
       - nomepierdo_uploads:/app/public/uploads
     ...

-  db:
-    image: postgres:15-alpine
-    environment:
-      POSTGRES_DB: ${POSTGRES_DB}
-      POSTGRES_USER: ${POSTGRES_USER}
-      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
-    networks:
-      - db_net
-    volumes:
-      - nomepierdo_pgdata:/var/lib/postgresql/data
-    ...

 networks:
   matdevnet:
     external: true
-  db_net:
-    driver: overlay
-    attachable: true

 volumes:
   nomepierdo_uploads:
-  nomepierdo_pgdata:
```
`web` only needs `matdevnet` — `docker_gwbridge` is attached automatically by Swarm to every service, no explicit config needed for the MySQL path.

### `/opt/deploy/nomepierdo/.env-prod` (real file on VPS, not in git)
Remove `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` (no longer used — no Postgres container). Change:
```
DATABASE_URL=mysql://nomepierdo:<password>@172.18.0.1:3306/nomepierdo
```

### `.env-prod.example` (in git, template only)
Mirror the same shape with placeholder values, matching what `tasks.md` should verify DEPLOY.md's checklist references correctly.

### `docker-compose.yml` (local dev)
```diff
   web:
     ...
     environment:
-      - DATABASE_URL=postgresql://postgres:postgres@db:5432/petqrdb?schema=public
+      - DATABASE_URL=mysql://root:root@db:3306/petqrdb
     ...

   db:
-    image: postgres:15
+    image: mysql:8.0
     restart: always
     environment:
-      POSTGRES_USER: postgres
-      POSTGRES_PASSWORD: postgres
-      POSTGRES_DB: petqrdb
+      MYSQL_ROOT_PASSWORD: root
+      MYSQL_DATABASE: petqrdb
     ports:
-      - "5433:5432"
+      - "3307:3306"
     volumes:
-      - petqr_postgres_data:/var/lib/postgresql/data
+      - petqr_mysql_data:/var/lib/mysql

 volumes:
-  petqr_postgres_data:
+  petqr_mysql_data:
```
`3307:3306` (not `3306:3306`) avoids clashing with a MySQL potentially already running on the dev's own machine. **Assumption, per proposal.md — confirm with the user whether local dev should instead use their own already-installed MySQL rather than a Docker one, if they have one.**

### `DEPLOY.md`
- Remove the Postgres-specific parts of steps 1 (env file) and 4 (deploy — no more `db` service to wait on).
- Step 5 (`prisma db push` via a throwaway container): the current command attaches to `nomepierdo_db_net`, which this change removes. Replace `--network nomepierdo_db_net` with `--network host` (simplest reliable path for a one-off manual admin container reaching `172.18.0.1:3306` — host networking gets full access to all host interfaces including `docker_gwbridge`, no extra network wiring needed). **Verify this specific command actually works during apply** (same live-test discipline used to validate the app's own connectivity this session) before finalizing the doc — don't just assume `--network host` works without running it once.

## Rollout order (per spec R6 — don't burn the rollback path early)

1. Land all code + config changes in one reviewable diff, `stack.yml` included.
2. Deploy: `docker stack deploy -c stack.yml nomepierdo` — this updates `web` (new image, new env) but does **not** touch the still-running old `nomepierdo_db` Postgres service unless explicitly removed (Swarm only touches services present in the compose file being deployed... but a `stack deploy` that omits `db` **will** remove the now-absent `db` service from the stack, since stack deploy reconciles the stack to match the file exactly). **This means the Postgres container gets removed immediately on the first deploy of this change** — there is no gradual cutover with this mechanism.
3. Because of that, do NOT delete the `nomepierdo_pgdata` Docker volume in this change (it survives even after its service is removed, until explicitly `docker volume rm`'d) — keep it as the rollback data source for some time, per spec R6, even though there's no real data to lose right now; establishing the right habit matters more than this specific instance.
4. After deploy, manually verify: app loads, login works (touches `User`/`Account`/`Session` tables), pet registration works (writes to `Pet`), tag search works (verifies R2's collation assumption), admin panel loads.

## Verification checklist (apply-time)

- `npm run build` succeeds with the new adapter.
- `npx prisma db push` succeeds against the empty MySQL `nomepierdo` database.
- Manual smoke test of the 4 flows in step 4 above, in production, after deploy — not just local dev.
- `grep -rn "mode: \"insensitive\"" src/` returns zero matches.
