import { HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ApiException } from "../common/errors/api.exception";
import { ErrorCode } from "../common/errors/error-codes";
import { UserApprovalStatus } from "../common/types/financial-enums";
import { User } from "../users/entities/user.entity";
import { AdminUserDto, toAdminUser } from "./dto/admin-user.dto";

/**
 * Administrative use cases for manual user approval. Only reachable through the
 * `AdminGuard`, which requires the `ADMIN_API_KEY` configured in the API `.env`.
 */
@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async listUsers(status?: UserApprovalStatus): Promise<AdminUserDto[]> {
    const users = await this.usersRepository.find({
      where: status ? { approvalStatus: status } : {},
      order: { createdAt: "DESC" },
    });
    return users.map(toAdminUser);
  }

  approve(userId: string): Promise<AdminUserDto> {
    return this.setStatus(userId, "approved");
  }

  reject(userId: string): Promise<AdminUserDto> {
    return this.setStatus(userId, "rejected");
  }

  private async setStatus(
    userId: string,
    status: UserApprovalStatus,
  ): Promise<AdminUserDto> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new ApiException(
        ErrorCode.NOT_FOUND,
        HttpStatus.NOT_FOUND,
        "El usuario no existe",
      );
    }
    user.approvalStatus = status;
    return toAdminUser(await this.usersRepository.save(user));
  }
}
