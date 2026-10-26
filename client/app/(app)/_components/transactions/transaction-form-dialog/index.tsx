"use client";

import { FormDialog } from "@/components/common/form-dialog";
import { SegmentedControl } from "@/components/common/segmented-control";
import type {
  Account,
  Category,
  Transaction,
  TransactionType,
} from "@/lib/api/types";
import { TRANSACTION_TYPE_LABELS } from "@/lib/labels";
import { TransactionAccountFields } from "./components/account-fields";
import { TransactionAmountPanel } from "./components/amount-panel";
import { TransactionDetailFields } from "./components/detail-fields";
import { TransferExchangeFields } from "./components/transfer-exchange-fields";
import { useTransactionForm } from "./hooks/use-transaction-form";

const TYPE_OPTIONS = (["expense", "income", "transfer"] as const).map(
  (value) => ({ value, label: TRANSACTION_TYPE_LABELS[value] }),
);

export interface TransactionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: Transaction;
  accounts: Account[];
  categories: Category[];
  initialType?: TransactionType;
  initialAccountId?: string;
}

export const TransactionFormDialog = ({
  open,
  onOpenChange,
  transaction,
  accounts,
  categories,
  initialType,
  initialAccountId,
}: TransactionFormDialogProps) => {
  const {
    form,
    type,
    selectedAccount,
    destinationAccount,
    destinationAccounts,
    categoryOptions,
    amountInput,
    isEditing,
    isPending,
    isCrossCurrency,
    rateInput,
    destinationAmount,
    changeRate,
    selectType,
    onSubmit,
  } = useTransactionForm({
    open,
    onOpenChange,
    transaction,
    accounts,
    categories,
    initialType,
    initialAccountId,
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Editar movimiento" : "Nuevo movimiento"}
      description={
        isEditing
          ? "Actualizá los datos del movimiento."
          : "Cargá un gasto, ingreso o transferencia."
      }
      form={form}
      onSubmit={onSubmit}
      submitLabel={isEditing ? "Guardar" : "Crear movimiento"}
      isPending={isPending}
      contentClassName="max-lg:max-h-[calc(100dvh-17px)] max-h-[94dvh] overflow-y-auto max-lg:pb-0"
    >
      <SegmentedControl
        options={TYPE_OPTIONS}
        value={type}
        onChange={selectType}
        ariaLabel="Tipo de movimiento"
        fullWidth
        disabled={isEditing}
      />
      <TransactionAccountFields
        form={form}
        type={type}
        accounts={accounts}
        destinationAccounts={destinationAccounts}
        categoryOptions={categoryOptions}
      />
      <TransactionAmountPanel
        form={form}
        type={type}
        account={selectedAccount}
        amountInput={amountInput}
      />
      {isCrossCurrency && selectedAccount && destinationAccount ? (
        <TransferExchangeFields
          sourceAccount={selectedAccount}
          destinationAccount={destinationAccount}
          rateInput={rateInput}
          onRateChange={changeRate}
          destinationAmount={destinationAmount}
        />
      ) : null}
      <TransactionDetailFields form={form} />
    </FormDialog>
  );
};
