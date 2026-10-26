import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll } from "vitest";
import type {
  AuthResponse,
  Category,
  CreateAccountInput,
  CreateCategoryInput,
  CreateTransactionInput,
  DashboardData,
  UpdateAccountInput,
  UpdateCategoryInput,
  UpdateTransactionInput,
  UpdateUserInput,
  User,
} from "@/lib/api/types";
import {
  currentTestUser,
  deriveTestAccount,
  resetTestState,
  signedAmount,
  testId,
  testState,
  type TestTransaction,
} from "./api-state";

const DAY_MS = 86_400_000;

const json = <T>(value: T, status = 200) =>
  HttpResponse.json(value as never, { status });

const fail = (
  status: number,
  code: string,
  message: string,
  fieldErrors?: Record<string, string[]>,
) => json({ statusCode: status, code, message, fieldErrors }, status);

const unauthorized = () => fail(401, "UNAUTHENTICATED", "Sesión no válida");

const logRequest = (request: Request) => {
  testState.requests.push({
    method: request.method,
    path: new URL(request.url).pathname,
  });
};

const requireUser = (): User | null => currentTestUser();

const isoDate = (date: Date): string => date.toISOString().slice(0, 10);

const dayRange = (from: string, to: string): string[] => {
  const days: string[] = [];
  const cursor = new Date(`${from}T00:00:00.000Z`);
  const end = new Date(`${to}T00:00:00.000Z`);
  while (cursor <= end) {
    days.push(isoDate(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
};

const weekRange = (
  from: string,
  to: string,
): { start: string; end: string }[] => {
  const weeks: { start: string; end: string }[] = [];
  const end = new Date(`${to}T00:00:00.000Z`);
  let cursor = new Date(`${from}T00:00:00.000Z`);
  while (cursor <= end) {
    const weekEnd = new Date(cursor);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
    const capped = weekEnd > end ? end : weekEnd;
    weeks.push({ start: isoDate(cursor), end: isoDate(capped) });
    cursor = new Date(capped);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return weeks;
};

const monthRange = (from: string, to: string): string[] => {
  const months: string[] = [];
  const cursor = new Date(`${from.slice(0, 7)}-01T00:00:00.000Z`);
  const end = new Date(`${to.slice(0, 7)}-01T00:00:00.000Z`);
  while (cursor <= end) {
    months.push(isoDate(cursor).slice(0, 7));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return months;
};

const monthEnd = (month: string): string => {
  const [year, monthNumber] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return `${month}-${String(lastDay).padStart(2, "0")}`;
};

const flowBetween = (from: string, to: string) => {
  const period = testState.transactions.filter(
    (transaction) => transaction.date >= from && transaction.date <= to,
  );
  const income = period
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + transaction.amount, 0);
  const expenses = period
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + transaction.amount, 0);
  return { income, expenses, savings: income - expenses };
};

const pctDelta = (current: number, previous: number): number | null =>
  previous === 0 ? null : ((current - previous) / Math.abs(previous)) * 100;

const previousRange = (from: string, to: string) => {
  const start = new Date(`${from}T00:00:00.000Z`);
  const end = new Date(`${to}T00:00:00.000Z`);
  const days = Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1;
  const previousEnd = new Date(start);
  previousEnd.setUTCDate(previousEnd.getUTCDate() - 1);
  const previousStart = new Date(previousEnd);
  previousStart.setUTCDate(previousStart.getUTCDate() - (days - 1));
  return { from: isoDate(previousStart), to: isoDate(previousEnd) };
};

const buildDashboard = (from: string, to: string): DashboardData => {
  const user = requireUser();
  const ownedTransactions = testState.transactions.filter(
    (transaction) => transaction.userId === user?.id,
  );
  const activeAccounts = testState.accounts.filter(
    (account) => account.userId === user?.id,
  );
  const initialTotal = activeAccounts.reduce(
    (total, account) => total + account.initialBalance,
    0,
  );
  const netWorthAt = (end: string): number =>
    initialTotal +
    ownedTransactions
      .filter((transaction) => transaction.date <= end)
      .reduce((total, transaction) => total + signedAmount(transaction), 0);

  const current = flowBetween(from, to);
  const previous = previousRange(from, to);
  const previousFlow = flowBetween(previous.from, previous.to);
  const months = monthRange(from, to);
  const rangeDays = dayRange(from, to).length;
  const daily = rangeDays <= 31;

  const monthly = (month: string) =>
    flowBetween(`${month}-01`, monthEnd(month));

  const incomeExpenseByMonth = months.map((month) => ({
    month,
    ...monthly(month),
  }));

  const incomeExpenseByPeriod = daily
    ? weekRange(from, to).map(({ start, end }) => ({
        bucket: "week" as const,
        start,
        end,
        ...flowBetween(start, end),
      }))
    : months.map((month) => ({
        bucket: "month" as const,
        start: `${month}-01`,
        end: monthEnd(month),
        ...monthly(month),
      }));

  const netWorthSeries = daily
    ? dayRange(from, to).map((date) => ({
        date,
        value: netWorthAt(date),
      }))
    : months.map((month) => ({
        date: monthEnd(month),
        value: netWorthAt(monthEnd(month)),
      }));

  const expensesByCategory = new Map<string, number>();
  for (const transaction of ownedTransactions) {
    if (transaction.type !== "expense" || !transaction.categoryId) continue;
    if (transaction.date < from || transaction.date > to) continue;
    expensesByCategory.set(
      transaction.categoryId,
      (expensesByCategory.get(transaction.categoryId) ?? 0) +
        transaction.amount,
    );
  }

  const netWorth = activeAccounts.reduce(
    (total, account) => total + deriveTestAccount(account).currentBalance,
    0,
  );
  const seriesStart = netWorthSeries[0]?.value ?? netWorth;

  return {
    period: { from, to },
    currency: "ARS",
    kpis: {
      netWorth,
      netWorthDeltaPct: pctDelta(netWorth, seriesStart),
      income: current.income,
      incomeDeltaPct: pctDelta(current.income, previousFlow.income),
      expenses: current.expenses,
      expensesDeltaPct: pctDelta(current.expenses, previousFlow.expenses),
      savings: current.savings,
      savingsDeltaPct: pctDelta(current.savings, previousFlow.savings),
      savingsRateDeltaPp:
        ((current.income > 0 ? current.savings / current.income : 0) -
          (previousFlow.income > 0
            ? previousFlow.savings / previousFlow.income
            : 0)) *
        100,
    },
    netWorthSeries,
    incomeExpenseByPeriod,
    incomeExpenseByMonth,
    expensesByCategory: [...expensesByCategory.entries()]
      .map(([categoryId, value]) => {
        const category = testState.categories.find(
          (item) => item.id === categoryId,
        );
        return {
          categoryId,
          name: category?.name ?? "Sin categoría",
          color: category?.color ?? "#64748b",
          value,
        };
      })
      .sort((first, second) => second.value - first.value),
  };
};

const authResponse = (user: User): AuthResponse => ({
  user,
  accessToken: `test-access-${user.id}`,
  refreshToken: `test-refresh-${user.id}`,
});

const buildAssistantAnswer = (question: string): string => {
  const text = question.toLowerCase();
  if (text.includes("gast")) {
    return "En el período indicado tu mayor gasto fue en Supermercado, con $ 180.000,00.";
  }
  if (text.includes("ahorr")) {
    return "En el período indicado ahorraste $ 1.000.000,00 (ingresos menos gastos).";
  }
  return "En el período indicado tus ingresos fueron $ 900.000,00 y tus gastos $ 324.000,00.";
};

const handlers = [
  http.get("*/auth/me", ({ request }) => {
    logRequest(request);
    const user = requireUser();
    return user ? json(user) : unauthorized();
  }),

  http.post("*/auth/login", async ({ request }) => {
    logRequest(request);
    const body = (await request.json()) as {
      email: string;
      password: string;
    };
    const record = testState.users.find(
      (item) =>
        item.user.email.toLowerCase() === body.email.toLowerCase() &&
        item.password === body.password,
    );
    if (!record) {
      return fail(401, "INVALID_CREDENTIALS", "Email o contraseña incorrectos");
    }
    testState.sessionUserId = record.user.id;
    return json(authResponse(record.user));
  }),

  http.post("*/auth/register", async ({ request }) => {
    logRequest(request);
    const body = (await request.json()) as {
      name: string;
      email: string;
      password: string;
    };
    if (
      testState.users.some(
        (item) => item.user.email.toLowerCase() === body.email.toLowerCase(),
      )
    ) {
      return fail(409, "EMAIL_IN_USE", "Ese email ya está registrado", {
        email: ["Ese email ya está registrado"],
      });
    }
    const user: User = {
      id: testId(),
      name: body.name,
      email: body.email.toLowerCase(),
      createdAt: new Date().toISOString(),
    };
    testState.users.push({ user, password: body.password });
    testState.sessionUserId = user.id;
    return json(authResponse(user), 201);
  }),

  http.post("*/auth/logout", ({ request }) => {
    logRequest(request);
    testState.sessionUserId = null;
    return new HttpResponse(null, { status: 204 });
  }),

  http.post("*/auth/refresh", ({ request }) => {
    logRequest(request);
    return new HttpResponse(null, { status: 401 });
  }),

  http.patch("*/users/me", async ({ request }) => {
    logRequest(request);
    const user = requireUser();
    if (!user) return unauthorized();
    const body = (await request.json()) as UpdateUserInput;
    const record = testState.users.find((item) => item.user.id === user.id);
    if (!record) return fail(404, "NOT_FOUND", "El usuario no existe");
    record.user = { ...record.user, ...body };
    return json(record.user);
  }),

  http.get("*/accounts", ({ request }) => {
    logRequest(request);
    const user = requireUser();
    if (!user) return unauthorized();
    return json(
      testState.accounts
        .filter((account) => account.userId === user.id)
        .map(deriveTestAccount),
    );
  }),

  http.post("*/accounts", async ({ request }) => {
    logRequest(request);
    const user = requireUser();
    if (!user) return unauthorized();
    const body = (await request.json()) as CreateAccountInput;
    const now = new Date().toISOString();
    const account = {
      id: testId(),
      userId: user.id,
      name: body.name,
      type: body.type,
      initialBalance: body.initialBalance ?? 0,
      currentBalance: body.initialBalance ?? 0,
      notes: body.notes ?? null,
      createdAt: now,
      updatedAt: now,
    };
    testState.accounts.push(account);
    return json(deriveTestAccount(account), 201);
  }),

  http.patch("*/accounts/:id", async ({ request, params }) => {
    logRequest(request);
    const user = requireUser();
    if (!user) return unauthorized();
    const account = testState.accounts.find(
      (item) => item.id === params.id && item.userId === user.id,
    );
    if (!account) return fail(404, "NOT_FOUND", "La cuenta no existe");
    const body = (await request.json()) as UpdateAccountInput;
    Object.assign(account, body, { updatedAt: new Date().toISOString() });
    return json(deriveTestAccount(account));
  }),

  http.delete("*/accounts/:id", ({ request, params }) => {
    logRequest(request);
    const user = requireUser();
    if (!user) return unauthorized();
    const account = testState.accounts.find(
      (item) => item.id === params.id && item.userId === user.id,
    );
    if (!account) return fail(404, "NOT_FOUND", "La cuenta no existe");
    testState.accounts = testState.accounts.filter(
      (item) => item.id !== params.id,
    );
    testState.transactions = testState.transactions.filter(
      (transaction) =>
        transaction.accountId !== params.id &&
        transaction.transferAccountId !== params.id,
    );
    return new HttpResponse(null, { status: 204 });
  }),

  http.get("*/categories", ({ request }) => {
    logRequest(request);
    if (!requireUser()) return unauthorized();
    return json([...testState.categories]);
  }),

  http.post("*/categories", async ({ request }) => {
    logRequest(request);
    if (!requireUser()) return unauthorized();
    const body = (await request.json()) as CreateCategoryInput;
    const name = body.name.trim();
    if (
      testState.categories.some(
        (category) =>
          category.type === body.type &&
          category.name.toLowerCase() === name.toLowerCase(),
      )
    ) {
      return fail(
        400,
        "VALIDATION_ERROR",
        "Ya existe una categoría con ese nombre",
        { name: ["Ya existe una categoría con ese nombre"] },
      );
    }
    const category: Category = {
      id: testId(),
      name,
      type: body.type,
      color: body.color.toLowerCase(),
      icon: null,
      isSystem: false,
    };
    testState.categories.push(category);
    return json(category, 201);
  }),

  http.patch("*/categories/:id", async ({ request, params }) => {
    logRequest(request);
    if (!requireUser()) return unauthorized();
    const category = testState.categories.find(
      (item) => item.id === params.id && !item.isSystem,
    );
    if (!category) return fail(404, "NOT_FOUND", "La categoría no existe");
    const body = (await request.json()) as UpdateCategoryInput;
    if (body.name !== undefined) {
      const name = body.name.trim();
      const duplicate = testState.categories.some(
        (item) =>
          item.id !== params.id &&
          item.type === category.type &&
          item.name.toLowerCase() === name.toLowerCase(),
      );
      if (duplicate) {
        return fail(
          400,
          "VALIDATION_ERROR",
          "Ya existe una categoría con ese nombre",
          { name: ["Ya existe una categoría con ese nombre"] },
        );
      }
      category.name = name;
    }
    if (body.color !== undefined) category.color = body.color.toLowerCase();
    return json(category);
  }),

  http.delete("*/categories/:id", ({ request, params }) => {
    logRequest(request);
    if (!requireUser()) return unauthorized();
    const category = testState.categories.find(
      (item) => item.id === params.id && !item.isSystem,
    );
    if (!category) return fail(404, "NOT_FOUND", "La categoría no existe");
    testState.categories = testState.categories.filter(
      (item) => item.id !== params.id,
    );
    for (const transaction of testState.transactions) {
      if (transaction.categoryId === params.id) {
        transaction.categoryId = null;
      }
    }
    return new HttpResponse(null, { status: 204 });
  }),

  http.get("*/transactions", ({ request }) => {
    logRequest(request);
    const user = requireUser();
    if (!user) return unauthorized();
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const pageSize = Math.min(
      100,
      Math.max(1, Number(url.searchParams.get("pageSize") ?? 20)),
    );
    const filtered = testState.transactions
      .filter((transaction) => transaction.userId === user.id)
      .sort((first, second) => {
        const byDate = second.date.localeCompare(first.date);
        return byDate || second.createdAt.localeCompare(first.createdAt);
      });
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const start = (page - 1) * pageSize;
    return json({
      items: filtered.slice(start, start + pageSize),
      page,
      pageSize,
      total,
      totalPages,
    });
  }),

  http.post("*/transactions", async ({ request }) => {
    logRequest(request);
    const user = requireUser();
    if (!user) return unauthorized();
    const body = (await request.json()) as CreateTransactionInput;
    const now = new Date().toISOString();

    if (body.type === "transfer") {
      if (!body.transferAccountId) {
        return fail(400, "VALIDATION_ERROR", "Elegí una cuenta de destino", {
          transferAccountId: ["Seleccioná la cuenta de destino"],
        });
      }
      if (body.transferAccountId === body.accountId) {
        return fail(
          400,
          "VALIDATION_ERROR",
          "Las cuentas deben ser distintas",
          {
            transferAccountId: ["Debe ser distinta de la cuenta origen"],
          },
        );
      }
      const groupId = testId();
      const outbound: TestTransaction = {
        id: testId(),
        userId: user.id,
        type: "transfer",
        amount: -Math.abs(body.amount),
        date: body.date,
        description: body.description,
        notes: body.notes ?? null,
        accountId: body.accountId,
        transferAccountId: body.transferAccountId,
        categoryId: null,
        transferGroupId: groupId,
        createdAt: now,
        updatedAt: now,
      };
      const inbound: TestTransaction = {
        ...outbound,
        id: testId(),
        amount: Math.abs(body.amount),
        accountId: body.transferAccountId,
        transferAccountId: body.accountId,
      };
      testState.transactions.push(outbound, inbound);
      return json(outbound, 201);
    }

    const transaction: TestTransaction = {
      id: testId(),
      userId: user.id,
      type: body.type,
      amount: Math.abs(body.amount),
      date: body.date,
      description: body.description,
      notes: body.notes ?? null,
      accountId: body.accountId,
      transferAccountId: null,
      categoryId: body.categoryId ?? null,
      transferGroupId: null,
      createdAt: now,
      updatedAt: now,
    };
    testState.transactions.push(transaction);
    return json(transaction, 201);
  }),

  http.patch("*/transactions/:id", async ({ request, params }) => {
    logRequest(request);
    const user = requireUser();
    if (!user) return unauthorized();
    const transaction = testState.transactions.find(
      (item) => item.id === params.id && item.userId === user.id,
    );
    if (!transaction) {
      return fail(404, "NOT_FOUND", "El movimiento no existe");
    }
    const body = (await request.json()) as UpdateTransactionInput;
    if (transaction.type === "transfer" && transaction.transferGroupId) {
      const group = testState.transactions.filter(
        (item) => item.transferGroupId === transaction.transferGroupId,
      );
      for (const item of group) {
        Object.assign(item, {
          amount:
            item.amount < 0
              ? -Math.abs(body.amount ?? Math.abs(item.amount))
              : Math.abs(body.amount ?? Math.abs(item.amount)),
          date: body.date ?? item.date,
          description: body.description ?? item.description,
          notes: body.notes ?? item.notes,
          updatedAt: new Date().toISOString(),
        });
      }
      return json(transaction);
    }
    Object.assign(transaction, body, {
      amount:
        body.amount === undefined ? transaction.amount : Math.abs(body.amount),
      updatedAt: new Date().toISOString(),
    });
    return json(transaction);
  }),

  http.delete("*/transactions/:id", ({ request, params }) => {
    logRequest(request);
    const user = requireUser();
    if (!user) return unauthorized();
    const transaction = testState.transactions.find(
      (item) => item.id === params.id && item.userId === user.id,
    );
    if (!transaction) {
      return fail(404, "NOT_FOUND", "El movimiento no existe");
    }
    const groupId = transaction.transferGroupId;
    testState.transactions = testState.transactions.filter((item) =>
      groupId ? item.transferGroupId !== groupId : item.id !== transaction.id,
    );
    return new HttpResponse(null, { status: 204 });
  }),

  http.get("*/dashboard", ({ request }) => {
    logRequest(request);
    if (!requireUser()) return unauthorized();
    const url = new URL(request.url);
    const to = url.searchParams.get("to") ?? isoDate(new Date());
    const from =
      url.searchParams.get("from") ??
      isoDate(
        new Date(new Date(`${to}T00:00:00.000Z`).getTime() - 180 * DAY_MS),
      );
    return json(buildDashboard(from, to));
  }),

  http.post("*/assistant/messages", async ({ request }) => {
    logRequest(request);
    if (!requireUser()) return unauthorized();
    const body = (await request.json()) as {
      question: string;
      period?: { from: string; to: string };
    };
    const answer = buildAssistantAnswer(body.question);
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start: (controller) => {
        const send = (event: string, data: unknown) => {
          controller.enqueue(
            encoder.encode(
              `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
            ),
          );
        };
        send("meta", {
          period: body.period,
          currency: "ARS",
          sources: ["transactions"],
          disclaimer: "Información de tus datos.",
        });
        const words = answer.split(" ");
        let index = 0;
        const timer = setInterval(() => {
          try {
            if (index < words.length) {
              send("token", { delta: `${words[index]} ` });
              index += 1;
              return;
            }
            send("done", { insufficient: false });
            clearInterval(timer);
            controller.close();
          } catch {
            clearInterval(timer);
          }
        }, 10);
      },
    });
    return new HttpResponse(stream, {
      headers: { "Content-Type": "text/event-stream" },
    });
  }),
];

export const server = setupServer(...handlers);

export const setupTestServer = () => {
  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterEach(() => {
    server.resetHandlers();
    resetTestState();
  });
  afterAll(() => server.close());
  return server;
};
