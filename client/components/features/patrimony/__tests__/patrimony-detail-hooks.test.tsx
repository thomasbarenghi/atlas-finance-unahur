import { waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useAssetDetail } from "@/components/features/patrimony/asset-detail-view/hooks/use-asset-detail";
import { useDebtDetail } from "@/components/features/patrimony/debt-detail-view/hooks/use-debt-detail";
import { usePositionDetail } from "@/components/features/patrimony/position-detail-view/hooks/use-position-detail";
import { mockState } from "@/lib/mocks/store";
import { renderHookWithProviders } from "@/lib/test/render";
import { resetMockSession, seedMockSession } from "@/lib/test/mock-session";

const ALL_TIME = { from: "2000-01-01", to: "2100-01-01" };

describe("patrimony detail hooks", () => {
  beforeEach(() => {
    seedMockSession();
  });

  afterEach(() => {
    resetMockSession();
    window.history.replaceState({}, "", "/");
  });

  it("useAssetDetail resolves the asset, its valuations and linked debt", async () => {
    const asset = mockState.assets.find(
      (item) => item.name === "Departamento",
    )!;
    window.history.replaceState(
      {},
      "",
      `/patrimony/assets/detail?id=${asset.id}`,
    );

    const { result } = renderHookWithProviders(() => useAssetDetail());
    await waitFor(() => expect(result.current.asset?.id).toBe(asset.id));
    await waitFor(() =>
      expect(result.current.valuations.length).toBeGreaterThan(0),
    );
    expect(result.current.linkedDebt?.name).toBe("Hipoteca");
  });

  it("useDebtDetail resolves the debt and its linked asset", async () => {
    const debt = mockState.debts[0];
    window.history.replaceState(
      {},
      "",
      `/patrimony/debts/detail?id=${debt.id}`,
    );

    const { result } = renderHookWithProviders(() => useDebtDetail());
    await waitFor(() => expect(result.current.debt?.id).toBe(debt.id));
    expect(result.current.linkedAsset?.id).toBe(debt.assetId);
  });

  it("usePositionDetail resolves the position and its converted value", async () => {
    const position = mockState.positions[0];
    window.history.replaceState(
      {},
      "",
      `/patrimony/investments/detail?id=${position.id}`,
    );

    const { result } = renderHookWithProviders(() => usePositionDetail(), {
      period: ALL_TIME,
    });
    await waitFor(() => expect(result.current.position?.id).toBe(position.id));
    await waitFor(() => expect(result.current.convertedValue).not.toBeNull());
    expect(result.current.displayCurrency).toBe("ARS");
  });
});
