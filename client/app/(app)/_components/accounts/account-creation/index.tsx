"use client";

import { AccountFormDialog } from "@/app/(app)/_components/accounts/account-form-dialog";
import { AccountTypePicker } from "@/app/(app)/_components/accounts/account-type-picker";
import type { AccountCreationState } from "./use-account-creation";

export { useAccountCreation } from "./use-account-creation";
export type { AccountCreationState } from "./use-account-creation";

export interface AccountCreationProps {
  creation: AccountCreationState;
}

export const AccountCreation = ({ creation }: AccountCreationProps) => {
  return (
    <>
      <AccountTypePicker
        open={creation.pickerOpen}
        onOpenChange={creation.setPickerOpen}
        onSelect={creation.openForm}
      />
      <AccountFormDialog
        key={`account-${creation.formKey}`}
        open={creation.accountType !== null}
        onOpenChange={(open) => {
          if (!open) creation.setAccountType(null);
        }}
        initialType={creation.accountType ?? undefined}
      />
    </>
  );
};
