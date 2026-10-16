import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ReportsView } from "@/components/features/reports/reports-view";
import { ReportsTabs } from "@/components/features/reports/reports-tabs";
import { ReportsSummary } from "@/components/features/reports/reports-summary";
import { HighlightsCard } from "@/components/features/reports/highlights-card";
import { buildHighlights } from "@/components/features/reports/highlights-card/highlights-card.utils";
import { WidgetCard } from "@/components/features/reports/widget-card";
import { mockApi } from "@/lib/mocks/api";
import { makeDashboardData } from "@/lib/test/factories";
import { renderWithProviders } from "@/lib/test/render";
import { resetMockSession, seedMockSession } from "@/lib/test/mock-session";

vi.mock("next/navigation", () => import("@/lib/test/next-navigation"));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { setPathname } from "@/lib/test/next-navigation";

const dashboard = makeDashboardData();

describe("buildHighlights", () => {
  it("builds expense, savings and category highlights, capped at three", () => {
    const highlights = buildHighlights({
      categoryChanges: [
        {
          categoryId: "c1",
          name: "Comida",
          current: 50,
          previous: 100,
          deltaPct: -50,
        },
        {
          categoryId: "c2",
          name: "Ocio",
          current: 200,
          previous: 100,
          deltaPct: 100,
        },
      ],
      expensesDeltaPct: -10,
      savingsDeltaPct: 25,
      currency: "ARS",
    });
    expect(highlights).toHaveLength(3);
    expect(highlights[0].tone).toBe("positive");
    expect(highlights[1].text).toMatch(/subió/);
    expect(highlights[2].text).toMatch(/menos en Comida/);
  });

  it("returns no highlights when there is nothing to compare", () => {
    expect(
      buildHighlights({
        categoryChanges: [
          {
            categoryId: "c",
            name: "X",
            current: 1,
            previous: 0,
            deltaPct: null,
          },
        ],
        expensesDeltaPct: 0,
        savingsDeltaPct: null,
        currency: "ARS",
      }),
    ).toEqual([]);
  });

  it("flags increases and savings drops as negative", () => {
    const highlights = buildHighlights({
      categoryChanges: [
        {
          categoryId: "c2",
          name: "Ocio",
          current: 200,
          previous: 100,
          deltaPct: 100,
        },
      ],
      expensesDeltaPct: 12,
      savingsDeltaPct: -8,
      currency: "ARS",
    });
    expect(highlights[0].tone).toBe("negative");
    expect(highlights[0].text).toMatch(/más/);
    expect(highlights[1].text).toMatch(/bajó/);
    expect(highlights[2].text).toMatch(/aumentó/);
  });
});

describe("HighlightsCard", () => {
  it("renders the highlights and nothing when empty", () => {
    const { unmount } = render(
      <HighlightsCard
        categoryChanges={[]}
        expensesDeltaPct={-5}
        savingsDeltaPct={10}
        currency="ARS"
      />,
    );
    expect(screen.getByText("Cambios destacados")).toBeInTheDocument();
    unmount();

    const empty = render(
      <HighlightsCard
        categoryChanges={[]}
        expensesDeltaPct={null}
        savingsDeltaPct={null}
        currency="ARS"
      />,
    );
    expect(empty.container).toBeEmptyDOMElement();
  });
});

describe("ReportsSummary", () => {
  it("maps deltas to the matching period stats", () => {
    render(
      <ReportsSummary
        income={1000}
        expenses={400}
        savings={600}
        incomeDeltaPct={10}
        expensesDeltaPct={-5}
        savingsDeltaPct={20}
        currency="ARS"
      />,
    );
    expect(screen.getByText("Ingresos")).toBeInTheDocument();
    expect(screen.getByText("Tasa de ahorro")).toBeInTheDocument();
  });
});

describe("WidgetCard", () => {
  it("renders the title, hint and children", () => {
    render(
      <WidgetCard title="Título" hint="Ayuda">
        <span>Contenido</span>
      </WidgetCard>,
    );
    expect(screen.getByText("Título")).toBeInTheDocument();
    expect(screen.getByText("Ayuda")).toBeInTheDocument();
    expect(screen.getByText("Contenido")).toBeInTheDocument();
  });
});

describe("ReportsTabs", () => {
  it("marks the active tab", () => {
    setPathname("/reports");
    render(<ReportsTabs />);
    expect(screen.getByRole("link", { name: "General" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.getByRole("link", { name: "Patrimonio" }),
    ).not.toHaveAttribute("aria-current");
  });
});

describe("ReportsView", () => {
  beforeEach(() => {
    seedMockSession();
    vi.restoreAllMocks();
  });
  afterEach(() => resetMockSession());

  it("renders the report widgets and summary", async () => {
    renderWithProviders(<ReportsView />, {
      period: { from: "2000-01-01", to: "2100-01-01" },
    });

    expect(await screen.findByText("Reportes")).toBeInTheDocument();
    expect(screen.getAllByText("Ingresos").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Ingresos vs\. gastos/).length).toBeGreaterThan(
      0,
    );
  });

  it("opens the widget picker", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReportsView />, {
      period: { from: "2000-01-01", to: "2100-01-01" },
    });

    await screen.findByText("Reportes");
    await user.click(screen.getByRole("button", { name: "Widgets" }));
    expect(await screen.findByText("Widgets del reporte")).toBeInTheDocument();
  });

  it("enters edit mode and exposes widget toolbars", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReportsView />, {
      period: { from: "2000-01-01", to: "2100-01-01" },
    });

    await screen.findByText("Reportes");
    await user.click(screen.getByRole("button", { name: "Editar" }));
    expect(
      await screen.findByRole("button", { name: /Ocultar Patrimonio neto/ }),
    ).toBeInTheDocument();
  });

  it("moves, resizes and hides widgets on a wide viewport", async () => {
    const user = userEvent.setup();
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
    renderWithProviders(<ReportsView />, {
      period: { from: "2000-01-01", to: "2100-01-01" },
    });

    await screen.findByText("Reportes");
    await user.click(screen.getByRole("button", { name: "Editar" }));

    await user.click(
      await screen.findByRole("button", {
        name: /Mover Patrimonio neto hacia abajo/,
      }),
    );
    await user.click(
      screen.getByRole("button", { name: /Ancho de Patrimonio neto/ }),
    );
    await user.click(
      screen.getByRole("button", { name: /Ocultar Patrimonio neto/ }),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: /Ocultar Patrimonio neto/ }),
      ).toBeNull(),
    );
  });

  it("shows an empty state without data", async () => {
    vi.spyOn(mockApi, "dashboard").mockResolvedValue(
      makeDashboardData({
        kpis: { ...dashboard.kpis, netWorth: 0 },
        expensesByCategory: [],
        incomeExpenseByMonth: [],
      }),
    );
    renderWithProviders(<ReportsView />, {
      period: { from: "2000-01-01", to: "2100-01-01" },
    });
    expect(await screen.findByText("Todavía no hay datos")).toBeInTheDocument();
  });

  it("shows an error state with retry", async () => {
    const spy = vi
      .spyOn(mockApi, "dashboard")
      .mockRejectedValue(new Error("boom"));
    renderWithProviders(<ReportsView />, {
      period: { from: "2000-01-01", to: "2100-01-01" },
    });
    expect(
      await screen.findByText("No pudimos cargar tus reportes"),
    ).toBeInTheDocument();
    const before = spy.mock.calls.length;
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Reintentar" }));
    await waitFor(() => expect(spy.mock.calls.length).toBeGreaterThan(before));
  });
});
