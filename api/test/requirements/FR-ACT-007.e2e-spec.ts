import request from "supertest";
import { bearer, registerUser } from "../utils/auth";
import { createAsset, createDebt, createPosition } from "../utils/factories";
import { MISSING_UUID, truncateAll } from "../utils/db";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * FR-ACT-007 — Editar y archivar activos, posiciones y deudas propias.
 */
describe("FR-ACT-007 · Editar y archivar patrimonio", () => {
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

  it("edita y archiva un activo", async () => {
    const user = await registerUser(ctx.app);
    const asset = await createAsset(ctx.app, user.accessToken, {
      name: "Depto",
      type: "property",
      currency: "ARS",
      initialValue: 100,
      date: "2026-03-01",
    });

    const updated = await request(ctx.server)
      .patch(`/api/assets/${asset.id}`)
      .set(bearer(user.accessToken))
      .send({ name: "Depto editado", type: "other", notes: "x" })
      .expect(200);
    expect(updated.body.name).toBe("Depto editado");

    const archived = await request(ctx.server)
      .post(`/api/assets/${asset.id}/archive`)
      .set(bearer(user.accessToken))
      .expect(201);
    expect(archived.body.archived).toBe(true);
  });

  it("edita, archiva, restaura y elimina una posición", async () => {
    const user = await registerUser(ctx.app);
    const position = await createPosition(ctx.app, user.accessToken, {
      symbol: "BTC",
      instrument: "Bitcoin",
      quantity: 1,
      avgCost: 100,
      currency: "USD",
    });

    const updated = await request(ctx.server)
      .patch(`/api/positions/${position.id}`)
      .set(bearer(user.accessToken))
      .send({ quantity: 2, avgCost: 150 })
      .expect(200);
    expect(updated.body.quantity).toBe(2);

    const archived = await request(ctx.server)
      .post(`/api/positions/${position.id}/archive`)
      .set(bearer(user.accessToken))
      .expect(201);
    expect(archived.body.archived).toBe(true);

    const restored = await request(ctx.server)
      .post(`/api/positions/${position.id}/restore`)
      .set(bearer(user.accessToken))
      .expect(201);
    expect(restored.body.archived).toBe(false);

    await request(ctx.server)
      .delete(`/api/positions/${position.id}`)
      .set(bearer(user.accessToken))
      .expect(200);
    const list = await request(ctx.server)
      .get("/api/positions")
      .set(bearer(user.accessToken))
      .expect(200);
    expect(list.body).toHaveLength(0);
  });

  it("edita y archiva una deuda", async () => {
    const user = await registerUser(ctx.app);
    const debt = await createDebt(ctx.app, user.accessToken, {
      name: "Hipoteca",
      type: "mortgage",
      balance: 1000,
      currency: "ARS",
      date: "2026-03-01",
    });

    const updated = await request(ctx.server)
      .patch(`/api/debts/${debt.id}`)
      .set(bearer(user.accessToken))
      .send({ balance: 800 })
      .expect(200);
    expect(updated.body.balance).toBe(800);

    const archived = await request(ctx.server)
      .post(`/api/debts/${debt.id}/archive`)
      .set(bearer(user.accessToken))
      .expect(201);
    expect(archived.body.archived).toBe(true);
  });

  it("responde 404 para recursos inexistentes", async () => {
    const user = await registerUser(ctx.app);
    await request(ctx.server)
      .patch(`/api/assets/${MISSING_UUID}`)
      .set(bearer(user.accessToken))
      .send({ name: "x" })
      .expect(404);
    await request(ctx.server)
      .patch(`/api/debts/${MISSING_UUID}`)
      .set(bearer(user.accessToken))
      .send({ balance: 1 })
      .expect(404);
    await request(ctx.server)
      .patch(`/api/positions/${MISSING_UUID}`)
      .set(bearer(user.accessToken))
      .send({ quantity: 1 })
      .expect(404);
  });
});
