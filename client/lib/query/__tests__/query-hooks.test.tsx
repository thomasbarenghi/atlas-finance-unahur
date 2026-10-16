import type { PropsWithChildren } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  useAccounts,
  useCreateAccount,
  useDeleteAccount,
} from "@/lib/query/accounts";
import {
  useCreateTransaction,
  useTransactions,
} from "@/lib/query/transactions";
import { useLogin, useLogout, useRegister } from "@/lib/query/auth";
import { useUpdateMe } from "@/lib/query/users";
import { useCategories } from "@/lib/query/categories";
import { useDashboard } from "@/lib/query/dashboard";
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

  it("deletes an account", async () => {
    const { result } = renderHook(() => useDeleteAccount(), {
      wrapper: createWrapper(newClient()),
    });
    const target = mockState.accounts[0];
    await act(async () => {
      await result.current.mutateAsync(target.id);
    });
    expect(mockState.accounts.find((a) => a.id === target.id)).toBeUndefined();
  });

  it("lists transactions and keys the query by the pagination params", async () => {
    const queryClient = newClient();
    const params = { page: 1, pageSize: 5 };
    const { result } = renderHook(() => useTransactions(params), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.pageSize).toBe(5);
    expect(
      queryClient.getQueryState(queryKeys.transactions(params)),
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
      queryKey: queryKeys.dashboardBase,
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

  it("loads categories", async () => {
    const { result } = renderHook(() => useCategories(), {
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
    expect(result.current.data?.currency).toBe("ARS");
  });
});
