import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { CreateDebtDto } from "./dto/create-debt.dto";
import { DebtResponseDto } from "./dto/debt-response.dto";
import { UpdateDebtDto } from "./dto/update-debt.dto";
import { DebtsOrchestrator } from "./debts.orchestrator";

@ApiTags("debts")
@Controller("debts")
export class DebtsController {
  constructor(private readonly debtsOrchestrator: DebtsOrchestrator) {}

  @Get()
  @ApiOperation({ summary: "Lista las deudas del usuario" })
  @ApiOkResponse({ description: "DebtResponseDto[]" })
  list(@CurrentUser("id") userId: string): Promise<DebtResponseDto[]> {
    return this.debtsOrchestrator.listDebts(userId);
  }

  @Post()
  @ApiOperation({ summary: "Crea una deuda" })
  @ApiOkResponse({ description: "DebtResponseDto" })
  create(
    @CurrentUser("id") userId: string,
    @Body() dto: CreateDebtDto,
  ): Promise<DebtResponseDto> {
    return this.debtsOrchestrator.createDebt(userId, dto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Edita una deuda (y su vínculo con un activo)" })
  @ApiOkResponse({ description: "DebtResponseDto" })
  update(
    @CurrentUser("id") userId: string,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateDebtDto,
  ): Promise<DebtResponseDto> {
    return this.debtsOrchestrator.updateDebt(userId, id, dto);
  }

  @Post(":id/archive")
  @ApiOperation({ summary: "Archiva una deuda" })
  @ApiOkResponse({ description: "DebtResponseDto" })
  archive(
    @CurrentUser("id") userId: string,
    @Param("id", new ParseUUIDPipe()) id: string,
  ): Promise<DebtResponseDto> {
    return this.debtsOrchestrator.archiveDebt(userId, id);
  }
}
