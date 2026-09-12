"use client";

import type { ReactNode } from "react";
import { GripVertical } from "lucide-react";
import { WidgetToolbar } from "@/components/features/dashboard/widget-toolbar";
import {
  dashboardWidgetLabel,
  type DashboardLayout,
  type DashboardWidgetId,
} from "@/lib/dashboard-widgets";
import { cn } from "@/lib/utils";
import {
  useWidgetGrid,
  WIDGET_GRID_GAP,
  WIDGET_ROW_HEIGHT,
} from "../hooks/use-widget-grid";

interface WidgetsBoardProps {
  orderedIds: DashboardWidgetId[];
  layout: DashboardLayout;
  columnCount: number;
  editing: boolean;
  widgetContent: Record<DashboardWidgetId, ReactNode>;
  onMove: (id: DashboardWidgetId, direction: "up" | "down") => void;
  onSetSpan: (id: DashboardWidgetId, span: number) => void;
  onToggleVisible: (id: DashboardWidgetId) => void;
  onPlaceAt: (id: DashboardWidgetId, column: number, index: number) => void;
  onSwap: (draggedId: DashboardWidgetId, targetId: DashboardWidgetId) => void;
}

export const WidgetsBoard = ({
  orderedIds,
  layout,
  columnCount,
  editing,
  widgetContent,
  onMove,
  onSetSpan,
  onToggleVisible,
  onPlaceAt,
  onSwap,
}: WidgetsBoardProps) => {
  const {
    containerRef,
    draggedId,
    swapTargetId,
    placement,
    getItem,
    getWidgetHandlers,
    gridHandlers,
  } = useWidgetGrid({
    layout,
    columnCount,
    editing,
    orderedIds,
    placeAt: onPlaceAt,
    swap: onSwap,
  });

  return (
    <div
      ref={containerRef}
      className="relative grid"
      {...gridHandlers}
      style={{
        gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
        gridAutoRows: `${WIDGET_ROW_HEIGHT}px`,
        columnGap: `${WIDGET_GRID_GAP}px`,
        rowGap: 0,
        gridAutoFlow: "dense",
      }}
    >
      {orderedIds.map((id) => {
        const item = getItem(id);

        return (
          <div
            key={id}
            data-widget-id={id}
            data-column={item.column}
            data-index={item.index}
            {...getWidgetHandlers(id)}
            style={{
              gridColumn: `${item.startColumn} / span ${item.span}`,
              gridRowEnd: `span ${item.rowSpan}`,
            }}
            className={cn(
              "relative",
              editing && "cursor-grab active:cursor-grabbing",
              draggedId === id && "opacity-40",
              swapTargetId === id && "ring-primary rounded-2xl ring-2",
            )}
          >
            {editing ? (
              <>
                <span
                  className="bg-background/90 text-muted-foreground absolute top-1/2 -left-2 z-20 hidden -translate-y-1/2 rounded-full border p-1 shadow-sm md:flex"
                  aria-hidden
                >
                  <GripVertical className="size-4" />
                </span>
                <WidgetToolbar
                  label={dashboardWidgetLabel(id)}
                  canMoveUp={item.canMoveUp}
                  canMoveDown={item.canMoveDown}
                  span={item.span}
                  maxSpan={Math.min(item.maxSpan, columnCount)}
                  onMoveUp={() => onMove(id, "up")}
                  onMoveDown={() => onMove(id, "down")}
                  onCycleSpan={() =>
                    onSetSpan(
                      id,
                      item.storedSpan >= item.maxSpan ? 1 : item.storedSpan + 1,
                    )
                  }
                  onHide={() => onToggleVisible(id)}
                />
              </>
            ) : null}
            <div data-measure-id={id}>{widgetContent[id]}</div>
          </div>
        );
      })}

      {editing && placement ? (
        <span
          aria-hidden
          className="bg-primary pointer-events-none absolute z-30 h-0.5 rounded-full"
          style={{
            top: placement.top,
            left: `${(placement.column / columnCount) * 100}%`,
            width: `${100 / columnCount}%`,
            transform: "translateY(-50%)",
          }}
        />
      ) : null}
    </div>
  );
};
