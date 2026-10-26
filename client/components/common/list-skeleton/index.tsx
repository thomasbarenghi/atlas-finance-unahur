import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface ListSkeletonProps {
  rows?: number;
  className?: string;
}

const DEFAULT_ROWS = 5;

export const ListSkeleton = ({
  rows = DEFAULT_ROWS,
  className,
}: ListSkeletonProps) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={`skeleton-${index}`}
          className={cn(
            "border-line2 flex items-center gap-3 border-b px-4 py-3.5 last:border-b-0",
            className,
          )}
        >
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </>
  );
};
