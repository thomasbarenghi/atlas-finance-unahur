import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProfileMenu } from "@/app/(app)/profile/_components/profile-menu";
import { makeTransaction, makeUser } from "@/lib/test/factories";
import { renderWithProviders } from "@/lib/test/render";
import { setupTestServer } from "@/lib/test/server";

vi.mock("next/navigation", () => import("@/lib/test/next-navigation"));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const server = setupTestServer();

describe("ProfileMenu", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the user initials and section links", () => {
    renderWithProviders(<ProfileMenu />, {
      user: makeUser({ name: "Ana Pérez", email: "ana@example.com" }),
    });

    expect(screen.getByText("A")).toBeInTheDocument();
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

  it("shows the total number of transactions, not only the loaded page", async () => {
    server.use(
      http.get("*/transactions", () =>
        HttpResponse.json({
          items: [makeTransaction()],
          page: 1,
          pageSize: 100,
          total: 112,
          totalPages: 2,
        }),
      ),
    );

    renderWithProviders(<ProfileMenu />, { user: makeUser() });

    expect(await screen.findByText("112")).toBeInTheDocument();
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
