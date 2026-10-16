import { ErrorCode } from "../common/errors/error-codes";
import { AssistantService } from "./assistant.service";

const asyncTokens = (tokens: string[]) =>
  (async function* () {
    for (const delta of tokens) yield { type: "token" as const, delta };
  })();

const build = () => {
  const usersService = {
    findByEmail: jest.fn().mockResolvedValue({ id: "dev-user" }),
  };
  const contextService = {
    build: jest.fn().mockResolvedValue({
      period: { from: "2026-03-01", to: "2026-03-31" },
      currency: "ARS",
      sources: ["transactions", "accounts", "categories"],
      summary: "Ingresos del período: 1000.",
    }),
  };
  const aiService = {
    streamChat: jest.fn().mockReturnValue(asyncTokens(["Hola ", "mundo"])),
  };
  const config = {
    get: jest.fn((key: string) =>
      key === "nodeEnv" ? "development" : { devUserEmail: "demo@test.app" },
    ),
  };

  const service = new AssistantService(
    usersService as any,
    contextService as any,
    aiService as any,
    config as any,
  );
  return { service, usersService, contextService, aiService };
};

describe("AssistantService", () => {
  it("resolves the authenticated user when present", async () => {
    const { service } = build();
    await expect(service.resolveUserId("u1")).resolves.toBe("u1");
  });

  it("falls back to the dev user outside production", async () => {
    const { service } = build();
    await expect(service.resolveUserId()).resolves.toBe("dev-user");
  });

  it("rejects an unauthenticated call in production", async () => {
    const { service } = build();
    const config = (service as any).config;
    config.get.mockReturnValue("production");
    await expect(service.resolveUserId()).rejects.toMatchObject({
      response: { code: ErrorCode.UNAUTHENTICATED },
    });
  });

  it("streams meta, tokens and done", async () => {
    const { service, contextService } = build();
    const events = [];
    for await (const event of service.answer("u1", {
      question: "¿Cómo van mis gastos?",
    } as any)) {
      events.push(event);
    }

    expect(contextService.build).toHaveBeenCalled();
    expect(events[0]).toMatchObject({
      type: "meta",
      data: { currency: "ARS" },
    });
    expect(events).toEqual(
      expect.arrayContaining([{ type: "token", data: { delta: "Hola " } }]),
    );
    expect(events.at(-1)).toEqual({
      type: "done",
      data: { insufficient: false },
    });
  });

  it("declares insufficiency when the model returns no text", async () => {
    const { service, aiService } = build();
    aiService.streamChat.mockReturnValue(asyncTokens([]));

    const events = [];
    for await (const event of service.answer("u1", {
      question: "¿Algo?",
    } as any)) {
      events.push(event);
    }

    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "token",
          data: {
            delta:
              "No tengo datos suficientes para responder con información verificable.",
          },
        }),
      ]),
    );
    expect(events.at(-1)).toEqual({
      type: "done",
      data: { insufficient: true },
    });
  });
});
