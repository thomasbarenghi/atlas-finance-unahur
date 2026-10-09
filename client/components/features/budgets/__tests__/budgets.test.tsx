import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { BudgetsView } from "@/components/features/budgets/budgets-view";
import { BudgetDetailView } from "@/components/features/budgets/budget-detail-view";
import { BudgetCard } from "@/components/features/budgets/budget-card";
import { BudgetsSummary } from "@/components/features/budgets/budgets-summary";
import { sortBudgetsBySeverity } from "@/components/features/budgets/budgets-summary/budgets-summary.utils";
import { BudgetPaceCard } from "@/components/features/budgets/budget-detail-view/components/budget-pace-card";
import { budgetPace } from "@/lib/budget";
import { mockApi } from "@/lib/mocks/api";
import { mockState } from "@/lib/mocks/store";
import { monthInputValue } from "@/lib/format";
import { makeBudget } from "@/lib/test/factories";
import { renderWithProviders } from "@/lib/test/render";
import { resetMockSession, seedMockSession } from "@/lib/test/mock-session";

vi.mock("next/navigation", () => import("@/lib/test/next-navigation"));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { push } from "@/lib/test/next-navigation";

describe("sortBudgetsBySeverity", () => {
  it("orders exceeded before warning before available, then by consumption", () => {
    const sorted = sortBudgetsBySeverity([
      makeBudget({ id: "a", status: "available", consumedPct: 10 }),
      makeBudget({ id: "e", status: "exceeded", consumedPct: 120 }),
      makeBudget({ id: "w", status: "warning", consumedPct: 90 }),
      makeBudget({ id: "w2", status: "warning", consumedPct: 95 }),
    ]);
    expect(sorted.map((budget) => budget.id)).toEqual(["e", "w2", "w", "a"]);
  });
});

describe("BudgetsSummary", () => {
  it("aggregates totals and counts exceeded budgets", () => {
    render(
      <BudgetsSummary
        budgets={[
          makeBudget({ id: "1", limit: 100, spent: 150, status: "exceeded" }),
          makeBudget({ id: "2", limit: 200, spent: 50, status: "available" }),
        ]}
      />,
    );
    expect(screen.getByText("Presupuesto total")).toBeInTheDocument();
    expect(screen.getByText("Categorías excedidas")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("labels the summary as exceeded instead of a negative available", () => {
    render(
      <BudgetsSummary
        budgets={[
          makeBudget({ id: "1", limit: 50, spent: 60, status: "exceeded" }),
        ]}
      />,
    );
    expect(screen.getByText("Excedido")).toBeInTheDocument();
    expect(screen.queryByText("Disponible")).not.toBeInTheDocument();
  });

  it("renders nothing without budgets", () => {
    const { container } = render(<BudgetsSummary budgets={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("BudgetCard", () => {
  it("links to the detail with period and shows progress", () => {
    render(
      <BudgetCard
        budget={makeBudget({
          id: "b1",
          period: "2026-01-01",
          spent: 90,
          limit: 100,
          consumedPct: 90,
          status: "warning",
          recurring: true,
        })}
      />,
    );
    expect(
      screen.getByRole("link", {
        name: "Ver detalle del presupuesto de Comida",
      }),
    ).toHaveAttribute("href", "/budgets/detail?id=b1&period=2026-01");
    expect(screen.getByText("Se renueva")).toBeInTheDocument();
  });
});

describe("BudgetPaceCard", () => {
  const reference = new Date(2026, 0, 20);

  it("describes a current month under the limit", () => {
    const pace = budgetPace(
      {
        period: "2026-01-01",
        spent: 20_000,
        limit: 100_000,
        available: 80_000,
      },
      reference,
    );
    render(
      <BudgetPaceCard
        pace={pace}
        limit={100_000}
        spent={20_000}
        currency="ARS"
      />,
    );
    expect(screen.getByText("Ritmo del mes")).toBeInTheDocument();
    expect(screen.getByText(/por debajo del límite/)).toBeInTheDocument();
  });

  it("warns about a projected overspend", () => {
    const pace = budgetPace(
      {
        period: "2026-01-01",
        spent: 90_000,
        limit: 100_000,
        available: 10_000,
      },
      reference,
    );
    render(
      <BudgetPaceCard
        pace={pace}
        limit={100_000}
        spent={90_000}
        currency="ARS"
      />,
    );
    expect(screen.getByText(/vas a excederte/)).toBeInTheDocument();
  });

  it("describes past and future months", () => {
    const past = budgetPace(
      {
        period: "2025-12-01",
        spent: 50_000,
        limit: 100_000,
        available: 50_000,
      },
      reference,
    );
    const { unmount } = render(
      <BudgetPaceCard
        pace={past}
        limit={100_000}
        spent={50_000}
        currency="ARS"
      />,
    );
    expect(screen.getByText(/Mes cerrado/)).toBeInTheDocument();
    unmount();

    const future = budgetPace(
      { period: "2026-03-01", spent: 0, limit: 100_000, available: 100_000 },
      reference,
    );
    render(
      <BudgetPaceCard pace={future} limit={100_000} spent={0} currency="ARS" />,
    );
    expect(screen.getByText("El mes todavía no comenzó.")).toBeInTheDocument();
  });
});

describe("BudgetsView", () => {
  beforeEach(() => {
    seedMockSession();
    vi.restoreAllMocks();
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });
  afterEach(() => resetMockSession());

  it("renders budgets with the summary", async () => {
    renderWithProviders(<BudgetsView />);
    expect(screen.getByText("Presupuestos")).toBeInTheDocument();
    expect(await screen.findByText("Presupuesto total")).toBeInTheDocument();
    expect(screen.getAllByText("Comida").length).toBeGreaterThan(0);
  });

  it("handles copying the previous month when there is nothing to copy", async () => {
    const user = userEvent.setup();
    renderWithProviders(<BudgetsView />);
    await screen.findByText("Presupuesto total");

    await user.click(
      screen.getByRole("button", { name: /Copiar mes anterior/ }),
    );
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "No había presupuestos para copiar",
      ),
    );
  });

  it("opens the create dialog", async () => {
    const user = userEvent.setup();
    renderWithProviders(<BudgetsView />);
    await user.click(screen.getByRole("button", { name: "Nuevo presupuesto" }));
    expect(await screen.findByText("Nuevo presupuesto")).toBeInTheDocument();
  });

  it("shows an empty state without budgets", async () => {
    vi.spyOn(mockApi, "listBudgets").mockResolvedValue([]);
    renderWithProviders(<BudgetsView />);
    expect(
      await screen.findByText("Sin presupuestos para este período"),
    ).toBeInTheDocument();
  });
});

describe("BudgetDetailView", () => {
  beforeEach(() => {
    seedMockSession();
    vi.restoreAllMocks();
    window.history.replaceState({}, "", "/");
    push.mockClear();
  });
  afterEach(() => {
    resetMockSession();
    window.history.replaceState({}, "", "/");
  });

  const budgetPath = () => {
    const budget = mockState.budgets[0];
    return `/budgets/detail?id=${budget.id}&period=${monthInputValue(budget.period)}`;
  };

  it("renders the budget consumption, pace and movements", async () => {
    window.history.replaceState({}, "", budgetPath());
    renderWithProviders(<BudgetDetailView />);

    expect(await screen.findByText("Consumo")).toBeInTheDocument();
    expect(screen.getByText("Ritmo del mes")).toBeInTheDocument();
    expect(screen.getByText("Movimientos de la categoría")).toBeInTheDocument();
  });

  it("shows a not-found state", async () => {
    window.history.replaceState(
      {},
      "",
      "/budgets/detail?id=missing&period=2026-01",
    );
    renderWithProviders(<BudgetDetailView />);
    expect(
      await screen.findByText("Presupuesto no encontrado"),
    ).toBeInTheDocument();
  });

  it("opens the edit dialog", async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, "", budgetPath());
    renderWithProviders(<BudgetDetailView />);

    await screen.findByText("Consumo");
    await user.click(
      screen.getByRole("button", { name: "Editar presupuesto" }),
    );
    expect(await screen.findByText("Editar presupuesto")).toBeInTheDocument();
  });

  it("deletes the budget and navigates back to the list", async () => {
    const user = userEvent.setup();
    const deleteSpy = vi
      .spyOn(mockApi, "deleteBudget")
      .mockResolvedValue(undefined);
    window.history.replaceState({}, "", budgetPath());
    renderWithProviders(<BudgetDetailView />);

    await screen.findByText("Consumo");
    await user.click(
      screen.getByRole("button", { name: "Eliminar presupuesto" }),
    );
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Eliminar" }));
    await waitFor(() => expect(deleteSpy).toHaveBeenCalled());
    await waitFor(() => expect(push).toHaveBeenCalledWith("/budgets"));
  });
});
