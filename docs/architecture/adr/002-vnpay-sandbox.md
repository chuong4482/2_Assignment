# ADR 002 ? VNPay Sandbox instead of mock payment
Status: accepted by explicit user instruction.

Context: assignment examples use simulated wallet/card; user requires their supplied VNPay Sandbox merchant preserved.
Decision: positive-value orders use external VNPay Sandbox with server-side signing and verified callbacks. Do not re-enable simulated wallet/card/COD or expose merchant secret. Zero-total orders may settle directly.
Consequences: tests can verify gateway contracts with isolated test signing keys; they do not prove a successful Sandbox banking session. Retain a separate manual Sandbox demo and clearly state this assignment variance.
