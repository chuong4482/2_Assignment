# Architecture

## Repository boundaries (Assignment 2)

Keep `apps/web`, `apps/api`, `docs`, and `tests` as separate top-level responsibilities, as specified in section 9 of the assignment. Existing `task-*` names inside application code identify inherited Assignment 1 features; they do not represent the five delivery stages of Assignment 2.

- `apps/web/app`: Next.js routes; feature components and hooks stay in `apps/web/features`.
- `apps/api/src/tasks`: backend business domains; preserve order, payment, authentication and inventory boundaries.
- `apps/api/src/config/moi-truong.ts`: shared environment-file loader for API startup and VNPay configuration. Injected environment variables take precedence over file values.
- `apps/api/prisma`: schema, versioned migrations and seed.
- `docs/requirements`, `docs/diagrams`, `docs/architecture`: Task 1–3 artifacts. Keep diagram sources and exports together.
- `docs/traceability-matrix.md`: links requirements to use-cases, design, code and tests; update it whenever those paths change.
- `tests`: integration and E2E tests; API unit tests remain beside backend code.
- Root `Dockerfile`: shared dependency stage and separate `api`/`web` build targets. Root `.dockerignore` applies to both.
- Root `.env` and `.env.example`: local configuration and its committed template; do not commit actual secrets. API containers receive their internal database URL through Compose.
- `docker-compose.yml`: local web/API/database. Production and isolated test databases retain separate Compose files to preserve secret, networking and storage boundaries.
- `.github/workflows` and `scripts`: CI/CD, deployment and rollback.

Structural cleanup does not establish assignment acceptance. Hosted CI success/failure evidence, protected merges, public HTTPS production URLs, release notes, demo and Sprint Review/Retrospective still require actual evidence. VNPay Sandbox remains the project's payment integration; the assignment's simulated Wallet/Card requirement must be reconciled with the SRS and ADR rather than silently claimed as implemented.

## Application architecture

A layered monorepo contains Next.js UI (`apps/web`), NestJS REST API (`apps/api`) and PostgreSQL via Prisma (`apps/api/prisma`). Feature/domain directories separate menu, auth, cart, ordering, payment, inventory and administration. Database migrations are versioned SQL; seed creates sample data.

The browser calls public API routes with JWT. Only API holds merchant/database secrets. VNPay Sandbox is an external redirect and signed callback boundary. API transactions coordinate payment settlement, ingredient compare-and-swap version checks and loyalty. Product stock in the assignment's minimal example is represented by Ingredient/RecipeItem availability in this richer model.

`GET /health` reports liveness and `/health/ready` tests database readiness. Runtime logs use container stdout; operators must avoid logging credentials, signed URLs and customer authentication material. Configuration comes from environment variables; `.env.example` is a template, while actual merchant stays outside committed artifacts.

Advantages: one repository, explicit domain code, reproducible Compose and relational transactions. Limitations: one API/database deployment, external gateway availability, reconciliation after a paid gateway transaction cannot be fulfilled, and operational deployment evidence still required. Production diagram describes the Compose/VPS candidate; no actual hosting provider or live URL is verified yet.

Current UI checkout creates an order then calls `POST /orders/:id/retry-payment` to obtain the VNPay URL. An additional authenticated `POST /payments` endpoint in `apps/api/src/tasks/task-08-thanh-toan/yeu-cau-thanh-toan.controller.ts` supports an explicit Idempotency-Key, per-order row lock and unique immutable payment intent; concurrent replays reuse one intent and URL. These are separate entry points with shared settlement.

PWA support uses `apps/web/app/manifest.ts`, `apps/web/public/sw.js`, `apps/web/public/offline.html` and registration in `apps/web/features/dung-chung/DangKyPwa.tsx`. Local mobile E2E verified manifest, service-worker registration and offline fallback. This supports a fallback page offline; live ordering/payment still requires network. Production HTTPS installation remains unverified. Local lint, unit/integration/mobile E2E, host/Docker build and workflow/shell static checks passed; actual hosted delivery remains pending.
