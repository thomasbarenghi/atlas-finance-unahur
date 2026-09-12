import { cn } from "@/lib/utils";
import type { SectionHeaderProps } from "./section-header.types";

export const SectionHeader = ({
  title,
  description,
  actions,
  className,
}: SectionHeaderProps) => {
  return (
    <div className={cn("flex items-center justify-between gap-2", className)}>
      <div className="flex min-w-0 flex-col gap-0.5">
        <h2 className="font-heading text-base font-semibold">{title}</h2>
        {description ? (
          <p className="text-muted-foreground text-xs">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 gap-1">{actions}</div> : null}
    </div>
  );
};
