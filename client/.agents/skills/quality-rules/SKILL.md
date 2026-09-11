---
name: quality-rules
description: >-
  Frontend code-quality and architecture standards for the Atlass Fin client.
  Covers component anatomy (folder-per-component, index.tsx), hooks and
  separation of concerns, generic vs. specific components, DRY/SRP, named
  exports, layer boundaries, and enforcement. Use when creating, reviewing, or
  refactoring any component, hook, util, or client module.
---

# Atlass Fin — Client Quality Rules

Normative. Keywords: **MUST** (required), **SHOULD** (recommended), **MAY** (optional).
If this skill conflicts with an example elsewhere, this skill wins and the example must be fixed.

## Workflow (how to apply this skill)

When implementing or refactoring a feature:

1. **Plan the layers first.** Identify the page (composition), the feature components, the data hooks, and any pure logic. Decide generics vs. specifics before coding.
2. **Build bottom-up:** types (`lib/api/types.ts`) → data hooks (`lib/query`) → generic components (`components/common`) → feature components (`components/features`) → page composition.
3. **Extract logic** into hooks/utils as you go; keep `index.tsx` as render.
4. **Reuse generics first.** Before writing a table, amount, badge, empty state, or dialog, check `components/common`.
5. **Self-review** against §8 (Definition of Done), then run `lint`, `typecheck`, `build`.
6. **Hand off to tests** using the `test-quality` skill.

Before writing code, state each new file's responsibility in one sentence. If the sentence contains an "and", split the file.

## 1. Core principles

1. **SRP** — Every component, hook, service, and function MUST have a single reason to change. If you describe a file with "and", it probably violates SRP.
2. **SoC** — Presentation, UI logic, data access, and business rules live in separate layers (see §5).
3. **DRY** — Remove duplicated *knowledge* (a rule, a format, a decision), not accidental text. Apply the **rule of three**: extract on the third repetition.
4. **KISS / YAGNI** — Simplest solution that meets the requirement. Never abstract for a hypothetical future.
5. **Composition over inheritance** — Build complex components by combining simple ones.
6. **High cohesion, low coupling** — Group what changes together; depend on as little as possible.
7. **Fail fast** — Validate at boundaries (DTOs, Zod schemas); fail early with clear errors.
8. **Explicit over implicit** — Descriptive names, concrete types, no magic.

## 2. Component architecture

### 2.1 Folder per component

Every owned component MUST live in a **folder named after the component**, with `index.tsx` as its entry point. `index.tsx` MUST hold the component and its named export.

```
components/
└── amount/
    ├── index.tsx            # Amount component (named export)
    ├── amount.types.ts      # AmountProps and related types
    ├── amount.utils.ts      # pure functions (formatting, math)
    ├── amount.test.tsx      # component tests
    ├── hooks/
    │   └── use-amount-color.ts
    └── components/          # private subcomponents (optional)
        └── amount-delta.tsx
```

Rules:

- `index.tsx` MUST be limited to **composition and render**. No business logic, calculations, or data access.
- `*.types.ts` holds props/types. Props MUST be named `<Component>Props` and exported.
- `*.utils.ts` holds **pure**, deterministic, independently testable functions.
- `hooks/` holds hooks **private** to the component. Promote to global `hooks/` or `lib/query` when reused.
- `components/` holds **private** subcomponents. Promote to its own top-level folder when reused.
- Files inside a component folder MUST NOT be imported from outside except `index.tsx`. Forbidden: `@/components/amount/amount.utils`.

### 2.2 Group by feature

Group domain components by feature, not by file type:

```
components/
├── ui/                      # shadcn primitives (generated, see §Exceptions)
├── common/                  # reusable domain-agnostic generics
│   ├── amount/
│   ├── data-table/
│   ├── empty-state/
│   ├── kpi-card/
│   └── status-badge/
└── features/
    ├── accounts/
    │   ├── accounts-table/
    │   ├── account-form/
    │   └── archive-account-dialog/
    ├── transactions/
    ├── dashboard/
    └── assistant/
```

The **dependency direction** is `ui` → `common` → `features`. Features MAY use common; common MUST NOT import features.

### 2.3 More rules

- **One component per file.** Do not export two components from `index.tsx` unless they are tightly related private variants.
- Folder names are `kebab-case`; components are `PascalCase`.
- A component over ~150 JSX lines SHOULD be split into subcomponents.
- Pages (`app/**/page.tsx`) are **composition only**: arrange layout and delegate to feature components. No heavy logic.
- Do NOT define a component inside another component (breaks React reconciliation), except trivial, state-dependent cases.

## 3. Generic vs. specific components

- Solve with a **generic** first (`components/common`). A specific component MUST NOT reimplement what a generic covers: it **composes** the generic and passes props.
- A generic MUST be domain-agnostic: it knows nothing about "accounts", "transactions", or endpoints. It receives data and callbacks via props.
- A specific component MUST add only domain concerns (data mapping, copy, actions) and delegate the rest.

```tsx
// components/features/accounts/accounts-table/index.tsx
import { DataTable } from "@/components/common/data-table";
import { Amount } from "@/components/common/amount";
import type { AccountsTableProps } from "./accounts-table.types";

export const AccountsTable = ({ accounts, onArchive }: AccountsTableProps) => {
  return (
    <DataTable
      data={accounts}
      columns={[
        { key: "name", header: "Name" },
        { key: "balance", header: "Balance", cell: (a) => <Amount value={a.currentBalance} currency={a.currency} /> },
      ]}
    />
  );
}
```

Anti-pattern: `AccountsTable` implementing its own table, currency formatting, and pagination, duplicating `DataTable`/`Amount`.

Promotion criterion: used by ≥ 2 features **and** its API mentions no domain concept. If two features need something similar but diverge, do **not** force an abstraction (YAGNI).

## 4. Hook rules

- Extract logic into a hook when it is non-trivial, reusable, or testable in isolation. The component MUST be left as render.
- Custom hooks MUST start with `use`, use **named exports**, and MUST NOT return JSX.
- One hook = one responsibility. If it mixes fetching + transformation + UI state, split it.
- **Data hooks** (TanStack Query) live in `lib/query/<domain>.ts`. **UI hooks** private to a component live in `components/<...>/hooks/`. Shared hooks live in `hooks/`.
- Follow React rules: never call hooks conditionally or outside components/hooks.
- Hooks MUST NOT import `next/*`; keeps `lib/` portable to Capacitor.

```ts
// components/common/amount/hooks/use-amount-color.ts
export const useAmountColor = (kind: "income" | "expense" | "transfer") => {
  return kind === "income" ? "text-success" : kind === "expense" ? "text-destructive" : "text-muted-foreground";
}
```

**Refactor example — move logic out of the render:**

```tsx
// BEFORE — component owns state, math, formatting, and tone (violates SoC/SRP)
export const TransactionAmount = ({ tx }: { tx: Transaction }) => {
  const signed = (tx.type === "expense" ? -1 : 1) * tx.amount;
  const tone = tx.type === "income" ? "text-success" : tx.type === "expense" ? "text-destructive" : "text-muted";
  return <span className={tone}>{formatCurrency(signed, tx.currency)}</span>;
}

// AFTER — logic in a hook, formatting in lib, component renders
// hooks/use-transaction-amount.ts
export const useTransactionAmount = (tx: Transaction) => {
  const value = formatCurrency((tx.type === "expense" ? -1 : 1) * tx.amount, tx.currency);
  const tone = tx.type === "income" ? "text-success" : tx.type === "expense" ? "text-destructive" : "text-muted";
  return { value, tone };
}

// index.tsx
export const TransactionAmount = ({ tx }: TransactionAmountProps) => {
  const { value, tone } = useTransactionAmount(tx);
  return <span className={tone}>{value}</span>;
}
```

## 5. Layer boundaries

Allowed dependency direction (one way only):

```
app/ (routes) → components/ (presentation) → hooks/ + lib/query (state/data) → lib/api (HTTP) → REST API
```

- NEVER reverse it: `lib/` MUST NOT import `components/` or `app/`; `lib/api` MUST NOT know React.
- `lib/` (api, query, format, validation) MUST NOT import `next/*` or components. It must be reusable as-is in the native build.
- A component MUST NOT call `fetch`/`axios` directly: always through `lib/query`.
- Formatting logic (currency, date, percent) lives in `lib/format.ts`, not in components.
- Form validation lives in `lib/validation/` (Zod) and is reused; do not rewrite per form.
- Query keys are centralized in `lib/query`; components MUST NOT build raw query keys or touch `QueryClient` directly.
- Server state (from the API) is owned by TanStack Query; do NOT copy it into local state/contexts. Local state is only for ephemeral UI concerns.

## 6. DRY and SRP

- **Rule of three**: first and second time duplication is allowed; on the third time it MUST be extracted into a generic/util/hook.
- Extract **knowledge** (a rule, a format, a decision), not accidental matches. Two identical blocks that change for different reasons MUST NOT be unified.
- A component that changes for business rules **and** for styling MUST be split (hook/utils + presentation).
- A backend service with multiple unrelated use cases MUST be split.
- Do NOT abstract when: single use (unless it is a core business rule), or the abstraction needs many booleans (`isX`, `withY`) to cover divergent cases — that signals broken SRP; prefer composition or two components.

## 7. Exports and code conventions

- **Named exports are mandatory.** `export default` is forbidden in components, hooks, utils, and services (framework exceptions in §Exceptions).
- **Arrow functions are mandatory.** Declare components, hooks, utils, services, and callbacks as `const foo = () => {}`. Do not use `function` declarations or function expressions. Generated `components/ui/**` is exempt (see §Exceptions).
- Type props with an exported `interface <Component>Props`; use `readonly` where applicable.
- Model variants with **discriminated unions**, not multiple booleans:

  ```ts
  import type { BudgetStatus, GoalStatus } from "@/lib/api/types";

  type StatusBadgeProps =
    | { variant: "budget"; status: BudgetStatus }
    | { variant: "goal"; status: GoalStatus };
  ```

- **TypeScript strict**; `any` is forbidden. Use `unknown` + narrowing. Prefer `interface` for objects and `type` for unions.
- Imports via `@/` alias; order: external → `@/lib`, `@/components` → relative.
- Files `kebab-case`; symbols `PascalCase` (components/types) and `camelCase` (functions/variables).
- No logic in JSX: extract complex calculations/conditionals to variables or hooks before `return`.
- No `console.log` in production; user feedback via `sonner`.
- No unnecessary comments; code should be self-explanatory. Comment only the non-obvious "why".

## 8. Enforcement and Definition of Done

Tooling:

- TypeScript `strict`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`.
- ESLint: `import/no-default-export` (with framework overrides), `no-restricted-imports`/boundaries (no deep imports into component internals, no inverted deps), `react-hooks/rules-of-hooks`, `react-hooks/exhaustive-deps`, `@typescript-eslint/no-explicit-any`, `prefer-arrow/prefer-arrow-functions`, plus `eslint-config-prettier` to disable formatting rules.
- Prettier with the project config; `npm run format:check` runs on **pre-push** (Husky) so unformatted files never reach the remote. `npm run format` writes the changes. CI runs `lint`, `typecheck`, `test`, `build`.

A task is done when:

- [ ] SRP/SoC respected; logic lives in hooks/services, not in render/controller.
- [ ] No avoidable duplication (DRY on the 3rd repetition).
- [ ] Components live in their folder with `index.tsx`, `*.types.ts`, `*.utils.ts`/`hooks/` as needed.
- [ ] Named exports (no `export default`, except §Exceptions).
- [ ] Arrow functions everywhere (except generated `components/ui/**`).
- [ ] Generics are reused; specifics compose them.
- [ ] Strict typing, no `any`.
- [ ] Relevant tests added/updated and green (see `test-quality` skill).
- [ ] `lint`, `typecheck`, `build` pass.
- [ ] Basic accessibility verified (focus, labels, not-color-only).

## Exceptions

- **Next.js requires `export default`** in special App Router files — the only exception:
  `app/**/page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `global-error.tsx`, `not-found.tsx`, `template.tsx`, `default.tsx`, and `route.ts` (Route Handlers). This project does not use Route Handlers (static export/Capacitor).
- **Config files** (`next.config.ts`, `tailwind.config.ts`, `capacitor.config.ts`) follow their tool's required format.
- **`components/ui/`** keeps shadcn's convention (generated `function` declarations, one file per component, named exports); the arrow-function rule and the folder-with-`index.tsx` rule do NOT apply here (Prettier still formats these files). The folder-with-`index.tsx` rule applies to owned components (`common/`, `features/`).
- **Generated code** (shadcn CLI, OpenAPI-derived types) is not hand-edited and is exempt; regenerate it. The shadcn registry ships a bare `cn` import; `tsconfig.json` aliases `cn` → `@/lib/utils` so generated files stay untouched (define `cn` with `clsx` + `tailwind-merge`).
