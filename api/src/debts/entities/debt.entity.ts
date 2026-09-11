import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { DebtType } from "../../common/types/financial-enums";
import { numericTransformer } from "../../common/transformers/numeric.transformer";

@Entity("debts")
export class Debt {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ name: "user_id", type: "uuid" })
  userId: string;

  @Column({ type: "text" })
  name: string;

  @Column({ type: "text" })
  type: DebtType;

  @Column({
    type: "numeric",
    precision: 18,
    scale: 4,
    transformer: numericTransformer,
  })
  balance: number;

  @Column({ type: "char", length: 3 })
  currency: string;

  @Column({ type: "date" })
  date: string;

  @Column({ type: "boolean", default: false })
  archived: boolean;

  @Column({ name: "asset_id", type: "uuid", nullable: true })
  assetId: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;
}
