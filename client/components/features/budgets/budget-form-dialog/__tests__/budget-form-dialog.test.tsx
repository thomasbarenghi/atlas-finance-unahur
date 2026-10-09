import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BudgetFormDialog } from "@/components/features/budgets/budget-form-dialog";
import { mockApi } from "@/lib/mocks/api";
import { mockState } from "@/lib/mocks/store";
import { makeBudget } from "@/lib/test/factories";
import { renderWithProviders } from "@/lib/test/render";
import { validateApiPayload, apiRequestDtos } from "@/lib/test/api-contracts";
import { resetMockSession, seedMockSession } from "@/lib/test/mock-session";

describe("BudgetFormDialog", () => {
  beforeEach(() => {
    seedMockSession();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    resetMockSession();
  });

  it("creates a budget with the period normalized to the first of the month", async () => {
    const user = userEvent.setup();
    const createSpy = vi
      .spyOn(mockApi, "createBudget")
      .mockResolvedValue(makeBudget());
    renderWithProviders(
      <BudgetFormDialog
        open
        onOpenChange={vi.fn()}
        defaultPeriod="2026-01-01"
      />,
    );

    await user.click(await screen.findByRole("button", { name: "Comida" }));
    await user.type(screen.getByPlaceholderText("0"), "150000");
    await user.click(screen.getByRole("button", { name: "Crear presupuesto" }));

    await waitFor(() => expect(createSpy).toHaveBeenCalledTimes(1));
    const payload = createSpy.mock.calls[0][0];
    const comida = mockState.categories.find((c) => c.name === "Comida");
    expect(payload).toMatchObject({
      period: "2026-01-01",
      categoryId: comida?.id,
      limit: 150000,
      currency: "ARS",
    });
    const result = await validateApiPayload(
      apiRequestDtos.CreateBudgetDto,
      payload,
    );
    expect(result.errors).toEqual([]);
  });

  it("requires a category", async () => {
    const user = userEvent.setup();
    const createSpy = vi.spyOn(mockApi, "createBudget");
    renderWithProviders(
      <BudgetFormDialog
        open
        onOpenChange={vi.fn()}
        defaultPeriod="2026-01-01"
      />,
    );

    await user.type(screen.getByPlaceholderText("0"), "150000");
    await user.click(screen.getByRole("button", { name: "Crear presupuesto" }));

    expect(
      (await screen.findAllByText("Elegí una categoría")).length,
    ).toBeGreaterThanOrEqual(1);
    expect(createSpy).not.toHaveBeenCalled();
  });

  it("updates only the editable fields", async () => {
    const user = userEvent.setup();
    const budget = makeBudget({
      id: "budget-1",
      limit: 100000,
      recurring: false,
    });
    const updateSpy = vi
      .spyOn(mockApi, "updateBudget")
      .mockResolvedValue(budget);
    renderWithProviders(
      <BudgetFormDialog
        open
        onOpenChange={vi.fn()}
        budget={budget}
        defaultPeriod="2026-01-01"
      />,
    );

    const limit = screen.getByPlaceholderText("0");
    await user.clear(limit);
    await user.type(limit, "200000");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(updateSpy).toHaveBeenCalledTimes(1));
    expect(updateSpy).toHaveBeenCalledWith(
      budget.id,
      expect.objectContaining({ limit: 200000 }),
    );
  });
});
