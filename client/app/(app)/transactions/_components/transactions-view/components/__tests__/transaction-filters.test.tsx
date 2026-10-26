import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TransactionFilters } from "../transaction-filters";

const baseProps = {
  search: "",
  onSearchChange: vi.fn(),
  type: "all" as const,
  onTypeChange: vi.fn(),
  accountId: "",
  onAccountChange: vi.fn(),
  categoryId: "",
  onCategoryChange: vi.fn(),
  preset: "month" as const,
  range: { from: "2026-10-01", to: "2026-10-31" },
  onPresetChange: vi.fn(),
  accounts: [],
  categories: [],
  hasActiveFilters: false,
  onClear: vi.fn(),
};

describe("TransactionFilters", () => {
  it("hides Limpiar when there are no active filters", () => {
    render(<TransactionFilters {...baseProps} />);
    expect(screen.queryByRole("button", { name: /Limpiar/ })).toBeNull();
  });

  it("shows Limpiar and clears the filters when active", async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(
      <TransactionFilters {...baseProps} hasActiveFilters onClear={onClear} />,
    );

    const buttons = screen.getAllByRole("button", { name: /Limpiar/ });
    expect(buttons.length).toBeGreaterThan(0);

    await user.click(buttons[0]);
    expect(onClear).toHaveBeenCalled();
  });
});
