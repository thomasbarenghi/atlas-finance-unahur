import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { SettingsView } from "@/app/(app)/settings/_components/settings-view";
import { makeAccount, makeUser } from "@/lib/test/factories";
import { renderWithProviders } from "@/lib/test/render";
import { testState } from "@/lib/test/api-state";
import { setupTestServer } from "@/lib/test/server";

vi.mock("next/navigation", () => import("@/lib/test/next-navigation"));
vi.mock("@/hooks/use-media-query", () => ({
  useMediaQuery: () => true,
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

setupTestServer();

describe("SettingsView", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    document.documentElement.classList.remove("dark");
  });

  it("enables save after editing the name and sends the update", async () => {
    const user = userEvent.setup();
    const currentUser = makeUser({
      name: "Demo",
      email: "demo@atlassfin.app",
    });
    renderWithProviders(<SettingsView />, { user: currentUser });

    const save = screen.getByRole("button", { name: /Guardar cambios/ });
    expect(save).toBeDisabled();

    const name = screen.getByLabelText("Nombre");
    await user.clear(name);
    await user.type(name, "Demo 2");
    expect(save).toBeEnabled();

    await user.click(save);
    await waitFor(() =>
      expect(
        testState.users.find(
          (record) => record.user.email === currentUser.email,
        )?.user.name,
      ).toBe("Demo 2"),
    );
    expect(toast.success).toHaveBeenCalledWith("Preferencias guardadas");
    expect(save).toBeDisabled();
    expect(screen.queryByText("Moneda principal")).not.toBeInTheDocument();
  });

  it("only shows the primary currency selector when a foreign account exists", async () => {
    const currentUser = makeUser({
      name: "Demo",
      email: "demo@atlassfin.app",
    });
    testState.accounts.push({
      ...makeAccount({
        id: "77777777-7777-4777-8777-777777777777",
        name: "Billetera USD",
        type: "wallet",
        currency: "USD",
        currentBalance: 100,
      }),
      userId: testState.users[0].user.id,
    });

    renderWithProviders(<SettingsView />, { user: currentUser });

    expect(await screen.findByText("Moneda principal")).toBeInTheDocument();
    expect(
      screen.queryByText("Monedas con cotización"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Agregar moneda/ }),
    ).not.toBeInTheDocument();
  });

  it("applies the theme preference", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SettingsView />, { user: makeUser() });

    await user.click(screen.getByRole("button", { name: "Oscuro" }));
    await waitFor(() => expect(document.documentElement).toHaveClass("dark"));

    await user.click(screen.getByRole("button", { name: "Claro" }));
    await waitFor(() =>
      expect(document.documentElement).not.toHaveClass("dark"),
    );
  });
});
