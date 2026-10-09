import { waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useBudgetDetail } from "@/components/features/budgets/budget-detail-view/hooks/use-budget-detail";
import { monthInputValue } from "@/lib/format";
import { mockState } from "@/lib/mocks/store";
import { renderHookWithProviders } from "@/lib/test/render";
import { resetMockSession, seedMockSession } from "@/lib/test/mock-session";

describe("useBudgetDetail", () => {
  beforeEach(() => {
    seedMockSession();
  });

  afterEach(() => {
    resetMockSession();
    window.history.replaceState({}, "", "/");
  });

  it("resolves the budget and maps categories and accounts", async () => {
    const budget = mockState.budgets[0];
    const month = monthInputValue(budget.period);
    window.history.replaceState(
      {},
      "",
      `/budgets/detail?id=${budget.id}&period=${month}`,
    );

    const { result } = renderHookWithProviders(() => useBudgetDetail());

    await waitFor(() => expect(result.current.budget?.id).toBe(budget.id));
    expect(result.current.month).toBe(month);
    expect(result.current.categoryById.get(budget.categoryId)?.name).toBe(
      budget.category.name,
    );
    for (const account of mockState.accounts) {
      expect(result.current.accountNameById.get(account.id)).toBe(account.name);
    }
  });

  it("exposes pagination from the transactions response", async () => {
    const budget = mockState.budgets[0];
    const month = monthInputValue(budget.period);
    window.history.replaceState(
      {},
      "",
      `/budgets/detail?id=${budget.id}&period=${month}`,
    );

    const { result } = renderHookWithProviders(() => useBudgetDetail());
    await waitFor(() => expect(result.current.pagination).toBeDefined());
    expect(result.current.pagination?.pageSize).toBe(10);
    expect(result.current.pagination?.page).toBe(1);
  });
});
