import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useWidgetGrid } from "@/components/features/reports/reports-view/hooks/use-widget-grid";
import {
  DEFAULT_DASHBOARD_LAYOUT,
  type DashboardLayout,
} from "@/lib/dashboard-widgets";

const layout: DashboardLayout = {
  columns: [["netWorth", "budgetUsage"], ["incomeExpense"], ["categoryDonut"]],
  hidden: ["incomeDonut", "budgetAlerts"],
  spans: { ...DEFAULT_DASHBOARD_LAYOUT.spans },
};

const setup = (
  overrides: Partial<Parameters<typeof useWidgetGrid>[0]> = {},
) => {
  const placeAt = vi.fn();
  const swap = vi.fn();
  const rendered = renderHook(() =>
    useWidgetGrid({
      layout,
      columnCount: 3,
      editing: true,
      orderedIds: layout.columns.flat(),
      placeAt,
      swap,
      ...overrides,
    }),
  );
  return { ...rendered, placeAt, swap };
};

describe("useWidgetGrid", () => {
  it("reports move capability and span metadata per widget", () => {
    const { result } = setup();
    const first = result.current.getItem("netWorth");
    expect(first.canMoveUp).toBe(false);
    expect(first.canMoveDown).toBe(true);
    expect(first.storedSpan).toBe(3);
    expect(first.span).toBe(3);
    expect(first.startColumn).toBe(1);

    const second = result.current.getItem("budgetUsage");
    expect(second.canMoveUp).toBe(true);
    expect(second.canMoveDown).toBe(false);
  });

  it("tracks the dragged widget on drag start and clears it on drag end", () => {
    const { result } = setup();
    act(() => result.current.getWidgetHandlers("netWorth").onDragStart());
    expect(result.current.draggedId).toBe("netWorth");

    act(() => result.current.getWidgetHandlers("netWorth").onDragEnd());
    expect(result.current.draggedId).toBeNull();
  });

  it("swaps widgets when dropped on another widget", () => {
    const { result, swap } = setup();
    act(() => result.current.getWidgetHandlers("netWorth").onDragStart());
    act(() => {
      result.current
        .getWidgetHandlers("incomeExpense")
        .onDrop({ preventDefault: vi.fn(), stopPropagation: vi.fn() } as never);
    });
    expect(swap).toHaveBeenCalledWith("netWorth", "incomeExpense");
    expect(result.current.draggedId).toBeNull();
  });

  it("does not swap when dropping on itself", () => {
    const { result, swap } = setup();
    act(() => result.current.getWidgetHandlers("netWorth").onDragStart());
    act(() => {
      result.current
        .getWidgetHandlers("netWorth")
        .onDrop({ preventDefault: vi.fn(), stopPropagation: vi.fn() } as never);
    });
    expect(swap).not.toHaveBeenCalled();
  });

  it("marks widgets non-draggable while not editing", () => {
    const { result } = setup({ editing: false });
    expect(result.current.getWidgetHandlers("netWorth").draggable).toBe(false);
  });

  it("clamps span and startColumn to the available columns", () => {
    const { result } = setup({ columnCount: 2 });
    const item = result.current.getItem("netWorth");
    expect(item.storedSpan).toBe(3);
    expect(item.span).toBe(2);
    expect(item.startColumn).toBe(1);
  });

  it("tracks drag-over target and clears it on leave", () => {
    const { result } = setup();
    const event = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as never;

    act(() =>
      result.current.getWidgetHandlers("budgetUsage").onDragOver(event),
    );
    expect(result.current.swapTargetId).toBeNull();

    act(() => result.current.getWidgetHandlers("netWorth").onDragStart());
    act(() =>
      result.current.getWidgetHandlers("budgetUsage").onDragOver(event),
    );
    expect(result.current.swapTargetId).toBe("budgetUsage");

    act(() => result.current.getWidgetHandlers("budgetUsage").onDragLeave());
    expect(result.current.swapTargetId).toBeNull();
  });

  it("computes a placement while dragging over the grid and places on drop", () => {
    const { result, placeAt } = setup();
    const target = document.createElement("div");
    target.getBoundingClientRect = () =>
      ({
        left: 0,
        top: 0,
        width: 300,
        height: 300,
        right: 300,
        bottom: 300,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect;
    Object.defineProperty(target, "querySelectorAll", {
      value: () => [],
    });
    const gridEvent = {
      preventDefault: vi.fn(),
      currentTarget: target,
      target,
      clientX: 250,
      clientY: 20,
    } as never;

    act(() => result.current.getWidgetHandlers("netWorth").onDragStart());
    act(() => result.current.gridHandlers.onDragOver(gridEvent));
    expect(result.current.placement).not.toBeNull();

    act(() => result.current.gridHandlers.onDrop(gridEvent));
    expect(placeAt).toHaveBeenCalled();
    expect(result.current.draggedId).toBeNull();
  });

  it("clears the placement when leaving the grid itself", () => {
    const { result } = setup();
    const target = document.createElement("div");
    target.getBoundingClientRect = () =>
      ({
        left: 0,
        top: 0,
        width: 300,
        height: 300,
        right: 300,
        bottom: 300,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect;
    Object.defineProperty(target, "querySelectorAll", { value: () => [] });
    const gridEvent = {
      preventDefault: vi.fn(),
      currentTarget: target,
      target,
      clientX: 10,
      clientY: 10,
    } as never;

    act(() => result.current.getWidgetHandlers("netWorth").onDragStart());
    act(() => result.current.gridHandlers.onDragOver(gridEvent));
    expect(result.current.placement).not.toBeNull();
    act(() => result.current.gridHandlers.onDragLeave(gridEvent));
    expect(result.current.placement).toBeNull();
  });
});
