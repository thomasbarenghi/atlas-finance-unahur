---
name: test-quality
description: >-
  Testing standards for the Atlass Fin API. Covers the test pyramid, tooling
  (Jest + Supertest + @nestjs/testing), test database strategy, what must be
  tested (calculations CAL-001..009, auth, ownership, transactional transfers,
  budgets, quotes, assistant security, error codes), provider mocking,
  determinism, fixtures, and anti-patterns. Use when writing, reviewing, or
  refactoring any test in api/, or when adding a feature that needs tests.
---

# Atlass Fin — API Test Quality

Normative. Keywords: **MUST** (required), **SHOULD** (recommended), **MAY** (optional).

## Workflow (how to apply this skill)

When adding or changing a feature:

1. **Identify the level.** Pure logic → unit; repository/transactions → integration; end-to-end path → e2e.
2. **Write the failing test first** (or alongside) for the new behavior, including the error/edge path.
3. **Unit-test the service** with mocked repositories/providers; reuse typed factories.
4. **Integration-test** anything transactional (transfers, rollback) against the test DB.
5. **E2E-test** the P0 flow through HTTP, asserting the exact contract.
6. **Run** `test` (and `test:e2e`), verify determinism, then `lint`, `typecheck`, `build`.
7. **Self-review** against §10 (Definition of Done).

## 1. Philosophy

- Tests are a **safety net** and executable specification, not a checkbox.
- Test **behavior and contracts** (inputs, outputs, side effects, errors), not implementation details. A refactor preserving behavior MUST NOT break tests.
- Tests MUST be **deterministic**, **independent**, and **isolated** (no shared mutable state, any order).
- Prefer few high-value tests over many brittle ones.
- A failing test MUST indicate a real defect, not flakiness.

## 2. Test pyramid

| Level | Scope | Tooling | Volume |
| :--- | :--- | :--- | :--- |
| Unit | Services (with mocked repos/providers), `calculations`, `fx`, mappers, guards, utils | Jest + `@nestjs/testing` | Most |
| Integration | Module + real Postgres (test DB), repositories + transactions | Jest + Nest TestingModule + test DB | Some |
| E2E | Full HTTP flows via the Nest app | Supertest (Jest) | Few |

- Push business rules into pure/unit-testable services so most coverage is unit-level.
- Do not test the same behavior at every level without reason.

## 3. What MUST be tested

- **Calculations (CAL-001..009), unit:** net worth, cash flow excludes transfers, budget consumption (limit = 0 edge), position value/profit-loss, goal progress, currency conversion + traceability. This is mandatory (NFR-CAL-004).
- **Auth:** register (duplicate email, password policy), login (invalid credentials → generic error), refresh rotation, logout revokes session, password reset one-time/expiry, `@Public()` vs guarded routes.
- **Ownership (security-critical):** a user cannot read/update/delete another user's account, transaction, budget, asset, debt, position, goal, or conversation → `FORBIDDEN`/`NOT_FOUND` (NFR-SEG-001).
- **Transactions:** transfer creates two atomic rows with a shared `transfer_group_id`; source = destination is rejected; failure rolls back both; transfers are excluded from income/expense consolidation (CAL-003).
- **Budgets:** status transitions `available → warning → exceeded`, `spent`/`available`/`consumedPct`, `DUPLICATE_BUDGET` on repeated category/period, `copy-previous`.
- **Quotes:** staleness computed from `QUOTE_STALE_MS`; external failure keeps the last valid price and never invents one; `isStale` surfaces correctly.
- **Assistant:** rejects when `aiEnabled=false` (`AI_DISABLED`); sends only the authenticated user's minimal pre-calculated context; conversation scoped to the user; no write operations; `insufficient` handling; provider failure → `AI_UNAVAILABLE`.
- **Contract/serialization:** responses are `camelCase`, dates `YYYY-MM-DD`, timestamps ISO 8601 UTC, decimals as `number`; error shape matches `backend.md` §7.17.
- **P0 e2e:** register/login → create account → create income/expense → create transfer → read dashboard/report; create budget; ask the assistant.

Not required: Nest internals, TypeORM internals, trivial getters.

**Example — calculation unit test:**

```ts
describe("CalculationsService", () => {
  const service = new CalculationsService(/* stubbed deps */);

  it("computes cash flow excluding transfers (CAL-002/003)", () => {
    const flow = service.cashFlow([
      { type: "income", amount: 1000 },
      { type: "expense", amount: 400 },
      { type: "transfer", amount: 300 },
    ]);
    expect(flow).toBe(600);
  });
});
```

## 4. Tooling and setup

- **Jest** (Nest default) + `@nestjs/testing` (`Test.createTestingModule`).
- **Supertest** for e2e against an initialized app (`app.init()`), using a dedicated test database.
- **@nestjs/config** loaded in tests with overrides; never hit real external services.
- Coverage via `jest --coverage`; a signal, not a target.
- Prefer `TestingModule` with the real module under test; override only external boundaries.

```jsonc
// package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  }
}
```

## 5. Test database strategy

- Use a **separate test database** (or a disposable Supabase branch/container). Never run tests against dev/prod.
- Apply migrations before the suite; reset state between tests (truncate/recreate or wrap each test in a rolling-back transaction).
- Seed only the minimum data each test needs; do not depend on leftover rows.
- Unit tests MUST NOT require a database (mock repositories/providers).

```ts
// test/setup-db.ts
beforeAll(async () => { await dataSource.runMigrations(); });
beforeEach(async () => {
  await dataSource.query('TRUNCATE "users", "accounts", "transactions", "budgets" RESTART IDENTITY CASCADE');
});
```

## 6. Mocking and isolation

- Mock external providers via DI overrides: `market`, `ai`, `mail`, `fx` (deterministic rates), and the clock.
- Mock repositories for unit tests; use real repositories for integration tests.
- Never perform real network calls, real SMTP, or real LLM calls in tests.
- Freeze time for quote staleness, token expiry, and period logic (`jest.useFakeTimers()` / injected clock); restore in `afterEach`.
- Do not mock the class under test.

## 7. Fixtures and data

- Use typed factories/builders (`makeUser`, `makeTransaction`) with sensible defaults and per-test overrides.
- Fixtures MUST be realistic and complete for the code path but contain **no real personal/financial data**.
- Factories MUST produce valid domain objects (e.g. dated periods, positive amounts) and MUST NOT hit the DB unless intended.

## 8. E2E rules

- Boot the full Nest app once per suite; authenticate via `POST /auth/login` to get a token/cookie for protected calls.
- Assert status codes **and** the exact response contract (`code`, field names, types).
- Each test arranges its own data, acts, asserts, and cleans up; no order dependence.
- Cover the security paths (cross-user access) and the transaction rollback at least once.
- Run in CI against a disposable database.

```ts
it("hides another user's account (404, no existence leak)", async () => {
  const { token } = await loginAsUserB(app);
  await request(app.getHttpServer())
    .get(`/accounts/${accountOfUserA}`)
    .set("Authorization", `Bearer ${token}`)
    .expect(404);
});
```

## 9. Anti-patterns (MUST avoid)

- Asserting on private methods, internals, or SQL strings.
- Sharing mutable state or a single seeded fixture across unrelated tests.
- Depending on test execution order or on existing database rows.
- Real network/DB dependencies in unit tests.
- Over-mocking so the test asserts on the mock, not the behavior.
- Snapshot tests of large payloads as the main assertion.
- Leaving `.only`/`.skip` or commented-out tests.
- Chasing coverage percentages with meaningless tests.

## 10. Definition of Done (testing)

- [ ] New/changed behavior has tests at the right pyramid level.
- [ ] Calculation rules (CAL-001..009) covered by unit tests.
- [ ] Ownership/cross-user access covered.
- [ ] Transfer atomicity/rollback covered.
- [ ] P0 e2e flows covered where applicable.
- [ ] Tests are deterministic, independent, and pass locally and in CI.
- [ ] External providers mocked; no real network/DB in unit tests.
- [ ] `npm run test` (and `test:e2e` where applicable) green.
