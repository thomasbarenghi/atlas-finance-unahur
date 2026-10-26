import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AccountsList } from "@/app/(app)/_components/accounts/accounts-list";
import { AccountDetailView } from "@/app/(app)/accounts/detail/_components/account-detail-view";
import { makeAccount } from "@/lib/test/factories";
import { renderWithProviders } from "@/lib/test/render";
import { testState } from "@/lib/test/api-state";
import { setupTestServer } from "@/lib/test/server";

vi.mock("next/navigation", () => import("@/lib/test/next-navigation"));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

setupTestServer();

describe("AccountsList", () => {
  it("orders accounts by type and shows balances", () => {
    render(
      <AccountsList
        accounts={[
          makeAccount({
            id: "1",
            name: "Banco",
            type: "bank",
            currentBalance: -500,
          }),
          makeAccount({
            id: "2",
            name: "Caja",
            type: "cash",
            currentBalance: 100,
          }),
        ]}
      />,
    );
    const rows = screen.getAllByRole("link");
    expect(rows[0]).toHaveTextContent("Caja");
    expect(rows[1]).toHaveTextContent("Banco");
    expect(screen.getByText("Saldo negativo")).toBeInTheDocument();
  });

  it("shows an empty state with an action", () => {
    render(
      <AccountsList
        accounts={[]}
        emptyAction={<button type="button">Crear</button>}
      />,
    );
    expect(screen.getByText("Todavía no tenés cuentas")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Crear" })).toBeInTheDocument();
  });
});

describe("AccountDetailView", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.history.replaceState({}, "", "/");
  });
  afterEach(() => {
    window.history.replaceState({}, "", "/");
  });

  const bankId = () =>
    testState.accounts.find((account) => account.name === "Banco ARS")!.id;

  it("renders the account, metrics and movements", async () => {
    window.history.replaceState({}, "", `/accounts/detail?id=${bankId()}`);
    renderWithProviders(<AccountDetailView />);

    expect((await screen.findAllByText("Banco ARS")).length).toBeGreaterThan(0);
    expect(screen.getByText("Saldo inicial")).toBeInTheDocument();
    expect(screen.getByText("Ingresos")).toBeInTheDocument();
    expect(screen.getByText("Gastos")).toBeInTheDocument();
    expect(screen.getByText(/Movimientos/)).toBeInTheDocument();
  });

  it("shows a not-found state for an unknown id", async () => {
    window.history.replaceState({}, "", "/accounts/detail?id=missing");
    renderWithProviders(<AccountDetailView />);
    expect(await screen.findByText("Cuenta no encontrada")).toBeInTheDocument();
  });

  it("opens the edit dialog", async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, "", `/accounts/detail?id=${bankId()}`);
    renderWithProviders(<AccountDetailView />);

    await screen.findAllByText("Banco ARS");
    await user.click(screen.getByRole("button", { name: "Editar cuenta" }));
    expect(await screen.findByText("Editar cuenta")).toBeInTheDocument();
  });

  it("deletes the account through the confirm dialog", async () => {
    const user = userEvent.setup();
    const targetId = bankId();
    window.history.replaceState({}, "", `/accounts/detail?id=${targetId}`);
    renderWithProviders(<AccountDetailView />);

    await screen.findAllByText("Banco ARS");
    await user.click(screen.getByRole("button", { name: "Eliminar cuenta" }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Eliminar" }));

    await waitFor(() =>
      expect(
        testState.accounts.find((account) => account.id === targetId),
      ).toBeUndefined(),
    );
  });
});
