import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "../../users/entities/user.entity";
import type {
  ActionClass,
  ActionPreview,
  AssistantActionStatus,
} from "../tools/tool.types";

@Entity("assistant_actions")
export class AssistantAction {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ name: "user_id", type: "uuid" })
  userId: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ name: "conversation_id", type: "uuid", nullable: true })
  conversationId: string | null;

  @Column({ name: "plan_id", type: "uuid", nullable: true })
  planId: string | null;

  @Column({ type: "int", default: 0 })
  step: number;

  @Column({ type: "boolean", default: true })
  resolved: boolean;

  @Column({ name: "tool_name", type: "text" })
  toolName: string;

  @Column({ type: "text" })
  classification: ActionClass;

  @Column({ type: "jsonb" })
  args: Record<string, unknown>;

  @Column({ type: "jsonb", nullable: true })
  preview: ActionPreview | null;

  @Column({ type: "text", default: "proposed" })
  status: AssistantActionStatus;

  @Column({ name: "token_hash", type: "text", nullable: true })
  tokenHash: string | null;

  @Column({ type: "jsonb", nullable: true })
  result: Record<string, unknown> | null;

  @Column({ name: "error_message", type: "text", nullable: true })
  errorMessage: string | null;

  @Column({ name: "expires_at", type: "timestamptz" })
  expiresAt: Date;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;
}
