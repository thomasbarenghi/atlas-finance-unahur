"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import {
  DASHBOARD_WIDGETS,
  type DashboardLayout,
  type DashboardWidgetId,
} from "@/lib/dashboard-widgets";

export interface WidgetPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  layout: DashboardLayout;
  onSetVisible: (id: DashboardWidgetId, visible: boolean) => void;
  onReset: () => void;
}

export const WidgetPicker = ({
  open,
  onOpenChange,
  layout,
  onSetVisible,
  onReset,
}: WidgetPickerProps) => {
  const isVisible = (id: DashboardWidgetId) => !layout.hidden.includes(id);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>Widgets del reporte</SheetTitle>
          <SheetDescription>
            Elegí qué mostrar y acomodá el orden con los controles de cada
            tarjeta.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-2 px-6 pb-6">
          {DASHBOARD_WIDGETS.map((widget) => (
            <div
              key={widget.id}
              className="flex items-center justify-between gap-3 rounded-xl border p-3"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium">{widget.label}</span>
                <span className="text-muted-foreground text-xs">
                  {widget.description}
                </span>
              </div>
              <Switch
                checked={isVisible(widget.id)}
                onCheckedChange={(checked) => onSetVisible(widget.id, checked)}
                aria-label={`Mostrar ${widget.label}`}
              />
            </div>
          ))}

          <Button variant="outline" className="mt-2" onClick={onReset}>
            <RotateCcw /> Restablecer diseño
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
