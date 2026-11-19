import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Brand } from "@/components/layout/brand";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { AuthGuard } from "@/components/layout/auth-guard";
import { makeUser } from "@/lib/test/factories";
import { renderWithProviders } from "@/lib/test/render";
import { setupTestServer } from "@/lib/test/server";

vi.mock("next/navigation", () => import("@/lib/test/next-navigation"));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

setupTestServer();

import { replace, setPathname } from "@/lib/test/next-navigation";

describe("Brand", () => {
  it("renders the name", () => {
    render(<Brand />);
    expect(screen.getByText("atlass fin")).toBeInTheDocument();
  });
});

describe("Sidebar", () => {
  it("marks the active section", () => {
    setPathname("/dashboard");
    renderWithProviders(<Sidebar />);
    expect(screen.getByRole("link", { name: /Inicio/ })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.getByRole("link", { name: /Movimientos/ }),
    ).not.toHaveAttribute("aria-current");
  });

  it("links the account block directly to the profile without a menu", () => {
    setPathname("/dashboard");
    renderWithProviders(<Sidebar />, {
      user: makeUser({ name: "Ana", email: "ana@example.com" }),
    });

    const profileLink = screen.getByRole("link", { name: "Mi perfil" });
    expect(profileLink).toHaveAttribute("href", "/profile");
    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(screen.queryByRole("menu")).toBeNull();
  });
});

describe("MobileTabBar", () => {
  it("renders Inicio, Asistente, Movimientos and Perfil as equal items", () => {
    setPathname("/assistant");
    render(<MobileTabBar />);
    expect(screen.getByRole("link", { name: "Asistente" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Inicio" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    expect(screen.getByRole("link", { name: "Movimientos" })).toHaveAttribute(
      "href",
      "/transactions",
    );
    expect(screen.getByRole("link", { name: "Perfil" })).toHaveAttribute(
      "href",
      "/profile",
    );
  });
});

describe("AuthGuard", () => {
  beforeEach(() => {
    replace.mockClear();
  });

  it("renders children for an authenticated user", () => {
    renderWithProviders(
      <AuthGuard>
        <span>Contenido</span>
      </AuthGuard>,
      { user: makeUser() },
    );
    expect(screen.getByText("Contenido")).toBeInTheDocument();
  });

  it("shows a loader and redirects unauthenticated users", async () => {
    renderWithProviders(
      <AuthGuard>
        <span>Contenido</span>
      </AuthGuard>,
      { user: null, auth: { isLoading: false } },
    );
    expect(screen.getByLabelText("Cargando")).toBeInTheDocument();
    expect(screen.queryByText("Contenido")).toBeNull();
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
  });
});
