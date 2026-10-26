# Atlass Fin

A personal finance manager with rich analytics and an integrated AI assistant. University project for **UNAHUR**.

Atlass Fin helps you organize and understand the money you enter yourself: accounts, income/expense transactions, atomic transfers, and categories (system plus your own). Its two distinguishing features are **analytics/charts** and a **conversational AI agent** that answers questions about your own data. The app uses a single system currency.

> **Scope note.** The app organizes and explains user-entered information. It does **not** connect to banks, execute payments or investments, and does **not** provide financial advice.

## Monorepo

```
atlas-finance-unahur/
├── api/      # NestJS REST API (PostgreSQL/Supabase, TypeORM, JWT)
├── client/   # Next.js 16 web app
├── docs/     # functional and technical documentation
└── README.md
```

## Stack

| Layer | Technologies |
| :--- | :--- |
| Client | Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · shadcn/ui · Outfit + Nunito · next-themes · Recharts · TanStack Query · React Hook Form + Zod · lucide-react |
| API | NestJS (modular monolith) · TypeScript · PostgreSQL (Supabase) · TypeORM · JWT (HttpOnly cookie + Bearer) · class-validator · argon2 |

## Documentation

- [`docs/specification/0.3/FRD_Gestor_Financiero_v0.3.md`](docs/specification/0.3/FRD_Gestor_Financiero_v0.3.md) — functional requirements, user stories, calculation rules, NFRs.
- [`docs/specification/0.3/BRD_Gestor_Financiero_v0.3.md`](docs/specification/0.3/BRD_Gestor_Financiero_v0.3.md) — business requirements, business rules, cases, glossary.
- [`docs/architecture/frontend.md`](docs/architecture/frontend.md) — site map, per-page behavior, file structure, auth, charts, AI, work plan.
- [`docs/architecture/backend.md`](docs/architecture/backend.md) — architecture, data model, REST contract (DTOs/enums/errors), integrations, security, seed, env.

The documentation index is in [`docs/README.md`](docs/README.md).

## Agent guidance

This repo is built with AI agents in mind. Each project ships its own `AGENTS.md` and reusable skills.

- [`client/AGENTS.md`](client/AGENTS.md) and [`api/AGENTS.md`](api/AGENTS.md) — start here.
- `.agents/skills/quality-rules/SKILL.md` — code-quality and architecture standards.
- `.agents/skills/test-quality/SKILL.md` — testing standards.
- `.agents/skills/push-ready/SKILL.md` — global pre-commit/pre-push readiness checklist.

Skills are written in English; functional documentation is in Spanish.

## Getting started

### Prerequisites

- Node.js 20+ and npm
- PostgreSQL 15+ (local, or a Supabase project)

### API

```bash
cd api
cp .env.example .env          # set DATABASE_URL, JWT secrets, etc.
npm install
npm run db:reset              # drop/recreate the schema from entities + seed demo data
npm run start:dev             # http://localhost:3001/api
```

> **No migrations by design.** The schema is derived from the TypeORM entities
> (`synchronize: true`). When the model changes we **recreate the database and
> re-seed** instead of writing a migration. See
> [`docs/architecture/backend.md`](docs/architecture/backend.md) §11.1.

### Client

```bash
cd client
npm install
npm run dev                   # http://localhost:3000
```

> Point the client at the API with `NEXT_PUBLIC_API_URL=http://localhost:3001/api` in `.env.local` (create the file; `.env*` is git-ignored).

### Demo credentials

All demo users share the password `Demo1234!`:

| Email | Scenario |
| :--- | :--- |
| `demo@atlassfin.app` | Full dataset: 3 accounts and 3 months of movements. |
| `sin-datos@atlassfin.app` | Empty user (no financial data) to exercise empty states. |
| `ana@atlassfin.app` | Second user with a minimal dataset, for isolation/permissions. |

The seed is deterministic: the same emails, entities and scenarios are produced
every time. See [`docs/architecture/backend.md`](docs/architecture/backend.md) §11.

## Features

- **Auth & profile:** register, login/logout, and profile name editing. Single system currency (no currency picker) and local light/dark/system theme.
- **Dashboard:** net-worth, income, expenses and savings KPIs; daily/weekly or monthly net-worth evolution and income-vs-expenses charts; expenses by category; selectable period (`This month`, `Last 30 days`, `6 months`, `12 months`).
- **Accounts:** cash, bank, wallet or other; current balance from initial balance + movements; direct deletion.
- **Transactions:** income, expense, and atomic transfers; paginated list with search, filters (type, account, category, period), and CSV export.
- **Categories:** five read-only system categories plus user-created categories with edit/delete and period usage.
- **AI assistant (distinctive):** **read-only** conversational answers built only from the user's own, pre-calculated, minimal context. Recent turns stay in client memory for follow-ups; the server does not persist the conversation. It never creates, edits or deletes data, does not connect to banks, move money, or give financial advice.

## Testing

```bash
# Client (Vitest + React Testing Library + MSW) — Playwright E2E pending
cd client && npm run test

# API (Jest + Supertest)
cd api && npm run test && npm run test:e2e
```

## Conventions

- Code, filenames, and API contracts in **English**; user-facing copy in **Spanish**.
- Named exports only; **arrow functions** for components/hooks/utils; logic in hooks/services; generic components composed by specific ones.
- Formatting is enforced with Prettier; the pre-push hook runs `format:check`, `lint`, `typecheck`, `test`, and `build`.
- See the `quality-rules` and `test-quality` skills in each project before contributing.

## License

University project. See the repository owner for details.
