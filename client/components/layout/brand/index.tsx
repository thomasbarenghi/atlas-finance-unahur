import { cn } from "@/lib/utils";

export interface BrandProps {
  className?: string;
  wordmarkClassName?: string;
}

export const Brand = ({ className, wordmarkClassName }: BrandProps) => {
  return (
    <div className={cn("flex h-11 items-center", className)}>
      <div className="flex flex-col gap-px">
        <span className="flex items-end gap-[5px]">
          <span
            className={cn(
              "font-heading text-foreground text-[18px] leading-[23px] font-semibold tracking-[-0.7px]",
              wordmarkClassName,
            )}
          >
            atlass fin
          </span>
          <span className="bg-primary size-1.5 rounded-[2px]" aria-hidden />
        </span>
        <span className="text-muted-foreground text-[10.5px] leading-[14px]">
          Gestor financiero
        </span>
      </div>
    </div>
  );
};
