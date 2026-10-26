import { Amount } from "@/components/common/amount";
import type { Account } from "@/lib/api/types";
import { CURRENCY, formatCurrency } from "@/lib/format";
import { DetailMetric } from "./detail-metric";

export interface AccountSummary {
  income: number;
  expense: number;
}

export interface AccountMetricsProps {
  account: Account;
  summary: AccountSummary;
}

export const AccountMetrics = ({ account, summary }: AccountMetricsProps) => {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3.5">
      <DetailMetric
        label="Saldo inicial"
        info={{
          formula: "Saldo declarado al crear la cuenta",
          description: `Lo que la cuenta tenía antes de los movimientos: ${formatCurrency(account.initialBalance, CURRENCY)}.`,
        }}
        value={
          <Amount
            value={account.initialBalance}
            currency={CURRENCY}
            className="font-heading font-semibold"
          />
        }
      />
      <DetailMetric
        label="Ingresos"
        info={{
          formula: "Σ ingresos del período en esta cuenta",
          description: `Ingresos del período en esta cuenta: ${formatCurrency(summary.income, CURRENCY)}. Las transferencias no cuentan como ingreso.`,
        }}
        value={
          <Amount
            value={summary.income}
            currency={CURRENCY}
            type="income"
            className="font-heading font-semibold"
          />
        }
      />
      <DetailMetric
        label="Gastos"
        info={{
          formula: "Σ gastos del período en esta cuenta",
          description: `Gastos del período en esta cuenta: ${formatCurrency(summary.expense, CURRENCY)}. Las transferencias no cuentan como gasto.`,
        }}
        value={
          <Amount
            value={summary.expense}
            currency={CURRENCY}
            type="expense"
            className="font-heading font-semibold"
          />
        }
      />
    </div>
  );
};
