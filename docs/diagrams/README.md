# Diagrams and rendered exports
Six Mermaid sources have matching genuine SVG exports rendered with Mermaid CLI 12.2.0 and existing Chrome. A contact sheet (`diagram-preview.png`) was visually inspected. Open individual SVGs and zoom for full detail.

| Diagram | Source | Render |
|---|---|---|
| Overall use cases | [Mermaid](use-cases.mmd) | [SVG](use-cases.svg) |
| Focused checkout use case | [Mermaid](use-case-checkout.mmd) | [SVG](use-case-checkout.svg) |
| Activity with component lanes | [Mermaid](activity-checkout.mmd) | [SVG](activity-checkout.svg) |
| Checkout sequence | [Mermaid](sequence-checkout.mmd) | [SVG](sequence-checkout.svg) |
| Domain classes | [Mermaid](domain.mmd) | [SVG](domain.svg) |
| Deployment topology | [Mermaid](deployment.mmd) | [SVG](deployment.svg) |

Re-render using `npx @mermaid-js/mermaid-cli -i docs/diagrams/sequence-checkout.mmd -o docs/diagrams/sequence-checkout.svg`. If browser download is disabled, supply a Puppeteer JSON config with your own Chrome executable via `-p`; machine paths are intentionally omitted from repository configuration.

Deployment is a component/node topology expressed with Mermaid flowchart notation, rather than native UML deployment notation. It is explicitly a candidate VPS target: actual hosting provider, HTTPS endpoints and run evidence remain pending. Update this diagram when deployment is established; if strict UML notation is required by the assessor, transcribe the same nodes and boundaries to PlantUML deployment notation.

Ingredient/RecipeItem availability replaces Product.stock from the assignment's minimal entity example and matches actual Prisma schema. The user-required VNPay Sandbox replaces assignment mock-payment examples.
