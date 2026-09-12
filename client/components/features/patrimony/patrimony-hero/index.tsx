import { Money } from "@/components/common/money";
import { cn } from "@/lib/utils";
import type { PatrimonyHeroProps } from "./patrimony-hero.types";

export const PatrimonyHero = ({
  icon: Icon,
  title,
  subtitle,
  value,
  currency,
  variant = "default",
  badge,
  supportingText,
}: PatrimonyHeroProps) => {
  const negative = variant === "negative";

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-2xl border bg-gradient-to-b p-6 text-center",
        negative
          ? "from-destructive/10 to-background"
          : "from-primary/10 to-background",
      )}
    >
      <span
        className={cn(
          "flex size-14 items-center justify-center rounded-full",
          negative
            ? "bg-destructive/10 text-destructive"
            : "bg-primary/10 text-primary",
        )}
      >
        <Icon className="size-7" aria-hidden />
      </span>
      <div className="flex flex-col gap-1">
        <span className="text-muted-foreground text-sm">{title}</span>
        <Money
          value={value}
          currency={currency}
          className="font-heading text-3xl font-bold sm:text-4xl"
        />
        {subtitle ? (
          <span className="text-muted-foreground text-xs">{subtitle}</span>
        ) : null}
        {supportingText ? (
          <span className="text-muted-foreground text-xs">
            {supportingText}
          </span>
        ) : null}
      </div>
      {badge}
    </div>
  );
};
