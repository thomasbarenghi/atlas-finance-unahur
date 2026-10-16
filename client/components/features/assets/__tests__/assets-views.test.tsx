import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AssetsList } from "@/components/features/assets/assets-list";
import { DebtsList } from "@/components/features/assets/debts-list";
import { PositionsList } from "@/components/features/assets/positions-list";
import { MarketQuotes } from "@/components/features/assets/market-quotes";
import { InvestmentsReportView } from "@/components/features/assets/investments-report-view";
import { mockApi } from "@/lib/mocks/api";
import { makeAsset, makeDebt, makePosition } from "@/lib/test/factories";
import { renderWithProviders } from "@/lib/test/render";
import { resetMockSession, seedMockSession } from "@/lib/test/mock-session";

vi.mock("next/navigation", () => import("@/lib/test/next-navigation"));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe("AssetsList", () => {
  it("renders active assets and hides archived ones behind the sheet", () => {
    const { unmount } = render(
      <AssetsList
        assets={[
          makeAsset({ id: "a1", name: "Depto" }),
          makeAsset({ id: "a2", name: "Viejo", archived: true }),
        ]}
      />,
    );
    expect(screen.getByText("Depto")).toBeInTheDocument();
    expect(screen.queryByText("Viejo")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Ver archivados \(1\)/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Depto/ })).toHaveAttribute(
      "href",
      "/patrimony/assets/detail?id=a1",
    );
    unmount();

    render(<AssetsList assets={[]} />);
    expect(screen.getByText("Todavía no tenés activos")).toBeInTheDocument();
  });
});

describe("DebtsList", () => {
  it("links debts to their assets and hides archived ones", () => {
    render(
      <DebtsList
        debts={[
          makeDebt({ id: "d1", name: "Hipoteca", assetId: "a1" }),
          makeDebt({ id: "d2", name: "Vieja", archived: true, assetId: null }),
        ]}
        assets={[makeAsset({ id: "a1", name: "Depto" })]}
      />,
    );
    expect(screen.getByText(/· Depto/)).toBeInTheDocument();
    expect(screen.queryByText("Vieja")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Ver archivados \(1\)/ }),
    ).toBeInTheDocument();
  });

  it("shows an empty state", () => {
    render(<DebtsList debts={[]} assets={[]} />);
    expect(screen.getByText("Todavía no tenés deudas")).toBeInTheDocument();
  });
});

describe("PositionsList", () => {
  it("renders gains, losses and positions without a quote", () => {
    render(
      <PositionsList
        positions={[
          makePosition({ id: "p1", instrument: "Bitcoin", profitLoss: 450 }),
          makePosition({
            id: "p2",
            instrument: "Ethereum",
            profitLoss: -100,
            profitLossPct: -5,
          }),
          makePosition({
            id: "p3",
            instrument: "Solana",
            currentValue: null,
            profitLoss: null,
            profitLossPct: null,
          }),
        ]}
      />,
    );
    expect(screen.getByText("Bitcoin")).toBeInTheDocument();
    expect(screen.getByText("Ethereum")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("shows an empty state", () => {
    render(<PositionsList positions={[]} />);
    expect(
      screen.getByText("Todavía no tenés inversiones"),
    ).toBeInTheDocument();
  });
});

describe("MarketQuotes", () => {
  beforeEach(() => {
    seedMockSession();
    vi.restoreAllMocks();
  });
  afterEach(() => resetMockSession());

  it("renders the catalog and flags stale quotes", async () => {
    renderWithProviders(<MarketQuotes />);
    expect(await screen.findByText("BTC")).toBeInTheDocument();
    expect(screen.getByText("ETH")).toBeInTheDocument();
    expect(screen.getAllByText(/Desactualizada/).length).toBeGreaterThan(0);
  });

  it("shows an empty state without quotes", async () => {
    vi.spyOn(mockApi, "listQuotes").mockResolvedValue([]);
    renderWithProviders(<MarketQuotes />);
    expect(
      await screen.findByText("Sin cotizaciones disponibles"),
    ).toBeInTheDocument();
  });
});

describe("InvestmentsReportView", () => {
  beforeEach(() => {
    seedMockSession();
    vi.restoreAllMocks();
  });
  afterEach(() => resetMockSession());

  it("renders stats, evolution, composition and quotes", async () => {
    renderWithProviders(<InvestmentsReportView />, {
      period: { from: "2000-01-01", to: "2100-01-01" },
    });

    expect((await screen.findAllByText("Patrimonio")).length).toBeGreaterThan(
      0,
    );
    expect(
      screen.getAllByText("Inversiones financieras").length,
    ).toBeGreaterThan(0);
    expect(screen.getByText("Evolución del patrimonio")).toBeInTheDocument();
    expect(
      screen.getAllByText("Composición de activos").length,
    ).toBeGreaterThan(0);
    expect(screen.getByText("Cotizaciones de mercado")).toBeInTheDocument();
    expect(await screen.findByText("BTC")).toBeInTheDocument();
  });

  it("switches the evolution series", async () => {
    const user = userEvent.setup();
    renderWithProviders(<InvestmentsReportView />, {
      period: { from: "2000-01-01", to: "2100-01-01" },
    });

    await screen.findByText("Evolución del patrimonio");
    await user.click(screen.getByRole("button", { name: "Activos" }));
    expect(screen.getByRole("button", { name: "Activos" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("shows an error state with retry", async () => {
    const spy = vi
      .spyOn(mockApi, "dashboard")
      .mockRejectedValue(new Error("boom"));
    renderWithProviders(<InvestmentsReportView />, {
      period: { from: "2000-01-01", to: "2100-01-01" },
    });
    expect(
      await screen.findByText("No pudimos cargar el patrimonio"),
    ).toBeInTheDocument();
    const before = spy.mock.calls.length;
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Reintentar" }));
    await waitFor(() => expect(spy.mock.calls.length).toBeGreaterThan(before));
  });
});
