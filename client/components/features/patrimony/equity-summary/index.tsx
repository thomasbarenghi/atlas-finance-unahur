import Link from "next/link";
import { Money } from "@/components/common/money";
import { SectionCard } from "@/components/common/section-card";
import { equityFor } from "@/lib/patrimony";
import type { EquitySummaryProps } from "./equity-summary.types";

export const EquitySummary = ({
  assetValue,
  debt,
  currency,
  title = "Patrimonio real",
  debtHref,
  debtLabel = "Deuda asociada",
}: EquitySummaryProps) => {
  const equity = equityFor(assetValue, debt);

  return (
    <SectionCard
      title={title}
      description="Cuánto de este activo realmente es tuyo."
    >
      <dl className="flex flex-col gap-2 text-sm">
        <div className="flex items-center justify-between gap-2">
          <dt className="text-muted-foreground">Valor del activo</dt>
          <dd className="font-medium">
            <Money value={assetValue} currency={currency} />
          </dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-muted-foreground">{debtLabel}</dt>
          <dd className="text-destructive font-medium">
            {debtHref ? (
              <Link href={debtHref} className="hover:underline">
                −<Money value={debt} currency={currency} />
              </Link>
            ) : (
              <>
                −<Money value={debt} currency={currency} />
              </>
            )}
          </dd>
        </div>
        <div className="mt-1 flex items-center justify-between gap-2 border-t pt-2">
          <dt className="font-medium">Valor neto</dt>
          <dd className="font-heading text-base font-semibold">
            <Money value={equity} currency={currency} />
          </dd>
        </div>
      </dl>
    </SectionCard>
  );
};
