import request from "supertest";
import { bearer, registerUser } from "../utils/auth";
import { createAsset } from "../utils/factories";
import { MISSING_UUID, truncateAll } from "../utils/db";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * FR-ACT-004 — Mantener historial de valuaciones manuales sin sobrescribir las
 * anteriores.
 */
describe("FR-ACT-004 · Historial de valuaciones", () => {
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

  it("agrega valuaciones y usa la más reciente como vigente", async () => {
    const user = await registerUser(ctx.app);
    const asset = await createAsset(ctx.app, user.accessToken, {
      name: "Depto",
      type: "property",
      currency: "ARS",
      initialValue: 100,
      date: "2026-01-01",
    });

    await request(ctx.server)
      .post(`/api/assets/${asset.id}/valuations`)
      .set(bearer(user.accessToken))
      .send({ value: 200, currency: "ARS", date: "2026-02-01" })
      .expect(201);
    await request(ctx.server)
      .post(`/api/assets/${asset.id}/valuations`)
      .set(bearer(user.accessToken))
      .send({ value: 300, currency: "ARS", date: "2026-03-01" })
      .expect(201);

    const history = await request(ctx.server)
      .get(`/api/assets/${asset.id}/valuations`)
      .set(bearer(user.accessToken))
      .expect(200);
    expect(history.body).toHaveLength(3);

    const detail = await request(ctx.server)
      .get(`/api/assets/${asset.id}`)
      .set(bearer(user.accessToken))
      .expect(200);
    expect(detail.body.currentValue).toBe(300);
    expect(detail.body.valuationDate).toBe("2026-03-01");
  });

  it("exige que el activo exista para listar o crear valuaciones", async () => {
    const user = await registerUser(ctx.app);
    await request(ctx.server)
      .get(`/api/assets/${MISSING_UUID}/valuations`)
      .set(bearer(user.accessToken))
      .expect(404);
    await request(ctx.server)
      .post(`/api/assets/${MISSING_UUID}/valuations`)
      .set(bearer(user.accessToken))
      .send({ value: 1, currency: "ARS", date: "2026-03-01" })
      .expect(404);
  });
});
