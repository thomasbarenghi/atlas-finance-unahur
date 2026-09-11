# AGENTS.md — Client (Atlass Fin)

Guidance for AI agents working in `client/`. Read this first, then load the relevant skills.

## Project

Atlass Fin web app: a personal-finance client (accounts, transactions, budgets, assets, goals, reports) with rich analytics and an integrated AI assistant. It is a **pure REST client** of the NestJS API in `../api/`. The same code is packaged for iOS/Android with Capacitor.

**Stack:** Next.js 16 (App Router) · TypeScript strict · Tailwind CSS · shadcn/ui · Recharts · TanStack Query · React Hook Form + Zod · @gravity-ui/icons · Capacitor.

## Source of truth (READMEs / docs)

- `../docs/frontend.md` — site map, per-page features, file structure, auth, charts, AI, Capacitor, batches plan.
- `../docs/backend.md` — REST contract (DTOs, enums, errors, streaming) this client consumes.
- `../docs/FRD_Gestor_Financiero_v0.1.docx.md` — functional requirements (FR-*, HU-*, CAL-*, NFR-*).

## Skills (load before coding)

- `.agents/skills/quality-rules/SKILL.md` — component anatomy, hooks/SoC, generic vs. specific, DRY/SRP, named exports, layers. **Mandatory before creating/refactoring components or hooks.**
- `.agents/skills/test-quality/SKILL.md` — testing standards (Vitest + RTL + MSW + Playwright). **Mandatory before writing tests.**

## Commands

```bash
npm run dev            # dev server
npm run build          # static export → out/ (output: "export")
npm run lint
npm run typecheck
npm run test           # Vitest
npm run test:e2e       # Playwright
npx cap sync           # sync web build into native projects
npx cap open ios       # or: npx cap open android
```

Run `lint`, `typecheck`, and `build` before considering a task done. CI runs all four.

## Hard rules (must follow)

1. **Client-only / static-exportable.** No Server Components data fetching, Server Actions, Route Handlers, `middleware.ts`, `cookies()`, or `headers()` in the data flow. Pages under `(app)` are client components. This keeps the build Capacitor-ready.
2. **Logic in hooks, not in render.** Components compose; hooks/utils hold logic.
3. **Named exports only**, except Next.js special files (`page.tsx`, `layout.tsx`, etc.) — see the quality skill.
4. **No direct `fetch` in components.** Data goes through `lib/query/*`; HTTP through `lib/api/client.ts`.
5. **`lib/` is portable.** It must not import `next/*` or components, so it can be reused on native.
6. **Match the backend contract.** JSON is `camelCase`; dates `YYYY-MM-DD`; timestamps ISO 8601 UTC; decimals are `number`. Types in `lib/api/types.ts` mirror `../docs/backend.md` §7.13–§7.18.
7. **No secrets.** Only `NEXT_PUBLIC_*` public env; never hardcode tokens/keys.
8. **No real financial data.** Use the backend seed; demo login `demo@atlassfin.app` / `Demo1234!`.

## Layout

```
client/
├── .agents/skills/      # agent skills
├── app/                 # routes: (auth) and (app) groups
├── components/
│   ├── ui/              # shadcn primitives (generated; do not hand-edit)
│   ├── common/          # reusable domain-agnostic components
│   └── features/<f>/    # domain components composing common
├── lib/                 # api, query, format, validation (portable)
├── hooks/               # shared hooks
├── providers/           # Query, Theme, Auth
└── capacitor.config.ts
```

## Navigation behavior

- Desktop (≥ `md`): fixed sidebar.
- Mobile: bottom app-style bar with 5 items (`Home`, `Transactions`, central `+`, `Reports`, `Settings`); `Settings` is the hub for the remaining sections and preferences. Same behavior in browser and Capacitor.
