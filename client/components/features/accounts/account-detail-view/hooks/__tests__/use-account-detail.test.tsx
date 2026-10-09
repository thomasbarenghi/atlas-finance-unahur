import { waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useAccountDetail } from "@/components/features/accounts/account-detail-view/hooks/use-account-detail";
import { mockState } from "@/lib/mocks/store";
import { renderHookWithProviders } from "@/lib/test/render";
import { resetMockSession, seedMockSession } from "@/lib/test/mock-session";

const ALL_TIME = { from: "2000-01-01", to: "2100-01-01" };

describe("useAccountDetail", () => {
  beforeEach(() => {
    seedMockSession();
  });

  afterEach(() => {
    resetMockSession();
    window.history.replaceState({}, "", "/");
  });

  it("resolves the account from the id query param and summarizes its movements", async () => {
    const bank = mockState.accounts.find(
      (account) => account.name === "Banco ARS",
    )!;
    window.history.replaceState({}, "", `/accounts/detail?id=${bank.id}`);

    const { result } = renderHookWithProviders(() => useAccountDetail(), {
      period: ALL_TIME,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await waitFor(() =>
      expect(result.current.movementCount).toBeGreaterThan(0),
    );

    expect(result.current.account?.id).toBe(bank.id);
    const expectedCount = mockState.transactions.filter(
      (transaction) => transaction.accountId === bank.id,
    ).length;
    expect(result.current.movementCount).toBe(expectedCount);
    expect(result.current.summary.income).toBeGreaterThan(0);
    expect(result.current.summary.expense).toBeGreaterThan(0);
  });

  it("returns no account when the id is missing", async () => {
    window.history.replaceState({}, "", "/accounts/detail");
    const { result } = renderHookWithProviders(() => useAccountDetail(), {
      period: ALL_TIME,
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.account).toBeUndefined();
  });
});
