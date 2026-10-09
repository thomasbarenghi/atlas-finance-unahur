import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AssetFormDialog } from "@/components/features/assets/asset-form-dialog";
import { DebtFormDialog } from "@/components/features/assets/debt-form-dialog";
import { PositionFormDialog } from "@/components/features/assets/position-form-dialog";
import { ValuationSheet } from "@/components/features/assets/valuation-sheet";
import { mockApi } from "@/lib/mocks/api";
import {
  makeAsset,
  makeDebt,
  makePosition,
  makeValuation,
} from "@/lib/test/factories";
import { renderWithProviders } from "@/lib/test/render";
import { validateApiPayload, apiRequestDtos } from "@/lib/test/api-contracts";
import { resetMockSession, seedMockSession } from "@/lib/test/mock-session";

describe("AssetFormDialog", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("creates a valid CreateAssetDto payload", async () => {
    const user = userEvent.setup();
    const createSpy = vi
      .spyOn(mockApi, "createAsset")
      .mockResolvedValue(makeAsset());
    renderWithProviders(<AssetFormDialog open onOpenChange={vi.fn()} />);

    await user.type(screen.getByPlaceholderText("Departamento"), "Casa");
    await user.type(screen.getByLabelText("Valor inicial"), "85000000");
    await user.click(screen.getByRole("button", { name: "Crear activo" }));

    await waitFor(() => expect(createSpy).toHaveBeenCalledTimes(1));
    const payload = createSpy.mock.calls[0][0];
    expect(payload).toMatchObject({
      name: "Casa",
      initialValue: 85000000,
      type: "property",
    });
    const result = await validateApiPayload(
      apiRequestDtos.CreateAssetDto,
      payload,
    );
    expect(result.errors).toEqual([]);
  });

  it("registers a new valuation when editing with a different value", async () => {
    const user = userEvent.setup();
    const asset = makeAsset({ id: "asset-1", currentValue: 85000000 });
    const updateSpy = vi.spyOn(mockApi, "updateAsset").mockResolvedValue(asset);
    const valuationSpy = vi
      .spyOn(mockApi, "createValuation")
      .mockResolvedValue(makeValuation());
    renderWithProviders(
      <AssetFormDialog open onOpenChange={vi.fn()} asset={asset} />,
    );

    await user.type(screen.getByPlaceholderText("Igual al actual"), "90000000");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(updateSpy).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(valuationSpy).toHaveBeenCalledTimes(1));
    expect(valuationSpy).toHaveBeenCalledWith(
      "asset-1",
      expect.objectContaining({ value: 90000000, source: "manual" }),
    );
  });
});

describe("DebtFormDialog", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("creates a valid CreateDebtDto payload with no linked asset", async () => {
    const user = userEvent.setup();
    const createSpy = vi
      .spyOn(mockApi, "createDebt")
      .mockResolvedValue(makeDebt());
    renderWithProviders(
      <DebtFormDialog open onOpenChange={vi.fn()} assets={[]} />,
    );

    await user.type(screen.getByPlaceholderText("Hipoteca"), "Préstamo");
    await user.type(screen.getByLabelText("Saldo actual"), "1000000");
    await user.click(screen.getByRole("button", { name: "Crear deuda" }));

    await waitFor(() => expect(createSpy).toHaveBeenCalledTimes(1));
    const payload = createSpy.mock.calls[0][0];
    expect(payload).toMatchObject({
      name: "Préstamo",
      balance: 1000000,
      assetId: null,
    });
    const result = await validateApiPayload(
      apiRequestDtos.CreateDebtDto,
      payload,
    );
    expect(result.errors).toEqual([]);
  });
});

describe("PositionFormDialog", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("creates a valid CreatePositionDto payload", async () => {
    const user = userEvent.setup();
    const createSpy = vi
      .spyOn(mockApi, "createPosition")
      .mockResolvedValue(makePosition());
    renderWithProviders(<PositionFormDialog open onOpenChange={vi.fn()} />);

    await user.type(screen.getByPlaceholderText("Bitcoin"), "Bitcoin");
    await user.type(screen.getByLabelText("Símbolo"), "BTC");
    await user.type(screen.getByLabelText("Cantidad"), "0.05");
    await user.type(screen.getByLabelText("Costo promedio"), "55000");
    await user.click(screen.getByRole("button", { name: "Crear posición" }));

    await waitFor(() => expect(createSpy).toHaveBeenCalledTimes(1));
    const payload = createSpy.mock.calls[0][0];
    expect(payload).toMatchObject({
      symbol: "BTC",
      instrument: "Bitcoin",
      quantity: 0.05,
      avgCost: 55000,
      currency: "USD",
    });
    const result = await validateApiPayload(
      apiRequestDtos.CreatePositionDto,
      payload,
    );
    expect(result.errors).toEqual([]);
  });
});

describe("ValuationSheet", () => {
  beforeEach(() => {
    seedMockSession();
    vi.restoreAllMocks();
  });
  afterEach(() => resetMockSession());

  it("creates a valuation for the selected asset", async () => {
    const user = userEvent.setup();
    const asset = makeAsset({ id: "asset-1", currency: "ARS" });
    const createSpy = vi
      .spyOn(mockApi, "createValuation")
      .mockResolvedValue(makeValuation());
    renderWithProviders(
      <ValuationSheet asset={asset} open onOpenChange={vi.fn()} />,
    );

    await user.type(screen.getByLabelText("Valor"), "90000000");
    await user.click(screen.getByRole("button", { name: "Agregar valuación" }));

    await waitFor(() => expect(createSpy).toHaveBeenCalledTimes(1));
    const [assetId, payload] = createSpy.mock.calls[0];
    expect(assetId).toBe("asset-1");
    const result = await validateApiPayload(
      apiRequestDtos.CreateValuationDto,
      payload,
    );
    expect(result.errors).toEqual([]);
  });

  it("disables the form and shows an empty history without an asset", async () => {
    renderWithProviders(
      <ValuationSheet asset={null} open onOpenChange={vi.fn()} />,
    );
    expect(
      screen.getByRole("button", { name: "Agregar valuación" }),
    ).toBeDisabled();
    expect(
      await screen.findByText(/Todavía no hay valuaciones/),
    ).toBeInTheDocument();
  });
});
