import type { TransactionType } from "@/lib/api/types";

export interface AmountPresentation {
  absolute: number;
  sign: string;
  tone: string;
}

export const getAmountPresentation = (
  value: number,
  type?: TransactionType,
): AmountPresentation => {
  const absolute = Math.abs(value);
  if (type === "income") {
    return { absolute, sign: "+", tone: "text-success" };
  }
  if (type === "expense") {
    return { absolute, sign: "−", tone: "text-destructive" };
  }
  if (type === "transfer") {
    return {
      absolute,
      sign: value < 0 ? "−" : "+",
      tone: "text-muted-foreground",
    };
  }
  return { absolute, sign: value < 0 ? "−" : "", tone: "" };
};
