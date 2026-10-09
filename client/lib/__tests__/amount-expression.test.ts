import { describe, expect, it } from "vitest";
import {
  AMOUNT_OPERATORS,
  evaluateAmountExpression,
} from "@/lib/amount-expression";

describe("evaluateAmountExpression", () => {
  it("evaluates a single number, accepting comma or dot decimals", () => {
    expect(evaluateAmountExpression("10")).toBe(10);
    expect(evaluateAmountExpression("10,5")).toBe(10.5);
    expect(evaluateAmountExpression(".5")).toBe(0.5);
  });

  it("applies multiplication/division precedence over addition/subtraction", () => {
    expect(evaluateAmountExpression("10+5×2")).toBe(20);
    expect(evaluateAmountExpression("10−2×3")).toBe(4);
    expect(evaluateAmountExpression("10÷4")).toBe(2.5);
    expect(evaluateAmountExpression("10+5−2")).toBe(13);
  });

  it("returns null for division by zero", () => {
    expect(evaluateAmountExpression("10÷0")).toBeNull();
  });

  it("returns null for malformed expressions", () => {
    expect(evaluateAmountExpression("")).toBeNull();
    expect(evaluateAmountExpression("abc")).toBeNull();
    expect(evaluateAmountExpression("10+")).toBeNull();
    expect(evaluateAmountExpression("+10")).toBeNull();
    expect(evaluateAmountExpression("10++2")).toBeNull();
    expect(evaluateAmountExpression("10 20")).toBeNull();
  });

  it("rounds to two decimals", () => {
    expect(evaluateAmountExpression("1÷3")).toBe(0.33);
    expect(evaluateAmountExpression("2.5+2.5")).toBe(5);
  });

  it("exposes the operator palette used by the keypad", () => {
    expect(AMOUNT_OPERATORS).toEqual(["+", "−", "×", "÷"]);
  });
});
