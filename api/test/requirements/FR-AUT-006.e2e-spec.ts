import request from "supertest";
import { bearer, registerUser } from "../utils/auth";
import { truncateAll } from "../utils/db";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * FR-AUT-006 — El usuario podrá seleccionar tema claro, oscuro o automático.
 */
describe("FR-AUT-006 · Tema de la interfaz", () => {
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

  it.each(["light", "dark", "system"])(
    "acepta el tema %s y lo persiste",
    async (theme) => {
      const user = await registerUser(ctx.app);

      const updated = await request(ctx.server)
        .patch("/api/users/me")
        .set(bearer(user.accessToken))
        .send({ theme })
        .expect(200);
      expect(updated.body.theme).toBe(theme);

      const me = await request(ctx.server)
        .get("/api/auth/me")
        .set(bearer(user.accessToken))
        .expect(200);
      expect(me.body.theme).toBe(theme);
    },
  );

  it("rechaza un tema inválido", async () => {
    const user = await registerUser(ctx.app);

    const response = await request(ctx.server)
      .patch("/api/users/me")
      .set(bearer(user.accessToken))
      .send({ theme: "neon" })
      .expect(400);

    expect(response.body.code).toBe("VALIDATION_ERROR");
    expect(response.body.fieldErrors.theme).toBeDefined();
  });
});
