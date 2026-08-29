# Proposal: CI Quality Gate + next-auth Role Type Augmentation

## Status
Draft

## Why

Two structurally related gaps identified during the project-wide SDD exploration (`sdd-explore`, 2026-08-29):

1. **No CI/CD pipeline exists.** Deploys are fully manual (`docker build` + `docker stack deploy` + manual `prisma db push` on the VPS, per `DEPLOY.md`). Nothing runs `lint`, type-checking, or a production build before code reaches `main`.
2. **`session.user.role` is untyped.** There is no `declare module "next-auth"` session/JWT augmentation anywhere in `src/`. This forces `as any` casts wherever role is read for authorization — **48 occurrences across 27 files**, concentrated in `requireAdmin()`-style checks. Git history shows this is the direct, recurring cause of commits like `fix: resolve remaining TS errors in OrderStatusActions component` and `fix: use proper OrderStatus enum type in server actions` — reactive patching of a systemic typing gap, made worse by the absence of any CI gate that would have caught it pre-merge.

These two items are proposed together because gap #2 is invisible without gap #1: without a CI type-check gate, a regression to `as any` on role checks will not be caught again.

## What Changes

### 1. CI pipeline (GitHub Actions)
- Add `.github/workflows/ci.yml` triggered on `push` and `pull_request` against `main`.
- Steps: install deps → `npm run lint` (eslint) → `tsc --noEmit` (new dedicated step/script, since `next build` no longer runs lint in Next 16 and type errors can otherwise slip through non-CI local builds) → `npm run build`.
- Add a `typecheck` script to `package.json` (`tsc --noEmit`) — currently missing; type-checking today is only an implicit side effect of `next build`.
- No deploy step included — deploy remains manual per `DEPLOY.md` (out of scope, see below).

### 2. next-auth role type augmentation
- Add `src/types/next-auth.d.ts` (or equivalent module augmentation file) declaring `role` on `Session["user"]` and on the JWT type, matching the actual `role` field/enum on the Prisma `User` model.
- Sweep the 27 affected files and remove the `as any` casts on `session.user.role` / token role reads, replacing them with the now-typed property.
- No runtime behavior change — this is a types-only fix. Authorization logic (`requireAdmin()` and friends) stays exactly as-is; only its type safety improves.

## Impact

- **Files touched:** `.github/workflows/ci.yml` (new), `package.json` (add `typecheck` script), `src/types/next-auth.d.ts` (new), ~27 files across `src/actions/`, `src/app/dashboard/**`, and auth-related lib code (exact list to be finalized in `tasks.md` via a fresh grep at apply time — file set may have shifted since exploration).
- **Prisma schema:** no changes. `role` already exists on the `User` model; this only types what's already there.
- **Runtime/user-facing behavior:** none. Pure dev-time/CI safety net.
- **Auth (next-auth v5 beta):** touched, but types-only — flagging per project convention since next-auth is on a beta release (`5.0.0-beta.31`) and its type surface can shift between beta versions.

## Out of Scope

- No test framework introduction (tracked as a separate future increment — repo currently has zero test runner).
- No `prisma db push` → `prisma migrate` migration (separate future increment).
- No CD/deploy automation — CI here is verification-only; deploy stays manual.
- No changes to authorization logic itself, only its typing.

## Risks & Rollback

- **Risk:** CI catching pre-existing lint/type issues elsewhere in the repo could block the first PR unrelated to this change's scope. **Mitigation:** run `lint`/`tsc --noEmit` locally first during `sdd-apply`/GPT implementation and fix or explicitly document any pre-existing failures before opening the CI-gated PR.
- **Risk:** next-auth beta type surface changes on a future beta bump could invalidate the augmentation. **Mitigation:** the augmentation file is small and isolated (`src/types/next-auth.d.ts`), cheap to adjust if beta APIs shift.
- **Rollback:** both changes are additive/type-only and independently revertable — deleting `.github/workflows/ci.yml` or `src/types/next-auth.d.ts` fully reverts either half with no data or runtime impact.

## Success Criteria

- CI runs on every push/PR to `main` and fails on lint, type, or build errors.
- `grep -rn "as any" src/` no longer matches role-related casts (auth/session role reads are fully typed).
- `npm run typecheck` and `npm run build` pass clean with zero role-related `as any`.
