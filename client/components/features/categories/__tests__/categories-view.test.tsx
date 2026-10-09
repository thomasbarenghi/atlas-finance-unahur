import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CategoriesView } from "@/components/features/categories/categories-view";
import { mockApi } from "@/lib/mocks/api";
import { renderWithProviders } from "@/lib/test/render";
import { resetMockSession, seedMockSession } from "@/lib/test/mock-session";

vi.mock("next/navigation", () => import("@/lib/test/next-navigation"));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe("CategoriesView", () => {
  beforeEach(() => {
    seedMockSession();
    vi.restoreAllMocks();
  });
  afterEach(() => resetMockSession());

  it("lists expense categories and switches to income", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CategoriesView />);

    expect(await screen.findByText("Comida")).toBeInTheDocument();
    expect(screen.getByText("food")).toBeInTheDocument();
    expect(screen.getAllByText("Sistema").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("tab", { name: "Ingresos" }));
    expect(await screen.findByText("Sueldo")).toBeInTheDocument();
  });

  it("opens the create form from the header", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CategoriesView />);

    await user.click(screen.getByRole("button", { name: "Nueva categoría" }));
    expect(await screen.findByText("Nueva categoría")).toBeInTheDocument();
  });

  it("opens the edit form for a custom category", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CategoriesView />);

    await screen.findByText("Comida");
    await user.click(
      screen.getByRole("button", { name: "Acciones de Comida" }),
    );
    await user.click(await screen.findByRole("menuitem", { name: /Editar/ }));
    expect(await screen.findByText("Editar categoría")).toBeInTheDocument();
  });

  it("archives a custom category through the confirm dialog", async () => {
    const user = userEvent.setup();
    const archiveSpy = vi
      .spyOn(mockApi, "archiveCategory")
      .mockResolvedValue({} as never);
    renderWithProviders(<CategoriesView />);

    await screen.findByText("Comida");
    await user.click(
      screen.getByRole("button", { name: "Acciones de Comida" }),
    );
    await user.click(await screen.findByRole("menuitem", { name: /Archivar/ }));

    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Archivar" }));
    await waitFor(() => expect(archiveSpy).toHaveBeenCalled());
  });
});
