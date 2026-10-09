import request from "supertest";
import { registerUser } from "../utils/auth";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * FR-AUT-004 — Toda pantalla financiera requerirá una sesión válida y el
 * servidor validará la autorización en cada operación.
 */
describe("FR-AUT-004 · Sesión requerida y autorización por request", () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  const protectedRoutes: Array<[string, string]> = [
    ["get", "/api/accounts"],
    ["get", "/api/categories"],
    ["get", "/api/transactions"],
    ["get", "/api/budgets"],
    ["get", "/api/goals"],
    ["get", "/api/assets"],
    ["get", "/api/debts"],
    ["get", "/api/positions"],
    ["get", "/api/quotes"],
    ["get", "/api/dashboard"],
    ["get", "/api/reports/summary"],
    ["get", "/api/assistant/conversations"],
    ["get", "/api/auth/me"],
  ];

  it.each(protectedRoutes)(
    "exige sesión en %s %s (401 UNAUTHENTICATED)",
    async (method, path) => {
      const response = await request(ctx.server)
        [method as "get"](path)
        .expect(401);
      expect(response.body.code).toBe("UNAUTHENTICATED");
    },
  );

  it("rechaza un token inválido", async () => {
    await request(ctx.server)
      .get("/api/accounts")
      .set({ Authorization: "Bearer token.invalido.xxx" })
      .expect(401);
  });

  it("permite el acceso con un token válido", async () => {
    const user = await registerUser(ctx.app);
    await request(ctx.server)
      .get("/api/accounts")
      .set({ Authorization: `Bearer ${user.accessToken}` })
      .expect(200);
  });

  it("expone públicos solo los endpoints de auth y salud", async () => {
    await request(ctx.server).get("/api/health").expect(200);
    await request(ctx.server)
      .post("/api/auth/login")
      .send({ email: "x@test.local", password: "Secreta123" })
      .expect(401);
  });
});
