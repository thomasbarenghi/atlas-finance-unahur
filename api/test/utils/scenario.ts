import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { httpClient } from "./test-app";
import { bearer } from "./auth";
import { createAccount, createCategory, createTransaction } from "./factories";

export interface BaseScenario {
  account: Record<string, any>;
  incomeCategory: Record<string, any>;
  expenseCategory: Record<string, any>;
}

/**
 * Deterministic finance scenario used by the dashboard/report tests: one ARS
 * account (initial 1000), a 500 income and a 200 expense in March 2026.
 */
export const seedBaseScenario = async (
  app: INestApplication,
  token: string,
): Promise<BaseScenario> => {
  const account = await createAccount(app, token, {
    name: "Caja",
    initialBalance: 1000,
  });
  const incomeCategory = await createCategory(app, token, {
    name: "Sueldo",
    type: "income",
  });
  const expenseCategory = await createCategory(app, token, {
    name: "Comida",
    type: "expense",
  });

  await createTransaction(app, token, {
    type: "income",
    amount: 500,
    currency: "ARS",
    date: "2026-03-05",
    description: "Sueldo",
    accountId: account.id,
    categoryId: incomeCategory.id,
  });
  await createTransaction(app, token, {
    type: "expense",
    amount: 200,
    currency: "ARS",
    date: "2026-03-10",
    description: "Comida",
    accountId: account.id,
    categoryId: expenseCategory.id,
  });

  return { account, incomeCategory, expenseCategory };
};

export const DASHBOARD_RANGE = "from=2026-01-01&to=2026-03-31";

export const getDashboard = async (
  app: INestApplication,
  token: string,
  query = DASHBOARD_RANGE,
): Promise<Record<string, any>> => {
  const response = await request(httpClient(app))
    .get(`/api/dashboard?${query}`)
    .set(bearer(token))
    .expect(200);
  return response.body;
};
