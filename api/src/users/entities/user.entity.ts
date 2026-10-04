import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Theme } from "../../common/types/financial-enums";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "text" })
  name: string;

  @Column({ type: "text", unique: true })
  email: string;

  @Column({ name: "password_hash", type: "text" })
  passwordHash: string;

  @Column({ name: "base_currency", type: "char", length: 3, default: "ARS" })
  baseCurrency: string;

  @Column({ type: "text", default: "system" })
  theme: Theme;

  @Column({ name: "ai_enabled", type: "boolean", default: false })
  aiEnabled: boolean;

  @Column({
    name: "assistant_destructive_enabled",
    type: "boolean",
    default: false,
  })
  assistantDestructiveEnabled: boolean;

  @Column({ name: "reset_token_hash", type: "text", nullable: true })
  resetTokenHash: string | null;

  @Column({
    name: "reset_token_expires_at",
    type: "timestamptz",
    nullable: true,
  })
  resetTokenExpiresAt: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;
}
