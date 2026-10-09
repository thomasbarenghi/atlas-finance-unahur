import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

vi.hoisted(() => {
  process.env.NEXT_PUBLIC_API_URL = "http://localhost/api";
  process.env.NEXT_PUBLIC_USE_MOCKS = "false";
});

import {
  accountEndpoints,
  assetEndpoints,
  assistantEndpoints,
  authEndpoints,
  budgetEndpoints,
  categoryEndpoints,
  dashboardEndpoints,
  debtEndpoints,
  goalEndpoints,
  positionEndpoints,
  transactionEndpoints,
  userEndpoints,
} from "@/lib/api/endpoints";
import { validateApiPayload, apiRequestDtos } from "@/lib/test/api-contracts";
import { makeAccount, makeAsset, makeBudget } from "@/lib/test/factories";

const BASE = "http://localhost/api";
const ACC = "11111111-1111-4111-8111-111111111111";
const ACC_2 = "33333333-3333-4333-8333-333333333333";
const CAT = "22222222-2222-4222-8222-222222222222";
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const okJson = <T>(value: T) => HttpResponse.json(value as never);

describe("account endpoints", () => {
  it("POSTs a valid CreateAccountDto payload", async () => {
    let body: unknown;
    server.use(
      http.post(`${BASE}/accounts`, async ({ request }) => {
        body = await request.json();
        return okJson(makeAccount());
      }),
    );

    await accountEndpoints.create({
      name: "Caja",
      type: "cash",
      currency: "ARS",
      initialBalance: 1000,
      notes: null,
    });

    const result = await validateApiPayload(
      apiRequestDtos.CreateAccountDto,
      body as never,
    );
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it("PATCHes a valid UpdateAccountDto payload without unknown fields", async () => {
    let body: unknown;
    server.use(
      http.patch(`${BASE}/accounts/:id`, async ({ request }) => {
        body = await request.json();
        return okJson(makeAccount());
      }),
    );

    await accountEndpoints.update("acc-1", {
      name: "Nueva",
      initialBalance: 0,
    });
    const result = await validateApiPayload(
      apiRequestDtos.UpdateAccountDto,
      body as never,
    );
    expect(result.valid).toBe(true);
  });

  it("accepts a CreateAccountDto that omits initialBalance (the API defaults it)", async () => {
    const result = await validateApiPayload(apiRequestDtos.CreateAccountDto, {
      name: "Caja",
      type: "cash",
      currency: "ARS",
    } as never);
    expect(result.valid).toBe(true);
  });
});

describe("transaction endpoints", () => {
  it("serializes filters into the query string, omitting empty values", async () => {
    let url: URL | undefined;
    server.use(
      http.get(`${BASE}/transactions`, ({ request }) => {
        url = new URL(request.url);
        return okJson({
          items: [],
          page: 1,
          pageSize: 20,
          total: 0,
          totalPages: 1,
        });
      }),
    );

    await transactionEndpoints.list({
      type: "expense",
      from: "2026-01-01",
      to: "2026-01-31",
      accountId: ACC,
      search: "",
      categoryId: undefined,
      page: 1,
      pageSize: 20,
    });

    expect(url?.searchParams.get("type")).toBe("expense");
    expect(url?.searchParams.get("from")).toBe("2026-01-01");
    expect(url?.searchParams.get("page")).toBe("1");
    expect(url?.searchParams.has("search")).toBe(false);
    expect(url?.searchParams.has("categoryId")).toBe(false);

    const query = Object.fromEntries(url?.searchParams ?? []);
    const result = await validateApiPayload(
      apiRequestDtos.QueryTransactionsDto,
      query as never,
    );
    expect(result.valid).toBe(true);
  });

  it("POSTs a valid CreateTransactionDto payload", async () => {
    let body: unknown;
    server.use(
      http.post(`${BASE}/transactions`, async ({ request }) => {
        body = await request.json();
        return okJson({});
      }),
    );

    await transactionEndpoints.create({
      type: "expense",
      amount: 1500,
      currency: "ARS",
      date: "2026-01-15",
      description: "Alquiler",
      notes: null,
      accountId: ACC,
      categoryId: CAT,
      transferAccountId: null,
    });

    const result = await validateApiPayload(
      apiRequestDtos.CreateTransactionDto,
      body as never,
    );
    expect(result.errors).toEqual([]);
  });

  it("requires a UUID account and accepts an optional UUID transfer destination", async () => {
    const base = {
      type: "transfer",
      amount: 100,
      currency: "ARS",
      date: "2026-01-15",
      description: "Transferencia",
    };
    const missingAccount = await validateApiPayload(
      apiRequestDtos.CreateTransactionDto,
      base as never,
    );
    expect(missingAccount.valid).toBe(false);

    const validTransfer = await validateApiPayload(
      apiRequestDtos.CreateTransactionDto,
      {
        ...base,
        accountId: ACC,
        transferAccountId: ACC_2,
      } as never,
    );
    expect(validTransfer.valid).toBe(true);
  });
});

describe("budget endpoints", () => {
  it("sends a valid CreateBudgetDto with a month period", async () => {
    let body: unknown;
    server.use(
      http.post(`${BASE}/budgets`, async ({ request }) => {
        body = await request.json();
        return okJson(makeBudget());
      }),
    );

    await budgetEndpoints.create({
      categoryId: CAT,
      period: "2026-01-01",
      limit: 150_000,
      currency: "ARS",
      recurring: false,
    });
    const result = await validateApiPayload(
      apiRequestDtos.CreateBudgetDto,
      body as never,
    );
    expect(result.errors).toEqual([]);
  });

  it("sends only the editable fields for an update", async () => {
    let body: unknown;
    server.use(
      http.patch(`${BASE}/budgets/:id`, async ({ request }) => {
        body = await request.json();
        return okJson(makeBudget());
      }),
    );

    await budgetEndpoints.update("b-1", { limit: 200_000, recurring: true });
    const result = await validateApiPayload(
      apiRequestDtos.UpdateBudgetDto,
      body as never,
    );
    expect(result.valid).toBe(true);
    expect(body).toEqual({ limit: 200_000, recurring: true });
  });

  it("validates the period query and the copy-previous payload", async () => {
    let listUrl: URL | undefined;
    let copyBody: unknown;
    server.use(
      http.get(`${BASE}/budgets`, ({ request }) => {
        listUrl = new URL(request.url);
        return okJson([]);
      }),
      http.post(`${BASE}/budgets/copy-previous`, async ({ request }) => {
        copyBody = await request.json();
        return okJson([]);
      }),
    );

    await budgetEndpoints.list("2026-01");
    const listResult = await validateApiPayload(
      apiRequestDtos.QueryBudgetsDto,
      Object.fromEntries(listUrl?.searchParams ?? []) as never,
    );
    expect(listResult.valid).toBe(true);

    await budgetEndpoints.copyPrevious({
      period: "2026-02",
      sourcePeriod: "2026-01",
    });
    const copyResult = await validateApiPayload(
      apiRequestDtos.CopyBudgetsDto,
      copyBody as never,
    );
    expect(copyResult.valid).toBe(true);
  });
});

describe("category, goal, asset, debt and position endpoints", () => {
  it("validates a category create payload", async () => {
    let body: unknown;
    server.use(
      http.post(`${BASE}/categories`, async ({ request }) => {
        body = await request.json();
        return okJson({});
      }),
    );
    await categoryEndpoints.create({
      name: "Comida",
      type: "expense",
      color: "#ef4444",
    });
    expect(
      (
        await validateApiPayload(
          apiRequestDtos.CreateCategoryDto,
          body as never,
        )
      ).valid,
    ).toBe(true);
  });

  it("validates a goal create payload with null optionals", async () => {
    let body: unknown;
    server.use(
      http.post(`${BASE}/goals`, async ({ request }) => {
        body = await request.json();
        return okJson({});
      }),
    );
    await goalEndpoints.create({
      name: "Vacaciones",
      targetAmount: 500_000,
      savedAmount: 0,
      currency: "ARS",
      targetDate: null,
      sourceAccountId: null,
    });
    expect(
      (await validateApiPayload(apiRequestDtos.CreateGoalDto, body as never))
        .valid,
    ).toBe(true);
  });

  it("validates an asset create and its valuation", async () => {
    let createBody: unknown;
    let valuationBody: unknown;
    server.use(
      http.post(`${BASE}/assets`, async ({ request }) => {
        createBody = await request.json();
        return okJson(makeAsset());
      }),
      http.post(`${BASE}/assets/:id/valuations`, async ({ request }) => {
        valuationBody = await request.json();
        return okJson({});
      }),
    );

    await assetEndpoints.create({
      name: "Depto",
      type: "property",
      currency: "ARS",
      initialValue: 85_000_000,
      date: "2026-01-01",
      notes: null,
    });
    expect(
      (
        await validateApiPayload(
          apiRequestDtos.CreateAssetDto,
          createBody as never,
        )
      ).valid,
    ).toBe(true);

    await assetEndpoints.createValuation("asset-1", {
      value: 90_000_000,
      currency: "ARS",
      date: "2026-01-01",
      source: "manual",
    });
    expect(
      (
        await validateApiPayload(
          apiRequestDtos.CreateValuationDto,
          valuationBody as never,
        )
      ).valid,
    ).toBe(true);
  });

  it("validates a debt create payload", async () => {
    let body: unknown;
    server.use(
      http.post(`${BASE}/debts`, async ({ request }) => {
        body = await request.json();
        return okJson({});
      }),
    );
    await debtEndpoints.create({
      name: "Hipoteca",
      type: "mortgage",
      balance: 45_000_000,
      currency: "ARS",
      date: "2026-01-01",
      assetId: null,
    });
    expect(
      (await validateApiPayload(apiRequestDtos.CreateDebtDto, body as never))
        .valid,
    ).toBe(true);
  });

  it("validates a position create payload", async () => {
    let body: unknown;
    server.use(
      http.post(`${BASE}/positions`, async ({ request }) => {
        body = await request.json();
        return okJson({});
      }),
    );
    await positionEndpoints.create({
      symbol: "BTC",
      instrument: "Bitcoin",
      quantity: 0.05,
      avgCost: 55_000,
      currency: "USD",
    });
    expect(
      (
        await validateApiPayload(
          apiRequestDtos.CreatePositionDto,
          body as never,
        )
      ).valid,
    ).toBe(true);
  });
});

describe("auth, user, dashboard and assistant endpoints", () => {
  it("sends login and register payloads", async () => {
    const bodies: Record<string, unknown> = {};
    server.use(
      http.post(`${BASE}/auth/login`, async ({ request }) => {
        bodies.login = await request.json();
        return okJson({ user: {}, accessToken: "a", refreshToken: "r" });
      }),
      http.post(`${BASE}/auth/register`, async ({ request }) => {
        bodies.register = await request.json();
        return okJson({ user: {}, accessToken: "a", refreshToken: "r" });
      }),
    );

    await authEndpoints.login({
      email: "demo@atlassfin.app",
      password: "Demo1234!",
    });
    await authEndpoints.register({
      name: "Ana",
      email: "ana@example.com",
      password: "Password1",
    });

    expect(
      (await validateApiPayload(apiRequestDtos.LoginDto, bodies.login as never))
        .valid,
    ).toBe(true);
    expect(
      (
        await validateApiPayload(
          apiRequestDtos.RegisterDto,
          bodies.register as never,
        )
      ).valid,
    ).toBe(true);
  });

  it("updates the user with a valid UpdateUserDto", async () => {
    let body: unknown;
    server.use(
      http.patch(`${BASE}/users/me`, async ({ request }) => {
        body = await request.json();
        return okJson({});
      }),
    );
    await userEndpoints.updateMe({
      name: "Demo",
      theme: "dark",
      aiEnabled: true,
    });
    expect(
      (await validateApiPayload(apiRequestDtos.UpdateUserDto, body as never))
        .valid,
    ).toBe(true);
  });

  it("serializes dashboard params and validates them", async () => {
    let url: URL | undefined;
    server.use(
      http.get(`${BASE}/dashboard`, ({ request }) => {
        url = new URL(request.url);
        return okJson({});
      }),
    );
    await dashboardEndpoints.get({
      from: "2026-01-01",
      to: "2026-01-31",
      currency: "ARS",
    });
    const result = await validateApiPayload(
      apiRequestDtos.DashboardQueryDto,
      Object.fromEntries(url?.searchParams ?? []) as never,
    );
    expect(result.valid).toBe(true);
  });

  it("posts a confirmation token for assistant actions", async () => {
    let body: unknown;
    server.use(
      http.post(
        `${BASE}/assistant/actions/:id/confirm`,
        async ({ request }) => {
          body = await request.json();
          return okJson({});
        },
      ),
    );
    await assistantEndpoints.confirmAction("action-1", "token-1");
    expect(
      (await validateApiPayload(apiRequestDtos.ConfirmActionDto, body as never))
        .valid,
    ).toBe(true);
  });

  it("reads assistant conversations as a paginated response", async () => {
    let url: URL | undefined;
    server.use(
      http.get(`${BASE}/assistant/conversations`, ({ request }) => {
        url = new URL(request.url);
        return okJson({
          items: [
            {
              id: "c1",
              question: "¿Cuánto gasté?",
              answer: "…",
              contextMeta: { sources: ["transactions"] },
              createdAt: "2026-01-01T00:00:00.000Z",
            },
          ],
          page: 1,
          pageSize: 20,
          total: 1,
          totalPages: 1,
        });
      }),
    );

    const result = await assistantEndpoints.conversations();
    expect(url?.pathname).toBe("/api/assistant/conversations");
    expect(result.items).toHaveLength(1);
    expect(result.items[0].question).toBe("¿Cuánto gasté?");
    expect(result.totalPages).toBe(1);
  });
});
