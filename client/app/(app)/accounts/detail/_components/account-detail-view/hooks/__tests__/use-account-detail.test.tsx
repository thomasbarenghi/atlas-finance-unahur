import { waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useAccountDetail } from "@/app/(app)/accounts/detail/_components/account-detail-view/hooks/use-account-detail";
import { renderHookWithProviders } from "@/lib/test/render";
import { testState } from "@/lib/test/api-state";
import { setupTestServer } from "@/lib/test/server";

setupTestServer();

describe("useAccountDetail", () => {
  afterEach(() => {
    window.history.replaceState({}, "", "/");
  });

  it("resolves the account from the id query param and summarizes its movements", async () => {
    const bank = testState.accounts.find(
      (account) => account.name === "Banco ARS",
    )!;
    window.history.replaceState({}, "", `/accounts/detail?id=${bank.id}`);

    const { result } = renderHookWithProviders(() => useAccountDetail());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await waitFor(() =>
      expect(result.current.movementCount).toBeGreaterThan(0),
    );

    expect(result.current.account?.id).toBe(bank.id);
    const expectedCount = testState.transactions.filter(
      (transaction) => transaction.accountId === bank.id,
    ).length;
    expect(result.current.movementCount).toBe(expectedCount);
    expect(result.current.summary.income).toBeGreaterThan(0);
    expect(result.current.summary.expense).toBeGreaterThan(0);
  });

  it("returns no account when the id is missing", async () => {
    window.history.replaceState({}, "", "/accounts/detail");
    const { result } = renderHookWithProviders(() => useAccountDetail());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.account).toBeUndefined();
  });
});
