import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ValuationSource } from "../../common/types/financial-enums";
import { numericTransformer } from "../../common/transformers/numeric.transformer";

@Entity("valuations")
export class Valuation {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ name: "asset_id", type: "uuid" })
  assetId: string;

  @Column({
    type: "numeric",
    precision: 18,
    scale: 4,
    transformer: numericTransformer,
  })
  value: number;

  @Column({ type: "char", length: 3 })
  currency: string;

  @Column({ type: "date" })
  date: string;

  @Column({ type: "text", default: "manual" })
  source: ValuationSource;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;
}
