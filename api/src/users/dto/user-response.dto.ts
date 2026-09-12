import type { Theme } from "../../common/types/financial-enums";
import { User } from "../entities/user.entity";

export interface UserResponseDto {
  id: string;
  name: string;
  email: string;
  baseCurrency: string;
  theme: Theme;
  aiEnabled: boolean;
  createdAt: string;
}

export const toUserResponse = (user: User): UserResponseDto => ({
  id: user.id,
  name: user.name,
  email: user.email,
  baseCurrency: user.baseCurrency,
  theme: user.theme,
  aiEnabled: user.aiEnabled,
  createdAt: user.createdAt.toISOString(),
});
