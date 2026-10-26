import { waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useAccountDetail } from "@/app/(app)/accounts/detail/_components/account-detail-view/hooks/use-account-detail";
import { renderHookWithProviders } from "@/lib/test/render";
import { testState } from "@/lib/test/api-state";
import { setSearchParams } from "@/lib/test/next-navigation";
import { setupTestServer } from "@/lib/test/server";

vi.mock("next/navigation", () => import("@/lib/test/next-navigation"));

setupTestServer();

describe("useAccountDetail", () => {
  it("resolves the account from the id query param and summarizes its movements", async () => {
    const bank = testState.accounts.find(
      (account) => account.name === "Banco ARS",
    )!;
    setSearchParams(new URLSearchParams({ id: bank.id }));

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
    setSearchParams(new URLSearchParams());
    const { result } = renderHookWithProviders(() => useAccountDetail());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.account).toBeUndefined();
  });
});
