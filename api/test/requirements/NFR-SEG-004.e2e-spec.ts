import request from "supertest";
import { authCookie, registerUser } from "../utils/auth";
import { truncateAll } from "../utils/db";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * NFR-SEG-004 — Cookies HttpOnly/Secure/SameSite y renovación del access token.
 */
describe("NFR-SEG-004 · Cookies de sesión y renovación", () => {
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

  it("emite cookies HttpOnly con SameSite y Path", async () => {
    const user = await registerUser(ctx.app);
    const login = await request(ctx.server)
      .post("/api/auth/login")
      .send({ email: user.email, password: user.password })
      .expect(200);

    const cookies = (login.headers["set-cookie"] as unknown as string[]).join(
      ";",
    );
    expect(cookies).toContain("access_token=");
    expect(cookies).toContain("refresh_token=");
    expect(cookies).toContain("HttpOnly");
    expect(cookies).toContain("SameSite=Lax");
    expect(cookies).toContain("Path=/");
  });

  it("autentica usando solo la cookie", async () => {
    const login = await request(ctx.server)
      .post("/api/auth/register")
      .send({
        name: "Cookie",
        email: "cookie@test.local",
        password: "Secreta123",
      })
      .expect(201);

    const cookies = login.headers["set-cookie"] as unknown as string[];
    const me = await request(ctx.server)
      .get("/api/auth/me")
      .set("Cookie", cookies)
      .expect(200);
    expect(me.body.email).toBe("cookie@test.local");
  });

  it("renueva el access token usando la cookie de refresh", async () => {
    const login = await request(ctx.server)
      .post("/api/auth/register")
      .send({
        name: "Renew",
        email: "renew@test.local",
        password: "Secreta123",
      })
      .expect(201);

    const refreshCookie = (
      login.headers["set-cookie"] as unknown as string[]
    ).find((cookie) => cookie.startsWith("refresh_token="));
    expect(refreshCookie).toBeDefined();

    const renewed = await request(ctx.server)
      .post("/api/auth/refresh")
      .set("Cookie", [refreshCookie as string])
      .expect(204);

    const renewedCookies = (
      renewed.headers["set-cookie"] as unknown as string[]
    ).join(";");
    expect(renewedCookies).toContain("access_token=");
    expect(renewedCookies).toContain("refresh_token=");
  });

  it("rechaza un access token usado como refresh token", async () => {
    const user = await registerUser(ctx.app);

    await request(ctx.server)
      .post("/api/auth/refresh")
      .set(authCookie(user.accessToken))
      .expect(401);
  });
});
