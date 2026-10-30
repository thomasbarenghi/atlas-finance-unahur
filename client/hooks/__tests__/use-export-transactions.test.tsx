import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Transaction } from "@/lib/api/types";
import { downloadCsv } from "@/lib/csv";
import { useExportTransactions } from "@/hooks/use-export-transactions";

vi.mock("@/lib/csv", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/csv")>();
  return { ...actual, downloadCsv: vi.fn() };
});

vi.mock("@/lib/query/accounts", () => ({
  useAccounts: () => ({
    data: [
      {
        id: "account-1",
        name: "Caja",
        type: "cash",
        currency: "ARS",
        initialBalance: 0,
        currentBalance: 0,
        notes: null,
        createdAt: "2026-10-01T00:00:00.000Z",
        updatedAt: "2026-10-01T00:00:00.000Z",
      },
    ],
  }),
}));

vi.mock("@/lib/query/categories", () => ({
  useCategories: () => ({
    data: [
      {
        id: "category-1",
        name: "Supermercado",
        type: "expense",
        color: "#ef4444",
        icon: null,
      },
    ],
  }),
}));

vi.mock("@/lib/query/transactions", () => ({
  useTransactions: () => ({ data: { items: [], total: 0 } }),
}));

const transaction: Transaction = {
  id: "transaction-1",
  type: "expense",
  amount: 12000,
  date: "2026-10-01",
  description: "Compra",
  notes: null,
  accountId: "account-1",
  transferAccountId: null,
  categoryId: "category-1",
  transferGroupId: null,
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
};

describe("useExportTransactions", () => {
  it("exports the amount as a raw decimal number", () => {
    const { result } = renderHook(() => useExportTransactions());

    act(() => result.current.exportTransactions([transaction]));

    expect(downloadCsv).toHaveBeenCalledTimes(1);
    const [filename, csv] = vi.mocked(downloadCsv).mock.calls[0];

    expect(filename).toMatch(/^movimientos-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(csv).toContain('"12000"');
    expect(csv).not.toContain("$");
  });
});
