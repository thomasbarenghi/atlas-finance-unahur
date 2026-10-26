import type { ReactNode } from "react";

export interface WidgetCardProps {
  title: string;
  hint?: string;
  children: ReactNode;
}

export const WidgetCard = ({ title, hint, children }: WidgetCardProps) => {
  return (
    <div className="bg-card flex h-full flex-col overflow-hidden rounded-3xl border">
      <div className="flex flex-col gap-0.5 px-5 pt-4 pb-2">
        <h3 className="truncate text-sm font-semibold">{title}</h3>
        {hint ? (
          <p className="text-muted-foreground truncate text-xs">{hint}</p>
        ) : null}
      </div>
      <div className="flex-1 px-5 pb-5">{children}</div>
    </div>
  );
};
