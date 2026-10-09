import request from "supertest";
import { bearer, registerUser } from "../utils/auth";
import { createCategory } from "../utils/factories";
import { seedSystemCategories, truncateAll } from "../utils/db";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * FR-TRX-008 — Crear, editar y archivar categorías personalizadas.
 */
describe("FR-TRX-008 · Categorías personalizadas", () => {
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

  it("crea, lista, edita y archiva una categoría propia", async () => {
    const user = await registerUser(ctx.app);
    const category = await createCategory(ctx.app, user.accessToken, {
      name: "Mascotas",
    });
    expect(category).toMatchObject({
      name: "Mascotas",
      type: "expense",
      isSystem: false,
    });

    const updated = await request(ctx.server)
      .patch(`/api/categories/${category.id}`)
      .set(bearer(user.accessToken))
      .send({ name: "Mascotas y vet", color: "#0ea5e9" })
      .expect(200);
    expect(updated.body.name).toBe("Mascotas y vet");

    const archived = await request(ctx.server)
      .post(`/api/categories/${category.id}/archive`)
      .set(bearer(user.accessToken))
      .expect(201);
    expect(archived.body.archived).toBe(true);
  });

  it("rechaza un color o tipo inválido", async () => {
    const user = await registerUser(ctx.app);

    await request(ctx.server)
      .post("/api/categories")
      .set(bearer(user.accessToken))
      .send({ name: "X", type: "expense", color: "rojo" })
      .expect(400);
    await request(ctx.server)
      .post("/api/categories")
      .set(bearer(user.accessToken))
      .send({ name: "X", type: "transfer", color: "#ef4444" })
      .expect(400);
  });

  it("no permite editar ni archivar categorías del sistema", async () => {
    await seedSystemCategories(ctx.dataSource);
    const user = await registerUser(ctx.app);

    const rows: Array<{ id: string }> = await ctx.dataSource.query(
      `SELECT id FROM categories WHERE user_id IS NULL AND name = 'food'`,
    );
    const systemId = rows[0].id;

    const list = await request(ctx.server)
      .get("/api/categories")
      .set(bearer(user.accessToken))
      .expect(200);
    expect(
      list.body.find((c: { id: string }) => c.id === systemId).isSystem,
    ).toBe(true);

    await request(ctx.server)
      .patch(`/api/categories/${systemId}`)
      .set(bearer(user.accessToken))
      .send({ name: "Hackeada" })
      .expect(403);
    await request(ctx.server)
      .post(`/api/categories/${systemId}/archive`)
      .set(bearer(user.accessToken))
      .expect(403);
  });
});
