import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";

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
