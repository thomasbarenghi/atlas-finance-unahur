# AGENTS.md — API (Atlass Fin)

Guidance for AI agents working in `api/`. Read this first, then load the relevant skills.

## Project

Atlass Fin backend: a **NestJS monolith** exposing a REST API for the web/native client in `../client/`. It owns all business logic, persistence, auth, and the AI integration (read-only assistant). It organizes and explains user-entered data; it does **not** connect to banks, move money, or give financial advice.

**Stack:** NestJS (modular monolith) · TypeScript strict · PostgreSQL (Supabase) · TypeORM (entities as schema source, no migrations) · JWT (HttpOnly cookie) · class-validator · argon2 · @nestjs/config.

## Source of truth (READMEs / docs)

- `../docs/architecture/backend.md` — architecture, data model, auth, **REST contract** (DTOs, enums, errors §7.9–§7.12), calculations, integrations, security, seed, env.
- `../docs/architecture/frontend.md` — the consumer; useful to keep contracts aligned.
- `../docs/specification/0.4/FRD_Gestor_Financiero_v0.4.md` — functional requirements (FR-*, HU-*, CAL-*, NFR-*).

## Skills (load before coding)

- `.agents/skills/quality-rules/SKILL.md` — layering, use-case services, DTOs, ownership, transactions, errors, DRY/SRP. **Mandatory before creating/refactoring modules, services, or DTOs.**
- `.agents/skills/orchestrator-domain-architecture/SKILL.md` — domain organization and Controller → Orchestrator → primary services → repositories; primary services never call each other. **Mandatory before implementing or refactoring a composite use case.**
- `.agents/skills/test-quality/SKILL.md` — unit/integration/e2e standards (Jest + Supertest, test DB, provider mocks). **Mandatory before writing tests.**

## Commands

```bash
npm run start:dev          # watch mode
npm run build
npm run lint
npm run typecheck
npm run test               # unit + integration (Jest)
npm run test:e2e           # Supertest
npm run db:reset           # drop/recreate schema from entities + seed
npm run db:clear           # empty all tables (keeps schema)
npm run seed               # idempotent demo data
```

There are **no migrations**. The schema is derived from the entities
(`synchronize: true`); when the model changes, recreate the database and re-run
the seed — never migrate data. See `../docs/architecture/backend.md` §11.

Run `lint`, `typecheck`, `test`, and `build` before considering a task done. CI runs all four.

## Hard rules (must follow)

1. **Controllers are thin.** Only routing, decorators, DTOs. Zero business logic — delegate to services.
2. **One service method per use case**, imperative name (`createAccount`, `transferBetweenAccounts`).
3. **Never trust client IDs.** Resolve ownership from the authenticated user (`@CurrentUser()`) on every read/write; a client-supplied ID grants no authorization (NFR-SEG-001).
4. **Never expose entities.** Map to DTOs; DB is `snake_case`, API JSON is `camelCase`; decimals serialize as `number`.
5. **Validate everything** with `class-validator` DTOs + global `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`).
6. **Transactions for multi-row writes** (`dataSource.transaction()`), e.g. transfers (two atomic rows, `transfer_group_id`).
7. **Calculations are centralized** in `calculations.service` (CAL-001/002/003/004). The dashboard and the AI must reuse it — never duplicate a formula.
8. **Stable error codes** from `backend.md` §7.12; never leak internal details.
9. **Secrets only in env**; never log passwords, tokens, full prompts, or sensitive financial data (NFR-SEG-003).
10. **Named exports** (NestJS convention); no `export default`.
11. **No real financial data** in the seed; demo users share `Demo1234!` (`demo@atlassfin.app` full dataset, `sin-datos@atlassfin.app` empty, `ana@atlassfin.app` minimal dataset for isolation). Deterministic and reproducible — see `../docs/architecture/backend.md` §11.
12. **Orchestrate across domains.** A primary service never calls another service; coordination belongs to an orchestrator (see the `orchestrator-domain-architecture` skill).

## Layout

```
api/
├── .agents/skills/      # agent skills
├── src/
│   ├── main.ts / app.module.ts
│   ├── config/          # carga de env
│   ├── database/        # datasource, maintenance scripts + seeds
│   ├── common/          # guards, decorators, filters, dto
│   ├── <feature>/       # auth, users, accounts, transactions,
│   │                    # categories, currencies, dashboard, assistant
│   └── shared/          # calculations, account-balances, ai
├── test/                # e2e
└── .env.example
```

Each feature follows: `<feature>.module.ts`, `<feature>.controller.ts`, `<feature>.service.ts`, `dto/`, `entities/`.

## Auth

- Stateless JWT auth: access token (short-lived) + refresh token (long-lived), both signed and carrying a `type` claim. There is no session table and no server-side revocation.
- Transport: `HttpOnly` cookie only. The web client never reads or stores tokens in JavaScript.
- `JwtAuthGuard` is global; mark public routes with `@Public()`.
- Logout only clears cookies; an issued token remains valid until it expires.
- Refresh verifies the refresh JWT and issues new tokens; it does not rotate or revoke the previous refresh token.
- The database pool opens connections on demand (`min = DB_POOL_MAX`, `keepAlive`).
