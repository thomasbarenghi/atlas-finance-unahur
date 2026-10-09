import request from "supertest";
import { bearer, registerUser } from "../utils/auth";
import { createAsset, createDebt } from "../utils/factories";
import { truncateAll } from "../utils/db";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * FR-ACT-008 — Vincular una deuda con un activo, por ejemplo una hipoteca con
 * una propiedad.
 */
describe("FR-ACT-008 · Vínculo deuda ↔ activo", () => {
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

  it("vincula la deuda al activo y lo refleja en ambos lados", async () => {
    const user = await registerUser(ctx.app);
    const asset = await createAsset(ctx.app, user.accessToken, {
      name: "Depto",
      type: "property",
      currency: "ARS",
      initialValue: 100,
      date: "2026-03-01",
    });
    const debt = await createDebt(ctx.app, user.accessToken, {
      name: "Hipoteca",
      type: "mortgage",
      balance: 50,
      currency: "ARS",
      date: "2026-03-01",
      assetId: asset.id,
    });
    expect(debt.assetId).toBe(asset.id);

    const assetDetail = await request(ctx.server)
      .get(`/api/assets/${asset.id}`)
      .set(bearer(user.accessToken))
      .expect(200);
    expect(assetDetail.body.debtId).toBe(debt.id);
  });

  it("permite desvincular la deuda", async () => {
    const user = await registerUser(ctx.app);
    const asset = await createAsset(ctx.app, user.accessToken, {
      name: "Depto",
      type: "property",
      currency: "ARS",
      initialValue: 100,
      date: "2026-03-01",
    });
    const debt = await createDebt(ctx.app, user.accessToken, {
      name: "Hipoteca",
      type: "mortgage",
      balance: 50,
      currency: "ARS",
      date: "2026-03-01",
      assetId: asset.id,
    });

    await request(ctx.server)
      .patch(`/api/debts/${debt.id}`)
      .set(bearer(user.accessToken))
      .send({ assetId: null })
      .expect(200);

    const assetDetail = await request(ctx.server)
      .get(`/api/assets/${asset.id}`)
      .set(bearer(user.accessToken))
      .expect(200);
    expect(assetDetail.body.debtId).toBeNull();
  });
});
