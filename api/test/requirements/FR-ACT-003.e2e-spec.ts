import request from "supertest";
import { bearer, registerUser } from "../utils/auth";
import { truncateAll } from "../utils/db";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * FR-ACT-003 — Registrar nombre, tipo, moneda, valor, fecha de valuación y notas.
 */
describe("FR-ACT-003 · Campos de activo, deuda y posición", () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  beforeEach(async () => {
    await truncateAll(ctx.dataSource);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it("crea un activo con su valuación inicial", async () => {
    const user = await registerUser(ctx.app);
    const response = await request(ctx.server)
      .post("/api/assets")
      .set(bearer(user.accessToken))
      .send({
        name: "Depto",
        type: "property",
        currency: "ARS",
        initialValue: 90000000,
        date: "2026-03-01",
        notes: "3 ambientes",
      })
      .expect(201);

    expect(response.body).toMatchObject({
      name: "Depto",
      type: "property",
      currency: "ARS",
      currentValue: 90000000,
      valuationDate: "2026-03-01",
      debtId: null,
      notes: "3 ambientes",
      archived: false,
    });
  });

  it("crea una deuda con sus campos", async () => {
    const user = await registerUser(ctx.app);
    const response = await request(ctx.server)
      .post("/api/debts")
      .set(bearer(user.accessToken))
      .send({
        name: "Hipoteca",
        type: "mortgage",
        balance: 45000000,
        currency: "ARS",
        date: "2026-03-01",
      })
      .expect(201);

    expect(response.body).toMatchObject({
      name: "Hipoteca",
      type: "mortgage",
      balance: 45000000,
      currency: "ARS",
      date: "2026-03-01",
      assetId: null,
      archived: false,
    });
  });

  it("crea una posición con sus campos", async () => {
    const user = await registerUser(ctx.app);
    const response = await request(ctx.server)
      .post("/api/positions")
      .set(bearer(user.accessToken))
      .send({
        symbol: "BTC",
        instrument: "Bitcoin",
        quantity: 0.05,
        avgCost: 55000,
        currency: "USD",
      })
      .expect(201);

    expect(response.body).toMatchObject({
      symbol: "BTC",
      instrument: "Bitcoin",
      quantity: 0.05,
      avgCost: 55000,
      currency: "USD",
      costBasis: 2750,
    });
  });

  it("rechaza valores negativos", async () => {
    const user = await registerUser(ctx.app);
    await request(ctx.server)
      .post("/api/assets")
      .set(bearer(user.accessToken))
      .send({
        name: "X",
        type: "other",
        currency: "ARS",
        initialValue: -1,
        date: "2026-03-01",
      })
      .expect(400);
    await request(ctx.server)
      .post("/api/positions")
      .set(bearer(user.accessToken))
      .send({
        symbol: "BTC",
        instrument: "Bitcoin",
        quantity: -1,
        avgCost: 1,
        currency: "USD",
      })
      .expect(400);
  });
});
