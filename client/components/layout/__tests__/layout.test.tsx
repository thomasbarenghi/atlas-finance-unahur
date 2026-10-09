import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Brand } from "@/components/layout/brand";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { Header } from "@/components/layout/header";
import { AuthGuard } from "@/components/layout/auth-guard";
import { makeUser } from "@/lib/test/factories";
import { renderWithProviders } from "@/lib/test/render";

vi.mock("next/navigation", () => import("@/lib/test/next-navigation"));
vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "system", setTheme: vi.fn() }),
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { replace, setPathname } from "@/lib/test/next-navigation";

describe("Brand", () => {
  it("renders the name and hides it in compact mode", () => {
    const { unmount } = render(<Brand />);
    expect(screen.getByText("Atlass Fin")).toBeInTheDocument();
    unmount();

    render(<Brand compact />);
    expect(screen.queryByText("Atlass Fin")).toBeNull();
  });
});

describe("Sidebar", () => {
  it("marks the active section", () => {
    setPathname("/dashboard");
    render(<Sidebar />);
    expect(screen.getByRole("link", { name: /Inicio/ })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.getByRole("link", { name: /Movimientos/ }),
    ).not.toHaveAttribute("aria-current");
  });
});

describe("MobileTabBar", () => {
  it("renders the mobile items with a central create link", () => {
    setPathname("/reports");
    render(<MobileTabBar />);
    expect(screen.getByRole("link", { name: "Reportes" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Movimientos" })).toHaveAttribute(
      "href",
      "/transactions",
    );
  });
});

describe("Header / UserMenu", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the account menu and signs out", async () => {
    const user = userEvent.setup();
    const signOut = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(<Header />, {
      user: makeUser({ name: "Ana", email: "ana@example.com" }),
      auth: { signOut },
    });

    await user.click(screen.getByRole("button", { name: "Cuenta" }));
    expect(await screen.findByText("Ana")).toBeInTheDocument();
    expect(screen.getByText("ana@example.com")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Perfil/ })).toHaveAttribute(
      "href",
      "/profile",
    );
    await user.click(screen.getByRole("menuitem", { name: /Cerrar sesión/ }));
    expect(signOut).toHaveBeenCalled();
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
