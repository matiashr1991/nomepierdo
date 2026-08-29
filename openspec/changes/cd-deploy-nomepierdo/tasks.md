# Tasks: Automated CD Deploy to VPS

Change: `cd-deploy-nomepierdo`
Reference: `./proposal.md`, `./spec.md`, `./design.md` (read all three first)

Implementer: intended for an external coding agent working in this repo (`D:/proyectos/webQrMascotas`), with `gh` CLI access to `matiashr1991/nomepierdo` and SSH access to the VPS.

**IMPORTANT — this change touches production credentials and a shared production VPS (18+ other stacks run on it). Phases 1 and 2 involve creating a new SSH key, writing to `/root/.ssh/authorized_keys` on that VPS, and creating GitHub repo secrets. Confirm with the user before executing any command in Phase 1 or 2 that writes to the VPS or to GitHub — do not run them silently even if credentials are available in the environment.**

---

## Phase 1 — Dedicated deploy SSH key (confirm with user before executing)

### 1.1 Generate the key pair locally

```
ssh-keygen -t ed25519 -C "github-actions-deploy-nomepierdo" -f ./nomepierdo_deploy_key -N ""
```
Do NOT commit `nomepierdo_deploy_key` or `nomepierdo_deploy_key.pub` to the repo. Keep them outside the working tree or add to `.gitignore` if generated inside it.

### 1.2 Install the public key on the VPS

Append the contents of `nomepierdo_deploy_key.pub` to `/root/.ssh/authorized_keys` on `72.61.134.65`. Confirm the file has exactly one new line added (currently 4 keys present; must become 5, not overwrite existing ones).

**Verification**: `ssh -i ./nomepierdo_deploy_key root@72.61.134.65 'echo ok'` must succeed non-interactively (no password prompt) before proceeding.

### 1.3 Store the private key as a GitHub secret

```
gh secret set VPS_SSH_KEY < ./nomepierdo_deploy_key
```
After this succeeds, delete the local private key file — it must not remain on disk once it's in GitHub Secrets.

---

## Phase 2 — Remaining secrets and variables (confirm with user before executing)

```
gh secret set VPS_HOST --body "72.61.134.65"
gh secret set VPS_USER --body "root"
gh variable set NEXT_PUBLIC_APP_URL --body "https://nomepierdo.mmatdev.com"
```

**Before running the `NEXT_PUBLIC_APP_URL` command**: confirm this exact value with the user — `design.md` assumes it from the already-deployed Traefik router rule (`Host(\`nomepierdo.mmatdev.com\`)`), but a wrong value here only surfaces after a deploy (it's baked into the client JS bundle at build time), so don't guess silently.

**Verification**: `gh secret list` shows `VPS_SSH_KEY`, `VPS_HOST`, `VPS_USER`; `gh variable list` shows `NEXT_PUBLIC_APP_URL`.

---

## Phase 3 — Workflow file changes (safe to do without extra confirmation)

### 3.1 Extend `.github/workflows/ci.yml`

Add two new jobs after the existing `verify` job, exactly as specified in `design.md`'s "Workflow additions to `ci.yml`" section — `build-and-push` (needs: verify) and `deploy` (needs: build-and-push), both gated with:
```yaml
if: github.ref == 'refs/heads/main' && github.event_name == 'push'
```

Copy the job definitions verbatim from `design.md` — do not re-derive them, they're already grounded against this repo's actual `Dockerfile` (which requires `NEXT_PUBLIC_APP_URL` as a build-arg) and the VPS's actual paths (`/opt/stacks/nomepierdo`, `/opt/deploy/nomepierdo/.env-prod`).

### 3.2 Validate YAML syntax

```
npx -y yaml-lint .github/workflows/ci.yml 2>/dev/null || python -c "import yaml,sys; yaml.safe_load(open('.github/workflows/ci.yml'))" 
```
Use whichever is available; the goal is just confirming the file parses as valid YAML before it's relied on by GitHub.

---

## Phase 4 — Do not trigger a real deploy yet

Do NOT push to `main`. This task file's job ends with a reviewable diff to `.github/workflows/ci.yml` plus the secrets/variable/key setup from Phases 1–2, confirmed working (1.2's non-interactive SSH check passed). Actually triggering `build-and-push`/`deploy` happens on the next real push to `main`, which is a decision for the user, not something to force here by pushing directly.

## Phase 5 — Handoff summary

List explicitly:
1. Every GitHub secret/variable created (names only, never values).
2. Confirmation that the new deploy key was added to VPS `authorized_keys` (key count before/after).
3. The exact diff to `.github/workflows/ci.yml`.
4. Any deviation from `design.md` with justification, same convention as `ci-and-auth-types`'s apply report.
