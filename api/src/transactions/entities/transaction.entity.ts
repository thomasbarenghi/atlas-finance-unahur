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
import { Account } from "../../accounts/entities/account.entity";
import { Category } from "../../categories/entities/category.entity";
import { TransactionType } from "../../common/types/financial-enums";
import { numericTransformer } from "../../common/transformers/numeric.transformer";
import { User } from "../../users/entities/user.entity";

@Entity("transactions")
export class Transaction {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ name: "user_id", type: "uuid" })
  userId: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

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

  @ManyToOne(() => Account, { onDelete: "CASCADE" })
  @JoinColumn({ name: "account_id" })
  account: Account;

  @Column({ name: "transfer_account_id", type: "uuid", nullable: true })
  transferAccountId: string | null;

  @ManyToOne(() => Account, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "transfer_account_id" })
  transferAccount: Account | null;

  @Column({ name: "category_id", type: "uuid", nullable: true })
  categoryId: string | null;

  @ManyToOne(() => Category, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "category_id" })
  category: Category | null;

  @Index()
  @Column({ name: "transfer_group_id", type: "uuid", nullable: true })
  transferGroupId: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;
}
