# BACKEND BEST PRACTICES — ALWAYS FOLLOW

Build every backend feature as production-quality code.

### Architecture

- Follow NestJS modular, feature-based architecture.
- Keep related controllers, services, DTOs, guards, types, and validators
  inside the appropriate module.
- Keep controllers thin; business logic belongs in services.
- Keep shared utilities in `common/`.
- Keep infrastructure concerns such as Prisma, storage, logging, and
  external services separated from business modules.
- Reuse existing code before creating new code.
- Do not unnecessarily modify unrelated modules.

### TypeScript & Code Quality

- Use strict TypeScript.
- Use meaningful names and clear function responsibilities.
- Avoid `any`.
- Never use `@ts-ignore`, `@ts-nocheck`, or disabled ESLint rules to hide
  problems.
- Follow DRY and SOLID principles where appropriate.
- Avoid duplicate logic, unnecessary abstractions, and unnecessary
  dependencies.
- Keep functions and classes reasonably small and maintainable.

### API Design

- Use RESTful conventions and `/api/v1`.
- Use DTOs for every request.
- Validate all input with `class-validator` and `class-transformer`.
- Use appropriate HTTP status codes.
- Use consistent response structures.
- Document APIs with Swagger.
- Support pagination, filtering, searching, and sorting for large resources.

### Database & Prisma

- Use PrismaService for database access.
- PostgreSQL is the source of truth.
- Never create random PrismaClient instances.
- Follow the existing Prisma schema and migration strategy.
- Use foreign keys, unique constraints, and indexes appropriately.
- Use database-level constraints for important data integrity rules.
- Avoid N+1 queries and unnecessary database queries.
- Never load large datasets into memory unnecessarily.

### Transactions & Data Integrity

- Use Prisma transactions for multi-step operations that must succeed or
  fail together.
- Prevent duplicate records and race conditions where necessary.
- Preserve historical/traceability data.
- Never silently overwrite important historical records.
- Do not use destructive deletes when the business domain requires history.

### Authentication & Authorization

- Protect private endpoints with authentication.
- Enforce authorization and RBAC/permissions on the backend.
- Never trust permissions, userId, farmId, ownership, or role information
  supplied by the client.
- Always verify resource ownership/membership server-side.
- Frontend authorization is only for UX; backend authorization is the
  security boundary.

### Security

- Never expose passwords, password hashes, tokens, secrets, or credentials.
- Never hardcode secrets.
- Use environment variables.
- Keep `.env` out of Git and maintain `.env.example`.
- Never expose raw Prisma/database errors or stack traces.
- Validate file uploads, request sizes, and external input.
- Configure CORS securely for production.
- Use rate limiting for sensitive endpoints where appropriate.
- Do not log passwords, tokens, or secrets.

### Error Handling

- Handle validation, authentication, authorization, not-found, conflict,
  database, and unexpected errors properly.
- Use NestJS exceptions such as:
  `BadRequestException`
  `UnauthorizedException`
  `ForbiddenException`
  `NotFoundException`
  `ConflictException`
- Return useful client-safe error messages.
- Never expose internal implementation details.

### Performance

- Use database indexes for frequently queried fields.
- Use pagination for large collections.
- Select only required database fields.
- Avoid unnecessary API/database requests.
- Use caching/background jobs only where they provide real benefit.
- Do not perform long-running operations inside database transactions.

### AITS Data Integrity

- Treat animals, health, production, breeding, movement, ownership,
  identifiers, QR codes, and audit records as important traceability data.
- Preserve historical records.
- Important mutations should be auditable.
- QR/identifier uniqueness must be enforced.
- Farm-level access must always be verified.
- Offline synchronization must be idempotent and conflict-aware where used.

### Testing

Test important:

- success cases
- validation failures
- authentication failures
- authorization failures
- not-found cases
- duplicate/conflict cases
- transaction rollback cases
- business-rule violations

Before finishing, run:

npx prisma validate
npx prisma generate
npx tsc --noEmit
npm run lint
npm run build

Run available tests as well.

### Final Rule

Before creating or modifying code, inspect the existing architecture,
Prisma schema, modules, authentication, authorization, and related services.

Do not break existing functionality or API contracts unnecessarily.

Prefer a simple, secure, scalable, maintainable solution over a quick
workaround.

If the correct implementation requires an architectural change, make the
change consistently across the affected modules instead of introducing
temporary hacks.
