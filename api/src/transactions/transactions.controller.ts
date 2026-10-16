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
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Paginated, PaginationDto } from "../common/dto/pagination.dto";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { TransactionResponseDto } from "./dto/transaction-response.dto";
import { UpdateTransactionDto } from "./dto/update-transaction.dto";
import { TransactionsOrchestrator } from "./transactions.orchestrator";
import { TransactionsService } from "./transactions.service";

@Controller("transactions")
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly transactionsOrchestrator: TransactionsOrchestrator,
  ) {}

  @Get()
  list(
    @CurrentUser("id") userId: string,
    @Query() pagination: PaginationDto,
  ): Promise<Paginated<TransactionResponseDto>> {
    return this.transactionsService.listTransactions(userId, pagination);
  }

  @Post()
  create(
    @CurrentUser("id") userId: string,
    @Body() dto: CreateTransactionDto,
  ): Promise<TransactionResponseDto> {
    return this.transactionsOrchestrator.createTransaction(userId, dto);
  }

  @Get(":id")
  get(
    @CurrentUser("id") userId: string,
    @Param("id", new ParseUUIDPipe()) id: string,
  ): Promise<TransactionResponseDto> {
    return this.transactionsService.getTransaction(userId, id);
  }

  @Patch(":id")
  update(
    @CurrentUser("id") userId: string,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateTransactionDto,
  ): Promise<TransactionResponseDto> {
    return this.transactionsOrchestrator.updateTransaction(userId, id, dto);
  }

  @Delete(":id")
  remove(
    @CurrentUser("id") userId: string,
    @Param("id", new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    return this.transactionsService.deleteTransaction(userId, id);
  }
}
