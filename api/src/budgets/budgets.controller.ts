import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { ApiErrors } from "../common/decorators/api-errors.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { BudgetsOrchestrator } from "./budgets.orchestrator";
import { BudgetResponseDto } from "./dto/budget-response.dto";
import { CopyBudgetsDto } from "./dto/copy-budgets.dto";
import { CreateBudgetDto } from "./dto/create-budget.dto";
import { QueryBudgetsDto } from "./dto/query-budgets.dto";
import { UpdateBudgetDto } from "./dto/update-budget.dto";

@ApiTags("budgets")
@ApiBearerAuth()
@ApiErrors(400, 401, 404, 409)
@Controller("budgets")
export class BudgetsController {
  constructor(private readonly budgetsOrchestrator: BudgetsOrchestrator) {}

  @Get()
  @ApiOperation({ summary: "Lista presupuestos del período (con proyección)" })
  @ApiOkResponse({ type: [BudgetResponseDto] })
  list(
    @CurrentUser("id") userId: string,
    @Query() query: QueryBudgetsDto,
  ): Promise<BudgetResponseDto[]> {
    return this.budgetsOrchestrator.listBudgets(userId, query.period);
  }

  @Post()
  @ApiOperation({ summary: "Crea un presupuesto mensual" })
  @ApiOkResponse({ type: BudgetResponseDto })
  create(
    @CurrentUser("id") userId: string,
    @Body() dto: CreateBudgetDto,
  ): Promise<BudgetResponseDto> {
    return this.budgetsOrchestrator.createBudget(userId, dto);
  }

  @Post("copy-previous")
  @ApiOperation({ summary: "Copia los presupuestos del mes anterior" })
  @ApiOkResponse({ type: [BudgetResponseDto] })
  copyPrevious(
    @CurrentUser("id") userId: string,
    @Body() dto: CopyBudgetsDto,
  ): Promise<BudgetResponseDto[]> {
    return this.budgetsOrchestrator.copyPreviousBudgets(userId, dto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Edita un presupuesto" })
  @ApiOkResponse({ type: BudgetResponseDto })
  update(
    @CurrentUser("id") userId: string,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateBudgetDto,
  ): Promise<BudgetResponseDto> {
    return this.budgetsOrchestrator.updateBudget(userId, id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Elimina un presupuesto" })
  @ApiOkResponse({ description: "Presupuesto eliminado" })
  remove(
    @CurrentUser("id") userId: string,
    @Param("id", new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    return this.budgetsOrchestrator.deleteBudget(userId, id);
  }
}
