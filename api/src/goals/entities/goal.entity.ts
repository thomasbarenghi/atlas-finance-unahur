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
import { numericTransformer } from "../../common/transformers/numeric.transformer";
import { User } from "../../users/entities/user.entity";

@Entity("goals")
export class Goal {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ name: "user_id", type: "uuid" })
  userId: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ type: "text" })
  name: string;

  @Column({
    name: "target_amount",
    type: "numeric",
    precision: 18,
    scale: 4,
    transformer: numericTransformer,
  })
  targetAmount: number;

  @Column({
    name: "saved_amount",
    type: "numeric",
    precision: 18,
    scale: 4,
    default: 0,
    transformer: numericTransformer,
  })
  savedAmount: number;

  @Column({ type: "char", length: 3 })
  currency: string;

  @Column({ name: "target_date", type: "date", nullable: true })
  targetDate: string | null;

  @Index()
  @Column({ name: "source_account_id", type: "uuid", nullable: true })
  sourceAccountId: string | null;

  @ManyToOne(() => Account, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "source_account_id" })
  sourceAccount: Account | null;

  @Column({ type: "boolean", default: false })
  archived: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;
}
