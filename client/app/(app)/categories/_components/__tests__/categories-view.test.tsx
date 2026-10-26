import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CategoriesView } from "@/app/(app)/categories/_components/categories-view";
import { mockApi } from "@/lib/mocks/api";
import { resetMockSession, seedMockSession } from "@/lib/test/mock-session";
import { renderWithProviders } from "@/lib/test/render";

vi.mock("next/navigation", () => import("@/lib/test/next-navigation"));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe("CategoriesView", () => {
  beforeEach(() => {
    seedMockSession();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    resetMockSession();
  });

  it("creates a category and switches to its tab", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CategoriesView />);

    await user.click(
      await screen.findByRole("button", { name: "Nueva categoría" }),
    );
    await user.type(screen.getByLabelText("Nombre"), "Mascotas");
    await user.click(screen.getByRole("button", { name: "Ingreso" }));
    await user.click(screen.getByRole("button", { name: "Crear categoría" }));

    expect(await screen.findByText("Mascotas")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Ingresos" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("does not offer edit or delete actions for system categories", async () => {
    renderWithProviders(<CategoriesView />);

    await screen.findByText("Supermercado");
    expect(
      screen.queryByRole("button", { name: "Acciones de Supermercado" }),
    ).toBeNull();
  });

  it("deletes an own category after confirmation", async () => {
    await mockApi.createCategory({
      name: "Mascotas",
      type: "expense",
      color: "#f97316",
    });
    const user = userEvent.setup();
    renderWithProviders(<CategoriesView />);

    await user.click(
      await screen.findByRole("button", { name: "Acciones de Mascotas" }),
    );
    await user.click(screen.getByRole("menuitem", { name: /Eliminar/ }));
    await user.click(screen.getByRole("button", { name: "Eliminar" }));

    await waitFor(() => expect(screen.queryByText("Mascotas")).toBeNull());
  });
});
