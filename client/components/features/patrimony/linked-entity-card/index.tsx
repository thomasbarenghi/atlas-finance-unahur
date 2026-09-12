import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Money } from "@/components/common/money";
import { SectionCard } from "@/components/common/section-card";
import type { LinkedEntityCardProps } from "./linked-entity-card.types";

export const LinkedEntityCard = ({
  label,
  title,
  amount,
  currency,
  href,
  trailing,
}: LinkedEntityCardProps) => {
  return (
    <SectionCard title={label}>
      <Link
        href={href}
        className="hover:bg-muted/40 -mx-2 flex items-center justify-between gap-3 rounded-xl px-2 py-2 transition-colors"
      >
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium">{title}</span>
          <Money
            value={amount}
            currency={currency}
            className="text-muted-foreground text-xs"
          />
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {trailing}
          <ChevronRight className="text-muted-foreground size-4" aria-hidden />
        </span>
      </Link>
    </SectionCard>
  );
};
