"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Archive } from "lucide-react";
import { toast } from "sonner";
import { FormCurrencyField } from "@/components/common/form-currency-field";
import { FormDialog } from "@/components/common/form-dialog";
import { FormHero } from "@/components/common/form-hero";
import { FormTextField } from "@/components/common/form-text-field";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { getErrorMessage } from "@/lib/api/errors";
import type { AccountType } from "@/lib/api/types";
import { ACCOUNT_TYPE_LABELS, ACCOUNT_TYPE_VALUES } from "@/lib/labels";
import {
  useArchiveAccount,
  useCreateAccount,
  useRestoreAccount,
  useUpdateAccount,
} from "@/lib/query/accounts";
import { cn } from "@/lib/utils";
import {
  accountSchema,
  type AccountFormValues,
} from "@/lib/validation/accounts";
import {
  AccountIcon,
  ACCOUNT_TYPE_ICONS,
} from "@/components/features/accounts/account-icon";
import type { AccountFormDialogProps } from "./account-form-dialog.types";

const HELPER_TEXT: Record<AccountType, string> = {
  cash: "Efectivo en mano. Podés editarla cuando quieras.",
  bank: "Cuenta bancaria. Su saldo se calcula con los movimientos.",
  wallet: "Billetera virtual o cuenta de dinero digital.",
  card: "Tarjeta de crédito. El saldo representa la deuda actual.",
  other: "Otro tipo de cuenta.",
};

export const AccountFormDialog = ({
  open,
  onOpenChange,
  account,
  initialType,
}: AccountFormDialogProps) => {
  const { user } = useAuth();
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const archiveAccount = useArchiveAccount();
  const restoreAccount = useRestoreAccount();
  const isEditing = Boolean(account);
  const isPending =
    createAccount.isPending ||
    updateAccount.isPending ||
    archiveAccount.isPending ||
    restoreAccount.isPending;

  const [archived, setArchived] = useState(account?.archived ?? false);

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: account?.name ?? "",
      type: account?.type ?? initialType ?? "cash",
      currency: account?.currency ?? user?.baseCurrency ?? "ARS",
      initialBalance: account?.initialBalance ?? 0,
      notes: account?.notes ?? "",
    },
  });

  const type = useWatch({ control: form.control, name: "type" });
  const firstType = account?.type ?? initialType ?? "cash";
  const typeOrder = [
    firstType,
    ...ACCOUNT_TYPE_VALUES.filter((value) => value !== firstType),
  ];

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
        if (archived !== account.archived) {
          const mutation = archived ? archiveAccount : restoreAccount;
          await mutation.mutateAsync(account.id);
        }
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
      description="Definí el nombre, el tipo y el saldo."
      form={form}
      onSubmit={onSubmit}
      submitLabel={isEditing ? "Guardar" : "Crear cuenta"}
      isPending={isPending}
      contentClassName="max-h-[90dvh] overflow-y-auto"
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
            <FormLabel>Tipo</FormLabel>
            <div className="flex w-full min-w-0 gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {typeOrder.map((value) => {
                const Icon = ACCOUNT_TYPE_ICONS[value];
                const active = field.value === value;
                return (
                  <button
                    type="button"
                    key={value}
                    onClick={() => field.onChange(value)}
                    className={cn(
                      "flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-sm transition-colors",
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted/40",
                    )}
                  >
                    <Icon className="size-4" aria-hidden />
                    {ACCOUNT_TYPE_LABELS[value]}
                  </button>
                );
              })}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-3">
        <FormTextField
          name="initialBalance"
          label="Saldo inicial"
          type="number"
          step="0.01"
        />
        <FormCurrencyField fallback={user?.baseCurrency ?? "ARS"} />
      </div>

      <FormTextField name="notes" label="Observaciones" multiline />

      {isEditing ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border p-4">
          <div className="flex items-start gap-3">
            <Archive
              className="text-muted-foreground mt-0.5 size-4 shrink-0"
              aria-hidden
            />
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">Cuenta archivada</span>
              <span className="text-muted-foreground text-xs">
                Se oculta del inicio y no admite nuevos movimientos.
              </span>
            </div>
          </div>
          <Switch
            checked={archived}
            onCheckedChange={setArchived}
            aria-label="Archivar cuenta"
          />
        </div>
      ) : null}
    </FormDialog>
  );
};
