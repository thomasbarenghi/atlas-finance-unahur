import { AssistantService } from "./assistant.service";

const asyncTokens = (tokens: string[]) =>
  (async function* () {
    for (const delta of tokens) yield { type: "token" as const, delta };
  })();

const build = () => {
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

  const service = new AssistantService(contextService as any, aiService as any);
  return { service, contextService, aiService };
};

describe("AssistantService", () => {
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

  it("forwards the conversation history before the current question", async () => {
    const { service, aiService } = build();
    const events = [];
    for await (const event of service.answer("u1", {
      question: "¿Y lo del auto?",
      history: [
        {
          role: "user",
          content: "¿Es inteligente comprar un auto por 2.750.000?",
        },
        { role: "assistant", content: "Equivale al 97% de tu patrimonio." },
      ],
    } as any)) {
      events.push(event);
    }

    const messages = aiService.streamChat.mock.calls[0][0] as {
      role: string;
      content: string;
    }[];
    expect(messages.map((message) => message.role)).toEqual([
      "system",
      "user",
      "assistant",
      "user",
    ]);
    expect(messages[1].content).toContain("comprar un auto");
    expect(messages[2].content).toContain("97%");
    expect(messages[3].content).toContain("Pregunta: ¿Y lo del auto?");
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
