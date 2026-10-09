import request from "supertest";
import { truncateAll } from "../utils/db";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * FR-AUT-001 — El visitante podrá registrarse con nombre, correo electrónico y
 * contraseña.
 */
describe("FR-AUT-001 · Registro de usuario", () => {
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

  it("registra un usuario y devuelve sesión sin exponer la contraseña", async () => {
    const response = await request(ctx.server)
      .post("/api/auth/register")
      .send({ name: "Ana", email: "ana@test.local", password: "Secreta123" })
      .expect(201);

    expect(response.body.user).toMatchObject({
      name: "Ana",
      email: "ana@test.local",
      baseCurrency: "ARS",
      aiEnabled: false,
      assistantDestructiveEnabled: false,
    });
    expect(response.body.user.id).toBeDefined();
    expect(response.body.user.passwordHash).toBeUndefined();
    expect(typeof response.body.accessToken).toBe("string");
    expect(typeof response.body.refreshToken).toBe("string");

    const setCookie = response.headers["set-cookie"] as unknown as string[];
    expect(setCookie.join(";")).toContain("access_token=");
    expect(setCookie.join(";")).toContain("refresh_token=");
  });

  it("persiste la contraseña hasheada (nunca en texto plano)", async () => {
    await request(ctx.server)
      .post("/api/auth/register")
      .send({ name: "Ana", email: "ana@test.local", password: "Secreta123" })
      .expect(201);

    const rows: Array<{ password_hash: string }> = await ctx.dataSource.query(
      `SELECT password_hash FROM users WHERE email = $1`,
      ["ana@test.local"],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].password_hash).not.toBe("Secreta123");
    expect(rows[0].password_hash.startsWith("$argon2")).toBe(true);
  });

  it("rechaza un email ya registrado con 409 EMAIL_IN_USE", async () => {
    await request(ctx.server)
      .post("/api/auth/register")
      .send({ name: "Ana", email: "ana@test.local", password: "Secreta123" })
      .expect(201);

    const response = await request(ctx.server)
      .post("/api/auth/register")
      .send({ name: "Otra", email: "ana@test.local", password: "Secreta123" })
      .expect(409);

    expect(response.body.code).toBe("EMAIL_IN_USE");
  });

  it("rechaza un email inválido con 400 y fieldErrors", async () => {
    const response = await request(ctx.server)
      .post("/api/auth/register")
      .send({ name: "Ana", email: "no-es-email", password: "Secreta123" })
      .expect(400);

    expect(response.body.code).toBe("VALIDATION_ERROR");
    expect(response.body.fieldErrors.email).toBeDefined();
  });

  it("rechaza una contraseña sin número o demasiado corta", async () => {
    const response = await request(ctx.server)
      .post("/api/auth/register")
      .send({ name: "Ana", email: "ana@test.local", password: "sololetras" })
      .expect(400);

    expect(response.body.code).toBe("VALIDATION_ERROR");
    expect(response.body.fieldErrors.password).toBeDefined();
  });

  it("rechaza campos faltantes", async () => {
    await request(ctx.server)
      .post("/api/auth/register")
      .send({ email: "ana@test.local", password: "Secreta123" })
      .expect(400);
  });

  it("rechaza campos inesperados (forbidNonWhitelisted)", async () => {
    const response = await request(ctx.server)
      .post("/api/auth/register")
      .send({
        name: "Ana",
        email: "ana@test.local",
        password: "Secreta123",
        role: "admin",
      })
      .expect(400);

    expect(response.body.code).toBe("VALIDATION_ERROR");
  });
});
