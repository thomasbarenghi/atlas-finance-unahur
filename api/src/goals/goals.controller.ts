import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { ApiErrors } from "../common/decorators/api-errors.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { CreateGoalDto } from "./dto/create-goal.dto";
import { GoalResponseDto } from "./dto/goal-response.dto";
import { UpdateGoalDto } from "./dto/update-goal.dto";
import { GoalsOrchestrator } from "./goals.orchestrator";
import { GoalsService } from "./goals.service";

@ApiTags("goals")
@ApiBearerAuth()
@ApiErrors(400, 401, 404, 409)
@Controller("goals")
export class GoalsController {
  constructor(
    private readonly goalsService: GoalsService,
    private readonly goalsOrchestrator: GoalsOrchestrator,
  ) {}

  @Get()
  @ApiOperation({ summary: "Lista las metas del usuario" })
  @ApiOkResponse({ type: [GoalResponseDto] })
  list(@CurrentUser("id") userId: string): Promise<GoalResponseDto[]> {
    return this.goalsService.listGoals(userId);
  }

  @Post()
  @ApiOperation({ summary: "Crea una meta de ahorro" })
  @ApiOkResponse({ type: GoalResponseDto })
  create(
    @CurrentUser("id") userId: string,
    @Body() dto: CreateGoalDto,
  ): Promise<GoalResponseDto> {
    return this.goalsOrchestrator.createGoal(userId, dto);
  }

  @Get(":id")
  @ApiOperation({ summary: "Obtiene una meta del usuario" })
  @ApiOkResponse({ type: GoalResponseDto })
  get(
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
  ): Promise<GoalResponseDto> {
    return this.goalsService.getGoal(userId, id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Edita una meta del usuario" })
  @ApiOkResponse({ type: GoalResponseDto })
  update(
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
    @Body() dto: UpdateGoalDto,
  ): Promise<GoalResponseDto> {
    return this.goalsOrchestrator.updateGoal(userId, id, dto);
  }

  @Post(":id/archive")
  @ApiOperation({ summary: "Archiva una meta" })
  @ApiOkResponse({ type: GoalResponseDto })
  archive(
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
  ): Promise<GoalResponseDto> {
    return this.goalsService.archiveGoal(userId, id);
  }

  @Post(":id/restore")
  @ApiOperation({ summary: "Restaura una meta archivada" })
  @ApiOkResponse({ type: GoalResponseDto })
  restore(
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
  ): Promise<GoalResponseDto> {
    return this.goalsService.restoreGoal(userId, id);
  }
}
