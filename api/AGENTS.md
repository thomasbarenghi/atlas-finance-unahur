# AGENTS.md — API (Atlass Fin)

Guidance for AI agents working in `api/`. Read this first, then load the relevant skills.

## Project

Atlass Fin backend: a **NestJS monolith** exposing a REST API for the web/native client in `../client/`. It owns all business logic, persistence, auth, and the market/AI/mail integrations. It organizes and explains user-entered data; it does **not** connect to banks, move money, or give financial advice.

**Stack:** NestJS (modular monolith) · TypeScript strict · PostgreSQL (Supabase) · TypeORM (entities + migrations) · JWT (HttpOnly cookie + Bearer) · class-validator · argon2 · @nestjs/schedule · @nestjs/throttler · @nestjs/swagger · @nestjs/config.

## Source of truth (READMEs / docs)

- `../docs/backend.md` — architecture, data model, auth, **REST contract** (DTOs, enums, errors §7.13–§7.18), calculations, integrations, security, seed, env, batches plan.
- `../docs/frontend.md` — the consumer; useful to keep contracts aligned.
- `../docs/FRD_Gestor_Financiero_v0.1.docx.md` — functional requirements (FR-*, HU-*, CAL-*, NFR-*).

## Skills (load before coding)

- `.agents/skills/quality-rules/SKILL.md` — layering, use-case services, DTOs, ownership, transactions, errors, DRY/SRP. **Mandatory before creating/refactoring modules, services, or DTOs.**
- `.agents/skills/test-quality/SKILL.md` — unit/integration/e2e standards (Jest + Supertest, test DB, provider mocks). **Mandatory before writing tests.**

## Commands

```bash
npm run start:dev          # watch mode
npm run build
npm run lint
npm run typecheck
npm run test               # unit + integration (Jest)
npm run test:e2e           # Supertest
npm run migration:run      # TypeORM migrations
npm run migration:generate -- src/database/migrations/<Name>
npm run seed               # idempotent demo data
```

Run `lint`, `typecheck`, `test`, and `build` before considering a task done. CI runs all four.

## Hard rules (must follow)

1. **Controllers are thin.** Only routing, decorators, DTOs. Zero business logic — delegate to services.
2. **One service method per use case**, imperative name (`createAccount`, `transferBetweenAccounts`).
3. **Never trust client IDs.** Resolve ownership from the authenticated user (`@CurrentUser()`) on every read/write; a client-supplied ID grants no authorization (NFR-SEG-001/005).
4. **Never expose entities.** Map to DTOs; DB is `snake_case`, API JSON is `camelCase`; decimals serialize as `number`.
5. **Validate everything** with `class-validator` DTOs + global `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`).
6. **Transactions for multi-row writes** (`dataSource.transaction()`), e.g. transfers (two atomic rows, `transfer_group_id`).
7. **Calculations are centralized** in `calculations.service` (CAL-001..009). Dashboard, reports, and the AI must reuse it — never duplicate a formula.
8. **Stable error codes** from `backend.md` §7.17; no internal details leaked (NFR-SEG-010).
9. **Secrets only in env**; never log passwords, tokens, full prompts, or sensitive financial data (NFR-SEG-007/008).
10. **Named exports** (NestJS convention); no `export default`.
11. **No real financial data** in the seed; demo user `demo@atlassfin.app` / `Demo1234!`.

## Layout

```
api/
├── .agents/skills/      # agent skills
├── src/
│   ├── main.ts / app.module.ts
│   ├── config/          # env loading + validation
│   ├── database/        # datasource + migrations
│   ├── common/          # guards, decorators, filters, interceptors, dto
│   ├── <feature>/       # auth, users, accounts, transactions, categories,
│   │                    # budgets, assets, debts, positions, quotes, goals,
│   │                    # reports, dashboard, assistant
│   └── shared/          # calculations, fx, market, ai, mail
├── test/                # e2e
└── .env.example
```

Each feature follows: `<feature>.module.ts`, `<feature>.controller.ts`, `<feature>.service.ts`, `dto/`, `entities/`.

## Auth

- JWT access token (short-lived) + opaque refresh token (hashed in `sessions`).
- Transport: `HttpOnly` cookie (web) or `Authorization: Bearer` (native). Both valid.
- `JwtAuthGuard` is global; mark public routes with `@Public()`.
- Logout revokes the session; refresh rotates the token.
