import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SettingsMenu } from "@/components/features/settings/settings-menu";
import { mockApi } from "@/lib/mocks/api";
import { makeUser } from "@/lib/test/factories";
import { renderWithProviders } from "@/lib/test/render";

vi.mock("next/navigation", () => import("@/lib/test/next-navigation"));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { toast } from "sonner";

describe("SettingsMenu", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it("shows the base currency and toggles the assistant flag", async () => {
    const user = userEvent.setup();
    const updateSpy = vi
      .spyOn(mockApi, "updateUser")
      .mockResolvedValue(makeUser());
    renderWithProviders(<SettingsMenu />, {
      user: makeUser({ baseCurrency: "ARS", aiEnabled: true }),
    });

    expect(screen.getByText("Moneda base")).toBeInTheDocument();
    expect(screen.getByText("ARS")).toBeInTheDocument();

    await user.click(screen.getByRole("switch", { name: "Asistente de IA" }));
    await waitFor(() =>
      expect(updateSpy).toHaveBeenCalledWith({ aiEnabled: false }),
    );
  });

  it("disables the destructive switch while the assistant is off", () => {
    renderWithProviders(<SettingsMenu />, {
      user: makeUser({ aiEnabled: false }),
    });
    expect(
      screen.getByRole("switch", {
        name: "Acciones destructivas del asistente",
      }),
    ).toBeDisabled();
  });

  it("changes the base currency through the option sheet", async () => {
    const user = userEvent.setup();
    const updateSpy = vi
      .spyOn(mockApi, "updateUser")
      .mockResolvedValue(makeUser());
    renderWithProviders(<SettingsMenu />, {
      user: makeUser({ baseCurrency: "ARS" }),
    });

    await user.click(screen.getByRole("button", { name: /Moneda base/ }));
    await user.click(await screen.findByRole("button", { name: "USD" }));

    await waitFor(() =>
      expect(updateSpy).toHaveBeenCalledWith({ baseCurrency: "USD" }),
    );
    expect(toast.success).toHaveBeenCalledWith("Moneda base actualizada");
  });

  it("signs out from the session section", async () => {
    const user = userEvent.setup();
    const signOut = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(<SettingsMenu />, {
      user: makeUser(),
      auth: { signOut },
    });

    await user.click(screen.getByRole("button", { name: /Cerrar sesión/ }));
    expect(signOut).toHaveBeenCalled();
  });

  it("reports update failures", async () => {
    const user = userEvent.setup();
    vi.spyOn(mockApi, "updateUser").mockRejectedValue(new Error("boom"));
    renderWithProviders(<SettingsMenu />, {
      user: makeUser({ baseCurrency: "ARS", aiEnabled: true }),
    });

    await user.click(screen.getByRole("switch", { name: "Asistente de IA" }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("No se pudo actualizar"),
    );

    await user.click(screen.getByRole("button", { name: /Moneda base/ }));
    await user.click(await screen.findByRole("button", { name: "USD" }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("No se pudo cambiar la moneda"),
    );
  });
});
