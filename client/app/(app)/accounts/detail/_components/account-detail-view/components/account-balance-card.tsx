import { Amount } from "@/components/common/amount";
import { AccountIcon } from "@/app/(app)/_components/accounts/account-icon";
import type { Account } from "@/lib/api/types";
import { CURRENCY } from "@/lib/format";
import { ACCOUNT_TYPE_LABELS } from "@/lib/labels";

export interface AccountBalanceCardProps {
  account: Account;
}

export const AccountBalanceCard = ({ account }: AccountBalanceCardProps) => {
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
      </span>
      <Amount
        value={account.currentBalance}
        currency={CURRENCY}
        className="font-heading text-[28px] leading-[35px] font-semibold md:text-[34px] md:leading-[43px]"
      />
    </div>
  );
};
