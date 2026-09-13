import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { TransactionType } from "../../common/types/financial-enums";
import { numericTransformer } from "../../common/transformers/numeric.transformer";

@Entity("transactions")
export class Transaction {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ name: "user_id", type: "uuid" })
  userId: string;

  @Column({ type: "text" })
  type: TransactionType;

  @Column({
    type: "numeric",
    precision: 18,
    scale: 4,
    transformer: numericTransformer,
  })
  amount: number;

  @Column({ type: "char", length: 3 })
  currency: string;

  @Column({ type: "date" })
  date: string;

  @Column({ type: "text" })
  description: string;

  @Column({ type: "text", nullable: true })
  notes: string | null;

  @Index()
  @Column({ name: "account_id", type: "uuid" })
  accountId: string;

  @Column({ name: "transfer_account_id", type: "uuid", nullable: true })
  transferAccountId: string | null;

  @Column({ name: "category_id", type: "uuid", nullable: true })
  categoryId: string | null;

  @Index()
  @Column({ name: "transfer_group_id", type: "uuid", nullable: true })
  transferGroupId: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;
}
