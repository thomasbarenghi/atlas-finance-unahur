"use client";

import { useConfirmAction } from "@/hooks/use-confirm-action";
import type { Transaction } from "@/lib/api/types";
import { useDeleteTransaction } from "@/lib/query/transactions";

export const useDeleteTransactionAction = () => {
  const deleteTransaction = useDeleteTransaction();

  return useConfirmAction<Transaction>({
    run: (transaction) => deleteTransaction.mutateAsync(transaction.id),
    successMessage: "Movimiento eliminado",
    errorMessage: "No se pudo eliminar",
  });
};
