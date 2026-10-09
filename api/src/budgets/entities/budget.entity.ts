import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";
import { Category } from "../../categories/entities/category.entity";
import { numericTransformer } from "../../common/transformers/numeric.transformer";
import { User } from "../../users/entities/user.entity";

@Entity("budgets")
@Unique(["userId", "categoryId", "period"])
export class Budget {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ name: "user_id", type: "uuid" })
  userId: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ name: "category_id", type: "uuid" })
  categoryId: string;

  @ManyToOne(() => Category, { onDelete: "CASCADE" })
  @JoinColumn({ name: "category_id" })
  category: Category;

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

  @Column({ type: "boolean", default: false })
  recurring: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;
}
