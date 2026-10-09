import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccountFormDialog } from "@/components/features/accounts/account-form-dialog";
import { mockApi } from "@/lib/mocks/api";
import { makeAccount } from "@/lib/test/factories";
import { renderWithProviders } from "@/lib/test/render";
import { validateApiPayload, apiRequestDtos } from "@/lib/test/api-contracts";

describe("AccountFormDialog", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("creates a valid CreateAccountDto payload", async () => {
    const user = userEvent.setup();
    const createSpy = vi
      .spyOn(mockApi, "createAccount")
      .mockResolvedValue(makeAccount());
    renderWithProviders(<AccountFormDialog open onOpenChange={vi.fn()} />, {
      user: undefined,
    });

    await user.type(screen.getByPlaceholderText("Caja, Banco…"), "Nueva Caja");
    await user.type(screen.getByLabelText("Saldo inicial"), "1000");
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    await waitFor(() => expect(createSpy).toHaveBeenCalledTimes(1));
    const payload = createSpy.mock.calls[0][0];
    const result = await validateApiPayload(
      apiRequestDtos.CreateAccountDto,
      payload,
    );
    expect(result.errors).toEqual([]);
    expect(payload).toMatchObject({ name: "Nueva Caja", initialBalance: 1000 });
  });

  it("rejects an empty name without calling the API", async () => {
    const user = userEvent.setup();
    const createSpy = vi.spyOn(mockApi, "createAccount");
    renderWithProviders(<AccountFormDialog open onOpenChange={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    expect(await screen.findByText("Ingresá un nombre")).toBeInTheDocument();
    expect(createSpy).not.toHaveBeenCalled();
  });

  it("updates an account and can archive it", async () => {
    const user = userEvent.setup();
    const account = makeAccount({
      id: "11111111-1111-4111-8111-111111111111",
      name: "Vieja",
    });
    const updateSpy = vi
      .spyOn(mockApi, "updateAccount")
      .mockResolvedValue(makeAccount());
    const archiveSpy = vi
      .spyOn(mockApi, "archiveAccount")
      .mockResolvedValue(makeAccount({ archived: true }));
    renderWithProviders(
      <AccountFormDialog open onOpenChange={vi.fn()} account={account} />,
    );

    const name = screen.getByPlaceholderText("Caja, Banco…");
    await user.clear(name);
    await user.type(name, "Renombrada");
    await user.click(screen.getByLabelText("Archivar cuenta"));
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(updateSpy).toHaveBeenCalledTimes(1));
    expect(updateSpy).toHaveBeenCalledWith(
      account.id,
      expect.objectContaining({ name: "Renombrada" }),
    );
    await waitFor(() => expect(archiveSpy).toHaveBeenCalledWith(account.id));
  });
});
