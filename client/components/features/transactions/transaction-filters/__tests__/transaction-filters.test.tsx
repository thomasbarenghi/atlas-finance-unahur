import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TransactionFilters } from "@/components/features/transactions/transaction-filters";
import type { TransactionFilterState } from "@/components/features/transactions/transaction-filters/transaction-filters.types";
import { makeAccount, makeCategory } from "@/lib/test/factories";

const EMPTY_FILTERS: TransactionFilterState = {
  type: "",
  accountId: "",
  categoryId: "",
  from: "",
  to: "",
};

const renderFilters = (
  overrides: Partial<React.ComponentProps<typeof TransactionFilters>> = {},
) => {
  const onSearchChange = vi.fn();
  const onFilterChange = vi.fn();
  const onClear = vi.fn();
  render(
    <TransactionFilters
      search=""
      onSearchChange={onSearchChange}
      filters={EMPTY_FILTERS}
      onFilterChange={onFilterChange}
      onClear={onClear}
      accounts={[makeAccount({ name: "Caja" })]}
      categories={[makeCategory({ name: "Comida" })]}
      {...overrides}
    />,
  );
  return { onSearchChange, onFilterChange, onClear };
};

describe("TransactionFilters", () => {
  it("caps the search input at the API max length of 120 characters", () => {
    renderFilters();
    const search = screen.getByLabelText("Buscar movimientos");
    expect(search).toHaveAttribute("maxlength", "120");
  });

  it("reports search changes and exposes accessible select names", async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    const Harness = () => {
      const [search, setSearch] = useState("");
      return (
        <TransactionFilters
          search={search}
          onSearchChange={(value) => {
            onSearchChange(value);
            setSearch(value);
          }}
          filters={EMPTY_FILTERS}
          onFilterChange={vi.fn()}
          onClear={vi.fn()}
          accounts={[makeAccount({ name: "Caja" })]}
          categories={[makeCategory({ name: "Comida" })]}
        />
      );
    };
    render(<Harness />);

    const searchInput = screen.getByLabelText("Buscar movimientos");
    await user.type(searchInput, "alquiler");
    expect(searchInput).toHaveValue("alquiler");
    expect(onSearchChange).toHaveBeenLastCalledWith("alquiler");

    expect(
      screen.getByRole("combobox", { name: "Tipo de movimiento" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Cuenta" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Categoría" }),
    ).toBeInTheDocument();
  });

  it("shows the clear action only when there are active filters", () => {
    const { rerender } = render(
      <TransactionFilters
        search=""
        onSearchChange={vi.fn()}
        filters={EMPTY_FILTERS}
        onFilterChange={vi.fn()}
        onClear={vi.fn()}
        accounts={[]}
        categories={[]}
      />,
    );
    expect(
      screen.queryByRole("button", { name: /limpiar filtros/i }),
    ).toBeNull();

    rerender(
      <TransactionFilters
        search="alquiler"
        onSearchChange={vi.fn()}
        filters={EMPTY_FILTERS}
        onFilterChange={vi.fn()}
        onClear={vi.fn()}
        accounts={[]}
        categories={[]}
      />,
    );
    expect(
      screen.getByRole("button", { name: /limpiar filtros/i }),
    ).toBeInTheDocument();
  });

  it("propagates select filter changes and clears filters", async () => {
    const user = userEvent.setup();
    const onFilterChange = vi.fn();
    const onClear = vi.fn();
    render(
      <TransactionFilters
        search="alquiler"
        onSearchChange={vi.fn()}
        filters={EMPTY_FILTERS}
        onFilterChange={onFilterChange}
        onClear={onClear}
        accounts={[makeAccount({ id: "acc-1", name: "Caja" })]}
        categories={[makeCategory({ id: "cat-1", name: "Comida" })]}
      />,
    );

    await user.click(
      screen.getByRole("combobox", { name: "Tipo de movimiento" }),
    );
    await user.click(await screen.findByRole("option", { name: "Gasto" }));
    expect(onFilterChange).toHaveBeenCalledWith({ type: "expense" });

    await user.click(screen.getByRole("combobox", { name: "Cuenta" }));
    await user.click(await screen.findByRole("option", { name: "Caja" }));
    expect(onFilterChange).toHaveBeenCalledWith({ accountId: "acc-1" });

    await user.click(screen.getByRole("combobox", { name: "Categoría" }));
    await user.click(await screen.findByRole("option", { name: "Comida" }));
    expect(onFilterChange).toHaveBeenCalledWith({ categoryId: "cat-1" });

    await user.click(screen.getByRole("button", { name: /Limpiar filtros/ }));
    expect(onClear).toHaveBeenCalled();
  });
});
