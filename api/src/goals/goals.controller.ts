import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { CreateGoalDto } from "./dto/create-goal.dto";
import { GoalResponseDto } from "./dto/goal-response.dto";
import { UpdateGoalDto } from "./dto/update-goal.dto";
import { GoalsOrchestrator } from "./goals.orchestrator";
import { GoalsService } from "./goals.service";

@ApiTags("goals")
@Controller("goals")
export class GoalsController {
  constructor(
    private readonly goalsService: GoalsService,
    private readonly goalsOrchestrator: GoalsOrchestrator,
  ) {}

  @Get()
  @ApiOperation({ summary: "Lista las metas del usuario" })
  @ApiOkResponse({ description: "GoalResponseDto[]" })
  list(@CurrentUser("id") userId: string): Promise<GoalResponseDto[]> {
    return this.goalsService.listGoals(userId);
  }

  @Post()
  @ApiOperation({ summary: "Crea una meta de ahorro" })
  @ApiOkResponse({ description: "GoalResponseDto" })
  create(
    @CurrentUser("id") userId: string,
    @Body() dto: CreateGoalDto,
  ): Promise<GoalResponseDto> {
    return this.goalsOrchestrator.createGoal(userId, dto);
  }

  @Get(":id")
  @ApiOperation({ summary: "Obtiene una meta del usuario" })
  @ApiOkResponse({ description: "GoalResponseDto" })
  get(
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
  ): Promise<GoalResponseDto> {
    return this.goalsService.getGoal(userId, id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Edita una meta del usuario" })
  @ApiOkResponse({ description: "GoalResponseDto" })
  update(
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
    @Body() dto: UpdateGoalDto,
  ): Promise<GoalResponseDto> {
    return this.goalsOrchestrator.updateGoal(userId, id, dto);
  }

  @Post(":id/archive")
  @ApiOperation({ summary: "Archiva una meta" })
  @ApiOkResponse({ description: "GoalResponseDto" })
  archive(
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
  ): Promise<GoalResponseDto> {
    return this.goalsService.archiveGoal(userId, id);
  }

  @Post(":id/restore")
  @ApiOperation({ summary: "Restaura una meta archivada" })
  @ApiOkResponse({ description: "GoalResponseDto" })
  restore(
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
  ): Promise<GoalResponseDto> {
    return this.goalsService.restoreGoal(userId, id);
  }
}
