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

const meta = () =>
  `event: meta\ndata: ${JSON.stringify({
    period: { from: "2026-01-01", to: "2026-01-31" },
    currency: "ARS",
    sources: ["transactions"],
    disclaimer: "No es asesoramiento financiero.",
  })}\n\n`;

const token = (delta: string) =>
  `event: token\ndata: ${JSON.stringify({ delta })}\n\n`;

const done = (insufficient = false) =>
  `event: done\ndata: ${JSON.stringify({ insufficient })}\n\n`;

describe("streamAssistantMessage (real SSE path)", () => {
  beforeEach(() => {});

  it("parses meta/token/done events in order", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        sseResponse([meta(), token("Hola "), token("mundo"), done()]),
      );
    vi.stubGlobal("fetch", fetchMock);

    const events: string[] = [];
    let answer = "";
    let insufficient: boolean | undefined;

    await streamAssistantMessage(
      { question: "¿gastos?" },
      {
        onMeta: () => events.push("meta"),
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
    expect(insufficient).toBe(false);
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

  it("sends the question and period to the API", async () => {
    const fetchMock = vi.fn().mockResolvedValue(sseResponse([meta(), done()]));
    vi.stubGlobal("fetch", fetchMock);

    await streamAssistantMessage(
      {
        question: "¿cuánto ahorré?",
        period: { from: "2026-01-01", to: "2026-01-31" },
      },
      {},
    );

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost/api/assistant/messages");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      question: "¿cuánto ahorré?",
      period: { from: "2026-01-01", to: "2026-01-31" },
    });
  });

  it("forwards the conversation history when present", async () => {
    const fetchMock = vi.fn().mockResolvedValue(sseResponse([meta(), done()]));
    vi.stubGlobal("fetch", fetchMock);

    const history = [
      { role: "user" as const, content: "¿Cuál fue mi mayor gasto?" },
      { role: "assistant" as const, content: "Supermercado." },
    ];
    await streamAssistantMessage(
      {
        question: "¿Y lo del auto?",
        period: { from: "2026-01-01", to: "2026-01-31" },
        history,
      },
      {},
    );

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string).history).toEqual(history);
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
