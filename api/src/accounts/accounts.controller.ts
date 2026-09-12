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
import { AccountResponseDto } from "./dto/account-response.dto";
import { CreateAccountDto } from "./dto/create-account.dto";
import { UpdateAccountDto } from "./dto/update-account.dto";
import { AccountsService } from "./accounts.service";

@ApiTags("accounts")
@Controller("accounts")
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  @ApiOperation({ summary: "Lista las cuentas con su saldo actual" })
  @ApiOkResponse({ description: "AccountResponseDto[]" })
  list(@CurrentUser("id") userId: string): Promise<AccountResponseDto[]> {
    return this.accountsService.listAccounts(userId);
  }

  @Post()
  @ApiOperation({ summary: "Crea una cuenta" })
  @ApiOkResponse({ description: "AccountResponseDto" })
  create(
    @CurrentUser("id") userId: string,
    @Body() dto: CreateAccountDto,
  ): Promise<AccountResponseDto> {
    return this.accountsService.createAccount(userId, dto);
  }

  @Get(":id")
  @ApiOperation({ summary: "Obtiene una cuenta" })
  @ApiOkResponse({ description: "AccountResponseDto" })
  get(
    @CurrentUser("id") userId: string,
    @Param("id", new ParseUUIDPipe()) id: string,
  ): Promise<AccountResponseDto> {
    return this.accountsService.getAccount(userId, id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Edita una cuenta" })
  @ApiOkResponse({ description: "AccountResponseDto" })
  update(
    @CurrentUser("id") userId: string,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateAccountDto,
  ): Promise<AccountResponseDto> {
    return this.accountsService.updateAccount(userId, id, dto);
  }

  @Post(":id/archive")
  @ApiOperation({ summary: "Archiva una cuenta" })
  @ApiOkResponse({ description: "AccountResponseDto" })
  archive(
    @CurrentUser("id") userId: string,
    @Param("id", new ParseUUIDPipe()) id: string,
  ): Promise<AccountResponseDto> {
    return this.accountsService.archiveAccount(userId, id);
  }

  @Post(":id/restore")
  @ApiOperation({ summary: "Restaura una cuenta archivada" })
  @ApiOkResponse({ description: "AccountResponseDto" })
  restore(
    @CurrentUser("id") userId: string,
    @Param("id", new ParseUUIDPipe()) id: string,
  ): Promise<AccountResponseDto> {
    return this.accountsService.restoreAccount(userId, id);
  }
}
