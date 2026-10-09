import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GoalFormDialog } from "@/components/features/goals/goal-form-dialog";
import { mockApi } from "@/lib/mocks/api";
import { makeGoal } from "@/lib/test/factories";
import { renderWithProviders } from "@/lib/test/render";
import { validateApiPayload, apiRequestDtos } from "@/lib/test/api-contracts";
import { resetMockSession, seedMockSession } from "@/lib/test/mock-session";

describe("GoalFormDialog", () => {
  beforeEach(() => {
    seedMockSession();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    resetMockSession();
  });

  it("creates a valid CreateGoalDto payload with null optionals", async () => {
    const user = userEvent.setup();
    const createSpy = vi
      .spyOn(mockApi, "createGoal")
      .mockResolvedValue(makeGoal());
    renderWithProviders(<GoalFormDialog open onOpenChange={vi.fn()} />);

    await user.type(screen.getByPlaceholderText("Vacaciones"), "Auto nuevo");
    await user.type(screen.getByLabelText("Monto asignado"), "50000");
    await user.type(screen.getByLabelText("Monto objetivo"), "200000");
    await user.click(screen.getByRole("button", { name: "Crear meta" }));

    await waitFor(() => expect(createSpy).toHaveBeenCalledTimes(1));
    const payload = createSpy.mock.calls[0][0];
    expect(payload).toMatchObject({
      name: "Auto nuevo",
      savedAmount: 50000,
      targetAmount: 200000,
      targetDate: null,
      sourceAccountId: null,
    });
    const result = await validateApiPayload(
      apiRequestDtos.CreateGoalDto,
      payload,
    );
    expect(result.errors).toEqual([]);
  });

  it("rejects an empty name", async () => {
    const user = userEvent.setup();
    const createSpy = vi.spyOn(mockApi, "createGoal");
    renderWithProviders(<GoalFormDialog open onOpenChange={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Crear meta" }));

    expect(await screen.findByText("Ingresá un nombre")).toBeInTheDocument();
    expect(createSpy).not.toHaveBeenCalled();
  });
});
