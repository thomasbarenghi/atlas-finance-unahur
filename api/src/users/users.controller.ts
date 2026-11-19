import { Body, Controller, HttpCode, HttpStatus, Patch } from "@nestjs/common";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UserResponseDto } from "./dto/user-response.dto";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch("me")
  updateMe(
    @CurrentUser("id") userId: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateMe(userId, dto);
  }

  @Patch("me/password")
  @HttpCode(HttpStatus.NO_CONTENT)
  changePassword(
    @CurrentUser("id") userId: string,
    @Body() dto: ChangePasswordDto,
  ): Promise<void> {
    return this.usersService.changePassword(userId, dto);
  }
}
