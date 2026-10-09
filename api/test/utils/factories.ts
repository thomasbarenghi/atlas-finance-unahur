import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { httpClient } from "./test-app";
import { bearer } from "./auth";

/**
 * Typed factories that create domain data through the public API. They are used
 * as arrange-helpers by the requirement specs, so the setup itself exercises the
 * real endpoints.
 */

export const isoDate = (date: Date = new Date()): string =>
  date.toISOString().slice(0, 10);

export const createAccount = async (
  app: INestApplication,
  token: string,
  overrides: Record<string, unknown> = {},
): Promise<Record<string, any>> => {
  const response = await request(httpClient(app))
    .post("/api/accounts")
    .set(bearer(token))
    .send({
      name: "Caja",
      type: "cash",
      currency: "ARS",
      initialBalance: 1000,
      ...overrides,
    })
    .expect(201);
  return response.body;
};

export const createCategory = async (
  app: INestApplication,
  token: string,
  overrides: Record<string, unknown> = {},
): Promise<Record<string, any>> => {
  const response = await request(httpClient(app))
    .post("/api/categories")
    .set(bearer(token))
    .send({
      name: "Comida",
      type: "expense",
      color: "#ef4444",
      ...overrides,
    })
    .expect(201);
  return response.body;
};

export const createTransaction = async (
  app: INestApplication,
  token: string,
  body: Record<string, unknown>,
): Promise<Record<string, any>> => {
  const response = await request(httpClient(app))
    .post("/api/transactions")
    .set(bearer(token))
    .send(body)
    .expect(201);
  return response.body;
};

export const createBudget = async (
  app: INestApplication,
  token: string,
  body: Record<string, unknown>,
): Promise<Record<string, any>> => {
  const response = await request(httpClient(app))
    .post("/api/budgets")
    .set(bearer(token))
    .send(body)
    .expect(201);
  return response.body;
};

export const createGoal = async (
  app: INestApplication,
  token: string,
  body: Record<string, unknown>,
): Promise<Record<string, any>> => {
  const response = await request(httpClient(app))
    .post("/api/goals")
    .set(bearer(token))
    .send(body)
    .expect(201);
  return response.body;
};

export const createAsset = async (
  app: INestApplication,
  token: string,
  body: Record<string, unknown>,
): Promise<Record<string, any>> => {
  const response = await request(httpClient(app))
    .post("/api/assets")
    .set(bearer(token))
    .send(body)
    .expect(201);
  return response.body;
};

export const createDebt = async (
  app: INestApplication,
  token: string,
  body: Record<string, unknown>,
): Promise<Record<string, any>> => {
  const response = await request(httpClient(app))
    .post("/api/debts")
    .set(bearer(token))
    .send(body)
    .expect(201);
  return response.body;
};

export const createPosition = async (
  app: INestApplication,
  token: string,
  body: Record<string, unknown>,
): Promise<Record<string, any>> => {
  const response = await request(httpClient(app))
    .post("/api/positions")
    .set(bearer(token))
    .send(body)
    .expect(201);
  return response.body;
};
