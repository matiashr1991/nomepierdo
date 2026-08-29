# Spec: CI Quality Gate + next-auth Role Type Augmentation

Change: `ci-and-auth-types`
Proposal: `./proposal.md`

## Requirements

### R1 — CI pipeline must run on every push and pull request to `main`

The system SHALL run an automated pipeline on every `push` and `pull_request` event targeting `main`.

**Scenario: PR opened against main**
- Given a contributor opens a pull request targeting `main`
- When the PR is created or updated with new commits
- Then a GitHub Actions workflow run MUST start automatically
- And the run MUST report its status (pending/success/failure) back on the PR

**Scenario: Direct push to main**
- Given a commit is pushed directly to `main`
- When the push completes
- Then the same workflow MUST run against that commit

### R2 — CI must gate on lint, type-check, and build

The pipeline SHALL fail the run if any of the following fail: ESLint, TypeScript type-checking, or the production build.

**Scenario: Lint failure blocks the run**
- Given a change introduces an ESLint violation
- When CI runs `npm run lint`
- Then the workflow run MUST fail
- And the failure MUST be attributable to the lint step in the run's logs

**Scenario: Type error blocks the run**
- Given a change introduces a TypeScript type error
- When CI runs the type-check step
- Then the workflow run MUST fail
- And this MUST hold even though `next build` (Next.js 16) no longer runs lint/type-check as part of the build step itself

**Scenario: Build failure blocks the run**
- Given a change breaks `next build`
- When CI runs `npm run build`
- Then the workflow run MUST fail

**Scenario: All gates pass**
- Given a change passes lint, type-check, and build
- When CI completes all steps
- Then the workflow run MUST report success

### R3 — A dedicated `typecheck` script MUST exist

`package.json` SHALL define a `typecheck` script that runs `tsc --noEmit`, independent of `build`, so type-checking can run (and fail fast) as its own CI step and be runnable locally without a full build.

### R4 — `session.user.role` and JWT `role` MUST be statically typed

The system SHALL provide a `next-auth` module augmentation declaring `role` on the `Session["user"]` type and on the JWT token type, matching the Prisma `User.role` field/enum.

**Scenario: Reading role from session with no cast**
- Given code reads `session.user.role` anywhere in `src/`
- When the project is type-checked
- Then the expression MUST type-check without an `as any` (or equivalent unsafe) cast
- And the inferred type MUST match the Prisma `User.role` enum

**Scenario: Existing as-any role casts are removed**
- Given the pre-change codebase has `as any` casts specifically to read `.role` off `session.user` or a JWT token
- When this change is applied
- Then those casts MUST be removed and replaced with the now-typed property access
- And no new `as any` casts MAY be introduced elsewhere to compensate

### R5 — No runtime behavior change from the type augmentation

The type augmentation change SHALL NOT alter any authorization decision, redirect, or access-control outcome.

**Scenario: Authorization outcomes unchanged**
- Given a `requireAdmin()`-style check currently allows/denies access based on `role`
- When the type augmentation is applied and `as any` casts are removed
- Then the same inputs MUST produce the same allow/deny outcome as before the change

## Out of Scope (non-requirements)

- Test framework introduction (no runner exists; not part of this change per `proposal.md`).
- `prisma db push` → `prisma migrate` migration.
- Deploy/CD automation — CI here is verification-only.
- Any change to authorization *logic* (only its typing).
