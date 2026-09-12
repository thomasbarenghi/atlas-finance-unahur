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
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { BudgetsService } from "./budgets.service";
import { BudgetResponseDto } from "./dto/budget-response.dto";
import { CopyBudgetsDto } from "./dto/copy-budgets.dto";
import { CreateBudgetDto } from "./dto/create-budget.dto";
import { QueryBudgetsDto } from "./dto/query-budgets.dto";
import { UpdateBudgetDto } from "./dto/update-budget.dto";

@ApiTags("budgets")
@Controller("budgets")
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Get()
  @ApiOperation({ summary: "Lista presupuestos del período (con proyección)" })
  @ApiOkResponse({ description: "BudgetResponseDto[]" })
  list(
    @CurrentUser("id") userId: string,
    @Query() query: QueryBudgetsDto,
  ): Promise<BudgetResponseDto[]> {
    return this.budgetsService.listBudgets(userId, query.period);
  }

  @Post()
  @ApiOperation({ summary: "Crea un presupuesto mensual" })
  @ApiOkResponse({ description: "BudgetResponseDto" })
  create(
    @CurrentUser("id") userId: string,
    @Body() dto: CreateBudgetDto,
  ): Promise<BudgetResponseDto> {
    return this.budgetsService.createBudget(userId, dto);
  }

  @Post("copy-previous")
  @ApiOperation({ summary: "Copia los presupuestos del mes anterior" })
  @ApiOkResponse({ description: "BudgetResponseDto[]" })
  copyPrevious(
    @CurrentUser("id") userId: string,
    @Body() dto: CopyBudgetsDto,
  ): Promise<BudgetResponseDto[]> {
    return this.budgetsService.copyPreviousBudgets(userId, dto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Edita un presupuesto" })
  @ApiOkResponse({ description: "BudgetResponseDto" })
  update(
    @CurrentUser("id") userId: string,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateBudgetDto,
  ): Promise<BudgetResponseDto> {
    return this.budgetsService.updateBudget(userId, id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Elimina un presupuesto" })
  remove(
    @CurrentUser("id") userId: string,
    @Param("id", new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    return this.budgetsService.deleteBudget(userId, id);
  }
}
