import request from "supertest";
import { bearer, registerUser } from "../utils/auth";
import { truncateAll } from "../utils/db";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * FR-CUE-002 — Registrar nombre, tipo, moneda, saldo inicial y observaciones
 * opcionales.
 */
describe("FR-CUE-002 · Campos de la cuenta", () => {
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

  it("registra todos los campos y devuelve el contrato esperado", async () => {
    const user = await registerUser(ctx.app);

    const response = await request(ctx.server)
      .post("/api/accounts")
      .set(bearer(user.accessToken))
      .send({
        name: "Caja",
        type: "cash",
        currency: "ARS",
        initialBalance: 50000,
        notes: "Efectivo de casa",
      })
      .expect(201);

    expect(response.body).toMatchObject({
      name: "Caja",
      type: "cash",
      currency: "ARS",
      initialBalance: 50000,
      currentBalance: 50000,
      archived: false,
      notes: "Efectivo de casa",
    });
    expect(typeof response.body.createdAt).toBe("string");
  });

  it("usa saldo inicial 0 y notas nulas por defecto", async () => {
    const user = await registerUser(ctx.app);

    const response = await request(ctx.server)
      .post("/api/accounts")
      .set(bearer(user.accessToken))
      .send({ name: "Caja", type: "cash", currency: "ARS" })
      .expect(201);

    expect(response.body.initialBalance).toBe(0);
    expect(response.body.notes).toBeNull();
  });

  it("rechaza una moneda con longitud distinta de 3", async () => {
    const user = await registerUser(ctx.app);

    await request(ctx.server)
      .post("/api/accounts")
      .set(bearer(user.accessToken))
      .send({ name: "Caja", type: "cash", currency: "ARSX" })
      .expect(400);
  });

  it("rechaza una moneda no soportada (BUG-1)", async () => {
    const user = await registerUser(ctx.app);

    const response = await request(ctx.server)
      .post("/api/accounts")
      .set(bearer(user.accessToken))
      .send({ name: "Caja", type: "cash", currency: "GBP" })
      .expect(400);

    expect(response.body.code).toBe("VALIDATION_ERROR");
    expect(response.body.fieldErrors.currency).toBeDefined();
  });

  it("rechaza un nombre vacío", async () => {
    const user = await registerUser(ctx.app);

    await request(ctx.server)
      .post("/api/accounts")
      .set(bearer(user.accessToken))
      .send({ name: "", type: "cash", currency: "ARS" })
      .expect(400);
  });

  it("rechaza un saldo inicial que no es número", async () => {
    const user = await registerUser(ctx.app);

    await request(ctx.server)
      .post("/api/accounts")
      .set(bearer(user.accessToken))
      .send({
        name: "Caja",
        type: "cash",
        currency: "ARS",
        initialBalance: "mil",
      })
      .expect(400);
  });
});
