import { HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ApiException } from "../common/errors/api.exception";
import { ErrorCode } from "../common/errors/error-codes";
import { CalculationsService } from "../shared/calculations/calculations.service";
import { CreateGoalDto } from "./dto/create-goal.dto";
import { GoalResponseDto } from "./dto/goal-response.dto";
import { UpdateGoalDto } from "./dto/update-goal.dto";
import { Goal } from "./entities/goal.entity";

@Injectable()
export class GoalsService {
  constructor(
    @InjectRepository(Goal)
    private readonly goalsRepository: Repository<Goal>,
    private readonly calculationsService: CalculationsService,
  ) {}

  private toResponse(goal: Goal): GoalResponseDto {
    const { progressPct, status } =
      this.calculationsService.calculateGoalProgress(
        goal.targetAmount,
        goal.savedAmount,
        goal.targetDate,
      );

    return {
      id: goal.id,
      name: goal.name,
      targetAmount: goal.targetAmount,
      savedAmount: goal.savedAmount,
      currency: goal.currency,
      targetDate: goal.targetDate,
      sourceAccountId: goal.sourceAccountId,
      archived: goal.archived,
      progressPct,
      status,
      createdAt: goal.createdAt.toISOString(),
      updatedAt: goal.updatedAt.toISOString(),
    };
  }

  async listGoals(userId: string): Promise<GoalResponseDto[]> {
    const goals = await this.goalsRepository.find({
      where: { userId },
      order: { createdAt: "ASC" },
    });
    return goals.map((goal) => this.toResponse(goal));
  }

  async getGoal(userId: string, id: string): Promise<GoalResponseDto> {
    return this.toResponse(await this.findOwnedGoal(userId, id));
  }

  async createGoal(
    userId: string,
    dto: CreateGoalDto,
  ): Promise<GoalResponseDto> {
    const goal = this.goalsRepository.create({
      userId,
      name: dto.name.trim(),
      targetAmount: dto.targetAmount,
      savedAmount: dto.savedAmount ?? 0,
      currency: dto.currency.toUpperCase(),
      targetDate: dto.targetDate ?? null,
      sourceAccountId: dto.sourceAccountId ?? null,
    });
    return this.toResponse(await this.goalsRepository.save(goal));
  }

  async updateGoal(
    userId: string,
    id: string,
    dto: UpdateGoalDto,
  ): Promise<GoalResponseDto> {
    const goal = await this.findOwnedGoal(userId, id);

    if (dto.name !== undefined) goal.name = dto.name.trim();
    if (dto.targetAmount !== undefined) goal.targetAmount = dto.targetAmount;
    if (dto.savedAmount !== undefined) goal.savedAmount = dto.savedAmount;
    if (dto.currency !== undefined) goal.currency = dto.currency.toUpperCase();
    if (dto.targetDate !== undefined) goal.targetDate = dto.targetDate ?? null;
    if (dto.sourceAccountId !== undefined) {
      goal.sourceAccountId = dto.sourceAccountId ?? null;
    }

    return this.toResponse(await this.goalsRepository.save(goal));
  }

  async contributeToGoal(
    userId: string,
    id: string,
    amount: number,
  ): Promise<GoalResponseDto> {
    const goal = await this.findOwnedGoal(userId, id);
    goal.savedAmount = goal.savedAmount + amount;
    return this.toResponse(await this.goalsRepository.save(goal));
  }

  async archiveGoal(userId: string, id: string): Promise<GoalResponseDto> {
    const goal = await this.findOwnedGoal(userId, id);
    goal.archived = true;
    return this.toResponse(await this.goalsRepository.save(goal));
  }

  async restoreGoal(userId: string, id: string): Promise<GoalResponseDto> {
    const goal = await this.findOwnedGoal(userId, id);
    goal.archived = false;
    return this.toResponse(await this.goalsRepository.save(goal));
  }

  private async findOwnedGoal(userId: string, id: string): Promise<Goal> {
    const goal = await this.goalsRepository.findOneBy({ id, userId });
    if (!goal) {
      throw new ApiException(
        ErrorCode.NOT_FOUND,
        HttpStatus.NOT_FOUND,
        "La meta no existe",
      );
    }
    return goal;
  }
}
