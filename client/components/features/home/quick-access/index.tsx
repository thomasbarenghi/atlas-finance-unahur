import Link from "next/link";
import { SECTIONS, type AppSection } from "@/lib/sections";

const ITEMS: AppSection[] = [
  SECTIONS.transactions,
  SECTIONS.budgets,
  SECTIONS.reports,
];

export const QuickAccess = () => {
  return (
    <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="bg-card hover:bg-muted/40 flex w-24 shrink-0 snap-start flex-col items-start gap-2 rounded-2xl border p-3 transition-colors"
          >
            <span className="text-primary bg-primary/10 flex size-8 items-center justify-center rounded-lg">
              <Icon className="size-4" aria-hidden />
            </span>
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
};
