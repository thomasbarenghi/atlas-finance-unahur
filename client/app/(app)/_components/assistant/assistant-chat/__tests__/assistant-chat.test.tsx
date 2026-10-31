import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AssistantPage from "@/app/(app)/assistant/page";
import { makeUser } from "@/lib/test/factories";
import { renderWithProviders } from "@/lib/test/render";
import { setupTestServer } from "@/lib/test/server";

vi.mock("next/navigation", () => import("@/lib/test/next-navigation"));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const server = setupTestServer();

const renderChat = () =>
  renderWithProviders(<AssistantPage />, {
    user: makeUser(),
    period: { from: "2000-01-01", to: "2100-01-01" },
  });

describe("AssistantChat", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });
  afterEach(() => {
    window.localStorage.clear();
  });

  it("labels the period like the dashboard", () => {
    renderChat();

    expect(
      screen.getByRole("combobox", { name: "Período del asistente" }),
    ).toHaveTextContent("Este mes");
  });

  it("streams an answer for a suggested question", async () => {
    const user = userEvent.setup();
    renderChat();

    await user.click(
      screen.getByRole("button", { name: /¿En qué gasté más este mes\?/ }),
    );
    expect(
      await screen.findByText("¿En qué gasté más este mes?"),
    ).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/gasto/)).toBeInTheDocument(), {
      timeout: 5000,
    });
  });

  it("streams an answer when effects re-mount under StrictMode", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AssistantPage />, {
      user: makeUser(),
      period: { from: "2000-01-01", to: "2100-01-01" },
      strict: true,
    });

    await user.click(
      screen.getByRole("button", { name: /¿En qué gasté más este mes\?/ }),
    );

    await waitFor(() => expect(screen.getByText(/gasto/)).toBeInTheDocument(), {
      timeout: 5000,
    });
  });

  it("sends the previous turns as conversation history", async () => {
    const bodies: { history?: unknown }[] = [];
    server.use(
      http.post("*/assistant/messages", async ({ request }) => {
        bodies.push((await request.json()) as { history?: unknown });
        const encoder = new TextEncoder();
        const stream = new ReadableStream<Uint8Array>({
          start: (controller) => {
            controller.enqueue(
              encoder.encode(
                'event: token\ndata: {"delta":"ok"}\n\nevent: done\ndata: {"insufficient":false}\n\n',
              ),
            );
            controller.close();
          },
        });
        return new HttpResponse(stream, {
          headers: { "Content-Type": "text/event-stream" },
        });
      }),
    );

    const user = userEvent.setup();
    renderChat();

    const input = screen.getByLabelText("Pregunta para el asistente");
    await user.type(input, "primera pregunta{Enter}");
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Enviar pregunta" }),
      ).toBeInTheDocument(),
    );

    await user.type(input, "¿y lo del auto?{Enter}");
    await waitFor(() => expect(bodies).toHaveLength(2));

    expect(bodies[0].history).toBeUndefined();
    expect(bodies[1].history).toEqual([
      { role: "user", content: "primera pregunta" },
      { role: "assistant", content: "ok" },
    ]);
  });

  it("sends the active reading currency", async () => {
    const bodies: { currency?: string }[] = [];
    server.use(
      http.post("*/assistant/messages", async ({ request }) => {
        bodies.push((await request.json()) as { currency?: string });
        const encoder = new TextEncoder();
        const stream = new ReadableStream<Uint8Array>({
          start: (controller) => {
            controller.enqueue(
              encoder.encode(
                'event: token\ndata: {"delta":"ok"}\n\nevent: done\ndata: {"insufficient":false}\n\n',
              ),
            );
            controller.close();
          },
        });
        return new HttpResponse(stream, {
          headers: { "Content-Type": "text/event-stream" },
        });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<AssistantPage />, {
      user: makeUser(),
      period: { from: "2000-01-01", to: "2100-01-01" },
      readingCurrency: "USD",
    });

    await user.type(
      screen.getByLabelText("Pregunta para el asistente"),
      "¿Cuánto gasté?{Enter}",
    );

    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0].currency).toBe("USD");
  });

  it("submits a typed question with the send button", async () => {
    const user = userEvent.setup();
    renderChat();

    const input = screen.getByLabelText("Pregunta para el asistente");
    await user.type(input, "¿Cuánto ahorré?");
    await user.click(screen.getByRole("button", { name: "Enviar pregunta" }));

    expect(await screen.findByText("¿Cuánto ahorré?")).toBeInTheDocument();
    await waitFor(
      () => expect(screen.getByText(/ahorraste/)).toBeInTheDocument(),
      { timeout: 5000 },
    );
  });

  it("submits on Enter and ignores Shift+Enter", async () => {
    const user = userEvent.setup();
    renderChat();

    const input = screen.getByLabelText("Pregunta para el asistente");
    await user.type(input, "hola{Shift>}{Enter}{/Shift}");
    expect(input).toHaveValue("hola\n");
    await user.clear(input);
    await user.type(input, "hola{Enter}");
    expect(await screen.findByText("hola")).toBeInTheDocument();
  });

  it("clears the single conversation with Nuevo chat", async () => {
    const user = userEvent.setup();
    renderChat();

    await user.click(
      screen.getByRole("button", { name: /¿En qué gasté más este mes\?/ }),
    );
    await waitFor(() => expect(screen.getByText(/gasto/)).toBeInTheDocument(), {
      timeout: 5000,
    });

    await user.click(screen.getByRole("button", { name: "Nuevo chat" }));
    expect(screen.getByText("¿En qué te ayudo?")).toBeInTheDocument();
  });

  it("discards the conversation and stops an in-flight response on Nuevo chat", async () => {
    const user = userEvent.setup();
    renderChat();

    await user.click(
      screen.getByRole("button", { name: /¿En qué gasté más este mes\?/ }),
    );
    await screen.findByRole("button", { name: "Detener respuesta" });
    await user.click(screen.getByRole("button", { name: "Nuevo chat" }));

    expect(screen.getByText("¿En qué te ayudo?")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Enviar pregunta" }),
    ).toBeInTheDocument();
  });

  it("cancels an in-flight response", async () => {
    const user = userEvent.setup();
    renderChat();

    await user.click(
      screen.getByRole("button", { name: /¿En qué gasté más este mes\?/ }),
    );
    await user.click(
      await screen.findByRole("button", { name: "Detener respuesta" }),
    );
    expect(
      await screen.findByRole("button", { name: "Enviar pregunta" }),
    ).toBeInTheDocument();
  });

  it("reports a failed stream", async () => {
    const user = userEvent.setup();
    server.use(
      http.post("*/assistant/messages", () =>
        HttpResponse.json({ message: "boom" }, { status: 500 }),
      ),
    );
    renderChat();

    const input = screen.getByLabelText("Pregunta para el asistente");
    await user.type(input, "falla");
    await user.click(screen.getByRole("button", { name: "Enviar pregunta" }));
    expect(await screen.findByText(/boom/)).toBeInTheDocument();
  });
});
