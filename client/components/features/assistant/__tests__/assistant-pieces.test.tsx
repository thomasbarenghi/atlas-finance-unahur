import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AssistantHistorySheet } from "@/components/features/assistant/assistant-chat/history-sheet";
import { AssistantWidget } from "@/components/features/assistant/assistant-widget";
import { AssistantPanelProvider } from "@/providers/assistant-panel-provider";
import { mockApi } from "@/lib/mocks/api";
import { makeUser } from "@/lib/test/factories";
import { renderWithProviders } from "@/lib/test/render";
import { resetMockSession, seedMockSession } from "@/lib/test/mock-session";

vi.mock("next/navigation", () => import("@/lib/test/next-navigation"));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { setPathname } from "@/lib/test/next-navigation";

describe("AssistantHistorySheet", () => {
  beforeEach(() => {
    seedMockSession();
    vi.restoreAllMocks();
  });
  afterEach(() => resetMockSession());

  it("lists local threads and the server conversations", async () => {
    renderWithProviders(
      <AssistantHistorySheet
        open
        onOpenChange={vi.fn()}
        threads={[
          {
            id: "t1",
            title: "Consulta vieja",
            conversationId: null,
            messages: [],
            updatedAt: 1,
          },
          {
            id: "t2",
            title: "Consulta nueva",
            conversationId: null,
            messages: [],
            updatedAt: 2,
          },
        ]}
        activeId="t2"
        onSelect={vi.fn()}
        onDelete={vi.fn()}
        onNew={vi.fn()}
      />,
    );

    expect(screen.getByText("Consulta nueva")).toBeInTheDocument();
    expect(screen.getByText("Guardadas en el servidor")).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.getByText("¿En qué gasté más este mes?"),
      ).toBeInTheDocument(),
    );
  });

  it("selects, deletes and starts a new conversation", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onDelete = vi.fn();
    const onNew = vi.fn();
    renderWithProviders(
      <AssistantHistorySheet
        open
        onOpenChange={vi.fn()}
        threads={[
          {
            id: "t1",
            title: "Consulta",
            conversationId: null,
            messages: [],
            updatedAt: 1,
          },
        ]}
        activeId="t1"
        onSelect={onSelect}
        onDelete={onDelete}
        onNew={onNew}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Consulta/ }));
    expect(onSelect).toHaveBeenCalledWith("t1");

    await user.click(
      screen.getByRole("button", { name: "Eliminar conversación" }),
    );
    expect(onDelete).toHaveBeenCalledWith("t1");

    await user.click(
      screen.getByRole("button", { name: /Nueva conversación/ }),
    );
    expect(onNew).toHaveBeenCalled();
  });

  it("deletes a server conversation", async () => {
    const user = userEvent.setup();
    const deleteSpy = vi
      .spyOn(mockApi, "deleteConversation")
      .mockResolvedValue(undefined);
    renderWithProviders(
      <AssistantHistorySheet
        open
        onOpenChange={vi.fn()}
        threads={[]}
        activeId={null}
        onSelect={vi.fn()}
        onDelete={vi.fn()}
        onNew={vi.fn()}
      />,
    );

    const deleteButtons = await screen.findAllByRole("button", {
      name: "Eliminar conversación del servidor",
    });
    await user.click(deleteButtons[0]);
    await waitFor(() => expect(deleteSpy).toHaveBeenCalled());
  });

  it("shows empty states", async () => {
    vi.spyOn(mockApi, "listConversations").mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 20,
      total: 0,
      totalPages: 1,
    });
    renderWithProviders(
      <AssistantHistorySheet
        open
        onOpenChange={vi.fn()}
        threads={[]}
        activeId={null}
        onSelect={vi.fn()}
        onDelete={vi.fn()}
        onNew={vi.fn()}
      />,
    );
    expect(
      screen.getByText("Todavía no hay conversaciones guardadas."),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Sin conversaciones en el servidor."),
    ).toBeInTheDocument();
  });
});

const desktopMedia = () => {
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches: true,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList,
  );
};

describe("AssistantWidget", () => {
  afterEach(() => vi.restoreAllMocks());

  it("renders nothing on the assistant route", () => {
    desktopMedia();
    setPathname("/assistant");
    const { container } = renderWithProviders(
      <AssistantPanelProvider>
        <AssistantWidget />
      </AssistantPanelProvider>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing on mobile", () => {
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query: string) =>
        ({
          matches: false,
          media: query,
          onchange: null,
          addEventListener: () => {},
          removeEventListener: () => {},
          addListener: () => {},
          removeListener: () => {},
          dispatchEvent: () => false,
        }) as unknown as MediaQueryList,
    );
    setPathname("/dashboard");
    const { container } = renderWithProviders(
      <AssistantPanelProvider>
        <AssistantWidget />
      </AssistantPanelProvider>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("toggles the assistant panel on desktop", async () => {
    const user = userEvent.setup();
    desktopMedia();
    setPathname("/dashboard");
    renderWithProviders(
      <AssistantPanelProvider>
        <AssistantWidget />
      </AssistantPanelProvider>,
      { user: makeUser({ aiEnabled: true }) },
    );

    await user.click(screen.getByRole("button", { name: "Abrir asistente" }));
    expect(
      (await screen.findAllByRole("button", { name: "Cerrar asistente" }))
        .length,
    ).toBeGreaterThan(0);
    expect(await screen.findByText("¿En qué te ayudo?")).toBeInTheDocument();
  });
});
