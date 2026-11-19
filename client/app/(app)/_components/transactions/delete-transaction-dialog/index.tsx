"use client";

import { ConfirmActionDialog } from "@/components/common/confirm-action-dialog";
import type { ConfirmAction } from "@/hooks/use-confirm-action";
import type { Transaction } from "@/lib/api/types";

const transactionDeleteDescription = (target: Transaction): string =>
  target.transferGroupId
    ? `Se eliminarán ambos lados de la transferencia «${target.description}». Esta acción no se puede deshacer.`
    : `Se eliminará «${target.description}» de forma permanente. Esta acción no se puede deshacer.`;

export interface DeleteTransactionDialogProps {
  action: ConfirmAction<Transaction>;
}

export const DeleteTransactionDialog = ({
  action,
}: DeleteTransactionDialogProps) => (
  <ConfirmActionDialog
    action={action}
    title="Eliminar movimiento"
    description={transactionDeleteDescription}
    confirmLabel="Eliminar"
  />
);
