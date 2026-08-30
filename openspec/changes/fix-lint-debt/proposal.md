# Proposal: Fix Pre-Existing Lint Errors Blocking CI

## Status
Draft

## Why

The CI pipeline added in `ci-and-auth-types` went live on the first real push to `main` and failed exactly as anticipated in that proposal's Risks section: `npm run lint` reports **24 errors, 53 warnings**, all in files untouched by either `ci-and-auth-types` or `cd-deploy-nomepierdo`. Since `deploy` depends on `verify` passing, **no deploy has run yet** — the CD pipeline built in `cd-deploy-nomepierdo` is blocked entirely by this pre-existing debt, not by anything wrong with it.

This is now the single blocker between "CI/CD is wired up" and "CI/CD actually works end to end."

## What Changes

Fix all 24 ESLint **errors** (not the 53 warnings — see Out of Scope) so `npm run lint` exits 0. Confirmed via the actual CI run output, they fall into three categories:

1. **`@typescript-eslint/no-require-imports` (3 occurrences, 2 files)**: `prisma.config.js:1`, `src/actions/pet.ts:44` and `:105` — inline `require(...)` calls where a top-level `import` is expected.
2. **`@typescript-eslint/no-explicit-any` (19 occurrences, 17 files)**: untyped `any` in component props, action parameters, and API response handling — full list in `tasks.md`.
3. **`react/no-unescaped-entities` (2 occurrences, 1 file)**: `src/app/page.tsx:123` — a raw `"` in JSX text needs escaping.

## Impact

- **Files touched**: ~19 files, all pre-existing, none touched by the previous two changes. No new files.
- **Runtime behavior**: none of these are behavior fixes — replacing `any` with a real type doesn't change what the code does, it only makes the compiler check it. The `require()` → `import` conversions are also behavior-neutral (same module, same resolution, just static instead of dynamic). The JSX entity fix changes rendered text by zero visible characters (`"` renders identically whether written raw or as `&quot;`).
- **No Prisma/schema impact.**

## Out of Scope

- The 53 warnings (`no-unused-vars`, `no-img-element`, etc.) — they don't fail `npm run lint`'s exit code (only errors do, confirmed: warnings-only runs still exit 0 in this project's eslint config), so they don't block CI. Fixing them is cosmetic cleanup, not a CI blocker — a separate, lower-priority change if the user wants it later.
- Any behavior change beyond what's needed to satisfy the lint rule.

## Risks & Rollback

- **Risk**: an `any` replaced with a type that's subtly wrong could introduce a *new* type error not currently caught (since these spots were never checked before). **Mitigation**: `tasks.md` requires running `npm run typecheck` after every batch of fixes, not just at the end.
- **Rollback**: every fix here is a local, independent edit — revertable file-by-file with no cross-file coupling risk.
