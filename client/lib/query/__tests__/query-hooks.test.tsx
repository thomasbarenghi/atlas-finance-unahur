import type { PropsWithChildren } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  useAccounts,
  useArchiveAccount,
  useCreateAccount,
} from "@/lib/query/accounts";
import {
  useCreateTransaction,
  useTransactions,
} from "@/lib/query/transactions";
import { useBudgets, useCreateBudget } from "@/lib/query/budgets";
import { useLogin, useLogout, useRegister } from "@/lib/query/auth";
import { useUpdateMe } from "@/lib/query/users";
import { useCategories } from "@/lib/query/categories";
import { useGoals } from "@/lib/query/goals";
import { useAssets, useValuations } from "@/lib/query/assets";
import { useDebts } from "@/lib/query/debts";
import { usePositions } from "@/lib/query/positions";
import { useDashboard } from "@/lib/query/dashboard";
import { useQuotes } from "@/lib/query/quotes";
import { useCurrencies } from "@/lib/query/reference";
import {
  useClearConversations,
  useConversations,
  useDeleteConversation,
} from "@/lib/query/assistant";
import { queryKeys } from "@/lib/query/keys";
import { resetMockSession, seedMockSession } from "@/lib/test/mock-session";
import { mockState } from "@/lib/mocks/store";

const createWrapper = (queryClient: QueryClient) => {
  const Wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return Wrapper;
};

const newClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 5 * 60_000, staleTime: 0 },
      mutations: { retry: false },
    },
  });

describe("data query hooks", () => {
  beforeEach(() => {
    seedMockSession();
  });

  afterEach(() => {
    resetMockSession();
  });

  it("loads accounts from the API", async () => {
    const { result } = renderHook(() => useAccounts(), {
      wrapper: createWrapper(newClient()),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.length).toBe(mockState.accounts.length);
  });

  it("creates an account and invalidates account, transaction and dashboard views", async () => {
    const queryClient = newClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useCreateAccount(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        name: "Nueva",
        type: "cash",
        currency: "ARS",
        initialBalance: 100,
        notes: null,
      });
    });

    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.accounts });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: queryKeys.transactionsBase,
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: queryKeys.dashboardBase,
    });
  });

  it("archives an account", async () => {
    const { result } = renderHook(() => useArchiveAccount(), {
      wrapper: createWrapper(newClient()),
    });
    const target = mockState.accounts[0];
    await act(async () => {
      await result.current.mutateAsync(target.id);
    });
    expect(mockState.accounts.find((a) => a.id === target.id)?.archived).toBe(
      true,
    );
  });

  it("passes transaction filters to the API and keys the query by filters", async () => {
    const queryClient = newClient();
    const filters = { type: "expense" as const, page: 1, pageSize: 5 };
    const { result } = renderHook(() => useTransactions(filters), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.pageSize).toBe(5);
    expect(result.current.data?.items.every((t) => t.type === "expense")).toBe(
      true,
    );
    expect(
      queryClient.getQueryState(queryKeys.transactions(filters)),
    ).toBeDefined();
  });

  it("creates a transaction and invalidates dependent views", async () => {
    const queryClient = newClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useCreateTransaction(), {
      wrapper: createWrapper(queryClient),
    });
    const account = mockState.accounts[0];

    await act(async () => {
      await result.current.mutateAsync({
        type: "income",
        amount: 500,
        currency: account.currency,
        date: "2026-01-10",
        description: "Regalo",
        notes: null,
        accountId: account.id,
        categoryId: null,
        transferAccountId: null,
      });
    });

    expect(invalidate).toHaveBeenCalledWith({
      queryKey: queryKeys.transactionsBase,
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.accounts });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: queryKeys.budgetsBase,
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: queryKeys.dashboardBase,
    });
  });

  it("keys budgets by period and invalidates on create", async () => {
    const queryClient = newClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useBudgets("2026-01-01"), {
      wrapper: createWrapper(queryClient),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(
      queryClient.getQueryState(queryKeys.budgets("2026-01-01")),
    ).toBeDefined();

    const create = renderHook(() => useCreateBudget(), {
      wrapper: createWrapper(queryClient),
    });
    const category = mockState.categories.find((c) => c.type === "expense")!;
    await act(async () => {
      await create.result.current.mutateAsync({
        categoryId: category.id,
        period: "2026-01-01",
        limit: 1000,
        currency: "ARS",
        recurring: false,
      });
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: queryKeys.budgetsBase,
    });
  });

  it("logs in, seeds the current user and clears the session on logout", async () => {
    const queryClient = newClient();
    const login = renderHook(() => useLogin(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await login.result.current.mutateAsync({
        email: "demo@atlassfin.app",
        password: "Demo1234!",
      });
    });
    expect(queryClient.getQueryData(queryKeys.auth.me)).toMatchObject({
      email: "demo@atlassfin.app",
    });

    const logout = renderHook(() => useLogout(), {
      wrapper: createWrapper(queryClient),
    });
    await act(async () => {
      await logout.result.current.mutateAsync();
    });
    // `useLogout` clears the whole query cache, so the auth entry is gone.
    expect(queryClient.getQueryData(queryKeys.auth.me)).toBeUndefined();
  });

  it("rejects login with invalid credentials", async () => {
    const login = renderHook(() => useLogin(), {
      wrapper: createWrapper(newClient()),
    });
    await expect(
      login.result.current.mutateAsync({
        email: "demo@atlassfin.app",
        password: "wrong",
      }),
    ).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });
  });

  it("registers a new user", async () => {
    const queryClient = newClient();
    const register = renderHook(() => useRegister(), {
      wrapper: createWrapper(queryClient),
    });
    await act(async () => {
      await register.result.current.mutateAsync({
        name: "Ana",
        email: "ana@example.com",
        password: "Password1",
      });
    });
    expect(queryClient.getQueryData(queryKeys.auth.me)).toMatchObject({
      email: "ana@example.com",
    });
  });

  it("updates the profile and mirrors it into the auth cache", async () => {
    const queryClient = newClient();
    const { result } = renderHook(() => useUpdateMe(), {
      wrapper: createWrapper(queryClient),
    });
    await act(async () => {
      await result.current.mutateAsync({ name: "Nuevo Nombre" });
    });
    expect(queryClient.getQueryData(queryKeys.auth.me)).toMatchObject({
      name: "Nuevo Nombre",
    });
  });

  it("loads the remaining domain collections", async () => {
    const wrapper = createWrapper(newClient());
    const categories = renderHook(() => useCategories(), { wrapper });
    const goals = renderHook(() => useGoals(), { wrapper });
    const assets = renderHook(() => useAssets(), { wrapper });
    const debts = renderHook(() => useDebts(), { wrapper });
    const positions = renderHook(() => usePositions(), { wrapper });
    const quotes = renderHook(() => useQuotes(), { wrapper });
    const currencies = renderHook(() => useCurrencies(), { wrapper });
    const conversations = renderHook(() => useConversations(), { wrapper });

    await waitFor(() => {
      expect(categories.result.current.isSuccess).toBe(true);
      expect(goals.result.current.isSuccess).toBe(true);
      expect(assets.result.current.isSuccess).toBe(true);
      expect(debts.result.current.isSuccess).toBe(true);
      expect(positions.result.current.isSuccess).toBe(true);
      expect(quotes.result.current.isSuccess).toBe(true);
      expect(currencies.result.current.isSuccess).toBe(true);
      expect(conversations.result.current.isSuccess).toBe(true);
    });

    expect(categories.result.current.data?.length).toBeGreaterThan(0);
    expect(currencies.result.current.data?.supported).toContain("ARS");
    expect(Array.isArray(conversations.result.current.data?.items)).toBe(true);
    expect(conversations.result.current.data?.total).toBe(
      conversations.result.current.data?.items?.length,
    );
  });

  it("loads valuations for an owned asset", async () => {
    const asset = mockState.assets[0];
    const { result } = renderHook(() => useValuations(asset.id), {
      wrapper: createWrapper(newClient()),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.length).toBeGreaterThan(0);
  });

  it("does not run the dashboard query without a period", () => {
    const { result } = renderHook(() => useDashboard({ from: "", to: "" }), {
      wrapper: createWrapper(newClient()),
    });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("loads the dashboard for a valid period", async () => {
    const { result } = renderHook(
      () => useDashboard({ from: "2026-01-01", to: "2026-01-31" }),
      { wrapper: createWrapper(newClient()) },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.period).toEqual({
      from: "2026-01-01",
      to: "2026-01-31",
    });
  });

  it("clears and deletes assistant conversations", async () => {
    const queryClient = newClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const clear = renderHook(() => useClearConversations(), {
      wrapper: createWrapper(queryClient),
    });
    await act(async () => {
      await clear.result.current.mutateAsync();
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: queryKeys.conversations,
    });

    const del = renderHook(() => useDeleteConversation(), {
      wrapper: createWrapper(queryClient),
    });
    await act(async () => {
      await del.result.current.mutateAsync("conversation-1");
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: queryKeys.conversations,
    });
  });
});
