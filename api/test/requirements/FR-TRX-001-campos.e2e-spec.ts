import request from "supertest";
import { authCookie, registerUser } from "../utils/auth";
import {
  categoryByName,
  createAccount,
  createCategory,
  createTransaction,
  isoDate,
  listCategories,
} from "../utils/factories";
import { truncateAll } from "../utils/db";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * FR-TRX-001 — Registrar monto positivo, fecha, cuenta, categoría, descripción
 * y notas opcionales. Las categorías del sistema son fijas; cada usuario puede
 * crear las suyas y asignarlas a sus movimientos.
 */
describe("FR-TRX-001 · Campos del movimiento", () => {
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

  it("devuelve el contrato completo del movimiento", async () => {
    const user = await registerUser(ctx.app);
    const account = await createAccount(ctx.app, user.accessToken);
    const category = await categoryByName(
      ctx.app,
      user.accessToken,
      "Supermercado",
    );

    const created = await createTransaction(ctx.app, user.accessToken, {
      type: "expense",
      amount: 1200,
      date: "2026-03-10",
      description: "Supermercado",
      notes: "con tarjeta",
      accountId: account.id,
      categoryId: category.id,
    });

    expect(created).toMatchObject({
      type: "expense",
      amount: 1200,
      date: "2026-03-10",
      description: "Supermercado",
      notes: "con tarjeta",
      accountId: account.id,
      categoryId: category.id,
      transferAccountId: null,
      transferGroupId: null,
    });
  });

  it("permite omitir las notas", async () => {
    const user = await registerUser(ctx.app);
    const account = await createAccount(ctx.app, user.accessToken);
    const category = await categoryByName(
      ctx.app,
      user.accessToken,
      "Supermercado",
    );

    const created = await createTransaction(ctx.app, user.accessToken, {
      type: "expense",
      amount: 10,
      date: isoDate(),
      description: "Sin notas",
      accountId: account.id,
      categoryId: category.id,
    });
    expect(created.notes).toBeNull();
  });

  it("exige un monto mayor que cero", async () => {
    const user = await registerUser(ctx.app);
    const account = await createAccount(ctx.app, user.accessToken);
    const category = await categoryByName(
      ctx.app,
      user.accessToken,
      "Supermercado",
    );

    for (const amount of [0, -50]) {
      const response = await request(ctx.server)
        .post("/api/transactions")
        .set(authCookie(user.accessToken))
        .send({
          type: "expense",
          amount,
          date: isoDate(),
          description: "X",
          accountId: account.id,
          categoryId: category.id,
        })
        .expect(400);
      expect(response.body.fieldErrors.amount).toBeDefined();
    }
  });

  it("exige una categoría para ingresos y gastos", async () => {
    const user = await registerUser(ctx.app);
    const account = await createAccount(ctx.app, user.accessToken);

    const response = await request(ctx.server)
      .post("/api/transactions")
      .set(authCookie(user.accessToken))
      .send({
        type: "expense",
        amount: 10,
        date: isoDate(),
        description: "X",
        accountId: account.id,
      })
      .expect(400);
    expect(response.body.code).toBe("VALIDATION_ERROR");
  });

  it("rechaza una categoría inexistente", async () => {
    const user = await registerUser(ctx.app);
    const account = await createAccount(ctx.app, user.accessToken);

    await request(ctx.server)
      .post("/api/transactions")
      .set(authCookie(user.accessToken))
      .send({
        type: "expense",
        amount: 10,
        date: isoDate(),
        description: "X",
        accountId: account.id,
        categoryId: "00000000-0000-4000-8000-000000000000",
      })
      .expect(404);
  });

  it("rechaza una fecha con formato inválido", async () => {
    const user = await registerUser(ctx.app);
    const account = await createAccount(ctx.app, user.accessToken);
    const category = await categoryByName(
      ctx.app,
      user.accessToken,
      "Supermercado",
    );

    await request(ctx.server)
      .post("/api/transactions")
      .set(authCookie(user.accessToken))
      .send({
        type: "expense",
        amount: 10,
        date: "10/03/2026",
        description: "X",
        accountId: account.id,
        categoryId: category.id,
      })
      .expect(400);
  });

  it("crea una categoría propia y la asigna a un movimiento", async () => {
    const user = await registerUser(ctx.app);
    const account = await createAccount(ctx.app, user.accessToken);
    const category = await createCategory(ctx.app, user.accessToken, {
      name: "Mascotas",
      type: "expense",
      color: "#f97316",
    });

    expect(category).toMatchObject({
      name: "Mascotas",
      type: "expense",
      color: "#f97316",
      isSystem: false,
    });

    const created = await createTransaction(ctx.app, user.accessToken, {
      type: "expense",
      amount: 500,
      date: isoDate(),
      description: "Veterinaria",
      accountId: account.id,
      categoryId: category.id,
    });
    expect(created.categoryId).toBe(category.id);

    const categories = await listCategories(ctx.app, user.accessToken);
    expect(categories).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: category.id, isSystem: false }),
        expect.objectContaining({ name: "Sueldo", isSystem: true }),
      ]),
    );
  });

  it("rechaza nombres duplicados y categorías del tipo equivocado", async () => {
    const user = await registerUser(ctx.app);
    const account = await createAccount(ctx.app, user.accessToken);
    const income = await createCategory(ctx.app, user.accessToken, {
      name: "Extra",
      type: "income",
      color: "#22c55e",
    });

    const duplicate = await request(ctx.server)
      .post("/api/categories")
      .set(authCookie(user.accessToken))
      .send({ name: "extra", type: "income", color: "#22c55e" })
      .expect(400);
    expect(duplicate.body.fieldErrors.name).toBeDefined();

    await request(ctx.server)
      .post("/api/transactions")
      .set(authCookie(user.accessToken))
      .send({
        type: "expense",
        amount: 10,
        date: isoDate(),
        description: "Tipo equivocado",
        accountId: account.id,
        categoryId: income.id,
      })
      .expect(400);
  });

  it("edita y elimina una categoría propia", async () => {
    const user = await registerUser(ctx.app);
    const category = await createCategory(ctx.app, user.accessToken);

    const updated = await request(ctx.server)
      .patch(`/api/categories/${category.id}`)
      .set(authCookie(user.accessToken))
      .send({ name: "Mascotas y pets", color: "#111111" })
      .expect(200);
    expect(updated.body).toMatchObject({
      name: "Mascotas y pets",
      color: "#111111",
      type: "expense",
    });

    await request(ctx.server)
      .delete(`/api/categories/${category.id}`)
      .set(authCookie(user.accessToken))
      .expect(200);

    const categories = await listCategories(ctx.app, user.accessToken);
    expect(categories.find((item) => item.id === category.id)).toBeUndefined();
  });

  it("aísla las categorías propias y no toca las del sistema", async () => {
    const owner = await registerUser(ctx.app);
    const other = await registerUser(ctx.app);
    const category = await createCategory(ctx.app, owner.accessToken, {
      name: "Privada",
      type: "expense",
      color: "#ef4444",
    });
    const otherAccount = await createAccount(ctx.app, other.accessToken);

    await request(ctx.server)
      .post("/api/transactions")
      .set(authCookie(other.accessToken))
      .send({
        type: "expense",
        amount: 10,
        date: isoDate(),
        description: "Ajena",
        accountId: otherAccount.id,
        categoryId: category.id,
      })
      .expect(404);

    const otherCategories = await listCategories(ctx.app, other.accessToken);
    expect(
      otherCategories.find((item) => item.id === category.id),
    ).toBeUndefined();

    await request(ctx.server)
      .patch(`/api/categories/${category.id}`)
      .set(authCookie(other.accessToken))
      .send({ name: "Hack" })
      .expect(404);

    await request(ctx.server)
      .delete(`/api/categories/${category.id}`)
      .set(authCookie(other.accessToken))
      .expect(404);

    const systemCategory = await categoryByName(
      ctx.app,
      owner.accessToken,
      "Sueldo",
    );
    await request(ctx.server)
      .delete(`/api/categories/${systemCategory.id}`)
      .set(authCookie(owner.accessToken))
      .expect(404);
  });
});
