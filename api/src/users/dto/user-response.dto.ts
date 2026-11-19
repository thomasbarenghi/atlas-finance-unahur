import { User } from "../entities/user.entity";

export class UserResponseDto {
  id: string;
  name: string;
  email: string;
  primaryCurrency: string;
  createdAt: string;
}

export const toUserResponse = (user: User): UserResponseDto => ({
  id: user.id,
  name: user.name,
  email: user.email,
  primaryCurrency: user.primaryCurrency,
  createdAt: user.createdAt.toISOString(),
});
