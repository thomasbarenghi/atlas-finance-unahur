import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AssistantHistorySheet } from "@/components/features/assistant/assistant-chat/history-sheet";
import { AssistantWidget } from "@/components/features/assistant/assistant-widget";
import { AssistantPanelProvider } from "@/providers/assistant-panel-provider";
import { makeUser } from "@/lib/test/factories";
import { renderWithProviders } from "@/lib/test/render";

vi.mock("next/navigation", () => import("@/lib/test/next-navigation"));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { setPathname } from "@/lib/test/next-navigation";

describe("AssistantHistorySheet", () => {
  afterEach(() => vi.restoreAllMocks());

  it("lists local threads ordered by recency", () => {
    renderWithProviders(
      <AssistantHistorySheet
        open
        onOpenChange={vi.fn()}
        threads={[
          { id: "t1", title: "Consulta vieja", messages: [], updatedAt: 1 },
          { id: "t2", title: "Consulta nueva", messages: [], updatedAt: 2 },
        ]}
        activeId="t2"
        onSelect={vi.fn()}
        onDelete={vi.fn()}
        onNew={vi.fn()}
      />,
    );

    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("Consulta nueva");
    expect(items[1]).toHaveTextContent("Consulta vieja");
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
        threads={[{ id: "t1", title: "Consulta", messages: [], updatedAt: 1 }]}
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

  it("shows an empty state without threads", () => {
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
      screen.getByText("Todavía no hay conversaciones."),
    ).toBeInTheDocument();
  });
});

const mockMedia = (matches: boolean) => {
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches,
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
    mockMedia(true);
    setPathname("/assistant");
    const { container } = renderWithProviders(
      <AssistantPanelProvider>
        <AssistantWidget />
      </AssistantPanelProvider>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing on mobile", () => {
    mockMedia(false);
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
    mockMedia(true);
    setPathname("/dashboard");
    renderWithProviders(
      <AssistantPanelProvider>
        <AssistantWidget />
      </AssistantPanelProvider>,
      { user: makeUser() },
    );

    await user.click(screen.getByRole("button", { name: "Abrir asistente" }));
    expect(
      (await screen.findAllByRole("button", { name: "Cerrar asistente" }))
        .length,
    ).toBeGreaterThan(0);
    expect(await screen.findByText("¿En qué te ayudo?")).toBeInTheDocument();
  });
});
