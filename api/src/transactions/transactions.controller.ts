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
import { Paginated } from "../common/dto/pagination.dto";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { QueryTransactionsDto } from "./dto/query-transactions.dto";
import { TransactionResponseDto } from "./dto/transaction-response.dto";
import { UpdateTransactionDto } from "./dto/update-transaction.dto";
import { TransactionsService } from "./transactions.service";

@ApiTags("transactions")
@Controller("transactions")
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @ApiOperation({ summary: "Lista movimientos con filtros y búsqueda" })
  @ApiOkResponse({ description: "Paginated<TransactionResponseDto>" })
  list(
    @CurrentUser("id") userId: string,
    @Query() filters: QueryTransactionsDto,
  ): Promise<Paginated<TransactionResponseDto>> {
    return this.transactionsService.listTransactions(userId, filters);
  }

  @Post()
  @ApiOperation({ summary: "Crea un ingreso, gasto o transferencia" })
  @ApiOkResponse({ description: "TransactionResponseDto" })
  create(
    @CurrentUser("id") userId: string,
    @Body() dto: CreateTransactionDto,
  ): Promise<TransactionResponseDto> {
    return this.transactionsService.createTransaction(userId, dto);
  }

  @Get(":id")
  @ApiOperation({ summary: "Obtiene un movimiento" })
  @ApiOkResponse({ description: "TransactionResponseDto" })
  get(
    @CurrentUser("id") userId: string,
    @Param("id", new ParseUUIDPipe()) id: string,
  ): Promise<TransactionResponseDto> {
    return this.transactionsService.getTransaction(userId, id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Edita un movimiento" })
  @ApiOkResponse({ description: "TransactionResponseDto" })
  update(
    @CurrentUser("id") userId: string,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateTransactionDto,
  ): Promise<TransactionResponseDto> {
    return this.transactionsService.updateTransaction(userId, id, dto);
  }

  @Delete(":id")
  @ApiOperation({
    summary: "Elimina un movimiento (y su par si es transferencia)",
  })
  remove(
    @CurrentUser("id") userId: string,
    @Param("id", new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    return this.transactionsService.deleteTransaction(userId, id);
  }
}
