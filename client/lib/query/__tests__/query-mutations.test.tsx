import type { PropsWithChildren } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  useCreateAccount,
  useDeleteAccount,
  useUpdateAccount,
} from "@/lib/query/accounts";
import {
  useDeleteTransaction,
  useUpdateTransaction,
} from "@/lib/query/transactions";
import { useMe } from "@/lib/query/auth";
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

  it("covers account create/update/delete mutations", async () => {
    const queryClient = newClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const wrapper = wrapperFor(queryClient);

    const create = renderHook(() => useCreateAccount(), { wrapper });
    await act(async () => {
      await create.result.current.mutateAsync({
        name: "Nueva",
        type: "wallet",
        initialBalance: 0,
      });
    });

    const account = mockState.accounts[0];
    const update = renderHook(() => useUpdateAccount(), { wrapper });
    await act(async () => {
      await update.result.current.mutateAsync({
        id: account.id,
        input: { name: "Renombrada" },
      });
    });

    const remove = renderHook(() => useDeleteAccount(), { wrapper });
    await act(async () => {
      await remove.result.current.mutateAsync(account.id);
    });

    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.accounts });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: queryKeys.transactionsBase,
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: queryKeys.dashboardBase,
    });
  });

  it("covers transaction update and delete mutations", async () => {
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
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.accounts });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: queryKeys.dashboardBase,
    });
  });

  it("covers the current-user query", async () => {
    const queryClient = newClient();
    const wrapper = wrapperFor(queryClient);

    const me = renderHook(() => useMe(), { wrapper });
    await waitFor(() => expect(me.result.current.isSuccess).toBe(true));
    expect(me.result.current.data?.email).toBe("demo@atlassfin.app");
  });
});
