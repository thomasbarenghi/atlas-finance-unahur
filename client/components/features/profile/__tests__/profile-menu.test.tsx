import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProfileMenu } from "@/components/features/profile/profile-menu";
import { makeUser } from "@/lib/test/factories";
import { renderWithProviders } from "@/lib/test/render";

vi.mock("next/navigation", () => import("@/lib/test/next-navigation"));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe("ProfileMenu", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the user initials and section links", () => {
    renderWithProviders(<ProfileMenu />, {
      user: makeUser({ name: "Ana Pérez", email: "ana@example.com" }),
    });

    expect(screen.getByText("AP")).toBeInTheDocument();
    expect(screen.getByText("Ana Pérez")).toBeInTheDocument();
    expect(screen.getByText("ana@example.com")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Categorías/ })).toHaveAttribute(
      "href",
      "/categories",
    );
    expect(screen.getByRole("link", { name: /Ajustes/ })).toHaveAttribute(
      "href",
      "/settings",
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
