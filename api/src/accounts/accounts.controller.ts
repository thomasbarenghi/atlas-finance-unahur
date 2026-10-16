import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from "@nestjs/common";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { AccountResponseDto } from "./dto/account-response.dto";
import { CreateAccountDto } from "./dto/create-account.dto";
import { UpdateAccountDto } from "./dto/update-account.dto";
import { AccountsService } from "./accounts.service";

@Controller("accounts")
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  list(@CurrentUser("id") userId: string): Promise<AccountResponseDto[]> {
    return this.accountsService.listAccounts(userId);
  }

  @Post()
  create(
    @CurrentUser("id") userId: string,
    @Body() dto: CreateAccountDto,
  ): Promise<AccountResponseDto> {
    return this.accountsService.createAccount(userId, dto);
  }

  @Get(":id")
  get(
    @CurrentUser("id") userId: string,
    @Param("id", new ParseUUIDPipe()) id: string,
  ): Promise<AccountResponseDto> {
    return this.accountsService.getAccount(userId, id);
  }

  @Patch(":id")
  update(
    @CurrentUser("id") userId: string,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateAccountDto,
  ): Promise<AccountResponseDto> {
    return this.accountsService.updateAccount(userId, id, dto);
  }

  @Delete(":id")
  remove(
    @CurrentUser("id") userId: string,
    @Param("id", new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    return this.accountsService.deleteAccount(userId, id);
  }
}
