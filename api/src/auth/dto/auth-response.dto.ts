import { UserResponseDto } from "../../users/dto/user-response.dto";

export class AuthResponse {
  user: UserResponseDto;
}

export class TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: UserResponseDto;
  tokens: TokenPair;
}
