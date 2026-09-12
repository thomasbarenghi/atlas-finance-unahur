"use client";

import { useCallback, useEffect, useState } from "react";
import {
  clampWidgetSpan,
  DEFAULT_DASHBOARD_LAYOUT,
  normalizeDashboardLayout,
  type DashboardLayout,
  type DashboardWidgetId,
} from "@/lib/dashboard-widgets";
import { readJson, writeJson } from "@/lib/storage";

const STORAGE_KEY = "atlassfin.dashboard.layout.v7";

const readLayout = (): DashboardLayout => {
  const raw = readJson<unknown>(STORAGE_KEY, null);
  return raw ? normalizeDashboardLayout(raw) : DEFAULT_DASHBOARD_LAYOUT;
};

const shortestColumn = (columns: DashboardWidgetId[][]): number => {
  let target = 0;
  for (let index = 1; index < columns.length; index += 1) {
    if (columns[index].length < columns[target].length) target = index;
  }
  return target;
};

export const useDashboardLayout = () => {
  const [layout, setLayout] = useState<DashboardLayout>(readLayout);

  useEffect(() => {
    writeJson(STORAGE_KEY, layout);
  }, [layout]);

  const move = useCallback(
    (id: DashboardWidgetId, direction: "up" | "down") => {
      setLayout((previous) => {
        const columns = previous.columns.map((column) => [...column]);
        for (const column of columns) {
          const index = column.indexOf(id);
          if (index < 0) continue;
          const target = direction === "up" ? index - 1 : index + 1;
          if (target < 0 || target >= column.length) return previous;
          [column[index], column[target]] = [column[target], column[index]];
          return { ...previous, columns };
        }
        return previous;
      });
    },
    [],
  );

  const swap = useCallback(
    (draggedId: DashboardWidgetId, targetId: DashboardWidgetId) => {
      if (draggedId === targetId) return;
      setLayout((previous) => {
        const columns = previous.columns.map((column) => [...column]);
        let draggedColumn = -1;
        let draggedIndex = -1;
        let targetColumn = -1;
        let targetIndex = -1;

        columns.forEach((column, columnIndex) => {
          column.forEach((id, index) => {
            if (id === draggedId) {
              draggedColumn = columnIndex;
              draggedIndex = index;
            }
            if (id === targetId) {
              targetColumn = columnIndex;
              targetIndex = index;
            }
          });
        });

        if (draggedColumn < 0 || targetColumn < 0) return previous;
        columns[draggedColumn][draggedIndex] = targetId;
        columns[targetColumn][targetIndex] = draggedId;
        return { ...previous, columns };
      });
    },
    [],
  );

  const placeAt = useCallback(
    (id: DashboardWidgetId, column: number, index: number) => {
      setLayout((previous) => {
        const columns = previous.columns.map((item) => [...item]);
        for (const item of columns) {
          const current = item.indexOf(id);
          if (current >= 0) item.splice(current, 1);
        }
        const targetColumn = Math.max(0, Math.min(columns.length - 1, column));
        const targetIndex = Math.max(
          0,
          Math.min(columns[targetColumn].length, index),
        );
        columns[targetColumn].splice(targetIndex, 0, id);
        return { ...previous, columns };
      });
    },
    [],
  );

  const show = useCallback(
    (previous: DashboardLayout, id: DashboardWidgetId) => {
      const columns = previous.columns.map((column) => [...column]);
      columns[shortestColumn(columns)].push(id);
      return {
        ...previous,
        columns,
        hidden: previous.hidden.filter((item) => item !== id),
      };
    },
    [],
  );

  const setVisible = useCallback(
    (id: DashboardWidgetId, visible: boolean) => {
      setLayout((previous) => {
        if (visible) {
          return previous.hidden.includes(id) ? show(previous, id) : previous;
        }
        if (previous.hidden.includes(id)) return previous;
        return {
          ...previous,
          columns: previous.columns.map((column) =>
            column.filter((item) => item !== id),
          ),
          hidden: [...previous.hidden, id],
        };
      });
    },
    [show],
  );

  const toggleVisible = useCallback(
    (id: DashboardWidgetId) => {
      setLayout((previous) =>
        previous.hidden.includes(id)
          ? show(previous, id)
          : {
              ...previous,
              columns: previous.columns.map((column) =>
                column.filter((item) => item !== id),
              ),
              hidden: [...previous.hidden, id],
            },
      );
    },
    [show],
  );

  const setSpan = useCallback((id: DashboardWidgetId, span: number) => {
    setLayout((previous) => ({
      ...previous,
      spans: { ...previous.spans, [id]: clampWidgetSpan(id, span) },
    }));
  }, []);

  const reset = useCallback(() => {
    setLayout(DEFAULT_DASHBOARD_LAYOUT);
  }, []);

  return {
    layout,
    move,
    swap,
    placeAt,
    setSpan,
    setVisible,
    toggleVisible,
    reset,
  };
};
