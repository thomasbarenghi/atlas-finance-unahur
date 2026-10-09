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
import { Paginated } from "../common/dto/pagination.dto";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { QueryTransactionsDto } from "./dto/query-transactions.dto";
import {
  PaginatedTransactionsDto,
  TransactionResponseDto,
} from "./dto/transaction-response.dto";
import { UpdateTransactionDto } from "./dto/update-transaction.dto";
import { TransactionsOrchestrator } from "./transactions.orchestrator";
import { TransactionsService } from "./transactions.service";

@ApiTags("transactions")
@ApiBearerAuth()
@ApiErrors(400, 401, 404, 409)
@Controller("transactions")
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly transactionsOrchestrator: TransactionsOrchestrator,
  ) {}

  @Get()
  @ApiOperation({ summary: "Lista movimientos con filtros y búsqueda" })
  @ApiOkResponse({ type: PaginatedTransactionsDto })
  list(
    @CurrentUser("id") userId: string,
    @Query() filters: QueryTransactionsDto,
  ): Promise<Paginated<TransactionResponseDto>> {
    return this.transactionsService.listTransactions(userId, filters);
  }

  @Post()
  @ApiOperation({ summary: "Crea un ingreso, gasto o transferencia" })
  @ApiOkResponse({ type: TransactionResponseDto })
  create(
    @CurrentUser("id") userId: string,
    @Body() dto: CreateTransactionDto,
  ): Promise<TransactionResponseDto> {
    return this.transactionsOrchestrator.createTransaction(userId, dto);
  }

  @Get(":id")
  @ApiOperation({ summary: "Obtiene un movimiento" })
  @ApiOkResponse({ type: TransactionResponseDto })
  get(
    @CurrentUser("id") userId: string,
    @Param("id", new ParseUUIDPipe()) id: string,
  ): Promise<TransactionResponseDto> {
    return this.transactionsService.getTransaction(userId, id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Edita un movimiento" })
  @ApiOkResponse({ type: TransactionResponseDto })
  update(
    @CurrentUser("id") userId: string,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateTransactionDto,
  ): Promise<TransactionResponseDto> {
    return this.transactionsOrchestrator.updateTransaction(userId, id, dto);
  }

  @Delete(":id")
  @ApiOperation({
    summary: "Elimina un movimiento (y su par si es transferencia)",
  })
  @ApiOkResponse({ description: "Movimiento eliminado" })
  remove(
    @CurrentUser("id") userId: string,
    @Param("id", new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    return this.transactionsService.deleteTransaction(userId, id);
  }
}
