"use client";

import { useState } from "react";
import type { TransactionType } from "@/lib/api/types";
import { evaluateAmountExpression } from "../amount-expression";
import type { AmountKeypadKey } from "../components/amount-keypad";

const OPERATOR_KEYS: readonly AmountKeypadKey[] = ["+", "−", "×", "÷"];
const TRAILING_OPERATOR = /[+−×÷]$/;

export const signForTransactionType = (type: TransactionType): string => {
  if (type === "expense") return "−";
  if (type === "income") return "+";
  return "";
};

export const useAmountInput = (
  initialAmount: number,
  onAmountChange: (amount: number) => void,
) => {
  const [expression, setExpression] = useState(() =>
    initialAmount > 0 ? String(initialAmount) : "",
  );

  const updateExpression = (next: string) => {
    setExpression(next);
    onAmountChange(evaluateAmountExpression(next) ?? 0);
  };

  const handleKey = (key: AmountKeypadKey) => {
    if (key === "backspace") {
      updateExpression(expression.slice(0, -1));
      return;
    }
    if (OPERATOR_KEYS.includes(key)) {
      if (!expression) return;
      const next = TRAILING_OPERATOR.test(expression)
        ? expression.slice(0, -1) + key
        : expression + key;
      updateExpression(next);
      return;
    }

    const lastNumber = expression.split(/[+−×÷]/).pop() ?? "";

    if (key === ".") {
      if (!lastNumber.includes(".")) updateExpression(`${expression}.`);
      return;
    }

    const next =
      lastNumber === "0" ? expression.slice(0, -1) + key : expression + key;
    updateExpression(next);
  };

  return {
    expression,
    evaluated:
      evaluateAmountExpression(expression.replace(/[+−×÷]+$/, "")) ?? 0,
    hasOperator: /[+−×÷]/.test(expression),
    handleKey,
  };
};

export type AmountInputState = ReturnType<typeof useAmountInput>;
