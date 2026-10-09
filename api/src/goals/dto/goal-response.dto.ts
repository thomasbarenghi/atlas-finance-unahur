import type { GoalStatus } from "../../common/types/financial-enums";

export class GoalResponseDto {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  currency: string;
  targetDate: string | null;
  sourceAccountId: string | null;
  archived: boolean;
  progressPct: number;
  status: GoalStatus;
  createdAt: string;
  updatedAt: string;
}
