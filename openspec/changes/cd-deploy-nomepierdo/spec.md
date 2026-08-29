# Spec: Automated CD Deploy to VPS

Change: `cd-deploy-nomepierdo`
Proposal: `./proposal.md`

## Requirements

### R1 — Deploy MUST only run after CI passes

The `deploy.yml` workflow SHALL NOT build or deploy unless `ci.yml` (lint + typecheck + build, from `ci-and-auth-types`) has already succeeded for the same commit on `main`.

**Scenario: CI fails, no deploy happens**
- Given a push to `main` that fails lint, typecheck, or build
- When CI reports failure
- Then no image MUST be built or pushed, and no deploy MUST be attempted

**Scenario: CI passes, deploy proceeds**
- Given a push to `main` that passes CI
- When CI completes successfully
- Then the build-and-deploy workflow MUST start automatically

### R2 — Image MUST be built with the correct build-time public URL

The build step SHALL pass `NEXT_PUBLIC_APP_URL` as a Docker build-arg matching the Dockerfile's `ARG NEXT_PUBLIC_APP_URL` / `ENV NEXT_PUBLIC_APP_URL` declaration.

**Scenario: Built image has the right public URL baked in**
- Given the build step runs with the configured `NEXT_PUBLIC_APP_URL` value
- When the resulting image is deployed and serves a page
- Then client-side code MUST reference the same `NEXT_PUBLIC_APP_URL` value used at build time (Next.js inlines this at build, not runtime)

### R3 — Image MUST be pushed to GHCR tagged by commit SHA

Every successful build SHALL push `ghcr.io/matiashr1991/nomepierdo:${{ github.sha }}` in addition to `:latest`, so a specific deploy can always be traced back to an exact commit and re-deployed by SHA if needed.

**Scenario: SHA tag exists after build**
- Given a build completes successfully
- When GHCR is queried for the image
- Then a tag matching the triggering commit's full SHA MUST exist

### R4 — Deploy MUST use a dedicated, revocable SSH credential

The deploy job SHALL authenticate to the VPS using an SSH key generated specifically for this CI pipeline, distinct from the user's personal key and from any key/password used by other projects' pipelines.

**Scenario: CI key is independently revocable**
- Given the CI deploy key is compromised or needs rotation
- When that key alone is removed from `/root/.ssh/authorized_keys`
- Then the user's personal SSH access and every other project's CI pipeline MUST remain unaffected

### R5 — Deploy MUST NOT disturb other stacks' Docker registry auth on the shared VPS

Since this VPS hosts 18+ unrelated Swarm stacks under one Docker daemon, the deploy script SHALL use an isolated `DOCKER_CONFIG` for its GHCR login rather than the default `~/.docker/config.json`.

**Scenario: Other stacks unaffected by this deploy's registry login**
- Given the deploy script logs into GHCR to pull `nomepierdo`'s image
- When the script completes (success or failure)
- Then the default Docker config used by other stacks on the VPS MUST be unchanged
- And any temporary Docker config created for this login MUST be removed after use

### R6 — Deploy MUST force the service to pick up the new image

Because Docker Swarm does not reliably detect a re-pushed `:latest` tag as a spec change, the deploy step SHALL explicitly force-update `nomepierdo_web` with the SHA-tagged image after `docker stack deploy`.

**Scenario: Service actually restarts on the new image**
- Given `docker stack deploy` has been run with an unchanged `:latest` reference
- When the deploy script subsequently runs `docker service update --force --image ghcr.io/matiashr1991/nomepierdo:${{ github.sha }} nomepierdo_web`
- Then the running task MUST be replaced by a new one based on that exact SHA-tagged image

### R7 — No automated schema migration

The deploy workflow SHALL NOT run `prisma db push`, `prisma migrate`, or any other schema-mutating command automatically.

**Scenario: Schema changes stay manual**
- Given a deploy runs after a commit that changes `prisma/schema.prisma`
- When the deploy workflow completes
- Then the database schema MUST be unchanged by the workflow itself — applying it remains a deliberate manual step per `DEPLOY.md`

## Out of Scope (non-requirements)

- Multi-environment (dev/staging) deploy branching.
- Rolling/zero-downtime deploy (still `replicas: 1`).
- Disabling VPS root password SSH login (flagged separately, not a requirement of this change).
