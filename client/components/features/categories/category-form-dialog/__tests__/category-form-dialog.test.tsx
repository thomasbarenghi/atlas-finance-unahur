import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CategoryFormDialog } from "@/components/features/categories/category-form-dialog";
import { mockApi } from "@/lib/mocks/api";
import { makeCategory } from "@/lib/test/factories";
import { renderWithProviders } from "@/lib/test/render";
import { validateApiPayload, apiRequestDtos } from "@/lib/test/api-contracts";

describe("CategoryFormDialog", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("creates a valid CreateCategoryDto payload", async () => {
    const user = userEvent.setup();
    const createSpy = vi
      .spyOn(mockApi, "createCategory")
      .mockResolvedValue(makeCategory());
    renderWithProviders(<CategoryFormDialog open onOpenChange={vi.fn()} />);

    await user.type(screen.getByLabelText("Nombre"), "Comida");
    expect(screen.getByRole("combobox", { name: "Tipo" })).toBeInTheDocument();
    await user.click(screen.getByLabelText("Color #22c55e"));
    await user.click(screen.getByRole("button", { name: "Crear categoría" }));

    await waitFor(() => expect(createSpy).toHaveBeenCalledTimes(1));
    const payload = createSpy.mock.calls[0][0];
    expect(payload).toMatchObject({ name: "Comida", color: "#22c55e" });
    const result = await validateApiPayload(
      apiRequestDtos.CreateCategoryDto,
      payload,
    );
    expect(result.errors).toEqual([]);
  });

  it("rejects an empty name", async () => {
    const user = userEvent.setup();
    const createSpy = vi.spyOn(mockApi, "createCategory");
    renderWithProviders(<CategoryFormDialog open onOpenChange={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Crear categoría" }));

    expect(await screen.findByText("Ingresá un nombre")).toBeInTheDocument();
    expect(createSpy).not.toHaveBeenCalled();
  });

  it("archives a custom category through the confirm dialog", async () => {
    const user = userEvent.setup();
    const category = makeCategory({ id: "cat-1", name: "Comida" });
    const archiveSpy = vi
      .spyOn(mockApi, "archiveCategory")
      .mockResolvedValue(makeCategory({ archived: true }));
    renderWithProviders(
      <CategoryFormDialog open onOpenChange={vi.fn()} category={category} />,
    );

    await user.click(screen.getByRole("button", { name: "Archivar" }));
    const confirmButtons = await screen.findAllByRole("button", {
      name: "Archivar",
    });
    await user.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => expect(archiveSpy).toHaveBeenCalledWith("cat-1"));
  });
});
