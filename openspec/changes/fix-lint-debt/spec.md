# Spec: Fix Pre-Existing Lint Errors Blocking CI

Change: `fix-lint-debt`
Proposal: `./proposal.md`

## Requirements

### R1 — `npm run lint` MUST exit 0

**Scenario: Lint passes**
- Given all fixes in this change are applied
- When `npm run lint` runs
- Then it MUST exit with code 0 (errors = 0; the 53 pre-existing warnings MAY remain, per proposal.md's Out of Scope)

### R2 — No behavior change

**Scenario: Fixes are type/syntax-only**
- Given any single file changed by this change
- When its behavior before and after the fix is compared (same inputs, same outputs, same side effects)
- Then it MUST be identical — every fix here is a type annotation, an import style, or a JSX text-escaping change, never a logic change

### R3 — Every `any` replaced with a real, non-widening type

**Scenario: Replacement type is meaningful**
- Given an `@typescript-eslint/no-explicit-any` error is fixed
- When the replacement type is checked
- Then it MUST NOT be `any` again under a different spelling (e.g. not `as any as X`) and MUST NOT be a type so broad it defeats the purpose (e.g. `unknown` is acceptable only where the value is genuinely opaque at that point and immediately narrowed; prefer the concrete type from context — a Prisma model type, a known API response shape, or a local `interface`/`type`)

### R4 — `npm run typecheck` MUST still pass after every batch

**Scenario: Typing a previously-any value doesn't break something else**
- Given a batch of `any` replacements in related files
- When `npm run typecheck` runs after that batch
- Then it MUST exit 0 — a newly-precise type must not surface a type error elsewhere that the old `any` was silently hiding without first resolving it, not deferring it

### R5 — `require()` calls MUST become static `import`s where the module and usage allow it

**Scenario: CommonJS require converted to ES import**
- Given `prisma.config.js` or `src/actions/pet.ts` uses `require(...)`
- When converted to `import`
- Then the resulting code MUST still run under this project's module system (check `"type"` in `package.json` and the file's context — `prisma.config.js` may need `require` kept if it's genuinely loaded as CommonJS; verify before converting, don't assume)

### R6 — Unescaped JSX entities MUST use a valid escape

**Scenario: Quote renders identically after escaping**
- Given `src/app/page.tsx:123` has a raw `"` in JSX text
- When replaced with `&quot;` (or `&ldquo;`/`&rdquo;` if it's an opening/closing quote pair, which is more correct typographically)
- Then the rendered page text MUST be visually unchanged

## Out of Scope (non-requirements)

- The 53 ESLint warnings.
- Any refactor beyond what each specific rule requires.
