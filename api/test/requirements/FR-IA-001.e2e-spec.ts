import { AiService } from "../../src/shared/ai/ai.service";
import { registerUser } from "../utils/auth";
import {
  aiStub,
  enableAssistant,
  postAssistantMessage,
} from "../utils/assistant";
import { truncateAll } from "../utils/db";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * FR-IA-001 — Permitir habilitar o deshabilitar el asistente de forma explícita.
 */
describe("FR-IA-001 · Habilitación del asistente", () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp((builder) =>
      builder
        .overrideProvider(AiService)
        .useValue(aiStub([[{ type: "token", delta: "ok" }]])),
    );
  });

  beforeEach(async () => {
    await truncateAll(ctx.dataSource);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it("rechaza con 403 AI_DISABLED cuando está deshabilitado", async () => {
    const user = await registerUser(ctx.app);

    const response = await postAssistantMessage(ctx.app, user.accessToken, {});
    expect(response.status).toBe(403);
    expect(response.body.code).toBe("AI_DISABLED");
  });

  it("responde cuando el usuario lo habilita", async () => {
    const user = await registerUser(ctx.app);
    await enableAssistant(ctx.app, user.accessToken);

    const response = await postAssistantMessage(ctx.app, user.accessToken, {});
    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("text/event-stream");
  });
});
