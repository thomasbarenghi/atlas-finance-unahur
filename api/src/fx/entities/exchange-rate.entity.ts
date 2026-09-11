import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import { numericTransformer } from "../../common/transformers/numeric.transformer";

@Entity("exchange_rates")
@Unique(["baseCurrency", "quoteCurrency", "provider", "date"])
export class ExchangeRate {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "base_currency", type: "char", length: 3 })
  baseCurrency: string;

  @Column({ name: "quote_currency", type: "char", length: 3 })
  quoteCurrency: string;

  @Column({
    type: "numeric",
    precision: 18,
    scale: 8,
    transformer: numericTransformer,
  })
  rate: number;

  @Column({ type: "text" })
  provider: string;

  @Column({ type: "date" })
  date: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;
}
