import { UserResponseDto } from "../../users/dto/user-response.dto";

export class AuthResponse {
  user: UserResponseDto;
  accessToken: string;
  refreshToken: string;
}

export class PendingApprovalResponse {
  pendingApproval: true;
  user: UserResponseDto;
  message: string;
}

export type RegisterResponse = AuthResponse | PendingApprovalResponse;

export class TokenPair {
  accessToken: string;
  refreshToken: string;
}
