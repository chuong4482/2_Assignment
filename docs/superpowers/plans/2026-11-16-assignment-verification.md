# BrewLite requirements-to-deployment verification plan

Goal: run Docker, verify both assignment PDFs, repair reproducible defects, and add the local artifacts required for handoff.
Architecture: preserve Next.js/NestJS/PostgreSQL and real VNPay Sandbox redirects. No simulated customer payment path. Tests use a separate PostgreSQL database and a dedicated signing key.
Scope approved by user: check, repair against both PDFs, and have two additional AI reviewers verify.

- [x] Start Docker and obtain two independent reviews.
- [ ] Add regressions and repair immutable checkout, concurrent retry, callback status and expiry defects.
- [ ] Make locked Docker builds reproducible; add real lint and CI/CD quality gates.
- [ ] Add requirements, use case, diagrams with source/render, ADR, traceability and deployment instructions.
- [ ] Run unit/integration/browser checks in isolated test environment; rebuild and smoke-test live Docker.
- [ ] Have both reviewers recheck the final changes; record actual evidence and external gaps.

Constraints: do not disclose secrets, alter existing demo database stock through tests, invent Git/Sprint/deployment history, or claim production without an accessible URL. README remains focused on commands to run/test/build/deploy/rollback. VNPay-only is the user's explicit override of the PDFs' mock Wallet/Card example.
