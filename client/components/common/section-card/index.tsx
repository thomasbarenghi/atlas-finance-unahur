import { cn } from "@/lib/utils";
import type { SectionCardProps } from "./section-card.types";

export const SectionCard = ({
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
}: SectionCardProps) => {
  return (
    <section
      className={cn(
        "bg-card flex flex-col overflow-hidden rounded-3xl border",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 className="truncate text-sm font-semibold">{title}</h3>
          {description ? (
            <p className="text-muted-foreground truncate text-xs">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 gap-1">{actions}</div> : null}
      </div>
      <div className={cn("flex-1 px-5 pb-5", contentClassName)}>{children}</div>
    </section>
  );
};
