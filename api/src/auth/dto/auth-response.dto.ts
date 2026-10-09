import { UserResponseDto } from "../../users/dto/user-response.dto";

export class AuthResponse {
  user: UserResponseDto;
  accessToken: string;
  refreshToken: string;
}

export class TokenPair {
  accessToken: string;
  refreshToken: string;
}
