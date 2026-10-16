import request from "supertest";
import { bearer, registerUser } from "../utils/auth";
import { truncateAll } from "../utils/db";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * FR-CUE-002 — Registrar nombre, tipo, saldo inicial y observaciones opcionales.
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
        initialBalance: 50000,
        notes: "Efectivo de casa",
      })
      .expect(201);

    expect(response.body).toMatchObject({
      name: "Caja",
      type: "cash",
      initialBalance: 50000,
      currentBalance: 50000,
      notes: "Efectivo de casa",
    });
    expect(typeof response.body.createdAt).toBe("string");
  });

  it("usa saldo inicial 0 y notas nulas por defecto", async () => {
    const user = await registerUser(ctx.app);

    const response = await request(ctx.server)
      .post("/api/accounts")
      .set(bearer(user.accessToken))
      .send({ name: "Caja", type: "cash" })
      .expect(201);

    expect(response.body.initialBalance).toBe(0);
    expect(response.body.notes).toBeNull();
  });

  it("rechaza un nombre vacío", async () => {
    const user = await registerUser(ctx.app);

    await request(ctx.server)
      .post("/api/accounts")
      .set(bearer(user.accessToken))
      .send({ name: "", type: "cash" })
      .expect(400);
  });

  it("rechaza un saldo inicial que no es número", async () => {
    const user = await registerUser(ctx.app);

    await request(ctx.server)
      .post("/api/accounts")
      .set(bearer(user.accessToken))
      .send({ name: "Caja", type: "cash", initialBalance: "mil" })
      .expect(400);
  });
});
