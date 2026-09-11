import { Column, Entity, PrimaryGeneratedColumn, Unique } from "typeorm";
import { numericTransformer } from "../../common/transformers/numeric.transformer";

@Entity("quotes")
@Unique(["symbol", "currency", "provider"])
export class Quote {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "text" })
  symbol: string;

  @Column({
    type: "numeric",
    precision: 18,
    scale: 8,
    transformer: numericTransformer,
  })
  price: number;

  @Column({ type: "char", length: 3 })
  currency: string;

  @Column({ type: "text" })
  provider: string;

  @Column({
    name: "change_24h",
    type: "numeric",
    precision: 18,
    scale: 8,
    nullable: true,
    transformer: numericTransformer,
  })
  change24h: number | null;

  @Column({ name: "fetched_at", type: "timestamptz" })
  fetchedAt: Date;
}
