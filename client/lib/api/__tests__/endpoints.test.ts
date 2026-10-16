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
  authEndpoints,
  categoryEndpoints,
  dashboardEndpoints,
  transactionEndpoints,
  userEndpoints,
} from "@/lib/api/endpoints";
import { validateApiPayload, apiRequestDtos } from "@/lib/test/api-contracts";
import { makeAccount, makeCategory } from "@/lib/test/factories";

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

  it("deletes an account with DELETE", async () => {
    let method: string | undefined;
    server.use(
      http.delete(`${BASE}/accounts/:id`, ({ request }) => {
        method = request.method;
        return okJson({});
      }),
    );

    await accountEndpoints.remove("acc-1");
    expect(method).toBe("DELETE");
  });
});

describe("transaction endpoints", () => {
  it("serializes pagination into the query string, omitting empty values", async () => {
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

    await transactionEndpoints.list({ page: 1, pageSize: 20 });

    expect(url?.searchParams.get("page")).toBe("1");
    expect(url?.searchParams.get("pageSize")).toBe("20");
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

describe("category endpoints", () => {
  it("lists the fixed category catalog", async () => {
    server.use(http.get(`${BASE}/categories`, () => okJson([makeCategory()])));
    const categories = await categoryEndpoints.list();
    expect(categories).toHaveLength(1);
  });
});

describe("auth, user and dashboard endpoints", () => {
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
    await userEndpoints.updateMe({ name: "Demo" });
    expect(
      (await validateApiPayload(apiRequestDtos.UpdateUserDto, body as never))
        .valid,
    ).toBe(true);
    expect(body).toEqual({ name: "Demo" });
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
    });
    const result = await validateApiPayload(
      apiRequestDtos.DashboardQueryDto,
      Object.fromEntries(url?.searchParams ?? []) as never,
    );
    expect(result.valid).toBe(true);
  });
});
