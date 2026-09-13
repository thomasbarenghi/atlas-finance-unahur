export interface AllocationItem {
  key: string;
  label: string;
  value: number;
  color?: string;
}

export interface AllocationListProps {
  items: AllocationItem[];
  currency: string;
  total?: number;
  caption?: string;
  emptyMessage?: string;
}
