import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TransactionFiltersSheet } from "@/components/features/transactions/transaction-filters-sheet";
import type { TransactionFilterState } from "@/components/features/transactions/transaction-filters-sheet/transaction-filters-sheet.types";
import { makeAccount, makeCategory } from "@/lib/test/factories";

const EMPTY_FILTERS: TransactionFilterState = {
  type: "",
  accountId: "",
  categoryId: "",
  from: "",
  to: "",
};

describe("TransactionFiltersSheet", () => {
  it("opens the bottom sheet and propagates filter changes", async () => {
    const user = userEvent.setup();
    const onFilterChange = vi.fn();
    render(
      <TransactionFiltersSheet
        filters={EMPTY_FILTERS}
        onFilterChange={onFilterChange}
        onClear={vi.fn()}
        accounts={[makeAccount({ id: "acc-1", name: "Caja" })]}
        categories={[makeCategory({ id: "cat-1", name: "Comida" })]}
        activeCount={0}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Filtros" }));
    await user.click(
      await screen.findByRole("combobox", { name: "Tipo de movimiento" }),
    );
    await user.click(await screen.findByRole("option", { name: "Gasto" }));
    expect(onFilterChange).toHaveBeenCalledWith({ type: "expense" });
  });

  it("shows the clear action only when there are active filters", async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(
      <TransactionFiltersSheet
        filters={{ ...EMPTY_FILTERS, type: "expense" }}
        onFilterChange={vi.fn()}
        onClear={onClear}
        accounts={[]}
        categories={[]}
        activeCount={1}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Filtros" }));
    await user.click(
      await screen.findByRole("button", { name: /Limpiar filtros/ }),
    );
    expect(onClear).toHaveBeenCalled();
  });
});
