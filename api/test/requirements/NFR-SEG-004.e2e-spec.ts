import request from "supertest";
import { registerUser } from "../utils/auth";
import { truncateAll } from "../utils/db";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * NFR-SEG-004 — Cookies HttpOnly/Secure/SameSite y rotación del refresh token.
 */
describe("NFR-SEG-004 · Cookies de sesión y rotación", () => {
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

  it("autentica usando solo la cookie (sin header Bearer)", async () => {
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

  it("rota el refresh token por cookie y rechaza el anterior", async () => {
    const login = await request(ctx.server)
      .post("/api/auth/register")
      .send({
        name: "Rotate",
        email: "rotate@test.local",
        password: "Secreta123",
      })
      .expect(201);

    const refreshCookie = (
      login.headers["set-cookie"] as unknown as string[]
    ).find((cookie) => cookie.startsWith("refresh_token="));
    expect(refreshCookie).toBeDefined();

    const rotated = await request(ctx.server)
      .post("/api/auth/refresh")
      .set("Cookie", [refreshCookie as string])
      .expect(200);
    expect(rotated.body.refreshToken).toBeDefined();

    // El refresh viejo ya no sirve.
    const previousRefresh = login.body.refreshToken as string;
    await request(ctx.server)
      .post("/api/auth/refresh")
      .send({ refreshToken: previousRefresh })
      .expect(401);
  });
});
