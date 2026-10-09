import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProfileMenu } from "@/components/features/profile/profile-menu";
import { mockApi } from "@/lib/mocks/api";
import { makeUser } from "@/lib/test/factories";
import { renderWithProviders } from "@/lib/test/render";

const setTheme = vi.fn();
vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "system", setTheme }),
}));
vi.mock("next/navigation", () => import("@/lib/test/next-navigation"));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe("ProfileMenu", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setTheme.mockClear();
  });

  it("shows the user initials, links and the current theme", () => {
    renderWithProviders(<ProfileMenu />, {
      user: makeUser({ name: "Ana Pérez", email: "ana@example.com" }),
    });

    expect(screen.getByText("AP")).toBeInTheDocument();
    expect(screen.getByText("Ana Pérez")).toBeInTheDocument();
    expect(screen.getByText("ana@example.com")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Presupuestos/ })).toHaveAttribute(
      "href",
      "/budgets",
    );
    expect(screen.getByRole("link", { name: /Categorías/ })).toHaveAttribute(
      "href",
      "/categories",
    );
    expect(screen.getByText("Automático")).toBeInTheDocument();
  });

  it("changes the theme and persists it", async () => {
    const user = userEvent.setup();
    const updateSpy = vi
      .spyOn(mockApi, "updateUser")
      .mockResolvedValue(makeUser());
    renderWithProviders(<ProfileMenu />, { user: makeUser() });

    await user.click(screen.getByRole("button", { name: /Tema/ }));
    await user.click(await screen.findByRole("button", { name: "Oscuro" }));

    expect(setTheme).toHaveBeenCalledWith("dark");
    await waitFor(() =>
      expect(updateSpy).toHaveBeenCalledWith({ theme: "dark" }),
    );
  });

  it("falls back to a question mark without a name", () => {
    renderWithProviders(<ProfileMenu />, {
      user: makeUser({ name: "" }),
    });
    expect(screen.getByText("?")).toBeInTheDocument();
  });

  it("signs out", async () => {
    const user = userEvent.setup();
    const signOut = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(<ProfileMenu />, {
      user: makeUser(),
      auth: { signOut },
    });

    await user.click(screen.getByRole("button", { name: /Cerrar sesión/ }));
    expect(signOut).toHaveBeenCalled();
  });
});
