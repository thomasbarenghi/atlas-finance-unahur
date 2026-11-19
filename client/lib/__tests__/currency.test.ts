import { describe, expect, it } from "vitest";
import {
  convertAmount,
  formatCurrencySymbol,
  formatRateValue,
  groupAccountsByCurrency,
  rateInPrimary,
} from "@/lib/currency";
import { makeAccount } from "@/lib/test/factories";

const rates = [
  { currency: "ARS", rate: 1, rateDate: "2026-10-25", source: "api" as const },
  {
    currency: "USD",
    rate: 1180,
    rateDate: "2026-10-25",
    source: "api" as const,
  },
];

describe("currency helpers", () => {
  it("reads the rate in the primary currency", () => {
    expect(rateInPrimary("ARS", rates, "ARS")).toBe(1);
    expect(rateInPrimary("USD", rates, "ARS")).toBe(1180);
    expect(
      rateInPrimary(
        "ARS",
        [
          {
            currency: "ARS",
            rate: 1 / 1180,
            rateDate: "2026-10-25",
          },
          {
            currency: "USD",
            rate: 1,
            rateDate: "2026-10-25",
          },
        ],
        "USD",
      ),
    ).toBeCloseTo(1 / 1180, 6);
  });

  it("converts between two currencies through the primary unit", () => {
    expect(convertAmount(100, "USD", "ARS", rates, "ARS")).toBe(118000);
    expect(convertAmount(118000, "ARS", "USD", rates, "ARS")).toBeCloseTo(
      100,
      6,
    );
    expect(convertAmount(100, "USD", "USD", rates, "ARS")).toBe(100);
  });

  it("formats rates with two decimals unless the value is very small", () => {
    expect(formatRateValue(1180)).toBe("1.180,00");
    expect(formatRateValue(0.000847)).toBe("0,000847");
  });

  it("formats the ISO symbol for the account form", () => {
    expect(formatCurrencySymbol("USD")).toBe("US$");
    expect(formatCurrencySymbol("ARS")).toBe("$");
  });

  it("groups accounts by currency with the primary first", () => {
    const groups = groupAccountsByCurrency(
      [
        makeAccount({ id: "usd", currency: "USD", currentBalance: 10 }),
        makeAccount({ id: "ars", currency: "ARS", currentBalance: 1000 }),
        makeAccount({ id: "usd-2", currency: "USD", currentBalance: 5 }),
      ],
      "ARS",
    );
    expect(groups.map((group) => group.currency)).toEqual(["ARS", "USD"]);
    expect(groups[1].total).toBe(15);
    expect(groups[1].accounts).toHaveLength(2);
  });
});
