# AGENTS.md — Client (Atlass Fin)

Guidance for AI agents working in `client/`. Read this first, then load the relevant skills.

## Project

Atlass Fin web app: a personal-finance client (accounts, transactions with system and user categories, dashboard) with rich analytics and an integrated **read-only** AI assistant. It is a **pure REST client** of the NestJS API in `../api/`.

**Stack:** Next.js 16 (App Router) · TypeScript strict · Tailwind CSS 4 · shadcn/ui (preset radix-maia: green, radius large) · Outfit (headings) + Nunito (body) · Recharts · TanStack Query · React Hook Form + Zod · lucide-react.

## Source of truth (READMEs / docs)

- `../docs/architecture/frontend.md` — site map, per-page features, file structure, auth, charts, AI.
- `../docs/architecture/backend.md` — REST contract (DTOs, enums, errors, streaming) this client consumes.
- `../docs/specification/0.3/FRD_Gestor_Financiero_v0.3.md` — functional requirements (FR-*, HU-*, CAL-*, NFR-*).

## Skills (load before coding)

- `.agents/skills/quality-rules/SKILL.md` — component anatomy, hooks/SoC, generic vs. specific, DRY/SRP, named exports, layers. **Mandatory before creating/refactoring components or hooks.**
- `.agents/skills/test-quality/SKILL.md` — testing standards (Vitest + RTL + MSW + Playwright). **Mandatory before writing tests.**

## Commands

```bash
npm run dev            # dev server
npm run build          # static export → out/ (output: "export")
npm run lint           # ESLint
npm run lint:fix
npm run typecheck
npm run format         # Prettier (write)
npm run format:check   # Prettier (check; runs on pre-push)
npm run test           # Vitest (unit + component + integration)
npm run test:watch     # Vitest watch mode
npm run test:coverage  # Vitest with V8 coverage
npm run test:e2e       # Playwright (pending setup)
```

Run `format:check`, `lint`, `typecheck`, and `build` before considering a task done (the pre-push hook does this).

## Hard rules (must follow)

1. **Client-only / static-exportable.** No Server Components data fetching, Server Actions, Route Handlers, `middleware.ts`, `cookies()`, or `headers()` in the data flow. Pages under `(app)` are client components. This keeps the build a static export.
2. **Logic in hooks, not in render.** Components compose; hooks/utils hold logic.
3. **Named exports and arrow functions only**, except Next.js special files (`page.tsx`, `layout.tsx`, etc.) — see the quality skill.
4. **No direct `fetch` in components.** Data goes through `lib/query/*`; HTTP through `lib/api/client.ts`.
5. **`lib/` is portable.** It must not import `next/*` or components, so it stays framework-agnostic.
6. **Match the backend contract.** JSON is `camelCase`; dates `YYYY-MM-DD`; timestamps ISO 8601 UTC; decimals are `number`. Types in `lib/api/types.ts` mirror `../docs/architecture/backend.md` §7.9–§7.12.
7. **No secrets.** Only `NEXT_PUBLIC_*` public env; never hardcode tokens/keys.
8. **No real financial data.** Use the backend seed; demo login `demo@atlassfin.app` / `Demo1234!`.

## Layout

```
client/
├── .agents/skills/      # agent skills
├── app/                 # rutas: grupos (auth) and (app)
│   ├── (auth)/_components/          # compartidos por login/register
│   ├── (app)/_components/<domain>/  # compartidos entre rutas de (app)
│   └── <ruta>/_components/          # propios de una sola ruta
├── components/
│   ├── ui/              # shadcn primitives (generated; do not hand-edit)
│   ├── common/          # reusable domain-agnostic components (≥ 2 consumers)
│   └── layout/          # shell de (app): sidebar, nav, user menu, auth guard
├── hooks/               # shared hooks
├── lib/                 # api, query, format, validation (portable)
├── providers/           # Query, Auth, Period; el tema vive en next-themes (layout raíz)
└── next.config.ts       # static export (output: "export")
```

## Navigation behavior

- Desktop (≥ `md`): fixed sidebar with navigation, accounts summary and the user block at the bottom that links to `/profile` (no account dropdown menu).
- Mobile: bottom app-style bar with 4 equal items (`Inicio`, `Movimientos`, `Asistente`, `Perfil`); `Categories` and `Settings` are reachable from `Profile`.
- `Ajustes` includes local theme (`Claro/Oscuro/Auto`), CSV export and the **primary currency** selector. The dashboard header has a **reading-currency** selector before the period; it re-expresses the values without altering data.
