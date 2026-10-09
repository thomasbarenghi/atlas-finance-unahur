import { AiService } from "../../src/shared/ai/ai.service";
import request from "supertest";
import { bearer, registerUser } from "../utils/auth";
import {
  aiStub,
  enableAssistant,
  postAssistantMessage,
} from "../utils/assistant";
import { truncateAll } from "../utils/db";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * FR-IA-014 — Conservar el historial de conversaciones en modo en vivo en el
 * servidor; el usuario podrá eliminarlo.
 */
describe("FR-IA-014 · Persistencia del historial", () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp((builder) =>
      builder
        .overrideProvider(AiService)
        .useValue(aiStub([[{ type: "token", delta: "respuesta" }]])),
    );
  });

  beforeEach(async () => {
    await truncateAll(ctx.dataSource);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it("persiste la conversación y permite borrar todo el historial", async () => {
    const user = await registerUser(ctx.app);
    await enableAssistant(ctx.app, user.accessToken);

    await postAssistantMessage(ctx.app, user.accessToken, {
      question: "¿Cómo vengo?",
    });

    const list = await request(ctx.server)
      .get("/api/assistant/conversations")
      .set(bearer(user.accessToken))
      .expect(200);
    expect(list.body.total).toBe(1);
    expect(list.body.items[0].question).toBe("¿Cómo vengo?");

    await request(ctx.server)
      .delete("/api/assistant/conversations")
      .set(bearer(user.accessToken))
      .expect(200);

    const after = await request(ctx.server)
      .get("/api/assistant/conversations")
      .set(bearer(user.accessToken))
      .expect(200);
    expect(after.body.total).toBe(0);
  });
});
