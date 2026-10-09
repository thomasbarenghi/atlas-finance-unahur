import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TransactionFormDialog } from "@/components/features/transactions/transaction-form-dialog";
import { mockApi } from "@/lib/mocks/api";
import {
  makeAccount,
  makeCategory,
  makeTransaction,
} from "@/lib/test/factories";
import { renderWithProviders } from "@/lib/test/render";
import { validateApiPayload, apiRequestDtos } from "@/lib/test/api-contracts";
import { resetMockSession } from "@/lib/test/mock-session";

const ARS_ACCOUNT = makeAccount({
  id: "11111111-1111-4111-8111-111111111111",
  currency: "ARS",
  name: "Caja ARS",
});
const USD_ACCOUNT = makeAccount({
  id: "33333333-3333-4333-8333-333333333333",
  currency: "USD",
  name: "Ahorro USD",
});
const ARS_ACCOUNT_2 = makeAccount({
  id: "55555555-5555-4555-8555-555555555555",
  currency: "ARS",
  name: "Banco ARS",
});
const EXPENSE_CATEGORY = makeCategory({
  id: "22222222-2222-4222-8222-222222222222",
  name: "Comida",
  type: "expense",
});
const INCOME_CATEGORY = makeCategory({
  id: "44444444-4444-4444-8444-444444444444",
  name: "Sueldo",
  type: "income",
});

const openCombobox = async (
  user: ReturnType<typeof userEvent.setup>,
  currentText: string,
) => {
  const trigger = screen
    .getAllByRole("combobox")
    .find((element) => element.textContent?.includes(currentText));
  if (!trigger) throw new Error(`Combobox with "${currentText}" not found`);
  await user.click(trigger);
};

const openCategory = async (
  user: ReturnType<typeof userEvent.setup>,
  optionName = "Comida",
) => {
  await openCombobox(user, "Categoría");
  await user.click(await screen.findByRole("option", { name: optionName }));
};

const typeAmount = async (
  user: ReturnType<typeof userEvent.setup>,
  digits: string,
) => {
  for (const digit of digits) {
    const label = digit === "." ? "," : digit;
    await user.click(screen.getByRole("button", { name: label }));
  }
};

const renderDialog = (
  props: Partial<React.ComponentProps<typeof TransactionFormDialog>> = {},
) =>
  renderWithProviders(
    <TransactionFormDialog
      open
      onOpenChange={vi.fn()}
      accounts={[ARS_ACCOUNT, USD_ACCOUNT]}
      categories={[EXPENSE_CATEGORY, INCOME_CATEGORY]}
      {...props}
    />,
  );

describe("TransactionFormDialog", () => {
  beforeEach(() => {
    resetMockSession();
    vi.restoreAllMocks();
  });

  it("builds a valid CreateTransactionDto for an expense", async () => {
    const user = userEvent.setup();
    const createSpy = vi
      .spyOn(mockApi, "createTransaction")
      .mockResolvedValue(makeTransaction());
    renderDialog();

    await openCategory(user);
    await typeAmount(user, "1500");
    await user.type(screen.getByPlaceholderText("Comentario"), "Alquiler");
    await user.click(screen.getByRole("button", { name: "Crear movimiento" }));

    await waitFor(() => expect(createSpy).toHaveBeenCalledTimes(1));
    const payload = createSpy.mock.calls[0][0];
    expect(payload).toMatchObject({
      type: "expense",
      amount: 1500,
      currency: "ARS",
      accountId: ARS_ACCOUNT.id,
      categoryId: EXPENSE_CATEGORY.id,
      transferAccountId: null,
      description: "Alquiler",
    });
    const result = await validateApiPayload(
      apiRequestDtos.CreateTransactionDto,
      payload as unknown as Record<string, unknown>,
    );
    expect(result.errors).toEqual([]);
  });

  it("rejects an empty description and a zero amount without calling the API", async () => {
    const user = userEvent.setup();
    const createSpy = vi.spyOn(mockApi, "createTransaction");
    renderDialog();

    await openCategory(user);
    await user.click(screen.getByRole("button", { name: "Crear movimiento" }));

    expect(
      await screen.findByText("Ingresá una descripción"),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("El monto debe ser mayor que cero"),
    ).toBeInTheDocument();
    expect(createSpy).not.toHaveBeenCalled();
  });

  it("uses the amount expression keypad to compute the amount", async () => {
    const user = userEvent.setup();
    const createSpy = vi
      .spyOn(mockApi, "createTransaction")
      .mockResolvedValue(makeTransaction());
    renderDialog();

    await openCategory(user);
    await typeAmount(user, "10+5×2");
    await user.type(screen.getByPlaceholderText("Comentario"), "Calculado");
    await user.click(screen.getByRole("button", { name: "Crear movimiento" }));

    await waitFor(() => expect(createSpy).toHaveBeenCalledTimes(1));
    expect(createSpy.mock.calls[0][0].amount).toBe(20);
  });

  it("builds a transfer payload without a category and with the destination", async () => {
    const user = userEvent.setup();
    const createSpy = vi
      .spyOn(mockApi, "createTransaction")
      .mockResolvedValue(makeTransaction({ type: "transfer" }));
    renderDialog({ accounts: [ARS_ACCOUNT, ARS_ACCOUNT_2, USD_ACCOUNT] });

    await user.click(screen.getByRole("button", { name: "Transferencia" }));
    await openCombobox(user, "Cuenta destino");
    await user.click(await screen.findByRole("option", { name: /Banco ARS/ }));
    await typeAmount(user, "500");
    await user.type(screen.getByPlaceholderText("Comentario"), "Ahorro");
    await user.click(screen.getByRole("button", { name: "Crear movimiento" }));

    await waitFor(() => expect(createSpy).toHaveBeenCalledTimes(1));
    const payload = createSpy.mock.calls[0][0];
    expect(payload).toMatchObject({
      type: "transfer",
      amount: 500,
      categoryId: null,
      transferAccountId: ARS_ACCOUNT_2.id,
    });
  });

  it("requires a destination different from the origin for transfers", async () => {
    const user = userEvent.setup();
    const createSpy = vi.spyOn(mockApi, "createTransaction");
    renderDialog();

    await user.click(screen.getByRole("button", { name: "Transferencia" }));
    await typeAmount(user, "500");
    await user.type(screen.getByPlaceholderText("Comentario"), "Ahorro");
    await user.click(screen.getByRole("button", { name: "Crear movimiento" }));

    expect(
      await screen.findByText("Elegí una cuenta de destino distinta"),
    ).toBeInTheDocument();
    expect(createSpy).not.toHaveBeenCalled();
  });

  it("updates an existing transaction through the edit flow", async () => {
    const user = userEvent.setup();
    const updateSpy = vi
      .spyOn(mockApi, "updateTransaction")
      .mockResolvedValue(makeTransaction());
    renderDialog({
      transaction: makeTransaction({
        id: "99999999-9999-4999-8999-999999999999",
        type: "expense",
        amount: 1000,
        categoryId: EXPENSE_CATEGORY.id,
        accountId: ARS_ACCOUNT.id,
        description: "Viejo",
      }),
    });

    const comment = screen.getByPlaceholderText("Comentario");
    await user.clear(comment);
    await user.type(comment, "Nuevo");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(updateSpy).toHaveBeenCalledTimes(1));
    expect(updateSpy).toHaveBeenCalledWith(
      "99999999-9999-4999-8999-999999999999",
      expect.objectContaining({ description: "Nuevo" }),
    );
  });

  it("creates an income with the income categories", async () => {
    const user = userEvent.setup();
    const createSpy = vi
      .spyOn(mockApi, "createTransaction")
      .mockResolvedValue(makeTransaction({ type: "income" }));
    renderDialog();

    await user.click(screen.getByRole("button", { name: "Ingreso" }));
    await openCategory(user, "Sueldo");
    await typeAmount(user, "5000");
    await user.type(screen.getByPlaceholderText("Comentario"), "Sueldo");
    await user.click(screen.getByRole("button", { name: "Crear movimiento" }));

    await waitFor(() => expect(createSpy).toHaveBeenCalledTimes(1));
    expect(createSpy.mock.calls[0][0]).toMatchObject({
      type: "income",
      amount: 5000,
      categoryId: INCOME_CATEGORY.id,
    });
  });

  it("switches the currency when the origin account changes", async () => {
    const user = userEvent.setup();
    const createSpy = vi
      .spyOn(mockApi, "createTransaction")
      .mockResolvedValue(makeTransaction());
    renderDialog();

    await openCombobox(user, "Caja ARS");
    await user.click(await screen.findByRole("option", { name: /Ahorro USD/ }));
    await openCategory(user);
    await typeAmount(user, "100");
    await user.type(screen.getByPlaceholderText("Comentario"), "En dólares");
    await user.click(screen.getByRole("button", { name: "Crear movimiento" }));

    await waitFor(() => expect(createSpy).toHaveBeenCalledTimes(1));
    expect(createSpy.mock.calls[0][0]).toMatchObject({
      accountId: USD_ACCOUNT.id,
      currency: "USD",
    });
  });
});
