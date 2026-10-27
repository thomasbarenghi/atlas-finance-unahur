import { HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as argon2 from "argon2";
import { Repository } from "typeorm";
import { ApiException } from "../common/errors/api.exception";
import { ErrorCode } from "../common/errors/error-codes";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { toUserResponse, UserResponseDto } from "./dto/user-response.dto";
import { User } from "./entities/user.entity";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async getById(userId: string): Promise<UserResponseDto> {
    return toUserResponse(await this.findOwned(userId));
  }

  async findByEmail(email: string): Promise<UserResponseDto | null> {
    const user = await this.usersRepository.findOneBy({
      email: email.toLowerCase().trim(),
    });
    return user ? toUserResponse(user) : null;
  }

  async updateMe(userId: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.findOwned(userId);

    if (dto.name !== undefined) user.name = dto.name.trim();
    if (dto.email !== undefined) {
      const email = dto.email.toLowerCase().trim();
      const existing = await this.usersRepository.findOneBy({ email });
      if (existing && existing.id !== user.id) {
        throw new ApiException(
          ErrorCode.EMAIL_IN_USE,
          HttpStatus.CONFLICT,
          "Ese email ya está registrado",
          { email: ["Ese email ya está registrado"] },
        );
      }
      user.email = email;
    }
    if (dto.primaryCurrency !== undefined) {
      user.primaryCurrency = dto.primaryCurrency;
    }

    return toUserResponse(await this.usersRepository.save(user));
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.findOwned(userId);
    const valid = await argon2.verify(user.passwordHash, dto.currentPassword);
    if (!valid) {
      throw new ApiException(
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        "La contraseña actual no es correcta",
        { currentPassword: ["La contraseña actual no es correcta"] },
      );
    }

    user.passwordHash = await argon2.hash(dto.newPassword);
    await this.usersRepository.save(user);
  }

  private async findOwned(userId: string): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new ApiException(
        ErrorCode.NOT_FOUND,
        HttpStatus.NOT_FOUND,
        "El usuario no existe",
      );
    }
    return user;
  }
}
