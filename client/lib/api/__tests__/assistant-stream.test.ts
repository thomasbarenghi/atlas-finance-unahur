import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

vi.hoisted(() => {
  process.env.NEXT_PUBLIC_API_URL = "http://localhost/api";
  process.env.NEXT_PUBLIC_USE_MOCKS = "false";
});

import { streamAssistantMessage } from "@/lib/api/assistant-stream";

beforeAll(() => {
  if (!globalThis.TextDecoder) {
    // jsdom provides TextDecoder; this guard keeps the intent explicit.
  }
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const sseResponse = (frames: string[]): Response =>
  new Response(frames.join(""), {
    status: 200,
    headers: { "Content-Type": "text/event-stream" },
  });

const meta = (conversationId = "c1") =>
  `event: meta\ndata: ${JSON.stringify({
    conversationId,
    period: { from: "2026-01-01", to: "2026-01-31" },
    currency: "ARS",
    sources: ["transactions"],
  })}\n\n`;

const token = (delta: string) =>
  `event: token\ndata: ${JSON.stringify({ delta })}\n\n`;

const done = (insufficient = false) =>
  `event: done\ndata: ${JSON.stringify({
    conversationId: "c1",
    insufficient,
  })}\n\n`;

describe("streamAssistantMessage (real SSE path)", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_USE_MOCKS = "false";
  });

  it("parses meta/token/done events in order", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        sseResponse([meta(), token("Hola "), token("mundo"), done()]),
      );
    vi.stubGlobal("fetch", fetchMock);

    const events: string[] = [];
    let answer = "";
    let conversationId = "";
    let insufficient: boolean | undefined;

    await streamAssistantMessage(
      { question: "¿gastos?" },
      {
        onMeta: (m) => {
          events.push("meta");
          conversationId = m.conversationId;
        },
        onToken: (delta) => {
          events.push("token");
          answer += delta;
        },
        onDone: (result) => {
          events.push("done");
          insufficient = result.insufficient;
        },
      },
    );

    expect(events).toEqual(["meta", "token", "token", "done"]);
    expect(answer).toBe("Hola mundo");
    expect(conversationId).toBe("c1");
    expect(insufficient).toBe(false);
  });

  it("handles action proposals and action errors", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      sseResponse([
        meta(),
        `event: action_proposal\ndata: ${JSON.stringify({
          actionId: "a1",
          token: "t1",
          name: "create_transaction",
          title: "Crear gasto",
          classification: "write_safe",
          destructive: false,
          summary: "Gasto de 100",
          preview: { title: "Crear gasto", summary: "", fields: [] },
          expiresAt: "2026-01-01T00:10:00.000Z",
          planId: null,
          step: 0,
          pending: true,
        })}\n\n`,
        `event: action_error\ndata: ${JSON.stringify({
          name: "create_transaction",
          title: "Crear gasto",
          code: "VALIDATION_ERROR",
          message: "Monto inválido",
        })}\n\n`,
        done(),
      ]),
    );
    vi.stubGlobal("fetch", fetchMock);

    const onProposal = vi.fn();
    const onActionError = vi.fn();
    await streamAssistantMessage(
      { question: "creá un gasto" },
      { onProposal, onActionError },
    );

    expect(onProposal).toHaveBeenCalledWith(
      expect.objectContaining({ actionId: "a1", name: "create_transaction" }),
    );
    expect(onActionError).toHaveBeenCalledWith(
      expect.objectContaining({ code: "VALIDATION_ERROR" }),
    );
  });

  it("reports an error event through onError", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        sseResponse([
          meta(),
          `event: error\ndata: ${JSON.stringify({ message: "AI_UNAVAILABLE" })}\n\n`,
        ]),
      );
    vi.stubGlobal("fetch", fetchMock);

    const onError = vi.fn();
    await streamAssistantMessage({ question: "?" }, { onError });
    expect(onError).toHaveBeenCalledWith("AI_UNAVAILABLE");
  });

  it("sends the question, conversation, period and currency to the API", async () => {
    const fetchMock = vi.fn().mockResolvedValue(sseResponse([meta(), done()]));
    vi.stubGlobal("fetch", fetchMock);

    await streamAssistantMessage(
      {
        question: "¿cuánto ahorré?",
        conversationId: "conv-1",
        period: { from: "2026-01-01", to: "2026-01-31" },
        currency: "ARS",
      },
      {},
    );

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost/api/assistant/messages");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      question: "¿cuánto ahorré?",
      conversationId: "conv-1",
      period: { from: "2026-01-01", to: "2026-01-31" },
      currency: "ARS",
    });
  });

  it("surfaces a non-OK response message", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "Asistente deshabilitado" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const onError = vi.fn();
    await streamAssistantMessage({ question: "?" }, { onError });
    expect(onError).toHaveBeenCalledWith("Asistente deshabilitado");
  });

  it("forwards the abort signal to fetch", async () => {
    const fetchMock = vi.fn().mockResolvedValue(sseResponse([meta(), done()]));
    vi.stubGlobal("fetch", fetchMock);
    const controller = new AbortController();

    await streamAssistantMessage(
      { question: "?" },
      {},
      { signal: controller.signal },
    );
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.signal).toBe(controller.signal);
  });
});

describe("streamAssistantMessage (mock path)", () => {
  it("streams the mock answer word by word", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", "true");
    vi.stubEnv("NEXT_PUBLIC_ASSISTANT_LIVE", "false");
    const { streamAssistantMessage: mockedStream } =
      await import("@/lib/api/assistant-stream");
    const { sessionStore } = await import("@/lib/api/session");
    const { mockState } = await import("@/lib/mocks/store");
    sessionStore.setUserId(mockState.users[0].user.id);

    const tokens: string[] = [];
    let final = "";
    await mockedStream(
      {
        question: "¿cuánto gasté?",
        period: { from: "2026-01-01", to: "2026-01-31" },
        currency: "ARS",
      },
      {
        onToken: (delta) => tokens.push(delta),
        onDone: (result) => {
          final = result.conversationId;
        },
      },
    );

    expect(tokens.length).toBeGreaterThan(0);
    expect(tokens.join("").length).toBeGreaterThan(0);
    expect(final).not.toBe("");
    sessionStore.clear();
  });
});
