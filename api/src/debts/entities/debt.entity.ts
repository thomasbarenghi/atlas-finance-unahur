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
import { Asset } from "../../assets/entities/asset.entity";
import { DebtType } from "../../common/types/financial-enums";
import { numericTransformer } from "../../common/transformers/numeric.transformer";
import { User } from "../../users/entities/user.entity";

@Entity("debts")
export class Debt {
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

  @ManyToOne(() => Asset, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "asset_id" })
  asset: Asset | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;
}
