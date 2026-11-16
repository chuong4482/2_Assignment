# Deployment and verification handoff

Implemented files: `.github/workflows/ci.yml`, `.github/workflows/delivery.yml`, `scripts/deploy.sh`, `scripts/rollback.sh`, both application Dockerfiles and `docker-compose.prod.yml`. Their presence is source evidence, not proof of a successful hosted run. Public URLs, branch protection, release and deployment evidence remain pending.

## Local and automated verification
Copy `.env.example` to `.env` only if absent, preserving supplied VNPay merchant values. Run `docker compose up -d --build`; inspect `docker compose ps`, `/health` and `/health/ready`. Root README documents local run/test/build.

CI runs npm ci, Prisma generation, lint, unit tests, build, isolated migration/seed, API startup, integration and Playwright E2E. PostgreSQL uses dedicated test credentials/database; Playwright starts its own web server at 3100 and uses API 4100. The test signing key is isolated from the supplied Sandbox merchant. CI must be configured as a required PR check in GitHub; YAML alone cannot enforce branch protection.

## GitHub setup
Repository: https://github.com/chuong4482/2_Assignment.git . GitHub CLI is unauthenticated locally; no remote settings or successful runs are verified.

1. Configure repository Actions variables `ENABLE_DEPLOY=true`, `PUBLIC_API_URL=https://your-api-host` and `PUBLIC_WEB_URL=https://your-web-host`. Use canonical HTTPS origins without trailing slash. Both public URL variables must be available to the publish job; set repository variables rather than only production-environment variables.
2. Create the `production` GitHub environment with desired approval/protection rules. Configure secrets `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY` and `DEPLOY_KNOWN_HOSTS` in that environment (or inherited repository secrets). Obtain the host key fingerprint through a trusted channel; store verified known_hosts lines. The SSH account needs Docker access and write access to `~/brewlite`.
3. Allow workflow package write permission. Publishing logs in to GHCR using `github.actor` and the automatically scoped `GITHUB_TOKEN`; no personal publishing token is needed in the workflow.
4. Set up Linux VPS Docker Engine/Compose, DNS and a TLS reverse proxy to loopback frontend 3000 and API 4000. Keep PostgreSQL internal. Configure VPS GHCR pull authentication for private images using a read:packages credential and `docker login ghcr.io --password-stdin`; retain it in the deploy user's Docker credential store, never repository/logs. Public images may not require login.
5. Create `~/brewlite/.env.production` securely on the VPS (chmod 600). Required variables: `IMAGE_OWNER=chuong4482` (lowercase GHCR owner), `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, long random `JWT_SECRET`, `STAFF_KEY`, `ADMIN_EMAIL`, strong `ADMIN_PASSWORD`, `WEB_ORIGIN` matching PUBLIC_WEB_URL, supplied Sandbox `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`, and `VNPAY_RETURN_URL` pointing to the public API `/payments/vnpay/return`. Use URL-safe database credentials or correctly URL-encode them in the database connection construction. Never copy production secrets into CI test configuration.
6. Confirm Sandbox merchant permits the chosen return/IPN endpoints. Browser frontend API URL is baked into the web image through PUBLIC_API_URL; changing runtime env alone cannot fix it.
7. Trigger Delivery manually or push a `v*` release tag after review. It first calls CI, then builds/pushes SHA-tagged images if ENABLE_DEPLOY is exactly true. It copies deployment files over SSH and invokes the VPS scripts, followed by public API readiness and frontend smoke checks.

## Database and first deployment
Before each migration, create an operator-managed PostgreSQL backup, verify completion and retain a tested restore procedure. Current deployment scripts do not automate backup. Use backward-compatible expand/contract schema changes: rollback only switches application images and does not reverse migrations.

The production script starts the database, runs `prisma migrate deploy` in a one-off new API container, then starts API/web. Production does not run seed automatically. Before first demonstration, initialize the empty production database using a reviewed one-time seed/bootstrap procedure; the sample seed must not be rerun on live data without checking its update behavior. API/web have no Compose healthcheck, so `--wait` confirms running containers; subsequent public readiness smoke provides stronger confirmation.

## Rollback and evidence
A successful release stores `.release-tag`; `.previous-release-tag` selects the previous SHA for `sh scripts/rollback.sh` from `~/brewlite`. Keep previous image digests available. There is no previous release for a first deployment. Verify public API/database readiness and frontend after rollback. Restore a backup or apply a reviewed forward repair for incompatible database changes.

The deployment script snapshots the active tag before any fallible step and clears stale previous-tag state on first deployment. Delivery explicitly reports rollback failure and checks API readiness after rollback; inspect these messages and verify frontend too. A failed rollout keeps the workflow failed even if rollback succeeds.

Required external records: PR review/history, protected checks, passing and intentionally failing CI run links, image digests, actual HTTPS frontend/API/health URLs, successful smoke output, release notes/tag, migration/backup record, rollback rehearsal, real Sandbox success/failure demo, Sprint Review and Retrospective. No such evidence is fabricated here.

