import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";
import { numericTransformer } from "../../common/transformers/numeric.transformer";

@Entity("budgets")
@Unique(["userId", "categoryId", "period"])
export class Budget {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ name: "user_id", type: "uuid" })
  userId: string;

  @Column({ name: "category_id", type: "uuid" })
  categoryId: string;

  @Column({ type: "date" })
  period: string;

  @Column({
    type: "numeric",
    precision: 18,
    scale: 4,
    transformer: numericTransformer,
  })
  limit: number;

  @Column({ type: "char", length: 3 })
  currency: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;
}
