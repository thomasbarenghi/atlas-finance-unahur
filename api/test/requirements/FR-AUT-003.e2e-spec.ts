import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { MailService } from "../../src/shared/mail/mail.service";
import { loginUser, registerUser } from "../utils/auth";
import { truncateAll } from "../utils/db";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * FR-AUT-003 — El usuario podrá solicitar recuperación de contraseña mediante un
 * enlace de uso limitado.
 */
describe("FR-AUT-003 · Recuperación de contraseña", () => {
  let ctx: TestContext;
  let app: INestApplication;
  const mails: Array<{ email: string; token: string }> = [];

  beforeAll(async () => {
    ctx = await createTestApp((builder) =>
      builder.overrideProvider(MailService).useValue({
        sendPasswordReset: (email: string, token: string) => {
          mails.push({ email, token });
          return Promise.resolve();
        },
      }),
    );
    app = ctx.app;
  });

  beforeEach(async () => {
    mails.length = 0;
    await truncateAll(ctx.dataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  const requestReset = async (email: string): Promise<void> => {
    await request(ctx.server)
      .post("/api/auth/forgot-password")
      .send({ email })
      .expect(204);
  };

  it("no revela si el email existe (204 en ambos casos)", async () => {
    await request(ctx.server)
      .post("/api/auth/forgot-password")
      .send({ email: "noexiste@test.local" })
      .expect(204);

    expect(mails).toHaveLength(0);
  });

  it("envía un enlace de un solo uso y permite resetear la contraseña", async () => {
    const user = await registerUser(ctx.app);
    await requestReset(user.email);
    expect(mails).toHaveLength(1);

    const token = mails[0].token;

    await request(ctx.server)
      .post("/api/auth/reset-password")
      .send({ token, password: "Nueva1234" })
      .expect(204);

    const session = await loginUser(ctx.app, user.email, "Nueva1234");
    expect(session.accessToken).toBeDefined();

    // El token es de un solo uso.
    await request(ctx.server)
      .post("/api/auth/reset-password")
      .send({ token, password: "Otra12345" })
      .expect(400);
  });

  it("invalida las sesiones previas al resetear la contraseña", async () => {
    const user = await registerUser(ctx.app);
    await requestReset(user.email);

    await request(ctx.server)
      .post("/api/auth/reset-password")
      .send({ token: mails[0].token, password: "Nueva1234" })
      .expect(204);

    await request(ctx.server)
      .get("/api/auth/me")
      .set({ Authorization: `Bearer ${user.accessToken}` })
      .expect(401);
  });

  it("rechaza un token inválido", async () => {
    const response = await request(ctx.server)
      .post("/api/auth/reset-password")
      .send({ token: "token-invalido", password: "Nueva1234" })
      .expect(400);

    expect(response.body.code).toBe("VALIDATION_ERROR");
  });

  it("aplica la política de contraseña al resetear", async () => {
    const user = await registerUser(ctx.app);
    await requestReset(user.email);

    await request(ctx.server)
      .post("/api/auth/reset-password")
      .send({ token: mails[0].token, password: "sololetras" })
      .expect(400);
  });
});
