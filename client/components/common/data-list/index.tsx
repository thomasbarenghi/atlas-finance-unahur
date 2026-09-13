import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { DataListProps } from "./data-list.types";

export type { DataListPagination, DataListProps } from "./data-list.types";

const DEFAULT_SKELETON_COUNT = 5;

export const DataList = <T,>({
  data,
  getRowKey,
  renderItem,
  isLoading,
  emptyState,
  pagination,
  skeletonCount = DEFAULT_SKELETON_COUNT,
}: DataListProps<T>) => {
  if (!isLoading && data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="bg-card divide-border divide-y overflow-hidden rounded-2xl border">
        {isLoading
          ? Array.from({ length: skeletonCount }).map((_, index) => (
              <li
                key={`skeleton-${index}`}
                className="flex items-center gap-3 px-4 py-3"
              >
                <Skeleton className="size-10 shrink-0 rounded-full" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-4 w-16" />
              </li>
            ))
          : data.map((row) => <li key={getRowKey(row)}>{renderItem(row)}</li>)}
      </ul>

      {pagination && pagination.totalPages > 1 ? (
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground text-sm">
            Página {pagination.page} de {pagination.totalPages} ·{" "}
            {pagination.total} registros
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft /> Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              Siguiente <ChevronRight />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
