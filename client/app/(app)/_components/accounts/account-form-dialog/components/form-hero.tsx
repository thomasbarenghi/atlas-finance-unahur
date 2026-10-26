import type { ReactNode } from "react";
import { Pencil } from "lucide-react";
import { hexToRgba } from "./colors";
import { cn } from "@/lib/utils";

export interface FormHeroProps {
  icon: ReactNode;
  label: string;
  helper?: string;
  /** Hex tint used for the gradient background and the label color. */
  accentColor?: string;
  className?: string;
  children?: ReactNode;
}

export const FormHero = ({
  icon,
  label,
  helper,
  accentColor,
  className,
  children,
}: FormHeroProps) => (
  <div
    className={cn(
      "flex w-full min-w-0 flex-col items-center gap-3 rounded-3xl border p-6 text-center",
      !accentColor && "from-primary/10 to-background bg-gradient-to-b",
      className,
    )}
    style={
      accentColor
        ? {
            backgroundImage: `linear-gradient(to bottom, ${hexToRgba(
              accentColor,
              0.12,
            )}, transparent)`,
          }
        : undefined
    }
  >
    <span className="relative">
      {icon}
      <span className="bg-background absolute -right-1 -bottom-1 flex size-7 items-center justify-center rounded-full border">
        <Pencil className="size-3.5" aria-hidden />
      </span>
    </span>
    <span
      className="text-muted-foreground text-xs"
      style={accentColor ? { color: accentColor } : undefined}
    >
      {label}
    </span>
    {children}
    {helper ? <p className="text-muted-foreground text-xs">{helper}</p> : null}
  </div>
);
