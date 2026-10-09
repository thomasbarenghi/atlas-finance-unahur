import { IsIn, IsOptional } from "class-validator";
import { UserApprovalStatus } from "../../common/types/financial-enums";

export const USER_APPROVAL_STATUS_VALUES: UserApprovalStatus[] = [
  "pending",
  "approved",
  "rejected",
];

export class ListUsersQueryDto {
  @IsOptional()
  @IsIn(USER_APPROVAL_STATUS_VALUES)
  status?: UserApprovalStatus;
}
