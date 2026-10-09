import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SettingsForm } from "@/components/features/settings/settings-form";
import { mockApi } from "@/lib/mocks/api";
import { makeUser } from "@/lib/test/factories";
import { renderWithProviders } from "@/lib/test/render";
import { validateApiPayload, apiRequestDtos } from "@/lib/test/api-contracts";

vi.mock("next/navigation", () => import("@/lib/test/next-navigation"));

describe("SettingsForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("saves the profile with a valid UpdateUserDto payload", async () => {
    const user = userEvent.setup();
    const updateSpy = vi
      .spyOn(mockApi, "updateUser")
      .mockResolvedValue(makeUser({ name: "Nuevo" }));
    renderWithProviders(<SettingsForm />, {
      user: makeUser({ name: "Demo", aiEnabled: false }),
    });

    const name = screen.getByLabelText("Nombre");
    await user.clear(name);
    await user.type(name, "Nuevo");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => expect(updateSpy).toHaveBeenCalledTimes(1));
    const payload = updateSpy.mock.calls[0][0];
    expect(payload).toMatchObject({ name: "Nuevo", baseCurrency: "ARS" });
    const result = await validateApiPayload(
      apiRequestDtos.UpdateUserDto,
      payload,
    );
    expect(result.errors).toEqual([]);
  });

  it("rejects a one-character name", async () => {
    const user = userEvent.setup();
    const updateSpy = vi.spyOn(mockApi, "updateUser");
    renderWithProviders(<SettingsForm />, { user: makeUser() });

    const name = screen.getByLabelText("Nombre");
    await user.clear(name);
    await user.type(name, "D");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(
      await screen.findByText("El nombre debe tener al menos 2 caracteres"),
    ).toBeInTheDocument();
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it("disables the destructive-actions switch while the assistant is off", () => {
    renderWithProviders(<SettingsForm />, {
      user: makeUser({ aiEnabled: false }),
    });
    const switches = screen.getAllByRole("switch");
    expect(switches[1]).toBeDisabled();
  });
});
