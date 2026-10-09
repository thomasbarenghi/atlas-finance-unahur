import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AssistantChat } from "@/components/features/assistant/assistant-chat";
import { AssistantChatProvider } from "@/providers/assistant-chat-provider";
import { makeAssistantAction, makeUser } from "@/lib/test/factories";
import { renderWithProviders } from "@/lib/test/render";
import { resetMockSession, seedMockSession } from "@/lib/test/mock-session";

vi.mock("next/navigation", () => import("@/lib/test/next-navigation"));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const STORAGE_KEY = "atlassfin.assistant.threads.v2";

const renderChat = (
  user = makeUser({ aiEnabled: true }),
  onClose?: () => void,
) =>
  renderWithProviders(
    <AssistantChatProvider>
      <AssistantChat onClose={onClose} />
    </AssistantChatProvider>,
    { user, period: { from: "2000-01-01", to: "2100-01-01" } },
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

  it("shows the disabled state and links to settings", () => {
    renderChat(makeUser({ aiEnabled: false }));
    expect(screen.getByText("Asistente deshabilitado")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir a Ajustes" })).toHaveAttribute(
      "href",
      "/settings",
    );
  });

  it("streams an answer for a suggested question", async () => {
    const user = userEvent.setup();
    renderChat();

    await user.click(
      screen.getByRole("button", { name: /¿Cómo van mis presupuestos\?/ }),
    );
    expect(
      await screen.findByText("¿Cómo van mis presupuestos?"),
    ).toBeInTheDocument();
    await waitFor(
      () => expect(screen.getByText(/presupuestos/)).toBeInTheDocument(),
      { timeout: 5000 },
    );
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
    expect(
      await screen.findByText("Guardadas en el servidor"),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: /Nueva conversación/ }),
    );
    expect(screen.getByText("¿En qué te ayudo?")).toBeInTheDocument();
  });

  it("closes the panel when requested", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderChat(makeUser({ aiEnabled: true }), onClose);

    await user.click(screen.getByRole("button", { name: "Cerrar asistente" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("renders action proposals and resolves them", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        activeId: "t1",
        threads: [
          {
            id: "t1",
            title: "Acción",
            conversationId: "c1",
            updatedAt: 1,
            messages: [
              {
                id: "m1",
                role: "assistant",
                content: "",
                actions: [makeAssistantAction()],
              },
            ],
          },
        ],
      }),
    );
    renderChat();

    expect(await screen.findByText("Crear movimiento")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Confirmar" }));
    await waitFor(() =>
      expect(screen.getByText(/No se pudo completar/)).toBeInTheDocument(),
    );
  });

  it("shows the recording UI and can cancel it", async () => {
    const user = userEvent.setup();
    const stopTrack = vi.fn();
    const getUserMedia = vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: stopTrack }],
    });
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia },
    });
    class FakeRecorder {
      state = "inactive";
      mimeType = "audio/webm";
      ondataavailable: ((event: { data: Blob }) => void) | null = null;
      onstop: (() => void) | null = null;
      start() {
        this.state = "recording";
      }
      stop() {
        this.state = "inactive";
      }
    }
    vi.stubGlobal("MediaRecorder", FakeRecorder);

    renderChat();
    await user.click(screen.getByRole("button", { name: "Grabar audio" }));
    expect(await screen.findByText("Grabando…")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Cancelar grabación" }),
    );
    await waitFor(() => expect(screen.queryByText("Grabando…")).toBeNull());
    vi.unstubAllGlobals();
  });

  it("stops a recording and reports a missing transcript", async () => {
    const user = userEvent.setup();
    const getUserMedia = vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }],
    });
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia },
    });
    class FakeRecorder {
      state = "inactive";
      mimeType = "audio/webm";
      ondataavailable: ((event: { data: Blob }) => void) | null = null;
      onstop: (() => void) | null = null;
      start() {
        this.state = "recording";
      }
      stop() {
        this.state = "inactive";
        this.ondataavailable?.({
          data: new Blob(["x"], { type: "audio/webm" }),
        });
        this.onstop?.();
      }
    }
    vi.stubGlobal("MediaRecorder", FakeRecorder);
    vi.stubGlobal("URL", { ...URL, createObjectURL: vi.fn(() => "blob:mock") });

    renderChat();
    await user.click(screen.getByRole("button", { name: "Grabar audio" }));
    await screen.findByText("Grabando…");
    await user.click(screen.getByRole("button", { name: "Enviar audio" }));

    expect(
      await screen.findByText(/no pude transcribirlo/),
    ).toBeInTheDocument();
    vi.unstubAllGlobals();
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

  it("cancels an action proposal", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        activeId: "t1",
        threads: [
          {
            id: "t1",
            title: "Acción",
            conversationId: "c1",
            updatedAt: 1,
            messages: [
              {
                id: "m1",
                role: "assistant",
                content: "",
                actions: [makeAssistantAction()],
              },
            ],
          },
        ],
      }),
    );
    renderChat();

    await user.click(await screen.findByRole("button", { name: "Cancelar" }));
    await waitFor(() =>
      expect(screen.getByText("Cancelada")).toBeInTheDocument(),
    );
  });

  it("locks an action that depends on a previous plan step", async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        activeId: "t1",
        threads: [
          {
            id: "t1",
            title: "Plan",
            conversationId: "c1",
            updatedAt: 1,
            messages: [
              {
                id: "m1",
                role: "assistant",
                content: "",
                actions: [
                  makeAssistantAction({
                    actionId: "a0",
                    planId: "plan-1",
                    step: 0,
                    title: "Paso uno",
                  }),
                  makeAssistantAction({
                    actionId: "a1",
                    planId: "plan-1",
                    step: 1,
                    title: "Paso dos",
                  }),
                ],
              },
            ],
          },
        ],
      }),
    );
    renderChat();

    expect(
      await screen.findByText("Confirmá primero el paso anterior."),
    ).toBeInTheDocument();
  });
});
