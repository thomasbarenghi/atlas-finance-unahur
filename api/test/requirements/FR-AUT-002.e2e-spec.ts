import request from "supertest";
import {
  authCookie,
  loginUser,
  refreshCookie,
  registerUser,
} from "../utils/auth";
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

  it("limpia las cookies al cerrar sesión", async () => {
    const user = await registerUser(ctx.app);

    const response = await request(ctx.server)
      .post("/api/auth/logout")
      .set(authCookie(user.accessToken))
      .expect(204);

    const cookies = (
      response.headers["set-cookie"] as unknown as string[]
    ).join(";");
    expect(cookies).toContain("access_token=;");
    expect(cookies).toContain("refresh_token=;");
  });

  it("mantiene el access token válido hasta expirar (JWT sin estado)", async () => {
    const user = await registerUser(ctx.app);

    await request(ctx.server)
      .post("/api/auth/logout")
      .set(authCookie(user.accessToken))
      .expect(204);

    await request(ctx.server)
      .get("/api/auth/me")
      .set(authCookie(user.accessToken))
      .expect(200);
  });

  it("renueva el access token con la cookie de refresh", async () => {
    const user = await registerUser(ctx.app);

    const refreshed = await request(ctx.server)
      .post("/api/auth/refresh")
      .set(refreshCookie(user.refreshToken))
      .expect(204);

    const cookies = (
      refreshed.headers["set-cookie"] as unknown as string[]
    ).join(";");
    expect(cookies).toContain("access_token=");
    expect(cookies).toContain("refresh_token=");
  });

  it("rechaza refresh sin cookie", async () => {
    const response = await request(ctx.server)
      .post("/api/auth/refresh")
      .expect(401);

    expect(response.body.code).toBe("SESSION_REVOKED");
  });
});
