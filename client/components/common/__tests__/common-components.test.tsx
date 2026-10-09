import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Wallet } from "lucide-react";
import { MarkdownText } from "@/components/common/markdown-text";
import { StatusBadge } from "@/components/common/status-badge";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { ComingSoon } from "@/components/common/coming-soon";
import { mockApi } from "@/lib/mocks/api";
import { makeUser } from "@/lib/test/factories";
import { renderWithProviders } from "@/lib/test/render";

const setTheme = vi.fn();
vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "system", setTheme }),
}));
vi.mock("next/navigation", () => import("@/lib/test/next-navigation"));

describe("MarkdownText", () => {
  it("renders headings, paragraphs, inline styles and lists", () => {
    render(
      <MarkdownText
        content={[
          "# Título",
          "",
          "Hola **mundo** con `code` y *itálica*",
          "",
          "- uno",
          "- dos",
          "",
          "1. primero",
          "2. segundo",
        ].join("\n")}
      />,
    );
    expect(screen.getByText("Título")).toBeInTheDocument();
    expect(screen.getByText("mundo")).toBeInTheDocument();
    expect(screen.getByText("code")).toBeInTheDocument();
    expect(screen.getByText("itálica")).toBeInTheDocument();
    expect(screen.getByText("uno")).toBeInTheDocument();
    expect(screen.getByText("primero")).toBeInTheDocument();
  });

  it("handles empty content", () => {
    const { container } = render(<MarkdownText content="" />);
    expect(container.querySelectorAll("p")).toHaveLength(0);
  });
});

describe("StatusBadge", () => {
  it("renders budget statuses", () => {
    const { unmount } = render(
      <StatusBadge variant="budget" status="exceeded" />,
    );
    expect(screen.getByText("Excedido")).toBeInTheDocument();
    unmount();

    const warning = render(<StatusBadge variant="budget" status="warning" />);
    expect(screen.getByText("Advertencia")).toBeInTheDocument();
    warning.unmount();

    render(<StatusBadge variant="budget" status="available" />);
    expect(screen.getByText("Disponible")).toBeInTheDocument();
  });

  it("renders goal statuses", () => {
    const cases = [
      ["achieved", "Alcanzado"],
      ["overdue", "Vencido"],
      ["in_progress", "En curso"],
      ["pending", "Pendiente"],
    ] as const;
    for (const [status, label] of cases) {
      const { unmount } = render(
        <StatusBadge variant="goal" status={status} />,
      );
      expect(screen.getByText(label)).toBeInTheDocument();
      unmount();
    }
  });

  it("renders account and quote statuses", () => {
    const { unmount } = render(
      <StatusBadge variant="account" archived={true} />,
    );
    expect(screen.getByText("Archivada")).toBeInTheDocument();
    unmount();

    const active = render(<StatusBadge variant="account" archived={false} />);
    expect(screen.getByText("Activa")).toBeInTheDocument();
    active.unmount();

    const stale = render(<StatusBadge variant="quote" isStale={true} />);
    expect(screen.getByText("Desactualizada")).toBeInTheDocument();
    stale.unmount();

    render(<StatusBadge variant="quote" isStale={false} />);
    expect(screen.getByText("Actualizada")).toBeInTheDocument();
  });
});

describe("ThemeToggle", () => {
  beforeEach(() => {
    setTheme.mockClear();
    vi.restoreAllMocks();
  });

  it("changes the theme and persists it for a logged-in user", async () => {
    const user = userEvent.setup();
    const updateSpy = vi
      .spyOn(mockApi, "updateUser")
      .mockResolvedValue(makeUser());
    renderWithProviders(<ThemeToggle />, { user: makeUser() });

    await user.click(screen.getByRole("button", { name: "Cambiar tema" }));
    await user.click(await screen.findByRole("menuitem", { name: /Oscuro/ }));

    expect(setTheme).toHaveBeenCalledWith("dark");
    expect(updateSpy).toHaveBeenCalledWith({ theme: "dark" });
  });

  it("does not persist when there is no user", async () => {
    const user = userEvent.setup();
    const updateSpy = vi.spyOn(mockApi, "updateUser");
    renderWithProviders(<ThemeToggle />, { user: null });

    await user.click(screen.getByRole("button", { name: "Cambiar tema" }));
    await user.click(await screen.findByRole("menuitem", { name: /Claro/ }));

    expect(setTheme).toHaveBeenCalledWith("light");
    expect(updateSpy).not.toHaveBeenCalled();
  });
});

describe("ComingSoon", () => {
  it("renders the icon, title and description", () => {
    render(<ComingSoon icon={Wallet} title="Pronto" description="En camino" />);
    expect(screen.getByText("Pronto")).toBeInTheDocument();
    expect(screen.getByText("En camino")).toBeInTheDocument();
    expect(screen.getByText("Pronto").tagName).toBe("H2");
  });
});
