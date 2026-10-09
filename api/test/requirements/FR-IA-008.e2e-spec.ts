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
 * FR-IA-008 — Mostrar que la respuesta es informativa y no constituye
 * asesoramiento financiero.
 */
describe("FR-IA-008 · Aviso informativo", () => {
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

  it("incluye el disclaimer de no-asesoramiento en el evento meta", async () => {
    const user = await registerUser(ctx.app);
    await enableAssistant(ctx.app, user.accessToken);

    const response = await postAssistantMessage(ctx.app, user.accessToken, {});
    const meta = parseSse(response.text).find((e) => e.event === "meta");

    expect(meta?.data.disclaimer).toMatch(/no constituye asesoramiento/i);
  });
});
