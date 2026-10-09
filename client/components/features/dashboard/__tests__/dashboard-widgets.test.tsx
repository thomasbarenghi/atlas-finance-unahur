import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InvestmentsSummary } from "@/components/features/dashboard/investments-summary";
import { NetWorthHero } from "@/components/features/dashboard/net-worth-hero";
import { BudgetUsage } from "@/components/features/dashboard/budget-usage";
import { BudgetAlerts } from "@/components/features/dashboard/budget-alerts";
import { WidgetPicker } from "@/components/features/dashboard/widget-picker";
import { WidgetToolbar } from "@/components/features/dashboard/widget-toolbar";
import { mockApi } from "@/lib/mocks/api";
import { makeBudget, makeDashboardData } from "@/lib/test/factories";
import { renderWithProviders } from "@/lib/test/render";
import { DEFAULT_DASHBOARD_LAYOUT } from "@/lib/dashboard-widgets";

const dashboard = makeDashboardData();

describe("InvestmentsSummary", () => {
  it("shows an empty state without positions", () => {
    render(
      <InvestmentsSummary
        {...dashboard.investments}
        positions={[]}
        currency="ARS"
      />,
    );
    expect(
      screen.getByText("Todavía no tenés inversiones"),
    ).toBeInTheDocument();
  });

  it("renders totals, positions, stale badge and provider", () => {
    render(<InvestmentsSummary {...dashboard.investments} currency="ARS" />);
    expect(screen.getByText("Valor actual")).toBeInTheDocument();
    expect(screen.getByText("BTC")).toBeInTheDocument();
    expect(screen.getByText("coingecko")).toBeInTheDocument();
    expect(screen.getByText(/cotización desactualizada/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /BTC/ })).toHaveAttribute(
      "href",
      "/patrimony/investments/detail?id=position-1",
    );
  });

  it("marks positions without a quote and hides a null P/L percentage", () => {
    render(
      <InvestmentsSummary
        {...dashboard.investments}
        staleQuotes={0}
        positions={[
          {
            id: "position-eth",
            symbol: "ETH",
            instrument: "Ethereum",
            quantity: 1,
            originalCurrency: "USD",
            originalValue: 0,
            originalCost: 0,
            originalProfitLoss: null,
            value: 0,
            profitLossPct: null,
            isStale: false,
            quoteDate: null,
            quoteProvider: null,
          },
        ]}
        currency="ARS"
      />,
    );
    expect(screen.getByText(/sin cotización/)).toBeInTheDocument();
    expect(screen.getByText("Cotizaciones al día")).toBeInTheDocument();
  });

  it("renders a negative result with the loss tone", () => {
    render(
      <InvestmentsSummary
        {...dashboard.investments}
        profitLoss={-100}
        profitLossPct={-3.5}
        currency="ARS"
      />,
    );
    expect(screen.getByText("Resultado")).toBeInTheDocument();
  });

  it("shows a converted value for a foreign-currency position", () => {
    render(
      <InvestmentsSummary
        {...dashboard.investments}
        staleQuotes={0}
        currency="ARS"
        positions={[
          {
            id: "position-eth-2",
            symbol: "ETH",
            instrument: "Ethereum",
            quantity: 1,
            originalCurrency: "USD",
            originalValue: 100,
            originalCost: 90,
            originalProfitLoss: 10,
            value: 100,
            profitLossPct: 11,
            isStale: false,
            quoteDate: null,
            quoteProvider: null,
          },
        ]}
      />,
    );
    expect(screen.getByText("ETH")).toBeInTheDocument();
    expect(screen.queryByText("coingecko")).toBeNull();
  });
});

describe("NetWorthHero", () => {
  it("renders the value, period stats and the accessible chart", () => {
    render(
      <NetWorthHero
        value={120_000}
        deltaPct={4.2}
        currency="ARS"
        series={dashboard.netWorthSeries}
        income={200_000}
        expenses={80_000}
        savings={120_000}
      />,
    );
    expect(screen.getByText("Patrimonio neto")).toBeInTheDocument();
    expect(screen.getByText("Ingresos")).toBeInTheDocument();
    expect(screen.getByText("Tasa de ahorro")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Evolución del patrimonio neto" }),
    ).toBeInTheDocument();
  });

  it("can hide the period stats", () => {
    render(
      <NetWorthHero
        value={1}
        deltaPct={null}
        currency="ARS"
        series={dashboard.netWorthSeries}
        income={0}
        expenses={0}
        savings={0}
        showPeriodStats={false}
      />,
    );
    expect(screen.queryByText("Ingresos")).toBeNull();
  });
});

describe("BudgetUsage", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("shows loading skeletons while the budgets are pending", async () => {
    vi.spyOn(mockApi, "listBudgets").mockReturnValue(new Promise(() => {}));
    const { container } = renderWithProviders(
      <BudgetUsage period="2026-01-01" />,
    );
    await waitFor(() =>
      expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBe(
        3,
      ),
    );
  });

  it("shows an empty state without budgets", async () => {
    vi.spyOn(mockApi, "listBudgets").mockResolvedValue([]);
    renderWithProviders(<BudgetUsage period="2026-01-01" />);
    expect(await screen.findByText("Sin presupuestos")).toBeInTheDocument();
  });

  it("renders each budget with its category and figures", async () => {
    vi.spyOn(mockApi, "listBudgets").mockResolvedValue([
      makeBudget({ category: { id: "c", name: "Comida", color: "#ef4444" } }),
    ]);
    renderWithProviders(<BudgetUsage period="2026-01-01" />);
    expect(await screen.findByText("Comida")).toBeInTheDocument();
  });
});

describe("BudgetAlerts", () => {
  it("shows a calm empty state", () => {
    render(<BudgetAlerts alerts={[]} />);
    expect(
      screen.getByText("Tus presupuestos están bajo control"),
    ).toBeInTheDocument();
  });

  it("lists alerts with their consumed percentage", () => {
    render(<BudgetAlerts alerts={dashboard.budgetAlerts} />);
    expect(screen.getByText("Comida")).toBeInTheDocument();
    expect(screen.getByText("92% consumido")).toBeInTheDocument();
  });
});

describe("WidgetPicker", () => {
  it("toggles widget visibility and resets the layout", async () => {
    const user = userEvent.setup();
    const onSetVisible = vi.fn();
    const onReset = vi.fn();
    render(
      <WidgetPicker
        open
        onOpenChange={vi.fn()}
        layout={DEFAULT_DASHBOARD_LAYOUT}
        onSetVisible={onSetVisible}
        onReset={onReset}
      />,
    );

    await user.click(
      screen.getByRole("switch", { name: "Mostrar Patrimonio neto" }),
    );
    expect(onSetVisible).toHaveBeenCalledWith("netWorth", false);

    await user.click(
      screen.getByRole("button", { name: /restablecer diseño/i }),
    );
    expect(onReset).toHaveBeenCalled();
  });
});

describe("WidgetToolbar", () => {
  it("invokes callbacks and disables unavailable actions", async () => {
    const user = userEvent.setup();
    const onMoveUp = vi.fn();
    const onMoveDown = vi.fn();
    const onCycleSpan = vi.fn();
    const onHide = vi.fn();
    render(
      <WidgetToolbar
        label="Patrimonio"
        canMoveUp={false}
        canMoveDown
        span={1}
        maxSpan={3}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        onCycleSpan={onCycleSpan}
        onHide={onHide}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Mover Patrimonio hacia arriba" }),
    ).toBeDisabled();
    await user.click(
      screen.getByRole("button", { name: "Mover Patrimonio hacia abajo" }),
    );
    expect(onMoveDown).toHaveBeenCalled();
    await user.click(
      screen.getByRole("button", {
        name: "Ancho de Patrimonio: 1 de 3. Cambiar",
      }),
    );
    expect(onCycleSpan).toHaveBeenCalled();
    await user.click(
      screen.getByRole("button", { name: "Ocultar Patrimonio" }),
    );
    expect(onHide).toHaveBeenCalled();
  });

  it("disables the span button when the widget cannot resize", () => {
    render(
      <WidgetToolbar
        label="X"
        canMoveUp
        canMoveDown
        span={1}
        maxSpan={1}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
        onCycleSpan={vi.fn()}
        onHide={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Ancho de X: 1 de 1. Cambiar" }),
    ).toBeDisabled();
  });
});
