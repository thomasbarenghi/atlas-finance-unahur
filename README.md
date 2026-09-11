# Atlass Fin

A personal finance manager with rich analytics and an integrated AI assistant. University project for **UNAHUR**.

Atlass Fin helps you organize and understand the money you enter yourself: accounts, income/expense transactions, transfers, budgets, assets, investments, debts, goals, and reports. Its two distinguishing features are **analytics/charts** and a **conversational AI agent** that answers questions about your own data.

> **Scope note.** The app organizes and explains user-entered information. It does **not** connect to banks, execute payments or investments, and does **not** provide financial advice.

## Monorepo

```
atlas-finance-unahur/
├── api/      # NestJS REST API (PostgreSQL/Supabase, TypeORM, JWT)
├── client/   # Next.js 16 web app + Capacitor (iOS/Android)
├── docs/     # functional and technical documentation
└── README.md
```

## Stack

| Layer | Technologies |
| :--- | :--- |
| Client | Next.js 16 (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Recharts · TanStack Query · React Hook Form + Zod · @gravity-ui/icons · Capacitor |
| API | NestJS (modular monolith) · TypeScript · PostgreSQL (Supabase) · TypeORM · JWT (HttpOnly cookie + Bearer) · class-validator · argon2 · Swagger |

## Documentation

- [`docs/FRD_Gestor_Financiero_v0.1.docx.md`](docs/FRD_Gestor_Financiero_v0.1.docx.md) — functional requirements, user stories, calculation rules, NFRs.
- [`docs/frontend.md`](docs/frontend.md) — site map, per-page behavior, file structure, auth, charts, AI, Capacitor, work plan.
- [`docs/backend.md`](docs/backend.md) — architecture, data model, REST contract (DTOs/enums/errors), integrations, security, seed, env.

## Agent guidance

This repo is built with AI agents in mind. Each project ships its own `AGENTS.md` and reusable skills.

- [`client/AGENTS.md`](client/AGENTS.md) and [`api/AGENTS.md`](api/AGENTS.md) — start here.
- `.agents/skills/quality-rules/SKILL.md` — code-quality and architecture standards.
- `.agents/skills/test-quality/SKILL.md` — testing standards.

Skills are written in English; functional documentation is in Spanish.

## Getting started

### Prerequisites

- Node.js 20+ and npm
- PostgreSQL 15+ (local, or a Supabase project)
- Optional: Xcode / Android Studio for native builds

### API

```bash
cd api
cp .env.example .env          # set DATABASE_URL, JWT secrets, etc.
npm install
npm run migration:run         # create the schema
npm run seed                  # idempotent demo data
npm run start:dev             # http://localhost:3001/api  (Swagger at /api/docs)
```

### Client

```bash
cd client
cp .env.example .env.local    # set NEXT_PUBLIC_API_URL=http://localhost:3001/api
npm install
npm run dev                   # http://localhost:3000
```

### Demo credentials

```
demo@atlassfin.app / Demo1234!
```

## Features

- **Auth & profile:** register, login/logout, password recovery, base currency, light/dark theme.
- **Dashboard:** net worth, income, expenses and savings KPIs; net-worth evolution; income vs. expenses; expenses by category; asset composition; budget alerts.
- **Accounts:** cash, bank, wallet, card or other; current balance from initial balance + movements; archive keeps history.
- **Transactions:** income, expense, and atomic transfers; filters, search, and custom categories.
- **Budgets:** monthly limit per category with available/warning/exceeded states.
- **Assets, investments & debts:** manual valuations with history, positions with market value and P/L, debts linked to assets.
- **Market quotes:** limited crypto catalog with caching, staleness flag, and last valid price on provider failure.
- **Goals:** target amount, progress, and status.
- **Reports:** summary, breakdown by category, net-worth evolution, budget compliance, CSV export.
- **AI assistant (distinctive):** opt-in conversational answers built only from the user's own, pre-calculated, minimal context — it never creates, edits, or deletes data.

## Testing

```bash
# Client (Vitest + React Testing Library + MSW + Playwright)
cd client && npm run test && npm run test:e2e

# API (Jest + Supertest)
cd api && npm run test && npm run test:e2e
```

## Conventions

- Code, filenames, and API contracts in **English**; user-facing copy in **Spanish**.
- Named exports only; logic in hooks/services; generic components composed by specific ones.
- See the `quality-rules` and `test-quality` skills in each project before contributing.

## License

University project. See the repository owner for details.
