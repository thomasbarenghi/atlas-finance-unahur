import request from "supertest";
import { authCookie, loginUser, registerUser } from "../utils/auth";
import { truncateAll } from "../utils/db";
import { createTestApp, TestContext } from "../utils/test-app";

describe("FR-CFG-002 · Perfil y credenciales", () => {
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

  it("actualiza el nombre y normaliza el correo", async () => {
    const user = await registerUser(ctx.app);

    const response = await request(ctx.server)
      .patch("/api/users/me")
      .set(authCookie(user.accessToken))
      .send({ name: "Ana Actualizada", email: "  NUEVA@TEST.LOCAL  " })
      .expect(200);

    expect(response.body).toMatchObject({
      name: "Ana Actualizada",
      email: "nueva@test.local",
    });

    const session = await loginUser(ctx.app, "nueva@test.local", user.password);
    expect(session.user.id).toBe(user.id);
  });

  it("rechaza un correo ya registrado por otro usuario", async () => {
    const first = await registerUser(ctx.app);
    const second = await registerUser(ctx.app);

    const response = await request(ctx.server)
      .patch("/api/users/me")
      .set(authCookie(first.accessToken))
      .send({ email: second.email })
      .expect(409);

    expect(response.body).toMatchObject({
      code: "EMAIL_IN_USE",
      fieldErrors: { email: ["Ese email ya está registrado"] },
    });
  });

  it("rechaza un correo con formato inválido", async () => {
    const user = await registerUser(ctx.app);

    const response = await request(ctx.server)
      .patch("/api/users/me")
      .set(authCookie(user.accessToken))
      .send({ email: "no-es-un-email" })
      .expect(400);

    expect(response.body.code).toBe("VALIDATION_ERROR");
    expect(response.body.fieldErrors.email).toBeDefined();
  });

  it("cambia la contraseña y permite iniciar sesión con la nueva", async () => {
    const user = await registerUser(ctx.app);

    await request(ctx.server)
      .patch("/api/users/me/password")
      .set(authCookie(user.accessToken))
      .send({ currentPassword: user.password, newPassword: "Nueva123" })
      .expect(204);

    await request(ctx.server)
      .post("/api/auth/login")
      .send({ email: user.email, password: user.password })
      .expect(401);

    const session = await loginUser(ctx.app, user.email, "Nueva123");
    expect(session.user.id).toBe(user.id);
  });

  it("rechaza el cambio si la contraseña actual no coincide", async () => {
    const user = await registerUser(ctx.app);

    const response = await request(ctx.server)
      .patch("/api/users/me/password")
      .set(authCookie(user.accessToken))
      .send({ currentPassword: "incorrecta123", newPassword: "Nueva123" })
      .expect(400);

    expect(response.body).toMatchObject({
      code: "VALIDATION_ERROR",
      fieldErrors: { currentPassword: ["La contraseña actual no es correcta"] },
    });
  });

  it("valida la política de la contraseña nueva", async () => {
    const user = await registerUser(ctx.app);

    const response = await request(ctx.server)
      .patch("/api/users/me/password")
      .set(authCookie(user.accessToken))
      .send({ currentPassword: user.password, newPassword: "corta" })
      .expect(400);

    expect(response.body.code).toBe("VALIDATION_ERROR");
    expect(response.body.fieldErrors.newPassword).toBeDefined();
  });
});
