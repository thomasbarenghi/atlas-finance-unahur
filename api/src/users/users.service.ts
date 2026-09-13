import { HttpStatus, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ApiException } from "../common/errors/api.exception";
import { ErrorCode } from "../common/errors/error-codes";
import { AppConfig } from "../config/configuration";
import { UpdateUserDto } from "./dto/update-user.dto";
import { toUserResponse, UserResponseDto } from "./dto/user-response.dto";
import { User } from "./entities/user.entity";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  async getById(userId: string): Promise<UserResponseDto> {
    return toUserResponse(await this.findOwned(userId));
  }

  async updateMe(userId: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.findOwned(userId);

    if (dto.name !== undefined) user.name = dto.name.trim();
    if (dto.baseCurrency !== undefined) {
      const currency = dto.baseCurrency.toUpperCase();
      const supported = this.config.get("supportedCurrencies", { infer: true });
      if (!supported.includes(currency)) {
        throw new ApiException(
          ErrorCode.VALIDATION_ERROR,
          HttpStatus.BAD_REQUEST,
          "La moneda no está soportada",
          { baseCurrency: ["Moneda no soportada"] },
        );
      }
      user.baseCurrency = currency;
    }
    if (dto.theme !== undefined) user.theme = dto.theme;
    if (dto.aiEnabled !== undefined) user.aiEnabled = dto.aiEnabled;
    if (dto.assistantDestructiveEnabled !== undefined) {
      user.assistantDestructiveEnabled = dto.assistantDestructiveEnabled;
    }

    return toUserResponse(await this.usersRepository.save(user));
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
