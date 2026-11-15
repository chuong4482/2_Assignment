# ADR 001 ? Next.js/NestJS monorepo
Status: documented current decision; historical team approval not asserted.

Context: both assignments require separate frontend and backend with shared documentation and delivery.
Decision: npm workspaces under apps/web and apps/api, PostgreSQL/Prisma, Docker Compose for local services.
Consequences: unified changes and build scripts; coupled repository releases; migrations remain explicit delivery operations.
