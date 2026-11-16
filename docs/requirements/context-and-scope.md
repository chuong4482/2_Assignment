# Context and scope
BrewLite reduces queues by allowing customers to select drinks, pay without cash and follow collection status.

| Stakeholder | Goal and acceptance interest |
|---|---|
| Customer | Correct price, safe payment, reliable order history |
| Counter staff | See paid orders and update preparation status |
| Store manager / Product Owner | Maintain menu, inventory and promotions |
| Lecturer / acceptance customer | Verify requirements, runnable increment and process evidence |
| Development team | Reproducible build, tests and deployment |
| VNPay | Signed Sandbox requests and authenticated callback handling |

In scope: mobile-first Next.js, NestJS REST API, PostgreSQL/Prisma; menu, options, authenticated cart, orders, VNPay Sandbox, history, order state machine, promotions, loyalty and ingredient inventory. Staff administration is an implemented extension of Assignment 1's customer MVP.

Out of scope: real-money collection, delivery logistics, live bank reconciliation and claims of production availability before deployment.

Assumptions: VND integer amounts; customers collect at the counter; supplied merchant remains local secret configuration; recipes determine product availability. Constraints: Next.js/NestJS/PostgreSQL are mandatory; no merchant secrets in source/logs; CI and hosted HTTPS evidence must be collected externally.

Risks: payment settles while ingredients are exhausted; duplicate or late callbacks; exposing merchant credentials; production environment differing from local; insufficient historical Scrum/CI evidence.

Scope decision: the user explicitly requests the supplied VNPay Sandbox merchant instead of mock wallet/card payment. Sandbox is a real external test gateway, not real-money production payment. Preserve this override in all diagrams, tests and review materials.
