---
name: quality-rules
description: >-
  Backend code-quality and architecture standards for the Atlass Fin API.
  Covers layered NestJS structure, thin controllers, use-case services, DTOs and
  validation, ownership enforcement, transactions, error codes, centralized
  calculations, module boundaries, serialization, config/logging, and named
  exports. Use when creating, reviewing, or refactoring any module, service,
  controller, DTO, entity, or shared provider in api/.
---

# Atlass Fin — API Quality Rules

Normative. Keywords: **MUST** (required), **SHOULD** (recommended), **MAY** (optional).
If this skill conflicts with an example elsewhere, this skill wins and the example must be fixed.

## Workflow (how to apply this skill)

When adding or changing a feature:

1. **Model first.** Update the entity + migration and the DTO contract (must match `backend.md` §7.13–§7.18).
2. **DTOs at the boundary.** Define `Create`/`Update`/`Query`/`Response` DTOs with `class-validator`.
3. **Service use case.** Implement one method per use case; reuse `calculations.service` and `fx` instead of new formulas.
4. **Thin controller.** Wire routes, `@CurrentUser()`, and DTOs; no logic.
5. **Ownership + transaction.** Filter by `user_id`; wrap multi-row writes in `dataSource.transaction()`.
6. **Map to a response DTO** (`snake_case` → `camelCase`, decimals as `number`).
7. **Self-review** against §15, then run `lint`, `typecheck`, `test`, `build`.
8. **Hand off to tests** using the `test-quality` skill.

## 1. Core principles

1. **SRP** — Every module, service, controller, and function MUST have a single reason to change.
2. **SoC** — Routing, use cases, persistence, and integrations live in separate layers (see §2).
3. **DRY** — Centralize shared *knowledge*. Business formulas (CAL-001..009) MUST exist once, in `calculations.service`. Apply the **rule of three**.
4. **KISS / YAGNI** — Simplest solution that meets the requirement; no speculative abstractions.
5. **High cohesion, low coupling** — One module per domain; depend on exported providers, never on internals.
6. **Fail fast** — Validate at the boundary (DTOs) and throw clear, typed errors.
7. **Security by default** — Every operation is authenticated and ownership-checked unless explicitly public.
8. **Explicit over implicit** — Descriptive names, concrete types, no magic.

## 2. Layers and allowed dependencies

```
HTTP (controllers) → application (services = use cases) → persistence (TypeORM repositories)
                                                       → integrations (market, ai, mail, fx)
                                                       → shared (calculations)
```

- Controllers MUST NOT touch repositories or contain business logic.
- Services MUST NOT read `req`/`res`. Controllers extract the user with `@CurrentUser()` and pass the user id/object into the service as an argument.
- Entities MUST NOT be returned from controllers; map to response DTOs.
- Cross-module use goes through a module's exported service (DI), never by importing another module's entity/internal.

## 3. Module anatomy

Each feature lives in its own folder:

```
<feature>/
├── <feature>.module.ts       # imports TypeOrmModule.forFeature([...]) + deps; exports the service if needed
├── <feature>.controller.ts   # routes, decorators, DTOs only
├── <feature>.service.ts      # use cases (one method per use case)
├── dto/
│   ├── create-<feature>.dto.ts
│   ├── update-<feature>.dto.ts
│   └── query-<feature>.dto.ts
└── entities/
    └── <feature>.entity.ts
```

- A module MUST register only the entities it owns.
- No circular imports between modules. If two features share logic, extract it to `shared/` (e.g. `calculations`, `fx`).
- Guards/decorators/filters/interceptors live in `common/`.

## 4. Use-case services

- One public method per use case, named in the imperative (`createAccount`, `transferBetweenAccounts`, `archiveBudget`).
- A method MUST represent a complete business operation, including validation, persistence, and mapping to a response DTO.
- Keep private helpers small and focused; do not expose them.
- Do not build "god services"; split by use case when responsibilities diverge.

```ts
// accounts.controller.ts — thin: routing, decorators, DTOs only
@Controller("accounts")
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateAccountDto): Promise<AccountResponseDto> {
    return this.accountsService.createAccount(user.id, dto);
  }
}

// accounts.service.ts — one use case, maps to a response DTO
async createAccount(userId: string, dto: CreateAccountDto): Promise<AccountResponseDto> {
  const account = this.accountsRepo.create({ ...dto, userId });
  return toAccountResponse(await this.accountsRepo.save(account));
}
```

## 5. DTOs and validation

- One DTO per operation: `CreateXDto`, `UpdateXDto`, `QueryXDto`, `XResponseDto`.
- MUST use `class-validator` decorators with explicit constraints (type, length, range, format). No untyped `any`.
- Global `ValidationPipe` with `whitelist: true, forbidNonWhitelisted: true, transform: true`; reject unexpected fields (NFR-SEG-002).
- `UpdateXDto` MUST make all fields optional (`PartialType`).
- Response DTOs define the public contract; MUST match `backend.md` §7.13–§7.18 exactly (field names, types, enums).
- Convert query params (pagination, dates) via DTOs with `class-transformer`, not manual parsing in controllers.

## 6. Entities and repositories

- Entities extend a common base when possible; use `uuid` PKs (`@PrimaryGeneratedColumn("uuid")`).
- Column names are `snake_case`; enforce `UNIQUE`/FK constraints in the entity and in a migration.
- Numeric money columns use `numeric(18,4)` (quantities/quotes `numeric(18,8)`) and a read transformer so the API returns `number` (see §9).
- Enums are stored as `text`; validate at the DTO/application layer against the allowed values in `backend.md` §7.14.
- Repositories are injected via `@InjectRepository`; no raw SQL outside repos/migrations.
- Every query that returns user data MUST filter by the authenticated `user_id`.

## 7. Ownership and security

- `JwtAuthGuard` is global; public routes use `@Public()`.
- Resolve the user with `@CurrentUser()`; **never** accept a `user_id` from the body/params.
- Before read/update/delete, verify the resource belongs to the user; otherwise throw `NotFound`/`Forbidden` (do not leak existence).
- Never trust client-supplied IDs for authorization (NFR-SEG-005).
- Respect rate limits on login, password reset, quotes, and AI (NFR-SEG-010).

## 8. Transactions and multi-row writes

- Use `dataSource.transaction()` for any operation that writes more than one row.
- Transfers MUST create both rows atomically with a shared `transfer_group_id`; if one side fails, nothing is persisted (FR-TRX-005).
- Validate domain invariants inside the transaction: source ≠ destination, accounts/categories owned by the user, archived account rejects movements.

```ts
await this.dataSource.transaction(async (manager) => {
  const transferGroupId = randomUUID();
  await manager.save(manager.create(Transaction, { ...outbound, type: "transfer", transferGroupId }));
  await manager.save(manager.create(Transaction, { ...inbound, type: "transfer", transferGroupId }));
});
```

## 9. Mapping and serialization

- DB `snake_case` → API `camelCase` via explicit mappers/DTOs; never leak column names or entities.
- Dates: `date` fields as `YYYY-MM-DD`; `timestamptz` as ISO 8601 UTC.
- Decimals: serialize `numeric` as `number` (transformer/mapper). Max 4 decimals for money, 8 for quantities/quotes.
- Derive computed fields (e.g. `currentBalance`, `consumedPct`, `profitLoss`, `status`) in the service, not on the client.

```ts
export function toAccountResponse(a: Account): AccountResponseDto {
  return {
    id: a.id, name: a.name, type: a.type, currency: a.currency,
    initialBalance: a.initialBalance, currentBalance: a.currentBalance,
    archived: a.archived, notes: a.notes,
  };
}
```

## 10. Calculations (DRY)

- All formulas live in `calculations.service` (CAL-001..009) and MUST be reused by dashboard, reports, and the assistant.
- Never reimplement a formula in a controller, mapper, or the AI prompt builder.
- Budget/goal statuses and quote staleness are computed centrally and exposed as fields (`status`, `isStale`).

## 11. Integrations

- All outbound calls go through dedicated providers (`market`, `ai`, `mail`, `fx`) using `HttpModule` with timeout, host validation, HTTPS, and no redirect following (NFR-SEG-009).
- External failures degrade gracefully: keep the last valid market price (never invent one), and surface `AI_UNAVAILABLE`/`MARKET_UNAVAILABLE`.
- The AI context is built server-side from minimal, pre-calculated, user-scoped data; system instructions are fixed and separated from user data. The assistant MUST NOT write data (FR-IA-006/010).

## 12. Errors

- Throw `HttpException` subclasses with a stable `code` from `backend.md` §7.17 and an HTTP status.
- A global exception filter normalizes the payload to `{ statusCode, code, message, fieldErrors? }`.
- Never leak stack traces, SQL, secrets, or whether a resource exists for another user.

## 13. Config, secrets, and logging

- Configuration via `@nestjs/config` with **validated** env; no hardcoded secrets/URLs.
- `.env` is never committed; `.env.example` documents keys.
- Log via Nest `Logger`; MUST NOT log passwords, tokens, full prompts, or sensitive financial data (NFR-SEG-008).

## 14. Naming and exports

- Files/folders `kebab-case`; classes `PascalCase`; methods/vars `camelCase`.
- **Named exports only** (Nest convention); no `export default`.
- No unnecessary comments; comment only the non-obvious "why".

## 15. Definition of Done

- [ ] Controller is thin; logic is in a use-case service.
- [ ] DTOs validate all input; entities never exposed; contract matches `backend.md` §7.
- [ ] Ownership enforced on every user-scoped query.
- [ ] Multi-row writes are transactional.
- [ ] Calculations reused from `calculations.service` (no duplicated formulas).
- [ ] Errors use stable codes; no sensitive leakage.
- [ ] Named exports; strict typing; no `any`.
- [ ] Tests added/updated and green (see `test-quality` skill).
- [ ] `lint`, `typecheck`, `test`, `build` pass.

## Exceptions

- Framework bootstrap (`main.ts`) and TypeORM config/migrations/seed follow their tool's required format.
- Generated files (e.g. OpenAPI artifacts) are exempt; regenerate them.
