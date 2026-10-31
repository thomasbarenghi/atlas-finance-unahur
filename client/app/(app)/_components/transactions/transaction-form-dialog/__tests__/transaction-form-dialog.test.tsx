import { useState } from "react";
import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TransactionFormDialog } from "@/app/(app)/_components/transactions/transaction-form-dialog";
import {
  makeAccount,
  makeCategory,
  makeTransaction,
} from "@/lib/test/factories";
import { renderWithProviders } from "@/lib/test/render";
import { validateApiPayload, apiRequestDtos } from "@/lib/test/api-contracts";
import { testState } from "@/lib/test/api-state";
import { setupTestServer } from "@/lib/test/server";

const ARS_ACCOUNT = makeAccount({
  id: "11111111-1111-4111-8111-111111111111",
  name: "Caja ARS",
});
const ARS_ACCOUNT_2 = makeAccount({
  id: "55555555-5555-4555-8555-555555555555",
  name: "Banco ARS",
});
const USD_ACCOUNT = makeAccount({
  id: "66666666-6666-4666-8666-666666666666",
  name: "Billetera USD",
  type: "wallet",
  currency: "USD",
});
const EXPENSE_CATEGORY = makeCategory({
  id: "22222222-2222-4222-8222-222222222222",
  name: "Supermercado",
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
  optionName = "Supermercado",
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
      accounts={[ARS_ACCOUNT]}
      categories={[EXPENSE_CATEGORY, INCOME_CATEGORY]}
      {...props}
    />,
  );

const ReopenHarness = () => {
  const [open, setOpen] = useState(true);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Abrir
      </button>
      <TransactionFormDialog
        open={open}
        onOpenChange={setOpen}
        accounts={[ARS_ACCOUNT]}
        categories={[EXPENSE_CATEGORY, INCOME_CATEGORY]}
      />
    </>
  );
};

const server = setupTestServer();

const captureTransactionPost = () => {
  let body: Record<string, unknown> | undefined;
  server.use(
    http.post("*/transactions", async ({ request }) => {
      body = (await request.json()) as Record<string, unknown>;
      return HttpResponse.json(makeTransaction(), { status: 201 });
    }),
  );
  return () => body;
};

const captureTransactionPatch = () => {
  let body: Record<string, unknown> | undefined;
  server.use(
    http.patch("*/transactions/:id", async ({ request }) => {
      body = (await request.json()) as Record<string, unknown>;
      return HttpResponse.json(makeTransaction());
    }),
  );
  return () => body;
};

describe("TransactionFormDialog", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("builds a valid CreateTransactionDto for an expense", async () => {
    const user = userEvent.setup();
    const getBody = captureTransactionPost();
    renderDialog();

    await openCategory(user);
    await typeAmount(user, "1500");
    await user.type(screen.getByPlaceholderText("Opcional"), "Alquiler");
    await user.click(screen.getByRole("button", { name: "Crear movimiento" }));

    await waitFor(() => expect(getBody()).toBeDefined());
    const payload = getBody()!;
    expect(payload).toMatchObject({
      type: "expense",
      amount: 1500,
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

  it("resets the form when the dialog is reopened", async () => {
    const user = userEvent.setup();
    const getBody = captureTransactionPost();
    renderWithProviders(<ReopenHarness />);

    await openCategory(user);
    await typeAmount(user, "5000");
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    await user.click(screen.getByRole("button", { name: "Abrir" }));
    await openCategory(user);
    await typeAmount(user, "1500");
    await user.type(screen.getByPlaceholderText("Opcional"), "Reabierto");
    await user.click(screen.getByRole("button", { name: "Crear movimiento" }));

    await waitFor(() => expect(getBody()).toBeDefined());
    expect(getBody()!.amount).toBe(1500);
  });

  it("rejects an empty description and a zero amount without calling the API", async () => {
    const user = userEvent.setup();
    renderDialog();

    await openCategory(user);
    await user.click(screen.getByRole("button", { name: "Crear movimiento" }));

    expect(
      await screen.findByText("Ingresá una descripción"),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("El monto debe ser mayor que cero"),
    ).toBeInTheDocument();
    expect(
      testState.requests.some(
        (request) =>
          request.method === "POST" && request.path.endsWith("/transactions"),
      ),
    ).toBe(false);
  });

  it("uses the amount expression keypad to compute the amount", async () => {
    const user = userEvent.setup();
    const getBody = captureTransactionPost();
    renderDialog();

    await openCategory(user);
    await typeAmount(user, "10+5×2");
    await user.type(screen.getByPlaceholderText("Opcional"), "Calculado");
    await user.click(screen.getByRole("button", { name: "Crear movimiento" }));

    await waitFor(() => expect(getBody()).toBeDefined());
    expect(getBody()!.amount).toBe(20);
  });

  it("builds a transfer payload without a category and with the destination", async () => {
    const user = userEvent.setup();
    const getBody = captureTransactionPost();
    renderDialog({ accounts: [ARS_ACCOUNT, ARS_ACCOUNT_2] });

    await user.click(screen.getByRole("button", { name: "Transferencia" }));
    await openCombobox(user, "Cuenta destino");
    await user.click(await screen.findByRole("option", { name: /Banco ARS/ }));
    await typeAmount(user, "500");
    await user.type(screen.getByPlaceholderText("Opcional"), "Ahorro");
    await user.click(screen.getByRole("button", { name: "Crear movimiento" }));

    await waitFor(() => expect(getBody()).toBeDefined());
    const payload = getBody()!;
    expect(payload).toMatchObject({
      type: "transfer",
      amount: 500,
      transferAmount: 500,
      categoryId: null,
      transferAccountId: ARS_ACCOUNT_2.id,
    });
  });

  it("computes the destination amount for a multi-currency transfer", async () => {
    const user = userEvent.setup();
    const getBody = captureTransactionPost();
    server.use(
      http.get("*/currencies/rates", () =>
        HttpResponse.json({
          primaryCurrency: "ARS",
          rates: [
            {
              currency: "USD",
              name: "Dólar estadounidense",
              symbol: "US$",
              rate: 1180,
              rateDate: "2026-10-25",
              source: "api",
            },
          ],
          updatedAt: null,
        }),
      ),
    );
    renderDialog({ accounts: [ARS_ACCOUNT, USD_ACCOUNT] });

    await user.click(screen.getByRole("button", { name: "Transferencia" }));
    await openCombobox(user, "Cuenta destino");
    await user.click(
      await screen.findByRole("option", { name: /Billetera USD/ }),
    );
    await typeAmount(user, "1180");
    await user.type(screen.getByPlaceholderText("Opcional"), "Compra USD");
    await user.click(screen.getByRole("button", { name: "Crear movimiento" }));

    await waitFor(() => expect(getBody()).toBeDefined());
    const payload = getBody()!;
    expect(payload).toMatchObject({
      type: "transfer",
      amount: 1180,
      transferAccountId: USD_ACCOUNT.id,
    });
    expect(payload.transferAmount).toBeCloseTo(1, 4);
    const result = await validateApiPayload(
      apiRequestDtos.CreateTransactionDto,
      payload as unknown as Record<string, unknown>,
    );
    expect(result.errors).toEqual([]);
  });

  it("requires a destination different from the origin for transfers", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("button", { name: "Transferencia" }));
    await typeAmount(user, "500");
    await user.type(screen.getByPlaceholderText("Opcional"), "Ahorro");
    await user.click(screen.getByRole("button", { name: "Crear movimiento" }));

    expect(
      await screen.findByText("Elegí una cuenta de destino distinta"),
    ).toBeInTheDocument();
    expect(
      testState.requests.some(
        (request) =>
          request.method === "POST" && request.path.endsWith("/transactions"),
      ),
    ).toBe(false);
  });

  it("updates an existing transaction through the edit flow", async () => {
    const user = userEvent.setup();
    const getBody = captureTransactionPatch();
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

    const comment = screen.getByPlaceholderText("Opcional");
    await user.clear(comment);
    await user.type(comment, "Nuevo");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(getBody()).toBeDefined());
    expect(getBody()).toMatchObject({ description: "Nuevo" });
  });

  it("creates an income with the income categories", async () => {
    const user = userEvent.setup();
    const getBody = captureTransactionPost();
    renderDialog();

    await user.click(screen.getByRole("button", { name: "Ingreso" }));
    await openCategory(user, "Sueldo");
    await typeAmount(user, "5000");
    await user.type(screen.getByPlaceholderText("Opcional"), "Sueldo");
    await user.click(screen.getByRole("button", { name: "Crear movimiento" }));

    await waitFor(() => expect(getBody()).toBeDefined());
    expect(getBody()).toMatchObject({
      type: "income",
      amount: 5000,
      categoryId: INCOME_CATEGORY.id,
    });
  });
});
