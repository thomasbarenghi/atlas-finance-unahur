import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { numericTransformer } from "../../common/transformers/numeric.transformer";

@Entity("goals")
export class Goal {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ name: "user_id", type: "uuid" })
  userId: string;

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

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;
}
