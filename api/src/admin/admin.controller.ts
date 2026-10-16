import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { Public } from "../common/decorators/public.decorator";
import { AdminGuard } from "./admin.guard";
import { AdminService } from "./admin.service";
import { AdminUserDto } from "./dto/admin-user.dto";
import { ListUsersQueryDto } from "./dto/list-users-query.dto";

@ApiTags("admin")
@ApiHeader({
  name: "x-admin-key",
  description: "Clave de administrador (ADMIN_API_KEY)",
  required: true,
})
@Public()
@UseGuards(AdminGuard)
@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("users")
  @ApiOperation({
    summary: "Lista usuarios, opcionalmente filtrados por estado de aprobación",
  })
  @ApiOkResponse({ type: [AdminUserDto] })
  list(@Query() query: ListUsersQueryDto): Promise<AdminUserDto[]> {
    return this.adminService.listUsers(query.status);
  }

  @Post("users/:id/approve")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Aprueba la cuenta de un usuario" })
  @ApiOkResponse({ type: AdminUserDto })
  approve(@Param("id", new ParseUUIDPipe()) id: string): Promise<AdminUserDto> {
    return this.adminService.approve(id);
  }

  @Post("users/:id/reject")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Rechaza la cuenta de un usuario" })
  @ApiOkResponse({ type: AdminUserDto })
  reject(@Param("id", new ParseUUIDPipe()) id: string): Promise<AdminUserDto> {
    return this.adminService.reject(id);
  }
}
