# Tasks: CI Quality Gate + next-auth Role Type Augmentation

Change: `ci-and-auth-types`
Reference: `./proposal.md`, `./spec.md`, `./design.md` (read all three before starting — this file assumes their context)

Implementer: intended for an external coding agent (no access to prior conversation) working directly in this repo (`D:/proyectos/webQrMascotas`). Every task below must be executable from this file alone.

---

## Phase 1 — next-auth role type augmentation

### 1.1 Create the augmentation file

Create `src/types/next-auth.d.ts`:

```ts
import { DefaultSession } from "next-auth";

type AppRole = "user" | "admin";

declare module "next-auth" {
  interface Session {
    user: {
      role: AppRole;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: AppRole;
  }
}
```

**Before finalizing**: verify the correct module path for the JWT type against the installed version. Run:
```
grep -rn "declare module" node_modules/next-auth/jwt.d.ts node_modules/@auth/core/jwt.d.ts 2>/dev/null
```
or inspect `node_modules/next-auth/jwt.d.ts` directly, since `next-auth@5.0.0-beta.31` is a beta and the augmentable module path has moved between betas. If it differs from `"@auth/core/jwt"`, use the actual path instead — the augmentation only works if the module specifier matches exactly.

### 1.2 Update `src/auth.ts`

In the `jwt` callback, replace:
```ts
token.role = (user as any).role;
```
with:
```ts
token.role = user.role as AppRole;
```
(Import `AppRole` type or inline `"user" | "admin"` — a cast is expected here since `user` in this callback is next-auth's own `authorize()`-return type, not our augmented `Session["user"]`. This is the one documented boundary cast — see `design.md`. Do not treat this as a spec violation.)

In the `session` callback, replace:
```ts
(session.user as any).role = token.role;
```
with:
```ts
session.user.role = token.role as AppRole;
```

### 1.3 Remove `as any` role casts at all read sites

In each file below, find the `(session?.user as any)?.role` / `(session.user as any).role` pattern and replace with the plain typed access (`session?.user?.role` / `session.user.role`). No other logic changes.

- `src/actions/users.ts`
- `src/actions/tags.ts`
- `src/actions/order.ts`
- `src/actions/products.ts`
- `src/app/dashboard/layout.tsx`
- `src/app/dashboard/admin/orders/page.tsx`
- `src/app/dashboard/admin/users/page.tsx`
- `src/app/dashboard/admin/products/page.tsx`
- `src/app/dashboard/admin/tags/page.tsx`
- `src/app/dashboard/admin/tags/batches/page.tsx`
- `src/app/dashboard/admin/tags/print/[batchId]/page.tsx`

**Verification for this task**: after edits, run:
```
grep -rn "as any" src/
```
Expected result: **zero matches** outside the one documented cast in `src/auth.ts` step 1.2. If any other `as any` remains or a new one was introduced, fix before moving on.

### 1.4 Confirm no behavior change

Read each of the 11 call sites above before and after your edit and confirm the comparison logic (`=== "admin"`, `!== "admin"`, etc.) is byte-for-byte unchanged — only the cast is removed. This task has no code to write; it's a self-check gate before Phase 2.

---

## Phase 2 — CI pipeline

### 2.1 Add the `typecheck` script

In `package.json`, inside `"scripts"`, add:
```json
"typecheck": "tsc --noEmit",
```
(next to the existing `dev`/`build`/`start`/`lint` scripts).

Run it locally to confirm it passes after Phase 1's changes:
```
npm run typecheck
```
It must exit 0 before you proceed to 2.2.

### 2.2 Create the GitHub Actions workflow

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci

      - run: npx prisma generate

      - run: npm run lint

      - run: npm run typecheck

      - run: npm run build
```

Before finalizing, check whether a `.nvmrc` or `engines` field pins a different Node version in this repo; if so, match `node-version` to it instead of `20`.

### 2.3 Verify the build step doesn't need real secrets

Grep for build-time Prisma/DB access that could break `next build` without a `DATABASE_URL`:
```
grep -rn "generateStaticParams" src/app/
```
For each match, check whether the function calls Prisma directly. If none do (expected, per `design.md`), no env vars are needed in the workflow. If one does, add a dummy `DATABASE_URL` (e.g. `postgresql://ci:ci@localhost:5432/ci`) as an `env:` on the `verify` job — do NOT use real credentials in the workflow file.

### 2.4 Local dry-run before pushing

Run the full sequence locally exactly as CI will:
```
npm ci
npx prisma generate
npm run lint
npm run typecheck
npm run build
```
All four must pass. If `lint` or `typecheck` fails on pre-existing code unrelated to this change, fix it if trivial; otherwise stop and flag it rather than silently working around it (e.g. do not add `// eslint-disable` or loosen `tsconfig.json` to force a pass).

---

## Phase 3 — Handoff for verification

### 3.1 Summarize the diff

Before handing back, list every file created or modified by this change (expected: `src/types/next-auth.d.ts`, `src/auth.ts`, the 11 files from 1.3, `package.json`, `.github/workflows/ci.yml`). If the actual diff includes anything outside this list, call it out explicitly — don't let scope silently expand.

### 3.2 Do not merge / do not push to main directly

This task file's job ends with a reviewable diff (commit to a branch, or leave working-tree changes as-is per the user's workflow). Merging to `main` and enabling branch protection on the new CI check are follow-up actions outside this change.
