# Proposal: Automated CD Deploy to VPS (Docker Swarm)

## Status
Draft

## Why

Deploy for this project is currently 100% manual, per `DEPLOY.md`: SSH into the VPS, `git pull`, build the Docker image locally on the server, `docker stack deploy`, and manually force-restart the service. This was confirmed directly against the production VPS (`72.61.134.65`, Docker Swarm, Traefik) during this session — the currently deployed `nomepierdo:latest` image is 2 commits behind local `main`.

The user already runs real CI/CD for other projects on this same VPS (`une`, `vendAcon`, `asist-lite`) using GitHub Actions: a `build` job that builds and pushes to GHCR, followed by a `deploy` job that SSHes into the VPS and redeploys the Swarm stack. This was verified directly by reading those repos' `.github/workflows/deploy.yml` on the VPS. This change ports that same proven pattern to `nomepierdo`, rather than inventing a new one.

This depends on the `ci-and-auth-types` change already being in place — CD should only ship on top of a verified-passing CI gate, not before.

## What Changes

Add `.github/workflows/deploy.yml`:
- **`build` job**: on push to `main` (after `ci` passes — see design.md for the exact gating mechanism), build the production Docker image and push to `ghcr.io/matiashr1991/nomepierdo` tagged `:latest` and `:${{ github.sha }}`. Must pass `--build-arg NEXT_PUBLIC_APP_URL=...` — this repo's Dockerfile bakes it in at build time (Next.js public env var), unlike the other reference projects, so the build-args wiring is new, not copy-paste.
- **`deploy` job** (needs: build): SSH into the VPS with a **new, dedicated** ed25519 deploy key (not reusing the user's personal key), run: `cd /opt/stacks/nomepierdo && git pull`, source the **existing** `/opt/deploy/nomepierdo/.env-prod` (already present on the VPS, confirmed — nothing to create there), `docker stack deploy -c stack.yml nomepierdo --with-registry-auth` via an isolated `DOCKER_CONFIG` (so GHCR login doesn't clobber the Docker config other stacks on this shared VPS rely on — same trick `vendAcon`'s pipeline already uses), then `docker service update --force --image ghcr.io/matiashr1991/nomepierdo:${{ github.sha }} nomepierdo_web` (Swarm doesn't reliably detect a `:latest` re-push as a change; `une`'s pipeline works around this the same way).

## Impact

- **New file**: `.github/workflows/deploy.yml`.
- **New GitHub repo secrets** (none currently exist on this repo — verified via `gh secret list`): `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY` (new dedicated key, see design.md).
- **VPS changes**: append one new public key to `/root/.ssh/authorized_keys` (currently has 4 keys; this adds a 5th, CI-only, revocable independently). No other VPS-side file changes — `/opt/stacks/nomepierdo` (git checkout) and `/opt/deploy/nomepierdo/.env-prod` already exist and are reused as-is.
- **No Prisma migration/db-push automation** — stays a manual, deliberate step per `DEPLOY.md` step 5, same as today. Out of scope here, same reasoning as `ci-and-auth-types`.
- **No changes to `stack.yml`** — the deployed one on the VPS is already byte-identical to the one in this repo (verified).

## Out of Scope

- Automated `prisma db push` / migrations on deploy.
- Multi-environment (dev/staging) deploy — `nomepierdo` has one environment, unlike `asist-lite`'s main/develop split.
- Disabling root password SSH login on the VPS — flagged as a real finding during the VPS review (root login with password is enabled, and `vendAcon`'s pipeline even stores that password as a GitHub secret), but that's shared-infra hardening affecting every project on the box, not something to bundle into a single project's CD change. Recommended as a separate follow-up the user should own explicitly.

## Risks & Rollback

- **Risk**: a bad deploy on `main` push has no manual gate. **Mitigation**: `deploy` only runs after `build` succeeds, and `build` only runs after `ci.yml`'s checks pass (see design.md for the trigger chain) — lint/typecheck/build must be green first.
- **Risk**: forced service update (`docker service update --force`) restarts `nomepierdo_web` with zero warm-up; a brief connection blip is possible during rollout since `replicas: 1` (no rolling redundancy). **Mitigation**: out of scope to fix today (would mean `replicas: 2`+, a capacity/cost decision for the user, not a CI/CD default) — documented as a known limitation, not silently fixed.
- **Rollback**: revert the commit that broke `main`, which retriggers `build`+`deploy` with the previous good source and produces a new `:sha` image built from the reverted state — same rollback mechanism as `une`/`vendAcon` already use, no new tooling needed. Deleting `.github/workflows/deploy.yml` alone reverts to the current fully-manual process with zero VPS-side cleanup required beyond removing the one added deploy key.
