import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { httpClient } from "./test-app";
import { bearer } from "./auth";

/**
 * Typed factories that create domain data through the public API. They are used
 * as arrange-helpers by the requirement specs, so the setup itself exercises the
 * real endpoints. Categories are a fixed system catalog, so they are read
 * (never created).
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
      initialBalance: 1000,
      ...overrides,
    })
    .expect(201);
  return response.body;
};

export const listCategories = async (
  app: INestApplication,
  token: string,
): Promise<Record<string, any>[]> => {
  const response = await request(httpClient(app))
    .get("/api/categories")
    .set(bearer(token))
    .expect(200);
  return response.body;
};

export const categoryByName = async (
  app: INestApplication,
  token: string,
  name: string,
): Promise<Record<string, any>> => {
  const categories = await listCategories(app, token);
  const category = categories.find((item) => item.name === name);
  if (!category) throw new Error(`Missing test category: ${name}`);
  return category;
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
