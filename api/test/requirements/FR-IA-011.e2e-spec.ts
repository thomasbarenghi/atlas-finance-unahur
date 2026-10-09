import { AiService } from "../../src/shared/ai/ai.service";
import { registerUser } from "../utils/auth";
import {
  aiStub,
  enableAssistant,
  parseSse,
  postAssistantMessage,
} from "../utils/assistant";
import { truncateAll } from "../utils/db";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * FR-IA-011 — Responder que no hay información suficiente cuando los datos no
 * permitan una conclusión verificable.
 */
describe("FR-IA-011 · Información insuficiente", () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp((builder) =>
      builder.overrideProvider(AiService).useValue(aiStub([[]])),
    );
  });

  beforeEach(async () => {
    await truncateAll(ctx.dataSource);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it("marca insufficient=true cuando no hay respuesta verificable", async () => {
    const user = await registerUser(ctx.app);
    await enableAssistant(ctx.app, user.accessToken);

    const response = await postAssistantMessage(ctx.app, user.accessToken, {});
    const done = parseSse(response.text).find((e) => e.event === "done");

    expect(done?.data.insufficient).toBe(true);
  });
});
