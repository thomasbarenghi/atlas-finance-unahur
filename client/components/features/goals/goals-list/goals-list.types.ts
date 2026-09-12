import type { Goal } from "@/lib/api/types";

export interface GoalsListProps {
  goals: Goal[];
  sourceNameById?: Map<string, string>;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}
