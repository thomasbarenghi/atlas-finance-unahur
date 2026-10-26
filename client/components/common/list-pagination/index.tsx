import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ListPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const ListPagination = ({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
}: ListPaginationProps) => {
  if (totalPages <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground text-[10.5px] leading-[14px] tabular-nums md:text-[11.5px] md:leading-[16px]">
        <span className="hidden md:inline">
          Página {page} de {totalPages} · {total} registros
        </span>
        <span className="md:hidden">
          {start}–{end} de {total}
        </span>
      </span>
      <div className="flex gap-1.5 md:gap-2">
        <Button
          variant="outline"
          size="sm"
          aria-label="Página anterior"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="bg-card hover:bg-card border-line h-[34px] gap-1.5 rounded-full px-3 text-[12px] leading-[16px] font-medium text-[#B9B9AE] disabled:opacity-100 md:h-9 md:px-3.5"
        >
          <ChevronLeft className="size-[14px]" aria-hidden />
          <span className="hidden md:inline">Anterior</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          aria-label="Página siguiente"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="bg-card hover:bg-card border-line h-[34px] gap-1.5 rounded-full px-3 text-[12px] leading-[16px] font-semibold md:h-9 md:px-3.5"
        >
          <span className="hidden md:inline">Siguiente</span>
          <ChevronRight className="size-[14px]" aria-hidden />
        </Button>
      </div>
    </div>
  );
};
