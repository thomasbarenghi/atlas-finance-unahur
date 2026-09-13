---
name: test-quality
description: >-
  Testing standards for the Atlass Fin client. Covers the test pyramid, what to
  test at each level, tooling (Vitest + React Testing Library + MSW +
  Playwright), co-location, determinism, mocking, accessibility, and coverage
  of critical flows. Use when writing, reviewing, or refactoring any test in the
  client, or when adding a feature that needs tests.
---

# Atlass Fin — Client Test Quality

Normative. Keywords: **MUST** (required), **SHOULD** (recommended), **MAY** (optional).

## Workflow (how to apply this skill)

When adding or changing a feature:

1. **Identify the level.** Pure logic → unit; component behavior → component; data/feature flow → integration; P0 path → e2e.
2. **Write the failing test first** (or alongside) for the new behavior, including the error/edge path.
3. **Mock at the network boundary** with MSW; reuse typed factories for data.
4. **Assert on user-visible behavior**, using accessible queries.
5. **Run** `test` (and `test:e2e`), verify determinism, then `lint`, `typecheck`, `build`.
6. **Self-review** against §13 (Definition of Done).

## 1. Philosophy

- Tests are a **safety net**, not a checkbox. They exist to catch regressions and document behavior.
- Test **behavior** (what a user or consumer observes), not implementation details. A refactor that preserves behavior MUST NOT break tests.
- Tests MUST be **deterministic**: no reliance on real time, network, ordering, or randomness.
- Tests MUST be **independent**: any order, no shared mutable state between tests.
- A failing test MUST point to a real problem, not to a flaky assertion.
- Prefer few high-value tests over many low-value ones.

## 2. Test pyramid

| Level | Scope | Tooling | Volume |
| :--- | :--- | :--- | :--- |
| Unit | Pure utils, formatters, hooks logic, Zod schemas | Vitest | Most |
| Component | Components with RTL (user interaction, a11y) | Vitest + RTL + jest-dom | Medium |
| Integration | Feature flows with mocked API | Vitest + RTL + MSW | Some |
| E2E | Critical flows in a real browser | Playwright | Few |

- Never test the same behavior at multiple levels without reason. Push logic down into unit-testable hooks/utils so it does not require a component test.

## 3. What MUST be tested

- **Critical (P0) flows (E2E):** register/login/logout, create income/expense, create transfer (atomic, no consolidation impact), manage budget, view dashboard, AI assistant question (HU-001/002/003/006).
- **Financial/formatting logic (unit):** `lib/format.ts` (currency, date, percent) and any client-side aggregation/sorting.
- **Data hooks (unit/integration):** query key construction, filters, mutation invalidation, error/`401` handling, refresh flow.
- **Forms (component):** required-field validation, `> 0` amount rule, transfer requires different accounts, backend `fieldErrors` mapped to fields.
- **States (component):** loading (`Skeleton`), empty (`EmptyState` with CTA), error, and success for every data view (FR-DAS-008).
- **Accessibility-relevant behavior:** charts expose an accessible name and a tabular alternative; status is not conveyed by color alone.

Not required: shadcn generated primitives, pure styling, third-party internals, trivial pass-through components.

## 4. Tooling and setup

- **Vitest** as the runner; `jsdom` environment for component tests.
- **@testing-library/react** + **@testing-library/user-event** (prefer `userEvent` over `fireEvent`).
- **@testing-library/jest-dom** for DOM matchers.
- **MSW (Mock Service Worker)** to mock the REST API at the network boundary; never mock `fetch` internals ad hoc.
- **Playwright** for E2E against the app with a seeded backend (demo credentials) or MSW/route stubs.
- Coverage via `vitest --coverage` (v8). Coverage is a signal, not a target.

Test scripts (example):

```jsonc
// package.json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test"
  }
}
```

## 5. File layout and naming

- Tests are **co-located** with the code:
  - `amount.utils.test.ts` next to `amount.utils.ts`.
  - `amount.test.tsx` next to the component `index.tsx` (name the test after the component).
  - `use-amount-color.test.ts` next to the hook.
- Integration tests live in `components/features/<feature>/*.test.tsx` or a `__tests__/` folder inside the feature.
- E2E tests live in `client/e2e/`.
- `describe` names the unit; `it`/`test` names the behavior in plain language, ideally "does X when Y".

```tsx
describe("Amount", () => {
  it("renders an expense with a minus sign and destructive tone", () => { /* ... */ });
  it("does not rely on color alone to convey direction", () => { /* ... */ });
});
```

## 6. Querying and assertions (RTL)

- Query by **role/label/text** (accessible), not by class or test id: `getByRole`, `getByLabelText`, `getByText`.
- Use `findBy*` for async and `waitFor` only when necessary; avoid arbitrary `setTimeout`.
- Interact via `userEvent.setup()`.
- Assert on user-visible outcomes, not component internals or state.
- For charts, assert the accessible name and the equivalent table data.
- Use `data-testid` only as a last resort, when no accessible query exists.

## 7. Mocking and data

- Mock at the **network boundary with MSW**; define handlers once and reuse them across tests.
- Use typed fixtures/factories for domain data (e.g., `makeAccount(overrides)`), not inline magic objects repeated across tests.
- Fixtures MUST be realistic and complete enough to exercise the code, but contain **no real personal/financial data**.
- Mock `next/navigation` (`useRouter`, `useSearchParams`) when a component navigates; assert on the expected navigation.
- Do not mock modules you own unless isolating a slow/irrelevant dependency; prefer injecting dependencies.
- Never mock what you are testing.

**Example — component test with MSW and a query wrapper:**

```tsx
// lib/test/render.tsx (test-only helper)
export const renderWithProviders = (ui: ReactElement) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

// components/features/accounts/accounts-table/index.test.tsx
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { renderWithProviders } from "@/lib/test/render";
import { AccountsTable } from ".";

const server = setupServer(
  http.get("*/accounts", () =>
    HttpResponse.json([makeAccount({ name: "Wallet", currentBalance: 1500, currency: "USD" })]),
  ),
);
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

it("renders accounts returned by the API", async () => {
  renderWithProviders(<AccountsTable />);
  expect(await screen.findByText("Wallet")).toBeInTheDocument();
});
```

## 8. Determinism and async

- Freeze time with `vi.useFakeTimers()` / a fixed clock for date/price logic; reset timers in `afterEach`.
- Reset MSW handlers and the QueryClient cache between tests.
- Await all async updates; do not leave floating promises.
- Avoid test-order dependencies; do not share mutable state across `it` blocks.
- Seed/randomness MUST be fixed or injected.
- A flaky test MUST be fixed or removed, never retried and ignored. Common causes: real timers, unawaited promises, shared state, animations, and unmocked network.

## 9. Data hooks and state

- Wrap hook/component tests in a fresh `QueryClientProvider` with `retry: false` and no caching between tests.
- Test query keys and filter propagation explicitly (they drive cache and correctness).
- Test mutation **invalidation** (e.g., creating a transaction invalidates `transactions`, `accounts`, `dashboard`, `budgets`, `reports`).
- Test the `401` path: interceptor triggers a single refresh and, on failure, redirects to login.
- Test the assistant stream with a mocked `ReadableStream` emitting `meta`/`token`/`done`/`error`, including cancellation via `AbortController` and the `insufficient` case.

**Example — data hook test:**

```tsx
const wrapper = ({ children }: PropsWithChildren) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>
);

const { result } = renderHook(() => useAccounts(), { wrapper });
await waitFor(() => expect(result.current.isSuccess).toBe(true));
expect(result.current.data?.[0].name).toBe("Wallet");
```

**Example — SSE parser test (assistant stream):**

```ts
it("parses assistant SSE events in order", async () => {
  const body = [
    'event: meta\ndata: {"conversationId":"c1","sources":["transactions"]}\n\n',
    'event: token\ndata: {"delta":"Hola "}\n\n',
    'event: token\ndata: {"delta":"mundo"}\n\n',
    'event: done\ndata: {"conversationId":"c1","insufficient":false}\n\n',
  ].join("");
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(body, { status: 200 })));

  const events: AssistantEvent[] = [];
  for await (const event of postAssistantStream({ question: "?" })) events.push(event);

  expect(events.map((e) => e.type)).toEqual(["meta", "token", "token", "done"]);
});
```

## 10. Accessibility tests

- Run `vitest-axe` (or `jest-axe`) on key components/pages; fix violations rather than skipping.
- Verify keyboard reachability and visible focus for interactive elements.
- Verify form fields have persistent labels and associated error messages.
- Verify status/amounts are not conveyed by color alone (text/icon present).

## 11. E2E rules

- Keep E2E small and focused on P0 flows; do not duplicate component-level assertions.
- Use `getByRole`/accessible selectors and Playwright auto-waiting; avoid hard sleeps.
- Each test MUST be self-contained: arrange its own data (seed/reset or API setup), act, assert.
- Run headless and in CI; capture trace/screenshot on failure.
- Cover the Capacitor-relevant flows at least once on a mobile viewport (bottom navigation, safe areas).

## 12. Anti-patterns (MUST avoid)

- Snapshot tests of large trees as the primary assertion.
- Testing implementation details (internal state, private functions, CSS classes).
- `fireEvent` where `userEvent` is appropriate.
- Arbitrary `waitFor`/`setTimeout` instead of proper async queries.
- Shared mutable fixtures across tests.
- Asserting on `console.log` or internal errors instead of user-visible behavior.
- Chasing coverage percentages with meaningless tests.
- Skipping/`it.only` left in the codebase.

## 13. Definition of Done (testing)

- [ ] New/changed behavior has tests at the right pyramid level.
- [ ] P0 flows remain covered (see §3).
- [ ] Tests are deterministic, independent, and pass locally and in CI.
- [ ] No `.only`/`.skip`; no commented-out tests.
- [ ] Mocks are at the network boundary (MSW); fixtures are shared and typed.
- [ ] Key components/pages pass accessibility checks.
- [ ] `npm run test` (and `test:e2e` where applicable) green.
