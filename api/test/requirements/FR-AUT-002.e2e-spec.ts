import request from "supertest";
import { loginUser, registerUser } from "../utils/auth";
import { truncateAll } from "../utils/db";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * FR-AUT-002 — El usuario podrá iniciar y cerrar sesión; al cerrar se invalidará
 * la sesión activa.
 */
describe("FR-AUT-002 · Inicio y cierre de sesión", () => {
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

  it("inicia sesión con credenciales válidas", async () => {
    const user = await registerUser(ctx.app);
    const result = await loginUser(ctx.app, user.email, user.password);

    expect(result.user.id).toBe(user.id);
    expect(typeof result.accessToken).toBe("string");
    expect(typeof result.refreshToken).toBe("string");
  });

  it("rechaza credenciales inválidas con un error genérico 401", async () => {
    const user = await registerUser(ctx.app);

    const response = await request(ctx.server)
      .post("/api/auth/login")
      .send({ email: user.email, password: "incorrecta123" })
      .expect(401);

    expect(response.body.code).toBe("INVALID_CREDENTIALS");
  });

  it("no enumera usuarios: email inexistente y contraseña incorrecta responden igual", async () => {
    const user = await registerUser(ctx.app);

    const wrongPassword = await request(ctx.server)
      .post("/api/auth/login")
      .send({ email: user.email, password: "incorrecta123" })
      .expect(401);
    const unknownEmail = await request(ctx.server)
      .post("/api/auth/login")
      .send({ email: "nadie@test.local", password: "Secreta123" })
      .expect(401);

    expect(unknownEmail.body.code).toBe("INVALID_CREDENTIALS");
    expect(unknownEmail.body.message).toBe(wrongPassword.body.message);
  });

  it("invalida la sesión al cerrar sesión", async () => {
    const user = await registerUser(ctx.app);

    await request(ctx.server)
      .post("/api/auth/logout")
      .set({ Authorization: `Bearer ${user.accessToken}` })
      .expect(204);

    await request(ctx.server)
      .get("/api/auth/me")
      .set({ Authorization: `Bearer ${user.accessToken}` })
      .expect(401);
  });

  it("rota el refresh token e invalida el anterior", async () => {
    const user = await registerUser(ctx.app);

    const rotated = await request(ctx.server)
      .post("/api/auth/refresh")
      .send({ refreshToken: user.refreshToken })
      .expect(200);

    expect(rotated.body.accessToken).toBeDefined();
    expect(rotated.body.refreshToken).not.toBe(user.refreshToken);

    await request(ctx.server)
      .post("/api/auth/refresh")
      .send({ refreshToken: user.refreshToken })
      .expect(401);
  });

  it("rechaza refresh sin token", async () => {
    const response = await request(ctx.server)
      .post("/api/auth/refresh")
      .send({})
      .expect(401);

    expect(response.body.code).toBe("SESSION_REVOKED");
  });
});
