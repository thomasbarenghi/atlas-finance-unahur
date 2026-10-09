import request from "supertest";
import { bearer, registerUser } from "../utils/auth";
import { createAccount, createCategory } from "../utils/factories";
import { truncateAll } from "../utils/db";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * NFR-SEG-002 — Validar entradas en límites, tipos, longitud y formato; rechazar
 * campos inesperados.
 */
describe("NFR-SEG-002 · Validación de entradas", () => {
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

  it("rechaza campos inesperados con forbidNonWhitelisted", async () => {
    const user = await registerUser(ctx.app);
    const response = await request(ctx.server)
      .post("/api/accounts")
      .set(bearer(user.accessToken))
      .send({
        name: "Caja",
        type: "cash",
        currency: "ARS",
        isAdmin: true,
      })
      .expect(400);

    expect(response.body.code).toBe("VALIDATION_ERROR");
  });

  it("rechaza tipos incorrectos", async () => {
    const user = await registerUser(ctx.app);
    await request(ctx.server)
      .post("/api/accounts")
      .set(bearer(user.accessToken))
      .send({ name: 123, type: "cash", currency: "ARS" })
      .expect(400);
  });

  it("rechaza un id de ruta que no es UUID", async () => {
    const user = await registerUser(ctx.app);
    await request(ctx.server)
      .get("/api/accounts/not-a-uuid")
      .set(bearer(user.accessToken))
      .expect(400);
  });

  it("rechaza un body vacío con fieldErrors", async () => {
    const user = await registerUser(ctx.app);
    const response = await request(ctx.server)
      .post("/api/accounts")
      .set(bearer(user.accessToken))
      .send({})
      .expect(400);

    expect(response.body.fieldErrors).toBeDefined();
    expect(response.body.fieldErrors.name).toBeDefined();
  });

  it("valida el formato de color y el largo del color en categorías", async () => {
    const user = await registerUser(ctx.app);
    await request(ctx.server)
      .post("/api/categories")
      .set(bearer(user.accessToken))
      .send({ name: "X", type: "expense", color: "#12345" })
      .expect(400);
  });

  it("normaliza los query params numéricos y valida sus límites", async () => {
    const user = await registerUser(ctx.app);
    await createAccount(ctx.app, user.accessToken);
    await createCategory(ctx.app, user.accessToken);

    await request(ctx.server)
      .get("/api/transactions?page=0")
      .set(bearer(user.accessToken))
      .expect(400);
    await request(ctx.server)
      .get("/api/transactions?pageSize=1000")
      .set(bearer(user.accessToken))
      .expect(400);
  });
});
