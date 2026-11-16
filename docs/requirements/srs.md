# Software requirements specification
Status: reconstructed from both assignment specifications and current implementation; historical approval is not asserted. Amounts use integer VND.

| ID | Requirement | MoSCoW | Verifiable acceptance |
|---|---|---|---|
| FR-01 | Browse menu | Must | GET /products returns id, name, price and image; UI shows loading, empty and error states |
| FR-02 | Product options | Must | Detail supports S/M/L and valid toppings; total matches server pricing |
| FR-03 | Cart | Must | Add/update/remove items, quantity badge and recalculated total; owner isolation |
| FR-04 | Authentication | Must | Register/login issue JWT; invalid input rejected; protected operations reject missing/forged JWT |
| FR-05 | Create order | Must | Valid authenticated items create one PENDING order with code; empty/invalid request rolls back |
| FR-06 | VNPay Sandbox | Must | Positive totals redirect to Sandbox; valid signed successful callback settles payment; invalid signature/amount cannot settle; failure preserves cart and allows retry |
| FR-07 | Order tracking | Must | Confirmation displays code and server-confirmed status; /orders/me returns only owner's orders |
| FR-08 | Order state machine | Must | PENDING -> PAID -> PREPARING -> READY -> COMPLETED; PAYMENT_FAILED retries through PENDING; unsupported transitions rejected; terminal states remain terminal |
| FR-09 | Payment idempotency | Must | Repeating one Idempotency-Key cannot create a second order/payment or repeat stock/points effects; callback duplicate also harmless |
| FR-10 | Concurrent inventory | Must | With ingredients sufficient for one drink, two concurrent settlements cannot both consume it; quantity stays nonnegative using transaction and version check |
| FR-11 | Promotion and loyalty | Must | Valid active promotion reduces total; expired promotion rejected; points credited once after PAID |
| FR-12 | Staff management | Should | Authorized staff update status; customer cannot mutate protected menu/admin data |
| NFR-01 | Performance | Must | Warm sample-data menu response p95 <500 ms; record environment and result |
| NFR-02 | Security | Must | bcrypt password hashes; JWT guard; DTO validation; no hashes/secrets in responses or committed configuration |
| NFR-03 | Usability/availability | Must | Mobile viewport supports checkout; loading/empty/error/retry states; health and DB readiness endpoints |
| NFR-04 | Reproducibility | Must | Clean clone supports migration/seed, local Compose, unit/integration/E2E and documented build |
| NFR-05 | Delivery | Must | PR quality gates; SHA-tagged images; production HTTPS, private DB, migration, smoke test and rollback procedure |
| NFR-06 | PWA | Should | Manifest and installable metadata/service worker policy verified on supported browser; current PWA capability must be checked before claiming it |
| FR-13 | Real-money payment | Won't | No production payment credentials or real charges in this scope |
| FR-14 | Delivery logistics | Could | Future backlog only; no MVP acceptance claim |

Overall use-case source: ../diagrams/use-cases.mmd. Detailed checkout: use-case-checkout.md. Verification coverage and pending evidence: ../traceability-matrix.md.
