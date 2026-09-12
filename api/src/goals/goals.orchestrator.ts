import { Injectable } from "@nestjs/common";
import { AccountsService } from "../accounts/accounts.service";
import { CreateGoalDto } from "./dto/create-goal.dto";
import { GoalResponseDto } from "./dto/goal-response.dto";
import { UpdateGoalDto } from "./dto/update-goal.dto";
import { GoalsService } from "./goals.service";

@Injectable()
export class GoalsOrchestrator {
  constructor(
    private readonly goalsService: GoalsService,
    private readonly accountsService: AccountsService,
  ) {}

  async createGoal(
    userId: string,
    dto: CreateGoalDto,
  ): Promise<GoalResponseDto> {
    if (dto.sourceAccountId) {
      await this.assertSourceAccount(userId, dto.sourceAccountId);
    }
    return this.goalsService.createGoal(userId, dto);
  }

  async updateGoal(
    userId: string,
    id: string,
    dto: UpdateGoalDto,
  ): Promise<GoalResponseDto> {
    if (typeof dto.sourceAccountId === "string") {
      await this.assertSourceAccount(userId, dto.sourceAccountId);
    }
    return this.goalsService.updateGoal(userId, id, dto);
  }

  private async assertSourceAccount(
    userId: string,
    sourceAccountId: string,
  ): Promise<void> {
    await this.accountsService.getAccount(userId, sourceAccountId);
  }
}
