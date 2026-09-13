# AGENTS.md — Atlass Fin (monorepo root)

Entry point for AI agents working in this repository. **Read this file first**, then the `AGENTS.md` of the app you are going to touch.

## Before you start

1. **Identify the app.** Changes live in `client/` (Next.js web + Capacitor) or `api/` (NestJS REST API). Root-level changes touch tooling, docs, or config only.
2. **Read that app's `AGENTS.md` in full** and follow it:
   - [ ] `client/AGENTS.md`
   - [ ] `api/AGENTS.md`
3. **Load the app's skills** (mandatory before writing or refactoring code):
   - `client/.agents/skills/quality-rules/SKILL.md` and `client/.agents/skills/test-quality/SKILL.md`
   - `api/.agents/skills/quality-rules/SKILL.md` and `api/.agents/skills/test-quality/SKILL.md`
   - **Global:** `.agents/skills/push-ready/SKILL.md` — load whenever the user asks to verify/commit/push changes.
4. **If a change crosses apps** (e.g. a new endpoint), update **both** sides and keep the REST contract in sync (`docs/backend.md` §7).

## Repository layout

```
atlas-finance-unahur/
├── client/     # Next.js 16 app + Capacitor Android (AGENTS.md + skills inside)
├── api/        # NestJS API (AGENTS.md + skills inside)
├── docs/       # FRD, frontend.md, backend.md (Spanish)
├── .agents/    # global skills (e.g. push-ready)
├── scripts/    # root tooling
├── .husky/     # git hooks (pre-commit, pre-push)
├── .github/    # PR template
└── agent-local/  # ignored scratch space (only .gitkeep is tracked)
```

## Source of truth

- `README.md` — overview, stack, quick start, demo credentials.
- `docs/FRD_Gestor_Financiero_v0.1.docx.md` — functional requirements (FR-*, HU-*, CAL-*, NFR-*).
- `docs/frontend.md` — client site map, structure, auth, charts, AI, Capacitor.
- `docs/backend.md` — API architecture, data model, REST contract, integrations, security.

Do not contradict these docs. If code and docs disagree, align them in the same change.

## Root tooling (Husky)

Hooks are installed at the root; projects are checked only if they are set up (have a `package.json` with the script).

- **pre-commit:** `npm run lint` + `npm run typecheck`.
- **pre-push:** `npm run format:check` + `npm run lint` + `npm run typecheck` + `npm run test` + `npm run build`.

Root scripts (`scripts/run-in-projects.sh`) run a script across `client` and `api` and skip un-scaffolded projects. Run the same commands before considering a task done.

## Global conventions

- **English** for code, filenames, endpoints, and skills; **Spanish** for user-facing copy and the `docs/` documentation.
- Named exports only; in `client/`, **arrow functions** for components/hooks/utils/services; logic in hooks/services; generics reused by specifics. Formatting is enforced with Prettier (`npm run format` / `npm run format:check`).
- No secrets and no real financial data anywhere (use the backend seed; demo user `demo@atlassfin.app` / `Demo1234!`).
- Use `agent-local/` for scratch files — it is git-ignored.

## PRs

Follow `.github/pull_request_template.md` and complete its checklist before opening a PR.
