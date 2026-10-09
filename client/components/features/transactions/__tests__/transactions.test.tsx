import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TransactionList } from "@/components/features/transactions/transaction-list";
import { collapseTransfers } from "@/components/features/transactions/transaction-list/transaction-list.utils";
import { TransactionsView } from "@/components/features/transactions/transactions-view";
import { mockApi } from "@/lib/mocks/api";
import { makeCategory, makeTransaction } from "@/lib/test/factories";
import { renderWithProviders } from "@/lib/test/render";
import { resetMockSession, seedMockSession } from "@/lib/test/mock-session";

vi.mock("next/navigation", () => import("@/lib/test/next-navigation"));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe("collapseTransfers", () => {
  it("keeps non-transfers and collapses a transfer pair to its outgoing leg", () => {
    const expense = makeTransaction({ id: "e1", type: "expense" });
    const outbound = makeTransaction({
      id: "t1",
      type: "transfer",
      amount: -100,
      transferGroupId: "group-1",
    });
    const inbound = makeTransaction({
      id: "t2",
      type: "transfer",
      amount: 100,
      transferGroupId: "group-1",
    });
    const orphan = makeTransaction({
      id: "t3",
      type: "transfer",
      amount: 50,
      transferGroupId: "group-2",
    });

    const result = collapseTransfers([expense, outbound, inbound, orphan]);
    expect(result.map((item) => item.id)).toEqual(["e1", "t1", "t3"]);
  });
});

describe("TransactionList", () => {
  const accountNameById = new Map([
    ["acc-1", "Banco"],
    ["acc-2", "Caja"],
  ]);

  it("renders income, expense and transfer rows", () => {
    const category = makeCategory();
    render(
      <TransactionList
        transactions={[
          makeTransaction({ id: "1", type: "income", description: "Sueldo" }),
          makeTransaction({
            id: "2",
            type: "expense",
            description: "Alquiler",
            categoryId: category.id,
          }),
          makeTransaction({
            id: "3",
            type: "transfer",
            description: "Reserva",
            accountId: "acc-1",
            transferAccountId: "acc-2",
          }),
        ]}
        accountNameById={accountNameById}
        categoryById={new Map([[category.id, category]])}
      />,
    );

    expect(screen.getByText("Sueldo")).toBeInTheDocument();
    expect(screen.getByText("Alquiler")).toBeInTheDocument();
    expect(screen.getByText(/Transferencia/)).toBeInTheDocument();
    expect(screen.getByText(/Banco → Caja/)).toBeInTheDocument();
  });

  it("shows an empty state with an action", () => {
    render(
      <TransactionList
        transactions={[]}
        accountNameById={new Map()}
        categoryById={new Map()}
        emptyAction={<button type="button">Nuevo</button>}
      />,
    );
    expect(screen.getByText("Sin movimientos")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nuevo" })).toBeInTheDocument();
  });

  it("exposes edit and delete actions per row and paginates", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    const onSelect = vi.fn();
    const onPageChange = vi.fn();
    render(
      <TransactionList
        transactions={[
          makeTransaction({ id: "1", description: "Sueldo", type: "income" }),
        ]}
        accountNameById={accountNameById}
        categoryById={new Map()}
        onDelete={onDelete}
        onSelect={onSelect}
        pagination={{
          page: 1,
          pageSize: 10,
          total: 20,
          totalPages: 2,
          onPageChange,
        }}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Acciones de Sueldo" }),
    );
    await user.click(await screen.findByRole("menuitem", { name: /Editar/ }));
    expect(onSelect).toHaveBeenCalled();

    await user.click(
      screen.getByRole("button", { name: "Acciones de Sueldo" }),
    );
    await user.click(await screen.findByRole("menuitem", { name: /Eliminar/ }));
    expect(onDelete).toHaveBeenCalled();

    expect(screen.getByText(/Página 1 de 2/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Siguiente/ }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});

describe("TransactionsView", () => {
  beforeEach(() => {
    seedMockSession();
    vi.restoreAllMocks();
  });
  afterEach(() => resetMockSession());

  it("lists transactions and opens the create dialog", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TransactionsView />, {
      period: { from: "2000-01-01", to: "2100-01-01" },
    });

    expect(await screen.findByText("Movimientos")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getAllByText(/Supermercado/).length).toBeGreaterThan(0),
    );

    await user.click(screen.getByRole("button", { name: "Nuevo movimiento" }));
    expect(await screen.findByText("Nuevo movimiento")).toBeInTheDocument();
  });

  it("deletes a transaction through the confirm dialog", async () => {
    const user = userEvent.setup();
    const deleteSpy = vi
      .spyOn(mockApi, "deleteTransaction")
      .mockResolvedValue(undefined);
    renderWithProviders(<TransactionsView />, {
      period: { from: "2000-01-01", to: "2100-01-01" },
    });

    await waitFor(() =>
      expect(screen.getAllByText(/Compras/).length).toBeGreaterThan(0),
    );
    const menuButtons = await screen.findAllByRole("button", {
      name: /Acciones de Compras/,
    });
    await user.click(menuButtons[0]);
    await user.click(await screen.findByRole("menuitem", { name: /Eliminar/ }));

    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Eliminar" }));
    await waitFor(() => expect(deleteSpy).toHaveBeenCalled());
  });

  it("clears active filters", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TransactionsView />, {
      period: { from: "2000-01-01", to: "2100-01-01" },
    });

    const search = await screen.findByLabelText("Buscar movimientos");
    await user.type(search, "alquiler");
    const clear = await screen.findByRole("button", {
      name: /Limpiar filtros/,
    });
    await user.click(clear);
    expect(search).toHaveValue("");
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: /Limpiar filtros/ }),
      ).toBeNull(),
    );
  });
});
