import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "../../users/entities/user.entity";

export interface StoredConversationMessage {
  role: "user" | "assistant";
  content: string;
}

@Entity("ai_conversations")
export class AiConversation {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ name: "user_id", type: "uuid" })
  userId: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ type: "text" })
  question: string;

  @Column({ type: "text" })
  answer: string;

  @Column({ name: "context_meta", type: "jsonb", default: {} })
  contextMeta: Record<string, unknown>;

  @Column({ type: "jsonb", default: () => "'[]'::jsonb" })
  messages: StoredConversationMessage[];

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;
}
