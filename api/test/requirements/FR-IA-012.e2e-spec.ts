import { AiService } from "../../src/shared/ai/ai.service";
import type { AiStreamChunk } from "../../src/shared/ai/ai.service";
import request from "supertest";
import { bearer, registerUser } from "../utils/auth";
import {
  aiStub,
  enableAssistant,
  parseSse,
  postAssistantMessage,
} from "../utils/assistant";
import { truncateAll } from "../utils/db";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * FR-IA-012 — Toda acción de escritura propuesta por el asistente requiere
 * confirmación explícita con token de un solo uso.
 */
describe("FR-IA-012 · Confirmación de acciones", () => {
  let ctx: TestContext;

  beforeAll(async () => {
    const toolCall: AiStreamChunk[] = [
      {
        type: "tool_calls",
        toolCalls: [
          {
            id: "call-1",
            type: "function",
            function: {
              name: "createAccount",
              arguments: JSON.stringify({
                name: "Banco asistente",
                type: "bank",
                currency: "ARS",
                initialBalance: 0,
              }),
            },
          },
        ],
      },
    ];
    const text: AiStreamChunk[] = [
      { type: "token", delta: "Listo, confirmá la acción." },
    ];

    ctx = await createTestApp((builder) =>
      builder
        .overrideProvider(AiService)
        .useValue(aiStub([toolCall, text, toolCall, text])),
    );
  });

  beforeEach(async () => {
    await truncateAll(ctx.dataSource);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it("propone la acción y solo la ejecuta al confirmarla con el token", async () => {
    const user = await registerUser(ctx.app);
    await enableAssistant(ctx.app, user.accessToken);

    const stream = await postAssistantMessage(ctx.app, user.accessToken, {});
    const proposal = parseSse(stream.text).find(
      (e) => e.event === "action_proposal",
    );
    expect(proposal).toBeDefined();
    expect(proposal?.data.name).toBe("createAccount");
    expect(typeof proposal?.data.token).toBe("string");

    // Antes de confirmar no existe la cuenta.
    const before = await request(ctx.server)
      .get("/api/accounts")
      .set(bearer(user.accessToken))
      .expect(200);
    expect(before.body).toHaveLength(0);

    const confirmed = await request(ctx.server)
      .post(`/api/assistant/actions/${proposal?.data.actionId}/confirm`)
      .set(bearer(user.accessToken))
      .send({ token: proposal?.data.token })
      .expect(201);
    expect(confirmed.body.status).toBe("executed");

    const after = await request(ctx.server)
      .get("/api/accounts")
      .set(bearer(user.accessToken))
      .expect(200);
    expect(after.body.map((a: { name: string }) => a.name)).toContain(
      "Banco asistente",
    );

    // El token es de un solo uso.
    const again = await request(ctx.server)
      .post(`/api/assistant/actions/${proposal?.data.actionId}/confirm`)
      .set(bearer(user.accessToken))
      .send({ token: proposal?.data.token });
    expect(again.status).toBe(409);
    expect(again.body.code).toBe("ACTION_ALREADY_EXECUTED");
  });

  it("rechaza la confirmación con un token inválido", async () => {
    const user = await registerUser(ctx.app);
    await enableAssistant(ctx.app, user.accessToken);

    const stream = await postAssistantMessage(ctx.app, user.accessToken, {});
    const proposal = parseSse(stream.text).find(
      (e) => e.event === "action_proposal",
    );

    const rejected = await request(ctx.server)
      .post(`/api/assistant/actions/${proposal?.data.actionId}/confirm`)
      .set(bearer(user.accessToken))
      .send({ token: "token-invalido" });
    expect(rejected.status).toBe(403);
    expect(rejected.body.code).toBe("ACTION_NOT_ALLOWED");
  });
});
