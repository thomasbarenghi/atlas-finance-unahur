import { HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ApiException } from "../common/errors/api.exception";
import { ErrorCode } from "../common/errors/error-codes";
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
      email: email.toLowerCase(),
    });
    return user ? toUserResponse(user) : null;
  }

  async updateMe(userId: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.findOwned(userId);

    if (dto.name !== undefined) user.name = dto.name.trim();

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
