# Design: Fix Pre-Existing Lint Errors Blocking CI

Change: `fix-lint-debt`
Proposal: `./proposal.md` · Spec: `./spec.md`

## `no-require-imports` (3 occurrences) — two different fixes, verified against actual file content

### `src/actions/pet.ts:44` and `:105`

Read directly: the file already has `import { writeFile } from "fs/promises";` at the top (line 7). Both flagged lines are a **redundant** inline `const { mkdir } = require("fs/promises");` — same module, already imported elsewhere in the same file. Fix: change the top import to `import { mkdir, writeFile } from "fs/promises";` and delete both inline `require` lines. Zero behavior change, removes actual duplication (not just the lint error).

### `prisma.config.js:1`

Read directly: this file is genuine CommonJS (`require(...)` + `module.exports`), and `package.json` has no `"type": "module"` — the whole project defaults to CommonJS. This file is loaded directly by the Prisma CLI, not bundled by Next.js/webpack. Converting it to `import`/`export default` would require either renaming it to `.mjs` or flipping the entire project to ESM (`"type": "module"` in `package.json`) — a much larger, riskier change than this proposal's scope, and unrelated to the actual goal (fixing 24 lint errors, not migrating module systems).

**Decision: do NOT convert `prisma.config.js` to `import`. Instead, scope an ESLint override for this one file** in `eslint.config.mjs`:
```js
{
  files: ["prisma.config.js"],
  rules: {
    "@typescript-eslint/no-require-imports": "off",
  },
},
```
This is the correct tool for "this rule doesn't apply to this legitimately-CommonJS file" — narrower and more honest than a blanket `/* eslint-disable */` comment, and doesn't touch the file's actual code at all.

## `no-explicit-any` (19 occurrences, 17 files)

No single fix pattern — each site needs its actual type determined from context (per spec R3: not `unknown` as a lazy substitute, not `as any as X`). General guidance for the implementer, by category (verify the actual category per file before fixing, don't assume from the name alone):

- **Prisma-shaped data** (e.g. a `tag`, `order`, `product`, `user` object passed as a prop or handled after a Prisma call): use the actual Prisma-generated type (`import type { Tag } from "@prisma/client"` or the relevant `Prisma.TagGetPayload<...>` if it includes relations) instead of `any`.
- **Event handlers / form data**: use the concrete DOM/React event type (e.g. `React.ChangeEvent<HTMLInputElement>`) instead of `any`.
- **API/action response shapes** (e.g. `catch (e: any)` or a fetch response): prefer `unknown` + a type guard/narrowing at the point of use if there's genuinely no fixed shape (this is one of the few legitimate `unknown` cases per spec R3), or a local `interface` if the shape is actually known and stable.
- **Modal/component props typed `any`**: define or reuse a proper prop `interface`/`type` for that component.

Full location list (file:line, from the actual CI run output):
1. `src/actions/tagRegister.ts:87`
2. `src/actions/tags.ts:118`
3. `src/app/dashboard/admin/orders/OrderStatusActions.tsx:22`
4. `src/app/dashboard/admin/products/ProductFormModal.tsx:9`
5. `src/app/dashboard/admin/tags/CreateBatchModal.tsx:19`
6. `src/app/dashboard/admin/tags/TagActions.tsx:26`
7. `src/app/dashboard/admin/tags/TagActions.tsx:38`
8. `src/app/dashboard/admin/tags/TagTable.tsx:7`
9. `src/app/dashboard/admin/tags/page.tsx:26`
10. `src/app/dashboard/admin/users/CreateAdminModal.tsx:20`
11. `src/app/dashboard/admin/users/UserRoleActions.tsx:22`
12. `src/app/dashboard/admin/users/UserRoleActions.tsx:34`
13. `src/app/dashboard/page.tsx:15`
14. `src/app/dashboard/pets/[id]/edit/EditPetForm.tsx:9`
15. `src/app/dashboard/pets/[id]/qr/QrClient.tsx:8`
16. `src/app/dashboard/pets/page.tsx:12`
17. `src/app/shop/OrderButton.tsx:12`
18. `src/app/shop/page.tsx:12`
19. `src/app/t/[tagCode]/TagRegisterFlow.tsx:92`

## `no-unescaped-entities` (2 occurrences, 1 file)

`src/app/page.tsx:123` — two raw `"` on the same line (columns 19 and 198, so it's a quoted phrase — likely a testimonial or tagline in JSX text). Read the actual line before fixing: if it's a matched opening/closing pair of a quoted phrase, use `&ldquo;`/`&rdquo;` (typographically correct curly quotes); if it's not a clean pair, use `&quot;` for both. Don't guess which — read the line first.

## Batching (per spec R4)

Fix in this order, running `npm run typecheck` after each batch (not just once at the end):
1. `no-require-imports` (2 files) — mechanical, low risk, do first.
2. `no-unescaped-entities` (1 file) — mechanical, isolated.
3. `no-explicit-any` — batch by directory (`actions/`, `dashboard/admin/tags/`, `dashboard/admin/users/`, remaining) rather than all 19 at once, so a typecheck failure narrows down to a small batch instead of all 17 files.

## Verification

Final check before handoff: `npm run lint` exits 0, `npm run typecheck` exits 0, `npm run build` still succeeds (confirms no new build-time type errors slipped in despite `no-explicit-any` fixes passing typecheck in isolation — Next.js's build type-checks with slightly different settings/scope in places).
