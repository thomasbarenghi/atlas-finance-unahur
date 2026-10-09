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
 * FR-IA-002 — Aceptar preguntas en lenguaje natural sobre datos financieros
 * propios, respondiendo por streaming.
 */
describe("FR-IA-002 · Preguntas en lenguaje natural", () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp((builder) =>
      builder.overrideProvider(AiService).useValue(
        aiStub([
          [
            { type: "token", delta: "Hola " },
            { type: "token", delta: "mundo" },
          ],
        ]),
      ),
    );
  });

  beforeEach(async () => {
    await truncateAll(ctx.dataSource);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it("emite meta, tokens y done por SSE", async () => {
    const user = await registerUser(ctx.app);
    await enableAssistant(ctx.app, user.accessToken);

    const response = await postAssistantMessage(ctx.app, user.accessToken, {
      question: "¿En qué gasté más?",
    });
    expect(response.status).toBe(200);

    const events = parseSse(response.text);
    const types = events.map((e) => e.event);
    expect(types).toContain("meta");
    expect(types.filter((t) => t === "token")).toHaveLength(2);
    expect(types).toContain("done");

    const meta = events.find((e) => e.event === "meta");
    expect(meta?.data.conversationId).toBeDefined();
    expect(meta?.data.sources).toEqual(expect.any(Array));

    const done = events.find((e) => e.event === "done");
    expect(done?.data.insufficient).toBe(false);
  });
});
