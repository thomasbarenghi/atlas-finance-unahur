import { registerUser } from "../utils/auth";
import { truncateAll } from "../utils/db";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * NFR-SEG-003 — Almacenar contraseñas mediante un algoritmo de hash adaptativo
 * (argon2) y nunca en texto plano.
 */
describe("NFR-SEG-003 · Hash de contraseñas", () => {
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

  it("almacena argon2id y nunca el texto plano", async () => {
    await registerUser(ctx.app, {
      email: "hash@test.local",
      password: "Secreta123",
    });

    const rows: Array<{ password_hash: string }> = await ctx.dataSource.query(
      `SELECT password_hash FROM users WHERE email = $1`,
      ["hash@test.local"],
    );

    expect(rows[0].password_hash).toMatch(/^\$argon2(id|i|d)\$/);
    expect(rows[0].password_hash).not.toContain("Secreta123");
  });
});
