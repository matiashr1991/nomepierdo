# Tasks: Migrate Database Engine from PostgreSQL to MySQL

Change: `migrate-postgres-to-mysql`
Reference: `./proposal.md`, `./spec.md`, `./design.md` (read all three first — this file assumes their context, especially the network-path correction in design.md)

Implementer: works in this repo (`D:/proyectos/webQrMascotas`) and needs SSH access to the VPS (`72.61.134.65`) for Phase 4.

**Before starting**: confirm with the user whether local dev should use a Docker MySQL (this file's default, per design.md) or their own already-installed MySQL — this was an assumption, not a confirmed requirement.

---

## Phase 1 — Re-verify VPS-side state (read-only, don't recreate blindly)

### 1.1 Check the database and user still exist correctly
```
mysql -u root -e "SHOW GRANTS FOR 'nomepierdo'@'172.18.%';"
```
Expected: grants scoped to `nomepierdo.*` only (never `*.*`). If the user/database is missing, recreate exactly per design.md's "Already-provisioned VPS state" section — do not use a wildcard host or broader grant as a shortcut.

### 1.2 Get the password
Ask the user for the `nomepierdo` MySQL user's password (generated in a prior session, not stored in this repo). Do not generate a new one unless 1.1 shows the user doesn't exist and needs recreating.

---

## Phase 2 — Code changes

### 2.1 `prisma/schema.prisma`
Change `provider = "postgresql"` to `provider = "mysql"` in the `datasource db` block.

### 2.2 Swap dependencies
```
npm uninstall pg @prisma/adapter-pg @types/pg
npm install mariadb @prisma/adapter-mariadb
```

### 2.3 `src/lib/prisma.ts`
Before editing, check the actual API of the installed adapter:
```
cat node_modules/@prisma/adapter-mariadb/dist/*.d.ts | grep -A10 "class PrismaMariaDb\|export.*PrismaMariaDb"
```
Rewrite the file to use `PrismaMariaDb` per its real constructor signature (design.md has a sketch using `{ connectionString }` — verify against the actual types before committing to that shape; it may instead want a `mariadb.Pool` instance, similar to how the old code passed a `pg.Pool`).

### 2.4 Remove `mode: "insensitive"` (6 occurrences, 2 files)
```
grep -rn 'mode: "insensitive"' src/
```
Remove the `mode: "insensitive"` property from each match in `src/actions/tags.ts` and `src/app/dashboard/admin/tags/page.tsx`, keeping the rest of each `contains` filter unchanged.

**Checkpoint**: `npm run typecheck` must pass.

---

## Phase 3 — Local config

### 3.1 `docker-compose.yml`
Apply the diff from design.md's "docker-compose.yml (local dev)" section.

### 3.2 `.env-prod.example`
Update `DATABASE_URL` to the `mysql://` format; remove `POSTGRES_DB`/`POSTGRES_USER`/`POSTGRES_PASSWORD` lines.

### 3.3 Local smoke test (optional but recommended before touching prod)
```
docker compose up -d db
npx prisma db push
npm run dev
```
Manually verify: signup/login, create a pet, search works.

---

## Phase 4 — Production infra

**Confirm with the user before this phase touches the live VPS — it removes the running Postgres container on first deploy (see design.md's Rollout order section).**

### 4.1 `stack.yml`
Apply the diff from design.md's "stack.yml" section — remove the `db` service, `db_net` network, and `nomepierdo_pgdata` volume declaration (the volume itself on disk is untouched by removing it from this file; it only stops being referenced).

### 4.2 `DEPLOY.md`
Update per design.md — remove Postgres-specific steps, change the `prisma db push` container's `--network nomepierdo_db_net` to `--network host`, and update `DATABASE_URL` references to the `mysql://...172.18.0.1:3306/nomepierdo` format.

### 4.3 Update the real `/opt/deploy/nomepierdo/.env-prod` on the VPS
SSH in and edit it directly (this file is not in git): remove the three `POSTGRES_*` lines, set `DATABASE_URL=mysql://nomepierdo:<password>@172.18.0.1:3306/nomepierdo`.

### 4.4 Push the schema to the new database
```
cd /opt/stacks/nomepierdo
set -a; . /opt/deploy/nomepierdo/.env-prod; set +a
docker run --rm --network host \
  --env-file /opt/deploy/nomepierdo/.env-prod \
  -v /opt/stacks/nomepierdo:/app -w /app \
  node:20-alpine sh -lc "apk add --no-cache libc6-compat openssl && npm ci && npx prisma db push"
```
**Verify this command actually works before relying on it** — test it live, don't just assume `--network host` resolves `172.18.0.1` correctly from inside that throwaway container (design.md flags this as unverified).

### 4.5 Deploy
```
git pull origin main   # after this change's commit(s) are merged and on main
docker stack deploy -c stack.yml nomepierdo --with-registry-auth
```
This removes `nomepierdo_db` (Postgres) — expected, per design.md. Do NOT run `docker volume rm nomepierdo_nomepierdo_pgdata` — keep it for rollback per spec R6, even with no real data at stake right now.

### 4.6 Verify in production
- `docker service ls | grep nomepierdo` — only `nomepierdo_web` should remain (no `nomepierdo_db`).
- `docker service logs --since 5m nomepierdo_web` — no connection errors.
- Manually test in the browser: login, register a pet, search tags in the admin panel (this specifically tests spec R2's case-insensitivity assumption), view the admin dashboard.

---

## Phase 5 — Handoff

List every file changed, confirm the 4 production smoke-test flows passed, and report the exact `@prisma/adapter-mariadb` API actually used (since design.md's sketch was explicitly unverified) so the design doc's assumption can be corrected for the record.

Do not delete the old Postgres volume or remove the rollback path in this task — that's a separate, later, explicit decision by the user once MySQL has run stably for a while.
