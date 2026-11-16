# UC-01 Place and pay for an order
Actors: customer (primary), VNPay Sandbox (supporting), staff (downstream). Trigger: customer confirms checkout. Links: FR-02 through FR-11, NFR-02 through NFR-05.

Preconditions: menu/recipes seeded, customer authenticated, nonempty valid cart, merchant configured for positive total. Postcondition on success: one paid order/payment, inventory consumed once, loyalty awarded once and confirmation from server state. On failure: no false success, failed/pending order visible and cart retained.

Main flow:
1. Customer browses menu, chooses size/toppings, updates cart and reviews server price.
2. UI sends authenticated order request. API validates items and transactionally persists a PENDING order and item price snapshots.
3. UI requests a VNPay URL. API verifies ownership and signs amount/reference using private merchant configuration.
4. Customer completes Sandbox authentication. VNPay sends signed return/IPN.
5. API verifies signature, amount, order state and duplicate effects, then transactionally settles payment, inventory and loyalty.
6. UI fetches the order and shows confirmed code/status. Customer follows preparation status.

Alternatives: unauthenticated customer signs in then resumes; zero-total order confirms without visiting the gateway; failed payment becomes PAYMENT_FAILED and can retry through PENDING; duplicate callback returns provider acknowledgement without repeated effects.

Exceptions: invalid options/stock reject checkout; missing merchant configuration reports actionable error; tampered callback cannot settle; a success URL alone cannot confirm payment. Concurrent last-stock and explicit Idempotency-Key replay have dedicated passing local integration checks. Sandbox completion evidence is separate from automated callback contract tests.

Focused use-case diagram: [source](../diagrams/use-case-checkout.mmd), [SVG](../diagrams/use-case-checkout.svg).
