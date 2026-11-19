import { Amount } from "@/components/common/amount";
import type { Account } from "@/lib/api/types";
import { formatCurrency } from "@/lib/format";
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
          description: `Lo que la cuenta tenía antes de los movimientos: ${formatCurrency(account.initialBalance, account.currency)}.`,
        }}
        value={
          <Amount
            value={account.initialBalance}
            currency={account.currency}
            className="font-heading font-semibold"
          />
        }
      />
      <DetailMetric
        label="Ingresos"
        info={{
          formula: "Σ ingresos de la cuenta",
          description: `Ingresos de la cuenta: ${formatCurrency(summary.income, account.currency)}. Las transferencias no cuentan como ingreso.`,
        }}
        value={
          <Amount
            value={summary.income}
            currency={account.currency}
            type="income"
            className="font-heading font-semibold"
          />
        }
      />
      <DetailMetric
        label="Gastos"
        info={{
          formula: "Σ gastos de la cuenta",
          description: `Gastos de la cuenta: ${formatCurrency(summary.expense, account.currency)}. Las transferencias no cuentan como gasto.`,
        }}
        value={
          <Amount
            value={summary.expense}
            currency={account.currency}
            type="expense"
            className="font-heading font-semibold"
          />
        }
      />
    </div>
  );
};
