import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { AccountType } from "../../common/types/financial-enums";
import { numericTransformer } from "../../common/transformers/numeric.transformer";

@Entity("accounts")
export class Account {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ name: "user_id", type: "uuid" })
  userId: string;

  @Column({ type: "text" })
  name: string;

  @Column({ type: "text" })
  type: AccountType;

  @Column({ type: "char", length: 3 })
  currency: string;

  @Column({
    name: "initial_balance",
    type: "numeric",
    precision: 18,
    scale: 4,
    transformer: numericTransformer,
  })
  initialBalance: number;

  @Column({ type: "boolean", default: false })
  archived: boolean;

  @Column({ type: "text", nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;
}
