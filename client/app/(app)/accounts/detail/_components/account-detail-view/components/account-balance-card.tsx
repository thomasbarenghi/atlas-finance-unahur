"use client";

import { Amount } from "@/components/common/amount";
import { AccountIcon } from "@/app/(app)/_components/accounts/account-icon";
import { useAuth } from "@/hooks/use-auth";
import type { Account } from "@/lib/api/types";
import { formatRateValue } from "@/lib/currency";
import { formatCurrency } from "@/lib/format";
import { ACCOUNT_TYPE_LABELS } from "@/lib/labels";
import { useCurrencyRates } from "@/lib/query/currencies";

export interface AccountBalanceCardProps {
  account: Account;
}

export const AccountBalanceCard = ({ account }: AccountBalanceCardProps) => {
  const { user } = useAuth();
  const settings = useCurrencyRates().data;
  const primaryCurrency =
    user?.primaryCurrency ?? settings?.primaryCurrency ?? "ARS";
  const rate = settings?.rates.find(
    (item) => item.currency === account.currency,
  )?.rate;
  const isForeign = account.currency !== primaryCurrency;
  const hasMultipleCurrencies = (settings?.rates.length ?? 0) > 0;
  const equivalent =
    isForeign && rate !== undefined ? account.currentBalance * rate : null;

  return (
    <div
      className="border-line flex flex-col items-center gap-1.5 rounded-3xl border px-4 pt-4 pb-[18px] md:px-6 md:py-6"
      style={{ backgroundImage: "var(--hero-gradient)" }}
    >
      <AccountIcon
        type={account.type}
        className="size-[38px] [&_svg]:size-[18px] md:size-[42px] md:[&_svg]:size-5"
      />
      <span className="text-muted-foreground text-[10.5px] leading-[14px] md:text-[13px] md:leading-[18px]">
        {ACCOUNT_TYPE_LABELS[account.type]}
        {hasMultipleCurrencies ? ` · ${account.currency}` : ""}
      </span>
      <Amount
        value={account.currentBalance}
        currency={account.currency}
        className="font-heading text-[28px] leading-[35px] font-semibold md:text-[34px] md:leading-[43px]"
      />
      {equivalent !== null && rate !== undefined ? (
        <span className="text-muted-foreground text-[10px] leading-[14px] md:text-[11.5px] md:leading-[16px]">
          ≈ {formatCurrency(equivalent, primaryCurrency)} · 1 {account.currency}{" "}
          = {formatRateValue(rate)} {primaryCurrency}
        </span>
      ) : null}
    </div>
  );
};
