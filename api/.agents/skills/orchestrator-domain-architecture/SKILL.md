---
name: orchestrator-domain-architecture
description: >-
  Design the Atlass Fin NestJS API organized by domain, with the flow
  Controller → Orchestrator (when needed) → primary services → repositories.
  Use when implementing or refactoring a use case in api/, to decide whether a
  flow needs an orchestrator and to enforce that primary services never call
  each other. Covers the responsibilities of each piece and where files live.
---

# Atlass Fin — Domain architecture with Orchestrator

Pattern for the Atlass Fin API: each NestJS module is organized **by domain**, with the
flow **Controller → Orchestrator (when needed) → primary services → repositories → database**.

This refines the service layer described in the `quality-rules` skill. It does not replace
it: DTOs, ownership, transactions, error codes, mapping, and `calculations` rules still apply.
When a use case spans more than one domain, add an **orchestrator** instead of letting a
domain service call another domain's service.

## The golden rule

> **A primary service never calls another primary service. Coordination belongs to the orchestrator.**

If a service needs data from another domain, the orchestrator asks each service for its own
part and combines the results.

## Pieces and responsibilities

### Controller

- Receives the HTTP request.
- Validates the basic shape of the input (DTOs, pipes).
- Resolves the authenticated user (guards / `@CurrentUser()`).
- Calls an orchestrator or a primary service.
- MUST NOT access repositories directly.
- MUST NOT coordinate multiple domains.

### Orchestrator

- Represents one **complete use case**.
- Coordinates two or more primary services.
- Defines the **order of operations**.
- Returns the final result to the controller.
- MUST NOT contain database queries.
- MUST NOT expose entities; returns response DTOs (reuse the mappers used by the services).

### Primary service

- Owns one concrete responsibility.
- Applies the local business rules of its domain.
- Accesses **only its own repository / entity**.
- MUST NOT call another primary service.
- Reuses `calculations.service` and shared providers (`fx`, `market`, `ai`, `mail`) when needed.
- One method per use case (imperative name), per the `quality-rules` skill.

### Repository

- Encapsulates database access for its entity.
- Performs create, read, update, delete and queries.
- MUST NOT coordinate use cases.
- MUST NOT call services.

## Choosing the path

**Simple CRUD → controller calls the primary service directly:**

```text
AccountsController ──> AccountsService ──> accounts repository
```

**Composite use case → controller calls the orchestrator:**

```text
TransactionsController ──> TransferOrchestrator ──> AccountsService,
                                                     TransactionsService
```

In this project, a transfer is a good example: the orchestrator validates both accounts,
delegates the persisted rows to the transactions service, and keeps the `dataSource.transaction()`
boundary in the application layer.

## Decision criteria

1. Does the use case touch a single domain with no cross-domain rules? → controller → primary service.
2. Does it combine two or more domains, or define an ordered sequence of operations? → orchestrator.
3. Would a primary service need another domain's data? → refactor: the orchestrator asks each service for its part and combines the results.
4. Would the controller need a repository? → design error: move the work into a service or orchestrator.

## Domain structure

Each domain is a folder inside `api/src/`, and its controllers, services, DTOs, entities, and
module live **inside** that folder. Shared cross-domain code lives in `common/`, `shared/`,
`config/`, and `database/`.

There are two kinds of domains:

- **Business domain**: owns its entity, primary service (and, when the module needs it, a
  dedicated repository).
- **Orchestration domain**: a distinct domain with its own controller, module, and DTOs.
  Instead of a primary service + entity, it has an orchestrator that coordinates the primary
  services of other domains.

```text
api/src/
├── config/                     # env loading and validation
├── database/                   # DataSource + migrations
├── common/                     # shared: guards, decorators, filters, interceptors, dto, errors, types, transformers
├── shared/                     # cross-domain providers: calculations, fx, market, ai, mail
├── accounts/                   # business domain
│   ├── accounts.controller.ts
│   ├── accounts.service.ts     # primary service
│   ├── accounts.module.ts
│   ├── dto/
│   └── entities/
└── transfer/                   # orchestration domain (composite use case)
    ├── transfer.controller.ts
    ├── transfer.orchestrator.ts
    ├── transfer.module.ts
    └── dto/
```

Location rules:

- A file belongs to its entity's/business domain (`accounts.service.ts` lives in `accounts/`).
- An orchestrator **is its own domain** (`transfer/`) with its controller, module, and DTOs.
  It has no repository and no entity of its own: it coordinates primary services from other
  domains.
- **Exception — documented modules.** When the composite use case already maps to a documented
  module/route (e.g. transfers under `/transactions` in `../docs/backend.md` §7.4), the
  orchestrator MAY live inside that module as `<domain>.orchestrator.ts` instead of a new
  top-level domain. Only create a top-level orchestration domain when the use case introduces a
  new resource, and register it in `../docs/backend.md` §4/§7 and `AGENTS.md` so the docs stay
  aligned.
- Code used by more than one domain (guards, decorators, filters, errors, constants) goes in
  `common/` (or `shared/` for cross-domain providers).
- The file name reflects its role: `.controller.ts`, `.service.ts`, `.orchestrator.ts`,
  `.module.ts`.
- Entities live in `<domain>/entities/`, matching the layout in `../docs/backend.md` §4.

## Anti-patterns (MUST avoid)

- A primary service injecting another primary service.
- An orchestrator running TypeORM queries or injecting repositories.
- A controller injecting a repository or orchestrating several domains itself.
- Reusing a primary service as the orchestrator of an unrelated composite use case.
- Returning entities from an orchestrator instead of response DTOs.

## Relationship with the existing skills

- **`quality-rules`**: thin controllers, one service method per use case, ownership,
  transactions, stable error codes, entity→DTO mapping, and `calculations.service` reuse all
  still apply. This skill only adds the orchestrator layer and the no-service-to-service rule.
- **`test-quality`**: unit-test orchestrators with mocked primary services; unit-test primary
  services with mocked repositories; integration-test the transactional path against the test DB.
- **`../docs/backend.md`**: the REST contract (§7) and module layout (§4) remain the source of
  truth. If a design here conflicts with those docs, the docs win and the design is adjusted.

## Checklist

- [ ] The controller does not touch repositories.
- [ ] The orchestrator has no database queries.
- [ ] No primary service imports another primary service.
- [ ] Each primary service uses only its own repository/entity.
- [ ] Composite use cases are coordinated by an orchestrator.
- [ ] Simple CRUD goes controller → primary service directly.
- [ ] Every file lives in its domain folder (not in global layer folders).
- [ ] Named exports; strict typing; no `any`.
