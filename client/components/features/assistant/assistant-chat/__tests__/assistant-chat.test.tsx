import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AssistantChat } from "@/components/features/assistant/assistant-chat";
import { AssistantChatProvider } from "@/providers/assistant-chat-provider";
import { makeUser } from "@/lib/test/factories";
import { renderWithProviders } from "@/lib/test/render";
import { resetMockSession, seedMockSession } from "@/lib/test/mock-session";

vi.mock("next/navigation", () => import("@/lib/test/next-navigation"));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const renderChat = (onClose?: () => void) =>
  renderWithProviders(
    <AssistantChatProvider>
      <AssistantChat onClose={onClose} />
    </AssistantChatProvider>,
    { user: makeUser(), period: { from: "2000-01-01", to: "2100-01-01" } },
  );

describe("AssistantChat", () => {
  beforeEach(() => {
    window.localStorage.clear();
    seedMockSession();
    vi.restoreAllMocks();
  });
  afterEach(() => {
    resetMockSession();
    window.localStorage.clear();
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

  it("opens the history and starts a new conversation", async () => {
    const user = userEvent.setup();
    renderChat();

    await user.click(screen.getByRole("button", { name: "Historial" }));
    expect(await screen.findByText("Historial")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: /Nueva conversación/ }),
    );
    expect(screen.getByText("¿En qué te ayudo?")).toBeInTheDocument();
  });

  it("closes the panel when requested", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderChat(onClose);

    await user.click(screen.getByRole("button", { name: "Cerrar asistente" }));
    expect(onClose).toHaveBeenCalled();
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
    const { mockApi } = await import("@/lib/mocks/api");
    vi.spyOn(mockApi, "sendMessage").mockRejectedValue(new Error("boom"));
    renderChat();

    const input = screen.getByLabelText("Pregunta para el asistente");
    await user.type(input, "falla");
    await user.click(screen.getByRole("button", { name: "Enviar pregunta" }));
    expect(await screen.findByText(/boom/)).toBeInTheDocument();
  });
});
