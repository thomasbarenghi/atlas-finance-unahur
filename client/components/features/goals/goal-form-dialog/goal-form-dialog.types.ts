import type { Goal } from "@/lib/api/types";

export interface GoalFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: Goal;
}
