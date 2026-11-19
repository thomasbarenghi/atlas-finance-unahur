"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { CurrencyFormField } from "@/components/common/currency-form-field";
import { FormDialog } from "@/components/common/form-dialog";
import { FormMoneyField } from "@/components/common/form-money-field";
import { FormTextField } from "@/components/common/form-text-field";
import { FIELD_LABEL } from "@/components/common/ui-classes";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { getErrorMessage } from "@/lib/api/errors";
import type { Account, AccountType } from "@/lib/api/types";
import { ACCOUNT_TYPE_LABELS } from "@/lib/labels";
import { useCreateAccount, useUpdateAccount } from "@/lib/query/accounts";
import {
  accountSchema,
  type AccountFormValues,
} from "@/lib/validation/accounts";
import { AccountIcon } from "@/app/(app)/_components/accounts/account-icon";
import { FormHero } from "./components/form-hero";
import { AccountTypeOptions } from "./components/account-type-options";

export interface AccountFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: Account;
  initialType?: AccountType;
  currencyLocked?: boolean;
}

const HELPER_TEXT: Record<AccountType, string> = {
  cash: "Efectivo en mano. Podés editarla cuando quieras.",
  bank: "Cuenta bancaria. Su saldo se calcula con los movimientos.",
  wallet: "Billetera virtual o cuenta de dinero digital.",
  other: "Otro tipo de cuenta.",
};

export const AccountFormDialog = ({
  open,
  onOpenChange,
  account,
  initialType,
  currencyLocked = false,
}: AccountFormDialogProps) => {
  const { user } = useAuth();
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const isEditing = Boolean(account);
  const isPending = createAccount.isPending || updateAccount.isPending;

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: account?.name ?? "",
      type: account?.type ?? initialType ?? "cash",
      currency: account?.currency ?? user?.primaryCurrency ?? "ARS",
      initialBalance: account?.initialBalance ?? 0,
      notes: account?.notes ?? "",
    },
  });

  const type = useWatch({ control: form.control, name: "type" });
  const currency = useWatch({ control: form.control, name: "currency" });

  const onSubmit = async (values: AccountFormValues) => {
    const payload = {
      name: values.name,
      type: values.type,
      currency: values.currency,
      initialBalance: values.initialBalance,
      notes: values.notes ?? null,
    };
    try {
      if (account) {
        await updateAccount.mutateAsync({ id: account.id, input: payload });
        toast.success("Cuenta actualizada");
      } else {
        await createAccount.mutateAsync(payload);
        toast.success("Cuenta creada");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo guardar"));
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Editar cuenta" : "Nueva cuenta"}
      description={
        isEditing
          ? "Actualizá los datos de la cuenta."
          : "Completá los datos de la cuenta."
      }
      form={form}
      onSubmit={onSubmit}
      submitLabel={isEditing ? "Guardar" : "Crear cuenta"}
      isPending={isPending}
      contentClassName="max-h-[90dvh] overflow-y-auto sm:max-w-[540px]"
    >
      <FormHero
        icon={<AccountIcon type={type} className="size-16 [&_svg]:size-8" />}
        label={ACCOUNT_TYPE_LABELS[type]}
        helper={HELPER_TEXT[type]}
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormControl>
                <Input
                  placeholder="Caja, Banco…"
                  className="h-auto border-0 bg-transparent px-0 text-center font-heading text-xl font-semibold shadow-none focus-visible:ring-0"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-center" />
            </FormItem>
          )}
        />
      </FormHero>

      <FormField
        control={form.control}
        name="type"
        render={({ field }) => (
          <FormItem className="min-w-0">
            <FormLabel className={FIELD_LABEL}>Tipo</FormLabel>
            <AccountTypeOptions value={field.value} onChange={field.onChange} />
            <FormMessage />
          </FormItem>
        )}
      />

      <CurrencyFormField
        name="currency"
        disabled={currencyLocked}
        hint={
          currencyLocked
            ? "No se puede cambiar porque la cuenta ya tiene movimientos."
            : "La moneda no se puede cambiar una vez que la cuenta tiene movimientos."
        }
      />

      <FormMoneyField
        name="initialBalance"
        label="Saldo inicial"
        currency={currency}
      />

      <FormTextField name="notes" label="Observaciones" multiline />
    </FormDialog>
  );
};
