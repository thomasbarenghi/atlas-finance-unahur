import request from "supertest";
import { bearer, registerUser } from "../utils/auth";
import { createAccount } from "../utils/factories";
import { MISSING_UUID, truncateAll } from "../utils/db";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * FR-CUE-003 — Editar y archivar cuentas propias.
 */
describe("FR-CUE-003 · Editar y archivar cuentas", () => {
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

  it("edita los campos de una cuenta propia", async () => {
    const user = await registerUser(ctx.app);
    const account = await createAccount(ctx.app, user.accessToken, {
      name: "Vieja",
      initialBalance: 100,
    });

    const response = await request(ctx.server)
      .patch(`/api/accounts/${account.id}`)
      .set(bearer(user.accessToken))
      .send({
        name: "Nueva",
        type: "bank",
        currency: "USD",
        initialBalance: 250,
        notes: "editada",
      })
      .expect(200);

    expect(response.body).toMatchObject({
      name: "Nueva",
      type: "bank",
      currency: "USD",
      initialBalance: 250,
      notes: "editada",
    });
  });

  it("archiva una cuenta propia", async () => {
    const user = await registerUser(ctx.app);
    const account = await createAccount(ctx.app, user.accessToken);

    const response = await request(ctx.server)
      .post(`/api/accounts/${account.id}/archive`)
      .set(bearer(user.accessToken))
      .expect(201);

    expect(response.body.archived).toBe(true);
  });

  it("rechaza editar una cuenta inexistente con 404", async () => {
    const user = await registerUser(ctx.app);

    await request(ctx.server)
      .patch(`/api/accounts/${MISSING_UUID}`)
      .set(bearer(user.accessToken))
      .send({ name: "X" })
      .expect(404);
  });

  it("rechaza un id que no es UUID", async () => {
    const user = await registerUser(ctx.app);

    await request(ctx.server)
      .patch("/api/accounts/not-a-uuid")
      .set(bearer(user.accessToken))
      .send({ name: "X" })
      .expect(400);
  });
});
