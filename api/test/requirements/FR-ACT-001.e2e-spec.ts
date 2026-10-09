import request from "supertest";
import { bearer, registerUser } from "../utils/auth";
import { createAsset } from "../utils/factories";
import { truncateAll } from "../utils/db";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * FR-ACT-001 — Crear activos de tipo propiedad, vehículo, efectivo, inversión,
 * criptoactivo u otro.
 */
describe("FR-ACT-001 · Tipos de activo", () => {
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

  it.each(["property", "vehicle", "cash", "investment", "crypto", "other"])(
    "crea un activo de tipo %s",
    async (type) => {
      const user = await registerUser(ctx.app);
      const asset = await createAsset(ctx.app, user.accessToken, {
        name: "Activo",
        type,
        currency: "ARS",
        initialValue: 1000,
        date: "2026-03-01",
      });
      expect(asset.type).toBe(type);
    },
  );

  it("rechaza un tipo de activo inválido", async () => {
    const user = await registerUser(ctx.app);

    const response = await request(ctx.server)
      .post("/api/assets")
      .set(bearer(user.accessToken))
      .send({
        name: "X",
        type: "yate",
        currency: "ARS",
        initialValue: 1,
        date: "2026-03-01",
      })
      .expect(400);
    expect(response.body.fieldErrors.type).toBeDefined();
  });
});
