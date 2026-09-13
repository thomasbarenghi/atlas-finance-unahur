import { cn } from "@/lib/utils";

export interface BrandProps {
  className?: string;
  compact?: boolean;
}

export const Brand = ({ className, compact }: BrandProps) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="bg-primary text-primary-foreground font-heading flex size-9 items-center justify-center rounded-xl text-lg font-bold">
        A
      </span>
      {!compact ? (
        <div className="flex flex-col">
          <span className="font-heading text-base leading-none font-semibold">
            Atlass Fin
          </span>
          <span className="text-muted-foreground text-xs">
            Gestor financiero
          </span>
        </div>
      ) : null}
    </div>
  );
};
