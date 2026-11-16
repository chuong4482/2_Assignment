# Traceability matrix
Paths are relative to repository root. Local verification reported by the implementation agent on 2026-11-16: lint passed, 45/45 unit tests, 17/17 integration tests, 5/5 mobile E2E tests, both host builds, Node 22 Docker builds with locked npm ci, actionlint for both workflows and shell syntax checks passed. These are local results, not hosted CI or production evidence. Unit and integration tests use isolated keys; actual Sandbox completion needs a manual demo.

| Requirement | Story/use-case | Design | Code/API | Test/evidence |
|---|---|---|---|---|
| FR-01 | US-01 Browse | activity-checkout, domain | apps/api/src/tasks/task-02-san-pham; GET /products | products.spec.ts; WEB-T01; PERF-T01 |
| FR-02 | US-02 Configure | domain | task-04-chi-tiet-san-pham; GET /products/:id | UNIT-T01; E2E-T01 |
| FR-03 | US-03 Cart | activity-checkout | task-05-gio-hang; /cart | INT-T01; E2E-T01 |
| FR-04 | US-04 Sign in | sequence-checkout | task-07-xac-thuc; /auth/register, /auth/login | INT-T02 |
| FR-05 | UC-01 | sequence-checkout | task-06-don-hang; POST /orders | INT-T03; E2E-T01 |
| FR-06 | UC-01 | sequence-checkout; ADR 002 | task-08-thanh-toan; /payments/vnpay/create, /return, /ipn | UNIT-T03, INT-T04, VNPay retry/policy tests; manual Sandbox pending |
| FR-07 | US-07 Track | domain | task-09-lich-su-don-hang; GET /orders/me | INT-T05; E2E-T01 |
| FR-08 | US-08 Prepare | domain state enum | task-10-nghiep-vu-nang-cao/may-trang-thai-don-hang.ts | UNIT-T02 |
| FR-09 | UC-01 repeat | sequence-checkout | Payment unique key and settlement | Passed local integration: six concurrent same-key requests produce one payment and same URL; duplicate IPN effects occur once |
| FR-10 | UC-01 last stock | domain; sequence-checkout | task-10-ton-kho; Ingredient.version | Passed local simultaneous last-cup integration; losing order points restored and stock nonnegative |
| FR-11 | UC-01 rewards | domain | promotion and loyalty settlement | UNIT-T01; INT-T04 reward count |
| FR-12 | US-12 Staff | use-cases | task-10-quan-tri | INT-T06 |
| NFR-01 | Menu response | architecture | GET /products | PERF-T01 passed within local 17/17 integration run; production performance unverified |
| NFR-02 | All protected actions | sequence-checkout | JWT guard, DTO, bcrypt | INT-T02/03/05/06; signature tests |
| NFR-03 | Availability | deployment | /health, /health/ready; web states | INT-T07; WEB-T01 |
| NFR-04 | Reproduce | ADR 001 | Dockerfiles, Compose, migrations, seed | Host and locked npm ci Docker builds passed locally; independent clean-clone handover pending |
| NFR-05 | Release | deployment | CI/CD and production Compose | External CI, URLs, release, rollback evidence pending |
| NFR-06 | Install PWA | architecture | apps/web/app/manifest.ts; public/sw.js; public/offline.html; features/dung-chung/DangKyPwa.tsx | Passed mobile E2E manifest, service-worker and offline-fallback verification; production installability pending |

Task 1 through 3 source documents now exist; this does not establish the historical sequential acceptance required by Assignment 2. Genuine SVG exports accompany all six Mermaid sources; actual deployment alignment and strict UML deployment notation remain to be finalized before submission.

Implementation update: `apps/api/src/tasks/task-08-thanh-toan/yeu-cau-thanh-toan.controller.ts` implements authenticated `POST /payments` with a required Idempotency-Key, order row lock and unique payment intent. Local integration verified concurrent key replay, immutable intent/status mismatches, last-cup competition, losing-order points restoration and paid-cancellation refund-pending behavior. `.github/workflows/ci.yml` and `delivery.yml`, `scripts/deploy.sh` and `rollback.sh` implement NFR-05 pipeline source; successful hosted runs and protected merge settings remain pending.

