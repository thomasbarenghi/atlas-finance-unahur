import type { ReactNode } from "react";

export interface DataListPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export interface DataListProps<T> {
  data: T[];
  getRowKey: (row: T) => string;
  renderItem: (row: T) => ReactNode;
  isLoading?: boolean;
  emptyState?: ReactNode;
  pagination?: DataListPagination;
  skeletonCount?: number;
}
