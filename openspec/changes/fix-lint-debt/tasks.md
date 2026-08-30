# Tasks: Fix Pre-Existing Lint Errors Blocking CI

Change: `fix-lint-debt`
Reference: `./proposal.md`, `./spec.md`, `./design.md` (read all three first)

---

## Phase 1 — `no-require-imports` (mechanical, do first)

### 1.1 `src/actions/pet.ts`
- Change `import { writeFile } from "fs/promises";` (line 7) to `import { mkdir, writeFile } from "fs/promises";`
- Delete both `const { mkdir } = require("fs/promises");` lines (around line 44 and line 105 — confirm exact line numbers, they may have shifted).

### 1.2 `prisma.config.js`
Do NOT convert to `import`. Instead, add a scoped override to `eslint.config.mjs`:
```js
{
  files: ["prisma.config.js"],
  rules: {
    "@typescript-eslint/no-require-imports": "off",
  },
},
```
Read `eslint.config.mjs`'s current structure first to place this consistently with its existing format (flat config array).

**Checkpoint**: `npm run lint` must show 0 errors for these 3 previously-flagged lines. `npm run typecheck` must pass.

---

## Phase 2 — `no-unescaped-entities` (mechanical, isolated)

### 2.1 `src/app/page.tsx:123`
Read the line first. Replace both raw `"` with `&ldquo;`/`&rdquo;` if they're a matched opening/closing quote pair, otherwise `&quot;` for both.

**Checkpoint**: `npm run lint` must show 0 errors for this file.

---

## Phase 3 — `no-explicit-any` (19 occurrences, batch by directory per design.md)

For each site: read enough surrounding context to determine the real type (see design.md's category guidance — Prisma data, DOM events, API responses, component props). Replace `any` with that type. Do not use `unknown` as a default — only where the value is genuinely opaque and immediately narrowed (spec R3).

### Batch 3a — `src/actions/`
- `src/actions/tagRegister.ts:87`
- `src/actions/tags.ts:118`

Run `npm run typecheck` after this batch.

### Batch 3b — `src/app/dashboard/admin/tags/`
- `src/app/dashboard/admin/tags/CreateBatchModal.tsx:19`
- `src/app/dashboard/admin/tags/TagActions.tsx:26`
- `src/app/dashboard/admin/tags/TagActions.tsx:38`
- `src/app/dashboard/admin/tags/TagTable.tsx:7`
- `src/app/dashboard/admin/tags/page.tsx:26`

Run `npm run typecheck` after this batch.

### Batch 3c — `src/app/dashboard/admin/users/` and `src/app/dashboard/admin/orders/`
- `src/app/dashboard/admin/orders/OrderStatusActions.tsx:22`
- `src/app/dashboard/admin/users/CreateAdminModal.tsx:20`
- `src/app/dashboard/admin/users/UserRoleActions.tsx:22`
- `src/app/dashboard/admin/users/UserRoleActions.tsx:34`
- `src/app/dashboard/admin/products/ProductFormModal.tsx:9`

Run `npm run typecheck` after this batch.

### Batch 3d — remaining (`dashboard/`, `pets/`, `shop/`, `t/`)
- `src/app/dashboard/page.tsx:15`
- `src/app/dashboard/pets/[id]/edit/EditPetForm.tsx:9`
- `src/app/dashboard/pets/[id]/qr/QrClient.tsx:8`
- `src/app/dashboard/pets/page.tsx:12`
- `src/app/shop/OrderButton.tsx:12`
- `src/app/shop/page.tsx:12`
- `src/app/t/[tagCode]/TagRegisterFlow.tsx:92`

Run `npm run typecheck` after this batch.

---

## Phase 4 — Final verification

```
npm run lint
npm run typecheck
npm run build
```
All three must pass clean. `npm run lint` may still show warnings (53 pre-existing, out of scope per proposal.md) but zero errors.

## Phase 5 — Handoff

List every file changed (expected: ~19-20 files) and confirm none of the fixes changed runtime behavior (spec R2) — for each `any` replacement, state in one line why the new type is correct (what the actual value is at that point), not just that it compiles.

Do not commit or push — leave changes in the working tree for review, same convention as the previous two changes in this repo.
