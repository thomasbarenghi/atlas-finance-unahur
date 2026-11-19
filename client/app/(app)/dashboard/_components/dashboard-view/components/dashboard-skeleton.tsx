import { Skeleton } from "@/components/ui/skeleton";

const STAT_PLACEHOLDERS = ["income", "expenses", "savings", "rate"] as const;
const CHART_PLACEHOLDERS = ["income-expense", "category"] as const;

/**
 * Mirrors the dashboard layout while data is loading: the full-width net-worth
 * hero on top and the two chart cards below, so the page does not jump when the
 * real content arrives.
 */
export const DashboardSkeleton = () => (
  <div
    className="flex flex-col gap-4 md:gap-[22px]"
    role="status"
    aria-label="Cargando resumen"
  >
    <div className="bg-card border-line rounded-[20px] border p-4 md:rounded-[24px] md:px-[26px] md:pt-6 md:pb-[18px]">
      <Skeleton className="h-3 w-28" />

      <div className="mt-3 flex flex-wrap items-center gap-3.5">
        <Skeleton className="h-9 w-56 max-w-full md:h-12 md:w-80" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2.5 md:grid-cols-4 md:gap-11">
        {STAT_PLACEHOLDERS.map((stat) => (
          <div key={stat} className="flex flex-col gap-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>

      <Skeleton className="mt-5 h-[105px] w-full rounded-xl md:h-[120px]" />
    </div>

    <div className="grid gap-4 md:gap-[22px] lg:grid-cols-[700fr_378fr]">
      {CHART_PLACEHOLDERS.map((chart) => (
        <div
          key={chart}
          className="bg-card border-line flex h-[320px] flex-col rounded-[20px] border px-4 pt-3.5 pb-3.5 md:h-[336px] md:rounded-[24px] md:px-[22px] md:pt-5"
        >
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-1.5 h-3 w-28" />
          <Skeleton className="mt-4 min-h-0 flex-1 rounded-xl" />
        </div>
      ))}
    </div>
  </div>
);
