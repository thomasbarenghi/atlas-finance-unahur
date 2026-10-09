import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useDashboardLayout } from "@/hooks/use-dashboard-layout";
import { DEFAULT_DASHBOARD_LAYOUT } from "@/lib/dashboard-widgets";

describe("useDashboardLayout", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("starts from the default layout", () => {
    const { result } = renderHook(() => useDashboardLayout());
    expect(result.current.layout.columns).toEqual(
      DEFAULT_DASHBOARD_LAYOUT.columns,
    );
  });

  it("moves a widget within its column", () => {
    const { result } = renderHook(() => useDashboardLayout());
    const column = 0;
    const first = result.current.layout.columns[column][0];
    const second = result.current.layout.columns[column][1];

    act(() => result.current.move(second, "up"));

    expect(result.current.layout.columns[column][0]).toBe(second);
    expect(result.current.layout.columns[column][1]).toBe(first);
  });

  it("ignores moves beyond the column edges", () => {
    const { result } = renderHook(() => useDashboardLayout());
    const before = result.current.layout.columns;
    const topWidget = before[0][0];

    act(() => result.current.move(topWidget, "up"));
    expect(result.current.layout.columns).toEqual(before);
  });

  it("swaps two widgets across columns", () => {
    const { result } = renderHook(() => useDashboardLayout());
    const [firstColumnId] = result.current.layout.columns[0];
    const [secondColumnId] = result.current.layout.columns[1];

    act(() => result.current.swap(firstColumnId, secondColumnId));

    const allColumns = result.current.layout.columns;
    expect(allColumns[0]).toContain(secondColumnId);
    expect(allColumns[1]).toContain(firstColumnId);
  });

  it("hides, shows and toggles widgets", () => {
    const { result } = renderHook(() => useDashboardLayout());
    const id = result.current.layout.columns[0][0];

    act(() => result.current.setVisible(id, false));
    expect(result.current.layout.hidden).toContain(id);
    expect(result.current.layout.columns.flat()).not.toContain(id);

    act(() => result.current.setVisible(id, true));
    expect(result.current.layout.hidden).not.toContain(id);
    expect(result.current.layout.columns.flat()).toContain(id);

    act(() => result.current.toggleVisible(id));
    expect(result.current.layout.hidden).toContain(id);
  });

  it("clamps spans and resets to the default", () => {
    const { result } = renderHook(() => useDashboardLayout());

    act(() => result.current.setSpan("netWorth", 99));
    expect(result.current.layout.spans.netWorth).toBe(3);

    act(() => result.current.reset());
    expect(result.current.layout.columns).toEqual(
      DEFAULT_DASHBOARD_LAYOUT.columns,
    );
    expect(result.current.layout.spans).toEqual(DEFAULT_DASHBOARD_LAYOUT.spans);
  });

  it("persists the layout to localStorage", () => {
    const { result } = renderHook(() => useDashboardLayout());
    const id = result.current.layout.columns[0][0];

    act(() => result.current.setVisible(id, false));

    const stored = JSON.parse(
      window.localStorage.getItem("atlassfin.dashboard.layout.v7") ?? "{}",
    );
    expect(stored.hidden).toContain(id);
  });

  it("places a widget at a target column and index, clamping the bounds", () => {
    const { result } = renderHook(() => useDashboardLayout());
    const id = result.current.layout.columns[0][0];

    act(() => result.current.placeAt(id, 99, 99));
    const lastColumn = result.current.layout.columns.length - 1;
    expect(result.current.layout.columns[lastColumn]).toContain(id);
    expect(
      result.current.layout.columns.some(
        (column, index) => index !== lastColumn && column.includes(id),
      ),
    ).toBe(false);
  });

  it("ignores no-op swaps and visibility changes", () => {
    const { result } = renderHook(() => useDashboardLayout());
    const id = result.current.layout.columns[0][0];
    const before = result.current.layout;

    act(() => result.current.swap(id, id));
    expect(result.current.layout).toBe(before);

    act(() => result.current.setVisible(id, true));
    expect(result.current.layout).toBe(before);

    act(() => result.current.setVisible(id, false));
    act(() => result.current.setVisible(id, false));
    expect(
      result.current.layout.hidden.filter((item) => item === id),
    ).toHaveLength(1);
  });

  it("ignores moves for unknown widget ids", () => {
    const { result } = renderHook(() => useDashboardLayout());
    const before = result.current.layout.columns;
    act(() => result.current.move("missing" as never, "up"));
    expect(result.current.layout.columns).toEqual(before);
  });
});
