import request from "supertest";
import { bearer, registerUser } from "../utils/auth";
import { truncateAll, MISSING_UUID } from "../utils/db";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * FR-IA-009 — Permitir consultar y eliminar el historial de conversaciones
 * propias.
 */
describe("FR-IA-009 · Historial de conversaciones", () => {
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

  const insertConversation = async (userId: string): Promise<string> => {
    const rows: Array<{ id: string }> = await ctx.dataSource.query(
      `INSERT INTO ai_conversations (id, user_id, question, answer, context_meta, messages, created_at)
       VALUES (gen_random_uuid(), $1, '¿Gastos?', 'Respuesta', '{}'::jsonb, '[]'::jsonb, now())
       RETURNING id`,
      [userId],
    );
    return rows[0].id;
  };

  it("lista, consulta y elimina una conversación propia", async () => {
    const user = await registerUser(ctx.app);
    const conversationId = await insertConversation(user.id);

    const list = await request(ctx.server)
      .get("/api/assistant/conversations")
      .set(bearer(user.accessToken))
      .expect(200);
    expect(list.body.total).toBe(1);
    expect(list.body.items[0].id).toBe(conversationId);

    const detail = await request(ctx.server)
      .get(`/api/assistant/conversations/${conversationId}`)
      .set(bearer(user.accessToken))
      .expect(200);
    expect(detail.body.question).toBe("¿Gastos?");

    await request(ctx.server)
      .delete(`/api/assistant/conversations/${conversationId}`)
      .set(bearer(user.accessToken))
      .expect(200);

    const after = await request(ctx.server)
      .get("/api/assistant/conversations")
      .set(bearer(user.accessToken))
      .expect(200);
    expect(after.body.total).toBe(0);
  });

  it("no expone conversaciones de otro usuario", async () => {
    const alice = await registerUser(ctx.app);
    const bob = await registerUser(ctx.app);
    const conversationId = await insertConversation(alice.id);

    await request(ctx.server)
      .get(`/api/assistant/conversations/${conversationId}`)
      .set(bearer(bob.accessToken))
      .expect(404);
    await request(ctx.server)
      .delete(`/api/assistant/conversations/${conversationId}`)
      .set(bearer(bob.accessToken))
      .expect(404);
    await request(ctx.server)
      .get(`/api/assistant/conversations/${MISSING_UUID}`)
      .set(bearer(alice.accessToken))
      .expect(404);
  });
});
