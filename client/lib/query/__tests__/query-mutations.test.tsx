import type { PropsWithChildren } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  useArchivePosition,
  useCreatePosition,
  useDeletePosition,
  useRestorePosition,
  useUpdatePosition,
} from "@/lib/query/positions";
import {
  useCopyPreviousBudgets,
  useDeleteBudget,
  useUpdateBudget,
} from "@/lib/query/budgets";
import {
  useDeleteTransaction,
  useUpdateTransaction,
} from "@/lib/query/transactions";
import { useArchiveCategory, useUpdateCategory } from "@/lib/query/categories";
import {
  useArchiveAsset,
  useCreateValuation,
  useUpdateAsset,
} from "@/lib/query/assets";
import { useArchiveDebt, useUpdateDebt } from "@/lib/query/debts";
import {
  useArchiveGoal,
  useRestoreGoal,
  useUpdateGoal,
} from "@/lib/query/goals";
import { useForgotPassword, useMe, useResetPassword } from "@/lib/query/auth";
import { queryKeys } from "@/lib/query/keys";
import { resetMockSession, seedMockSession } from "@/lib/test/mock-session";
import { mockState } from "@/lib/mocks/store";

const newClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 5 * 60_000 },
      mutations: { retry: false },
    },
  });

const wrapperFor = (queryClient: QueryClient) => {
  const Wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return Wrapper;
};

describe("query mutations", () => {
  beforeEach(() => seedMockSession());
  afterEach(() => resetMockSession());

  it("covers position mutations and invalidations", async () => {
    const queryClient = newClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const wrapper = wrapperFor(queryClient);
    const account = mockState.positions[0];

    const create = renderHook(() => useCreatePosition(), { wrapper });
    await act(async () => {
      await create.result.current.mutateAsync({
        symbol: "SOL",
        instrument: "Solana",
        quantity: 2,
        avgCost: 10,
        currency: "USD",
      });
    });

    const update = renderHook(() => useUpdatePosition(), { wrapper });
    await act(async () => {
      await update.result.current.mutateAsync({
        id: account.id,
        input: { quantity: 3 },
      });
    });

    const archive = renderHook(() => useArchivePosition(), { wrapper });
    await act(async () => {
      await archive.result.current.mutateAsync(account.id);
    });

    const restore = renderHook(() => useRestorePosition(), { wrapper });
    await act(async () => {
      await restore.result.current.mutateAsync(account.id);
    });

    const remove = renderHook(() => useDeletePosition(), { wrapper });
    await act(async () => {
      await remove.result.current.mutateAsync(account.id);
    });

    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.positions });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: queryKeys.dashboardBase,
    });
  });

  it("covers budget update/delete/copy mutations", async () => {
    const queryClient = newClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const wrapper = wrapperFor(queryClient);
    const budget = mockState.budgets[0];

    const update = renderHook(() => useUpdateBudget(), { wrapper });
    await act(async () => {
      await update.result.current.mutateAsync({
        id: budget.id,
        input: { limit: 9 },
      });
    });

    const copy = renderHook(() => useCopyPreviousBudgets(), { wrapper });
    await act(async () => {
      await copy.result.current.mutateAsync({ period: "2026-01" });
    });

    const remove = renderHook(() => useDeleteBudget(), { wrapper });
    await act(async () => {
      await remove.result.current.mutateAsync(budget.id);
    });

    expect(invalidate).toHaveBeenCalledWith({
      queryKey: queryKeys.budgetsBase,
    });
  });

  it("covers transaction update/delete mutations", async () => {
    const queryClient = newClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const wrapper = wrapperFor(queryClient);
    const transaction = mockState.transactions[0];

    const update = renderHook(() => useUpdateTransaction(), { wrapper });
    await act(async () => {
      await update.result.current.mutateAsync({
        id: transaction.id,
        input: { description: "Editado" },
      });
    });

    const remove = renderHook(() => useDeleteTransaction(), { wrapper });
    await act(async () => {
      await remove.result.current.mutateAsync(transaction.id);
    });

    expect(invalidate).toHaveBeenCalledWith({
      queryKey: queryKeys.transactionsBase,
    });
  });

  it("covers category/asset/debt/goal mutations", async () => {
    const queryClient = newClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const wrapper = wrapperFor(queryClient);

    const category = renderHook(() => useUpdateCategory(), { wrapper });
    await act(async () => {
      await category.result.current.mutateAsync({
        id: mockState.categories.find((c) => !c.isSystem)!.id,
        input: { name: "Editada" },
      });
    });
    const archiveCategory = renderHook(() => useArchiveCategory(), { wrapper });
    await act(async () => {
      await archiveCategory.result.current.mutateAsync(
        mockState.categories.find((c) => !c.isSystem)!.id,
      );
    });

    const asset = renderHook(() => useUpdateAsset(), { wrapper });
    await act(async () => {
      await asset.result.current.mutateAsync({
        id: mockState.assets[0].id,
        input: { name: "Editado" },
      });
    });
    const valuation = renderHook(() => useCreateValuation(), { wrapper });
    await act(async () => {
      await valuation.result.current.mutateAsync({
        assetId: mockState.assets[0].id,
        input: { value: 1, currency: "ARS", date: "2026-01-01" },
      });
    });
    const archiveAsset = renderHook(() => useArchiveAsset(), { wrapper });
    await act(async () => {
      await archiveAsset.result.current.mutateAsync(mockState.assets[0].id);
    });

    const debt = renderHook(() => useUpdateDebt(), { wrapper });
    await act(async () => {
      await debt.result.current.mutateAsync({
        id: mockState.debts[0].id,
        input: { balance: 5 },
      });
    });
    const archiveDebt = renderHook(() => useArchiveDebt(), { wrapper });
    await act(async () => {
      await archiveDebt.result.current.mutateAsync(mockState.debts[0].id);
    });

    const goal = renderHook(() => useUpdateGoal(), { wrapper });
    await act(async () => {
      await goal.result.current.mutateAsync({
        id: mockState.goals[0].id,
        input: { name: "Editada" },
      });
    });
    const archiveGoal = renderHook(() => useArchiveGoal(), { wrapper });
    await act(async () => {
      await archiveGoal.result.current.mutateAsync(mockState.goals[0].id);
    });
    const restoreGoal = renderHook(() => useRestoreGoal(), { wrapper });
    await act(async () => {
      await restoreGoal.result.current.mutateAsync(mockState.goals[0].id);
    });

    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.categories });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.assets });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.debts });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.goals });
  });

  it("covers the current-user query and password flows", async () => {
    const queryClient = newClient();
    const wrapper = wrapperFor(queryClient);

    const me = renderHook(() => useMe(), { wrapper });
    await waitFor(() => expect(me.result.current.isSuccess).toBe(true));
    expect(me.result.current.data?.email).toBe("demo@atlassfin.app");

    const forgot = renderHook(() => useForgotPassword(), { wrapper });
    await act(async () => {
      await forgot.result.current.mutateAsync({ email: "demo@atlassfin.app" });
    });

    const reset = renderHook(() => useResetPassword(), { wrapper });
    await act(async () => {
      await reset.result.current.mutateAsync({
        token: "t",
        password: "Password1",
      });
    });
    await waitFor(() => expect(reset.result.current.isSuccess).toBe(true));
  });
});
