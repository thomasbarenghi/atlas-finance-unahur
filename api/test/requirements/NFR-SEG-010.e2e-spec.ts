import request from "supertest";
import { truncateAll } from "../utils/db";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * NFR-SEG-010 — Aplicar límites de frecuencia (rate limiting) en login.
 */
describe("NFR-SEG-010 · Rate limiting de login", () => {
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

  it("bloquea con 429 tras superar el límite de intentos de login", async () => {
    const attempt = () =>
      request(ctx.server)
        .post("/api/auth/login")
        .send({ email: "nadie@test.local", password: "Secreta123" });

    const first = await attempt();
    expect(first.status).toBe(401);

    // El límite del endpoint de login es 5/min.
    let lastStatus = first.status;
    for (let i = 0; i < 6; i += 1) {
      lastStatus = (await attempt()).status;
    }
    expect(lastStatus).toBe(429);
  });
});
