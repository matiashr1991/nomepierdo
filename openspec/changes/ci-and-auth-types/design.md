# Design: CI Quality Gate + next-auth Role Type Augmentation

Change: `ci-and-auth-types`
Proposal: `./proposal.md` · Spec: `./spec.md`

## Correction vs. initial exploration

The original `sdd-explore` pass estimated "48 `as any` occurrences across 27 files." Direct verification during this design pass (`grep -rn "as any" src/`) found **13 occurrences across 12 files**, and all 13 are the same root cause: unsafe casts to read `.role` off `session.user` or a JWT `token`. There is no other class of `as any` in `src/`. The smaller, precise number is what `tasks.md` should be scoped against.

Affected files (verified):
- `src/auth.ts` (2 occurrences — `jwt` and `session` callbacks)
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

## Part 1 — CI pipeline

### Workflow file

`.github/workflows/ci.yml`:
- Trigger: `push` to `main`, `pull_request` targeting `main`.
- Single job `verify` on `ubuntu-latest`:
  1. `actions/checkout@v4`
  2. `actions/setup-node@v4` (Node version pinned to match `engines`/local dev — check `.nvmrc`/CI hint; default to Node 20 LTS if unspecified)
  3. `npm ci`
  4. `npx prisma generate` (required before `tsc`/`next build` can resolve `@prisma/client` types — the repo has no `postinstall` generating it automatically; confirm at apply time)
  5. `npm run lint`
  6. `npm run typecheck`
  7. `npm run build`
- No `DATABASE_URL`/secrets needed for lint/typecheck/build (Next.js build does not need a live DB connection for this app — Server Actions aren't executed at build time). Confirm during apply that no page does build-time DB access (e.g. `generateStaticParams` hitting Prisma); if one does, the workflow will need a dummy `DATABASE_URL` env var, not real credentials.

### package.json change

Add:
```json
"typecheck": "tsc --noEmit"
```
alongside existing `dev`/`build`/`start`/`lint` scripts. No new dependency required — `typescript` is already a devDependency.

## Part 2 — next-auth role type augmentation

### Why a literal union, not `string`

`role` is `String @default("user")` in `prisma/schema.prisma` — not a Prisma enum. Grep confirms only two values are ever assigned or compared: `"admin"` and `"user"` (`src/actions/users.ts` assigns both; every authorization check compares `=== "admin"` / `!== "admin"`). Typing the augmentation as plain `string` would remove the `as any` casts but give no real type safety (a typo like `"admni"` would still compile). Typing it as the literal union `"user" | "admin"` catches that class of bug and matches actual usage — at effectively the same implementation cost.

If a future change needs more roles or wants the Prisma layer itself to enforce the value set, promoting `role` to a real Prisma `enum Role { user admin }` is a natural *follow-up* change — out of scope here (schema change would need a migration note per project convention, and the current `String` field with app-level validation is functionally sufficient for this increment).

### Augmentation file

`src/types/next-auth.d.ts`:
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
Exact augmented module path for JWT (`"next-auth/jwt"` vs `"@auth/core/jwt"`) must be confirmed against the installed `next-auth@5.0.0-beta.31` type definitions at apply time — beta releases have moved this before. `tasks.md` calls this out explicitly as a verify-first step.

### Call-site changes

In `src/auth.ts` callbacks — remove the two `as any` casts now that `token.role` and `session.user.role` are typed:
```ts
// before
token.role = (user as any).role;
// after
token.role = user.role as AppRole; // user here is next-auth's User type; role isn't on it either — see note below
```
Note: `user` in the `jwt` callback comes from `authorize()`'s return value, which is next-auth's own (loosely-typed) `User`/adapter type, not our augmented `Session["user"]`. A single, narrow cast may still be needed at this one boundary (where our app-level `role` first enters next-auth's type system) — that is expected and acceptable; the goal is eliminating the *propagated* `as any` at every read site, not necessarily zero casts at the single point where an external type meets ours. `tasks.md` and `sdd-verify` should treat "one documented boundary cast in `auth.ts`, zero elsewhere" as compliant with spec R4, not "zero casts anywhere."

All 10 other call sites (`src/actions/*.ts`, `src/app/dashboard/**`) simply drop `(session.user as any).role` → `session.user.role`, no logic change.

## Server Action boundary note

All role checks live inside Server Actions (`src/actions/*.ts`) or Server Components reading `auth()` directly (`src/app/dashboard/**`) — none are in Client Components. The type augmentation has no client-bundle impact; `next-auth` type declarations are compile-time only.

## Rollout / rollback

- Land Part 2 (type augmentation) first as its own reviewable unit, verify `npm run typecheck` is clean.
- Land Part 1 (CI workflow) second, in a PR that itself gets validated by the new pipeline it introduces (first real end-to-end proof it works).
- Either half reverts independently by deleting its file(s); no data migration, no schema change, no runtime behavior change in either part.
