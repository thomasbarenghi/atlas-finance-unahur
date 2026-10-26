import { Column, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { numericTransformer } from "../../common/transformers/numeric.transformer";

/**
 * Global, API-owned quote for a currency (RN-016). `rate` is stored in ARS per
 * unit, the internal base of the catalog. Users never create or edit these
 * rows: the provider refreshes them and the UI only displays them. The only
 * per-operation override is the rate of a multi-currency transfer, which is
 * not persisted (RN-017).
 */
@Entity("currency_rates")
export class CurrencyRate {
  @PrimaryColumn({ type: "text" })
  currency: string;

  @Column({
    type: "numeric",
    precision: 18,
    scale: 6,
    transformer: numericTransformer,
  })
  rate: number;

  @Column({ name: "rate_date", type: "date" })
  rateDate: string;

  @Column({ type: "text" })
  source: "api" | "seed";

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;
}
