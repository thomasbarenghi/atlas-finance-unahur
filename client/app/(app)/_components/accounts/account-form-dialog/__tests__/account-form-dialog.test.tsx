import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccountFormDialog } from "@/app/(app)/_components/accounts/account-form-dialog";
import { makeAccount } from "@/lib/test/factories";
import { renderWithProviders } from "@/lib/test/render";
import { validateApiPayload, apiRequestDtos } from "@/lib/test/api-contracts";
import { testState } from "@/lib/test/api-state";
import { setupTestServer } from "@/lib/test/server";

const server = setupTestServer();

describe("AccountFormDialog", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("creates a valid CreateAccountDto payload", async () => {
    const user = userEvent.setup();
    let payload: Record<string, unknown> | undefined;
    server.use(
      http.post("*/accounts", async ({ request }) => {
        payload = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(makeAccount(), { status: 201 });
      }),
    );
    renderWithProviders(<AccountFormDialog open onOpenChange={vi.fn()} />);

    await user.type(screen.getByPlaceholderText("Caja, Banco…"), "Nueva Caja");
    await user.type(screen.getByLabelText("Saldo inicial"), "1000");
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    await waitFor(() => expect(payload).toBeDefined());
    const result = await validateApiPayload(
      apiRequestDtos.CreateAccountDto,
      payload!,
    );
    expect(result.errors).toEqual([]);
    expect(payload).toMatchObject({
      name: "Nueva Caja",
      type: "cash",
      currency: "ARS",
      initialBalance: 1000,
    });
  });

  it("rejects an empty name without calling the API", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AccountFormDialog open onOpenChange={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    expect(await screen.findByText("Ingresá un nombre")).toBeInTheDocument();
    expect(
      testState.requests.some(
        (request) =>
          request.method === "POST" && request.path.endsWith("/accounts"),
      ),
    ).toBe(false);
  });

  it("updates an account", async () => {
    const user = userEvent.setup();
    const account = makeAccount({
      id: "11111111-1111-4111-8111-111111111111",
      name: "Vieja",
    });
    let payload: Record<string, unknown> | undefined;
    server.use(
      http.patch("*/accounts/:id", async ({ request }) => {
        payload = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(makeAccount());
      }),
    );
    renderWithProviders(
      <AccountFormDialog open onOpenChange={vi.fn()} account={account} />,
    );

    const name = screen.getByPlaceholderText("Caja, Banco…");
    await user.clear(name);
    await user.type(name, "Renombrada");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(payload).toBeDefined());
    expect(payload).toMatchObject({ name: "Renombrada" });
  });
});
