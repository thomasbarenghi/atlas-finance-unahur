import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GoalsList } from "@/components/features/goals/goals-list";
import { GoalDetailView } from "@/components/features/goals/goal-detail-view";
import { mockApi } from "@/lib/mocks/api";
import { mockState } from "@/lib/mocks/store";
import { makeGoal } from "@/lib/test/factories";
import { renderWithProviders } from "@/lib/test/render";
import { resetMockSession, seedMockSession } from "@/lib/test/mock-session";

vi.mock("next/navigation", () => import("@/lib/test/next-navigation"));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe("GoalsList", () => {
  it("renders progress, plan and source account", () => {
    const goal = makeGoal({
      id: "g1",
      name: "Vacaciones",
      savedAmount: 120_000,
      targetAmount: 500_000,
      targetDate: "2027-07-01",
      sourceAccountId: "acc-1",
    });
    render(
      <GoalsList
        goals={[goal]}
        sourceNameById={new Map([["acc-1", "Banco"]])}
      />,
    );
    expect(screen.getByText("Vacaciones")).toBeInTheDocument();
    expect(screen.getByText(/· Banco/)).toBeInTheDocument();
    expect(screen.getByText(/Faltan/)).toBeInTheDocument();
    expect(screen.getByText(/Objetivo:/)).toBeInTheDocument();
    expect(screen.getByText(/Necesitás ahorrar/)).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/goals/detail?id=g1",
    );
  });

  it("marks an achieved goal and shows an empty state", () => {
    const { unmount } = render(
      <GoalsList
        goals={[makeGoal({ savedAmount: 500_000, targetAmount: 500_000 })]}
        sourceNameById={new Map()}
      />,
    );
    expect(screen.getByText("Meta cumplida")).toBeInTheDocument();
    unmount();

    render(<GoalsList goals={[]} sourceNameById={new Map()} />);
    expect(screen.getByText("Todavía no tenés metas")).toBeInTheDocument();
  });
});

describe("GoalDetailView", () => {
  beforeEach(() => {
    seedMockSession();
    vi.restoreAllMocks();
    window.history.replaceState({}, "", "/");
  });
  afterEach(() => {
    resetMockSession();
    window.history.replaceState({}, "", "/");
  });

  const goalId = () => mockState.goals[0].id;

  it("renders the goal, plan and source account", async () => {
    window.history.replaceState({}, "", `/goals/detail?id=${goalId()}`);
    renderWithProviders(<GoalDetailView />);

    expect((await screen.findAllByText("Vacaciones")).length).toBeGreaterThan(
      0,
    );
    expect(screen.getByText("Acumulado")).toBeInTheDocument();
    expect(screen.getByText("Objetivo")).toBeInTheDocument();
    expect(screen.getByText("Falta")).toBeInTheDocument();
    expect(screen.getByText("Origen del ahorro")).toBeInTheDocument();
    const accountLink = screen.getByRole("link", { name: /Ver cuenta/ });
    expect(accountLink).toHaveAttribute(
      "href",
      `/accounts/detail?id=${mockState.goals[0].sourceAccountId}`,
    );
  });

  it("shows a not-found state", async () => {
    window.history.replaceState({}, "", "/goals/detail?id=missing");
    renderWithProviders(<GoalDetailView />);
    expect(await screen.findByText("Meta no encontrada")).toBeInTheDocument();
  });

  it("opens the edit dialog", async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, "", `/goals/detail?id=${goalId()}`);
    renderWithProviders(<GoalDetailView />);

    await screen.findAllByText("Vacaciones");
    await user.click(screen.getByRole("button", { name: "Editar meta" }));
    expect(await screen.findByText("Editar meta")).toBeInTheDocument();
  });

  it("archives the goal through the confirm dialog", async () => {
    const user = userEvent.setup();
    const archiveSpy = vi
      .spyOn(mockApi, "archiveGoal")
      .mockResolvedValue({} as never);
    window.history.replaceState({}, "", `/goals/detail?id=${goalId()}`);
    renderWithProviders(<GoalDetailView />);

    await screen.findAllByText("Vacaciones");
    await user.click(screen.getByRole("button", { name: "Más acciones" }));
    await user.click(await screen.findByRole("menuitem", { name: /Archivar/ }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Archivar" }));
    await waitFor(() => expect(archiveSpy).toHaveBeenCalled());
  });
});
