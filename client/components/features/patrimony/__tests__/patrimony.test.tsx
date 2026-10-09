import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PatrimonyHero } from "@/components/features/patrimony/patrimony-hero";
import { EquitySummary } from "@/components/features/patrimony/equity-summary";
import { ValuationSummary } from "@/components/features/patrimony/valuation-summary";
import { ValuationHistory } from "@/components/features/patrimony/valuation-history";
import { LinkedEntityCard } from "@/components/features/patrimony/linked-entity-card";
import { PositionMetrics } from "@/components/features/patrimony/position-detail-view/components/position-metrics";
import { PositionCalculationCard } from "@/components/features/patrimony/position-detail-view/components/position-calculation-card";
import { AssetDetailView } from "@/components/features/patrimony/asset-detail-view";
import { DebtDetailView } from "@/components/features/patrimony/debt-detail-view";
import { PositionDetailView } from "@/components/features/patrimony/position-detail-view";
import { mockApi } from "@/lib/mocks/api";
import { mockState } from "@/lib/mocks/store";
import { makePosition, makeValuation } from "@/lib/test/factories";
import { renderWithProviders } from "@/lib/test/render";
import { resetMockSession, seedMockSession } from "@/lib/test/mock-session";

vi.mock("next/navigation", () => import("@/lib/test/next-navigation"));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { push } from "@/lib/test/next-navigation";
import { Target } from "lucide-react";

const ALL_TIME = { from: "2000-01-01", to: "2100-01-01" };

describe("PatrimonyHero", () => {
  it("renders the value, subtitle, supporting text and badge", () => {
    render(
      <PatrimonyHero
        icon={Target}
        title="Título"
        subtitle="Subtítulo"
        value={1000}
        currency="ARS"
        supportingText="Actualizado"
        badge={<span>Badge</span>}
      />,
    );
    expect(screen.getByText("Título")).toBeInTheDocument();
    expect(screen.getByText("Subtítulo")).toBeInTheDocument();
    expect(screen.getByText("Actualizado")).toBeInTheDocument();
    expect(screen.getByText("Badge")).toBeInTheDocument();
  });
});

describe("EquitySummary / LinkedEntityCard", () => {
  it("links the associated debt when a href is provided", () => {
    render(
      <EquitySummary
        assetValue={100}
        debt={40}
        currency="ARS"
        debtHref="/patrimony/debts/detail?id=d1"
      />,
    );
    expect(screen.getByText("Valor neto")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/patrimony/debts/detail?id=d1",
    );
  });

  it("renders a plain debt amount without a link", () => {
    render(<EquitySummary assetValue={100} debt={40} currency="ARS" />);
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("renders a linked entity card", () => {
    render(
      <LinkedEntityCard
        label="Activo vinculado"
        title="Depto"
        amount={1000}
        currency="ARS"
        href="/patrimony/assets/detail?id=a1"
      />,
    );
    expect(screen.getByRole("link", { name: /Depto/ })).toHaveAttribute(
      "href",
      "/patrimony/assets/detail?id=a1",
    );
  });
});

describe("ValuationSummary / ValuationHistory", () => {
  it("renders nothing without valuations", () => {
    const { container } = render(
      <ValuationSummary valuations={[]} currency="ARS" />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders placeholders for a single valuation", () => {
    render(
      <ValuationSummary
        valuations={[makeValuation({ value: 100 })]}
        currency="ARS"
      />,
    );
    expect(screen.getByText("Valor actual")).toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("renders a variation for multiple valuations", () => {
    render(
      <ValuationSummary
        valuations={[
          makeValuation({ id: "v1", value: 100, date: "2026-01-01" }),
          makeValuation({ id: "v2", value: 120, date: "2026-02-01" }),
        ]}
        currency="ARS"
      />,
    );
    expect(screen.getByText("Variación")).toBeInTheDocument();
    expect(screen.getByText("Variación %")).toBeInTheDocument();
  });

  it("shows the history chart and list", () => {
    const valuations = [
      makeValuation({ id: "v1", value: 100, date: "2026-01-01" }),
      makeValuation({ id: "v2", value: 120, date: "2026-02-01" }),
    ];
    render(<ValuationHistory valuations={valuations} currency="ARS" />);
    expect(
      screen.getByRole("img", { name: "Evolución del valor del activo" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Historial de valuaciones")).toBeInTheDocument();
    expect(screen.getByText("2 registros")).toBeInTheDocument();
  });

  it("shows empty states without enough valuations", () => {
    const { unmount } = render(
      <ValuationHistory valuations={[]} currency="ARS" />,
    );
    expect(
      screen.getAllByText(/historial de valuaciones/).length,
    ).toBeGreaterThan(0);
    unmount();

    render(<ValuationHistory valuations={[makeValuation()]} currency="ARS" />);
    expect(screen.getByText("1 registro")).toBeInTheDocument();
  });
});

describe("PositionMetrics / PositionCalculationCard", () => {
  it("renders quote-derived metrics", () => {
    render(<PositionMetrics position={makePosition()} positive />);
    expect(screen.getByText("Detalle de la posición")).toBeInTheDocument();
    expect(screen.getByText("Rentabilidad")).toBeInTheDocument();
  });

  it("renders placeholders when there is no quote", () => {
    render(
      <PositionMetrics
        position={makePosition({
          currentPrice: null,
          currentValue: null,
          profitLoss: null,
          profitLossPct: null,
          quoteDate: null,
        })}
        positive={false}
      />,
    );
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("renders the calculation card", () => {
    render(<PositionCalculationCard />);
    expect(screen.getByText("Cómo se calcula")).toBeInTheDocument();
    expect(screen.getByText("Precio actual")).toBeInTheDocument();
  });
});

describe("AssetDetailView", () => {
  beforeEach(() => {
    seedMockSession();
    vi.restoreAllMocks();
    window.history.replaceState({}, "", "/");
  });
  afterEach(() => {
    resetMockSession();
    window.history.replaceState({}, "", "/");
  });

  const assetId = () =>
    mockState.assets.find((asset) => asset.name === "Departamento")!.id;

  it("renders the asset, valuations and equity", async () => {
    window.history.replaceState(
      {},
      "",
      `/patrimony/assets/detail?id=${assetId()}`,
    );
    renderWithProviders(<AssetDetailView />, { period: ALL_TIME });

    expect((await screen.findAllByText("Departamento")).length).toBeGreaterThan(
      0,
    );
    expect(screen.getByText("Evolución del valor")).toBeInTheDocument();
    expect(screen.getByText("Patrimonio real")).toBeInTheDocument();
    expect(screen.getByText("Información")).toBeInTheDocument();
  });

  it("shows a not-found state", async () => {
    window.history.replaceState({}, "", "/patrimony/assets/detail?id=missing");
    renderWithProviders(<AssetDetailView />, { period: ALL_TIME });
    expect(await screen.findByText("Activo no encontrado")).toBeInTheDocument();
  });

  it("opens the edit dialog and the valuations sheet", async () => {
    const user = userEvent.setup();
    window.history.replaceState(
      {},
      "",
      `/patrimony/assets/detail?id=${assetId()}`,
    );
    renderWithProviders(<AssetDetailView />, { period: ALL_TIME });

    await screen.findAllByText("Departamento");
    await user.click(screen.getByRole("button", { name: "Editar activo" }));
    expect(await screen.findByText("Editar activo")).toBeInTheDocument();
  });

  it("opens the valuations sheet", async () => {
    const user = userEvent.setup();
    window.history.replaceState(
      {},
      "",
      `/patrimony/assets/detail?id=${assetId()}`,
    );
    renderWithProviders(<AssetDetailView />, { period: ALL_TIME });

    await screen.findAllByText("Departamento");
    await user.click(screen.getByRole("button", { name: "Más acciones" }));
    await user.click(
      await screen.findByRole("menuitem", { name: /Valuaciones/ }),
    );
    expect(
      (await screen.findAllByText("Historial de valuaciones")).length,
    ).toBeGreaterThan(0);
  });

  it("archives the asset through the confirm dialog", async () => {
    const user = userEvent.setup();
    const archiveSpy = vi
      .spyOn(mockApi, "archiveAsset")
      .mockResolvedValue({} as never);
    window.history.replaceState(
      {},
      "",
      `/patrimony/assets/detail?id=${assetId()}`,
    );
    renderWithProviders(<AssetDetailView />, { period: ALL_TIME });

    await screen.findAllByText("Departamento");
    await user.click(screen.getByRole("button", { name: "Más acciones" }));
    await user.click(await screen.findByRole("menuitem", { name: /Archivar/ }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Archivar" }));
    await waitFor(() => expect(archiveSpy).toHaveBeenCalled());
  });

  it("omits the equity section when the asset has no linked debt", async () => {
    const vehicle = mockState.assets.find((asset) => asset.name === "Auto")!;
    window.history.replaceState(
      {},
      "",
      `/patrimony/assets/detail?id=${vehicle.id}`,
    );
    renderWithProviders(<AssetDetailView />, { period: ALL_TIME });

    await screen.findAllByText("Auto");
    expect(screen.queryByText("Patrimonio real")).toBeNull();
  });
});

describe("DebtDetailView", () => {
  beforeEach(() => {
    seedMockSession();
    vi.restoreAllMocks();
    window.history.replaceState({}, "", "/");
  });
  afterEach(() => {
    resetMockSession();
    window.history.replaceState({}, "", "/");
  });

  it("renders the debt, linked asset and equity", async () => {
    const debtId = mockState.debts[0].id;
    window.history.replaceState({}, "", `/patrimony/debts/detail?id=${debtId}`);
    renderWithProviders(<DebtDetailView />);

    expect(await screen.findByText("Saldo pendiente")).toBeInTheDocument();
    expect(screen.getAllByText("Activo vinculado").length).toBeGreaterThan(0);
    expect(screen.getByText("Equity del activo")).toBeInTheDocument();
  });

  it("shows a not-found state", async () => {
    window.history.replaceState({}, "", "/patrimony/debts/detail?id=missing");
    renderWithProviders(<DebtDetailView />);
    expect(await screen.findByText("Deuda no encontrada")).toBeInTheDocument();
  });

  it("edits the debt", async () => {
    const user = userEvent.setup();
    const debtId = mockState.debts[0].id;
    window.history.replaceState({}, "", `/patrimony/debts/detail?id=${debtId}`);
    renderWithProviders(<DebtDetailView />);

    await screen.findByText("Saldo pendiente");
    await user.click(screen.getByRole("button", { name: "Editar deuda" }));
    expect(await screen.findByText("Editar deuda")).toBeInTheDocument();
  });

  it("archives the debt through the row menu", async () => {
    const user = userEvent.setup();
    const archiveSpy = vi
      .spyOn(mockApi, "archiveDebt")
      .mockResolvedValue({} as never);
    const debtId = mockState.debts[0].id;
    window.history.replaceState({}, "", `/patrimony/debts/detail?id=${debtId}`);
    renderWithProviders(<DebtDetailView />);

    await screen.findByText("Saldo pendiente");
    await user.click(screen.getByRole("button", { name: "Más acciones" }));
    await user.click(await screen.findByRole("menuitem", { name: /Archivar/ }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Archivar" }));
    await waitFor(() => expect(archiveSpy).toHaveBeenCalled());
  });

  it("renders an unlinked debt without the asset sections", async () => {
    const unlinked = mockState.debts[0];
    vi.spyOn(mockApi, "listDebts").mockResolvedValue([
      { ...unlinked, id: "deb-orphan", assetId: null },
    ]);
    window.history.replaceState(
      {},
      "",
      "/patrimony/debts/detail?id=deb-orphan",
    );
    renderWithProviders(<DebtDetailView />);

    expect(await screen.findByText("Saldo pendiente")).toBeInTheDocument();
    expect(screen.getAllByText(/Sin vincular/).length).toBeGreaterThan(0);
    expect(screen.queryByText("Equity del activo")).toBeNull();
  });
});

describe("PositionDetailView", () => {
  beforeEach(() => {
    seedMockSession();
    vi.restoreAllMocks();
    window.history.replaceState({}, "", "/");
    push.mockClear();
  });
  afterEach(() => {
    resetMockSession();
    window.history.replaceState({}, "", "/");
  });

  const positionId = () => mockState.positions[0].id;

  it("renders the position metrics", async () => {
    window.history.replaceState(
      {},
      "",
      `/patrimony/investments/detail?id=${positionId()}`,
    );
    renderWithProviders(<PositionDetailView />, { period: ALL_TIME });

    expect((await screen.findAllByText("Bitcoin")).length).toBeGreaterThan(0);
    expect(screen.getByText("Detalle de la posición")).toBeInTheDocument();
  });

  it("shows a not-found state", async () => {
    window.history.replaceState(
      {},
      "",
      "/patrimony/investments/detail?id=missing",
    );
    renderWithProviders(<PositionDetailView />, { period: ALL_TIME });
    expect(
      await screen.findByText("Inversión no encontrada"),
    ).toBeInTheDocument();
  });

  it("archives the position from the row menu", async () => {
    const user = userEvent.setup();
    const archiveSpy = vi
      .spyOn(mockApi, "archivePosition")
      .mockResolvedValue({} as never);
    window.history.replaceState(
      {},
      "",
      `/patrimony/investments/detail?id=${positionId()}`,
    );
    renderWithProviders(<PositionDetailView />, { period: ALL_TIME });

    await screen.findAllByText("Bitcoin");
    await user.click(screen.getByRole("button", { name: "Más acciones" }));
    await user.click(await screen.findByRole("menuitem", { name: /Archivar/ }));
    await waitFor(() => expect(archiveSpy).toHaveBeenCalled());
  });

  it("deletes the position and navigates away", async () => {
    const user = userEvent.setup();
    const deleteSpy = vi
      .spyOn(mockApi, "deletePosition")
      .mockResolvedValue(undefined);
    window.history.replaceState(
      {},
      "",
      `/patrimony/investments/detail?id=${positionId()}`,
    );
    renderWithProviders(<PositionDetailView />, { period: ALL_TIME });

    await screen.findAllByText("Bitcoin");
    await user.click(screen.getByRole("button", { name: "Más acciones" }));
    await user.click(await screen.findByRole("menuitem", { name: /Eliminar/ }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Eliminar" }));
    await waitFor(() => expect(deleteSpy).toHaveBeenCalled());
    await waitFor(() => expect(push).toHaveBeenCalledWith("/dashboard"));
  });

  it("restores an archived position", async () => {
    const user = userEvent.setup();
    const restoreSpy = vi
      .spyOn(mockApi, "restorePosition")
      .mockResolvedValue({} as never);
    vi.spyOn(mockApi, "listPositions").mockResolvedValue([
      makePosition({ id: "pos-arch", archived: true }),
    ]);
    window.history.replaceState(
      {},
      "",
      "/patrimony/investments/detail?id=pos-arch",
    );
    renderWithProviders(<PositionDetailView />, { period: ALL_TIME });

    await screen.findAllByText("Bitcoin");
    await user.click(screen.getByRole("button", { name: "Más acciones" }));
    await user.click(
      await screen.findByRole("menuitem", { name: /Restaurar/ }),
    );
    await waitFor(() => expect(restoreSpy).toHaveBeenCalledWith("pos-arch"));
  });

  it("renders a position without a current quote", async () => {
    vi.spyOn(mockApi, "listPositions").mockResolvedValue([
      makePosition({
        id: "pos-noquote",
        currentPrice: null,
        currentValue: null,
        profitLoss: null,
        profitLossPct: null,
        quoteDate: null,
        quoteProvider: null,
        isStale: false,
      }),
    ]);
    window.history.replaceState(
      {},
      "",
      "/patrimony/investments/detail?id=pos-noquote",
    );
    renderWithProviders(<PositionDetailView />, { period: ALL_TIME });

    expect(
      await screen.findByText("Sin cotización actual"),
    ).toBeInTheDocument();
  });

  it("warns about a stale quote without a date and shows a loss", async () => {
    vi.spyOn(mockApi, "listPositions").mockResolvedValue([
      makePosition({
        id: "pos-stale",
        isStale: true,
        quoteDate: null,
        profitLoss: -120,
        profitLossPct: -8,
      }),
    ]);
    window.history.replaceState(
      {},
      "",
      "/patrimony/investments/detail?id=pos-stale",
    );
    renderWithProviders(<PositionDetailView />, { period: ALL_TIME });

    expect(
      await screen.findByText("Cotización desactualizada"),
    ).toBeInTheDocument();
    expect(screen.getByText("Detalle de la posición")).toBeInTheDocument();
  });
});
