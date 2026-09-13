"use client";

import { ChevronDown, ChevronUp, EyeOff, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface WidgetToolbarProps {
  label: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  span: number;
  maxSpan: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onCycleSpan: () => void;
  onHide: () => void;
}

export const WidgetToolbar = ({
  label,
  canMoveUp,
  canMoveDown,
  span,
  maxSpan,
  onMoveUp,
  onMoveDown,
  onCycleSpan,
  onHide,
}: WidgetToolbarProps) => {
  return (
    <div className="bg-background/90 absolute top-3 right-3 z-10 flex items-center gap-0.5 rounded-full border p-0.5 shadow-sm backdrop-blur">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Mover ${label} hacia arriba`}
        disabled={!canMoveUp}
        onClick={onMoveUp}
      >
        <ChevronUp />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Mover ${label} hacia abajo`}
        disabled={!canMoveDown}
        onClick={onMoveDown}
      >
        <ChevronDown />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="gap-1 px-2"
        aria-label={`Ancho de ${label}: ${span} de ${maxSpan}. Cambiar`}
        disabled={maxSpan <= 1}
        onClick={onCycleSpan}
      >
        <Maximize2 />
        <span className="text-xs tabular-nums">
          {span}/{maxSpan}
        </span>
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Ocultar ${label}`}
        onClick={onHide}
      >
        <EyeOff />
      </Button>
    </div>
  );
};
