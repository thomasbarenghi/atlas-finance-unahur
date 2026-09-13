"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import {
  clampWidgetSpan,
  dashboardWidgetMaxSpan,
  type DashboardLayout,
  type DashboardWidgetId,
} from "@/lib/dashboard-widgets";

const ROW_HEIGHT = 8;
const GRID_GAP = 32;
const FALLBACK_HEIGHT = 320;

export const WIDGET_ROW_HEIGHT = ROW_HEIGHT;
export const WIDGET_GRID_GAP = GRID_GAP;

export interface WidgetPlacement {
  column: number;
  index: number;
  top: number;
}

export interface WidgetGridItem {
  id: DashboardWidgetId;
  column: number;
  index: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
  storedSpan: number;
  maxSpan: number;
  span: number;
  startColumn: number;
  rowSpan: number;
}

interface UseWidgetGridOptions {
  layout: DashboardLayout;
  columnCount: number;
  editing: boolean;
  orderedIds: DashboardWidgetId[];
  placeAt: (id: DashboardWidgetId, column: number, index: number) => void;
  swap: (draggedId: DashboardWidgetId, targetId: DashboardWidgetId) => void;
}

export const useWidgetGrid = ({
  layout,
  columnCount,
  editing,
  orderedIds,
  placeAt,
  swap,
}: UseWidgetGridOptions) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [heights, setHeights] = useState<Record<string, number>>({});
  const [draggedId, setDraggedId] = useState<DashboardWidgetId | null>(null);
  const [swapTargetId, setSwapTargetId] = useState<DashboardWidgetId | null>(
    null,
  );
  const [placement, setPlacement] = useState<WidgetPlacement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      setHeights((previous) => {
        let changed = false;
        const next = { ...previous };
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).dataset.measureId;
          if (!id) continue;
          const height = entry.contentRect.height;
          if (Math.abs((previous[id] ?? 0) - height) > 1) {
            next[id] = height;
            changed = true;
          }
        }
        return changed ? next : previous;
      });
    });
    const elements =
      container.querySelectorAll<HTMLElement>("[data-measure-id]");
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [orderedIds, columnCount]);

  const findPosition = (id: DashboardWidgetId) => {
    for (let column = 0; column < layout.columns.length; column += 1) {
      const index = layout.columns[column].indexOf(id);
      if (index >= 0) return { column, index };
    }
    return null;
  };

  const rowSpanFor = (id: DashboardWidgetId): number => {
    const height = heights[id] ?? FALLBACK_HEIGHT;
    return Math.max(1, Math.ceil((height + GRID_GAP) / ROW_HEIGHT));
  };

  const resetDrag = () => {
    setDraggedId(null);
    setSwapTargetId(null);
    setPlacement(null);
  };

  const computePlacement = (
    event: DragEvent<HTMLDivElement>,
    activeId: DashboardWidgetId,
  ): WidgetPlacement => {
    const rect = event.currentTarget.getBoundingClientRect();
    const column = Math.max(
      0,
      Math.min(
        columnCount - 1,
        Math.floor(((event.clientX - rect.left) / rect.width) * columnCount),
      ),
    );
    const cards = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>("[data-widget-id]"),
    )
      .filter(
        (element) =>
          element.dataset.widgetId !== activeId &&
          Number(element.dataset.column) === column,
      )
      .sort(
        (first, second) =>
          Number(first.dataset.index) - Number(second.dataset.index),
      );

    let index = cards.length;
    for (let position = 0; position < cards.length; position += 1) {
      const cardRect = cards[position].getBoundingClientRect();
      if (event.clientY < cardRect.top + cardRect.height / 2) {
        index = position;
        break;
      }
    }

    return { column, index, top: event.clientY - rect.top };
  };

  const getItem = (id: DashboardWidgetId): WidgetGridItem => {
    const position = findPosition(id);
    const storedSpan = clampWidgetSpan(id, layout.spans[id]);
    const maxSpan = dashboardWidgetMaxSpan(id);
    const span = Math.min(storedSpan, columnCount);
    const startColumn = Math.max(
      1,
      Math.min((position?.column ?? 0) + 1, columnCount - span + 1),
    );
    return {
      id,
      column: position?.column ?? 0,
      index: position?.index ?? 0,
      canMoveUp: Boolean(position && position.index > 0),
      canMoveDown: Boolean(
        position && position.index < layout.columns[position.column].length - 1,
      ),
      storedSpan,
      maxSpan,
      span,
      startColumn,
      rowSpan: rowSpanFor(id),
    };
  };

  const handleGridDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!editing || !draggedId) return;
    event.preventDefault();
    const next = computePlacement(event, draggedId);
    setPlacement((previous) =>
      previous &&
      previous.column === next.column &&
      previous.index === next.index &&
      Math.abs(previous.top - next.top) < 1
        ? previous
        : next,
    );
    setSwapTargetId(null);
  };

  const handleGridDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (event.currentTarget === event.target) setPlacement(null);
  };

  const handleGridDrop = (event: DragEvent<HTMLDivElement>) => {
    if (editing && draggedId) {
      event.preventDefault();
      const target = computePlacement(event, draggedId);
      placeAt(draggedId, target.column, target.index);
    }
    resetDrag();
  };

  const getWidgetHandlers = (id: DashboardWidgetId) => ({
    draggable: editing,
    onDragStart: () => setDraggedId(id),
    onDragEnd: resetDrag,
    onDragOver: (event: DragEvent<HTMLDivElement>) => {
      if (!editing || !draggedId || draggedId === id) return;
      event.preventDefault();
      event.stopPropagation();
      setSwapTargetId(id);
      setPlacement(null);
    },
    onDragLeave: () =>
      setSwapTargetId((current) => (current === id ? null : current)),
    onDrop: (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      if (editing && draggedId && draggedId !== id) {
        swap(draggedId, id);
      }
      resetDrag();
    },
  });

  return {
    containerRef,
    draggedId,
    swapTargetId,
    placement,
    getItem,
    getWidgetHandlers,
    gridHandlers: {
      onDragOver: handleGridDragOver,
      onDragLeave: handleGridDragLeave,
      onDrop: handleGridDrop,
    },
  };
};
