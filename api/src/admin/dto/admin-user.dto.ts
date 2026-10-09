import { UserApprovalStatus } from "../../common/types/financial-enums";
import { User } from "../../users/entities/user.entity";

export class AdminUserDto {
  id: string;
  name: string;
  email: string;
  approvalStatus: UserApprovalStatus;
  aiEnabled: boolean;
  createdAt: string;
}

export const toAdminUser = (user: User): AdminUserDto => ({
  id: user.id,
  name: user.name,
  email: user.email,
  approvalStatus: user.approvalStatus,
  aiEnabled: user.aiEnabled,
  createdAt: user.createdAt.toISOString(),
});
