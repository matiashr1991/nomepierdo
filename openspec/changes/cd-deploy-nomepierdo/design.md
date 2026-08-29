# Design: Automated CD Deploy to VPS

Change: `cd-deploy-nomepierdo`
Proposal: `./proposal.md` · Spec: `./spec.md`

## Correction vs. proposal.md

`proposal.md` describes this as a new standalone `.github/workflows/deploy.yml`. During design, this turned out to be the wrong mechanism for satisfying **R1** ("deploy MUST only run after CI passes"): GitHub Actions' `needs:` dependency only works *within* one workflow file. Making a separate `deploy.yml` wait on `ci.yml` requires a `workflow_run` trigger, which is known to be flaky in practice (branch/ref association quirks, harder to reason about for `push`-triggered flows, awkward local testing).

**Decision: extend the existing `.github/workflows/ci.yml` (from `ci-and-auth-types`) with two additional jobs instead of creating a separate file.** Same file, `needs:` chain, branch-gated:

```
verify (existing: lint, typecheck, build)
  → build-and-push (new; only on push to main)
    → deploy (new; only on push to main)
```

PRs still run `verify` only (no image build, no deploy — matches R1's "no deploy on CI failure or on PRs" intent, since `build-and-push`/`deploy` are gated with `if: github.ref == 'refs/heads/main' && github.event_name == 'push'`).

## Workflow additions to `ci.yml`

```yaml
  build-and-push:
    needs: verify
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4

      - uses: docker/setup-buildx-action@v3

      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          build-args: |
            NEXT_PUBLIC_APP_URL=${{ vars.NEXT_PUBLIC_APP_URL }}
          tags: |
            ghcr.io/matiashr1991/nomepierdo:latest
            ghcr.io/matiashr1991/nomepierdo:${{ github.sha }}

  deploy:
    needs: build-and-push
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy por SSH al Swarm
        uses: appleboy/ssh-action@v1.0.3
        env:
          GHCR_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GHCR_USER: ${{ github.actor }}
          IMAGE_SHA: ${{ github.sha }}
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          envs: GHCR_TOKEN,GHCR_USER,IMAGE_SHA
          script: |
            set -e
            export DOCKER_CONFIG="$(mktemp -d)"
            trap 'rm -rf "$DOCKER_CONFIG"' EXIT
            echo "$GHCR_TOKEN" | docker --config "$DOCKER_CONFIG" login ghcr.io -u "$GHCR_USER" --password-stdin

            cd /opt/stacks/nomepierdo
            git pull origin main

            set -a
            . /opt/deploy/nomepierdo/.env-prod
            set +a

            docker --config "$DOCKER_CONFIG" pull "ghcr.io/matiashr1991/nomepierdo:${IMAGE_SHA}"
            docker --config "$DOCKER_CONFIG" stack deploy -c stack.yml nomepierdo --with-registry-auth --detach=false
            docker service update --force --image "ghcr.io/matiashr1991/nomepierdo:${IMAGE_SHA}" nomepierdo_web
```

Reused conventions from the verified reference pipelines (design justification per requirement):
- `docker/login-action` + `GITHUB_TOKEN` for GHCR push (`build-and-push`), matching `une`/`asist-lite`.
- Isolated `DOCKER_CONFIG` via `mktemp -d` + `trap` cleanup for the deploy-side GHCR login — copied from `vendAcon`'s pipeline specifically because this VPS runs 18+ unrelated stacks under one Docker daemon (R5); reusing the default `~/.docker/config.json` would be a real risk on this box, not a hypothetical one.
- `docker service update --force --image ...` after `stack deploy` — copied from `une`'s pipeline (R6); without it, a `:latest` re-push alone does not reliably restart the Swarm service.
- `appleboy/ssh-action@v1.0.3` — same action version already proven working on this VPS by two other pipelines.

## Secrets and variables to create (none exist today — confirmed via `gh secret list` / `gh variable list`, both empty)

| Name | Type | Value source |
|---|---|---|
| `VPS_HOST` | Secret | `72.61.134.65` |
| `VPS_USER` | Secret | `root` |
| `VPS_SSH_KEY` | Secret | **New** dedicated ed25519 private key (see below) — NOT the user's personal key |
| `NEXT_PUBLIC_APP_URL` | Repository **variable** (not secret — it's a public URL baked into client JS anyway) | Whatever the app's public URL is, e.g. `https://nomepierdo.mmatdev.com` — confirm exact value with the user at apply time |

`GITHUB_TOKEN` needs no manual setup — it's automatically provided by Actions and already scoped correctly for both the build-side push and deploy-side pull, since the image lives under the same GitHub org/user as the repo.

### R4 — dedicated deploy key

Generate a new key specifically for this pipeline (do not reuse `vendAcon`'s password-based auth or any personal key):
```
ssh-keygen -t ed25519 -C "github-actions-deploy-nomepierdo" -f nomepierdo_deploy_key -N ""
```
Append `nomepierdo_deploy_key.pub` to `/root/.ssh/authorized_keys` on the VPS (currently has 4 keys; this becomes a 5th, independently revocable one — satisfies R4). Paste the *private* key's contents into the `VPS_SSH_KEY` GitHub secret. Never commit either file to the repo.

## Known limitation (documented, not silently fixed — per proposal.md Risks)

`nomepierdo_web` runs `replicas: 1`. `docker service update --force` replaces the single running task, so there is a brief window (Swarm's `restart_policy: on-failure` default rollout, typically a few seconds) where the service is unavailable. Traefik will 502 during that gap. Fixing this would mean `replicas: 2+`, which is a capacity/cost tradeoff for the user to decide separately — not bundled into this change.

## Verification at apply time

Before merging, confirm with the user the exact production value for `NEXT_PUBLIC_APP_URL` (design assumes `https://nomepierdo.mmatdev.com` based on the Traefik router rule already deployed, but this should be confirmed, not assumed, since it's baked into the client bundle and wrong values are only visible after deploy).
