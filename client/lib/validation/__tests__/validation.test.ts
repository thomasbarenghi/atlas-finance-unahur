import { describe, expect, it } from "vitest";
import {
  MAX_MONEY,
  currencySchema,
  dateSchema,
  moneySchema,
  notesSchema,
  optionalDateSchema,
  optionalIdSchema,
  uuidSchema,
} from "@/lib/validation/common";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validation/auth";
import { accountSchema } from "@/lib/validation/accounts";
import { transactionSchema } from "@/lib/validation/transactions";
import { budgetSchema } from "@/lib/validation/budgets";
import {
  assetSchema,
  debtSchema,
  positionSchema,
  valuationSchema,
} from "@/lib/validation/assets";
import { goalSchema } from "@/lib/validation/goals";
import { categorySchema } from "@/lib/validation/categories";
import { settingsSchema } from "@/lib/validation/settings";

const UUID = "11111111-1111-4111-8111-111111111111";
const UUID_2 = "22222222-2222-4222-8222-222222222222";

const errorFor = (
  result: {
    success: boolean;
    error?: { issues: { path: (string | number)[]; message: string }[] };
  },
  path: string,
): string | undefined => {
  if (result.success) return undefined;
  return result.error?.issues.find((issue) => issue.path.join(".") === path)
    ?.message;
};

describe("common validation building blocks", () => {
  it("accepts a 3-letter ISO currency and rejects anything else", () => {
    expect(currencySchema.safeParse("ARS").success).toBe(true);
    expect(currencySchema.safeParse("usd").success).toBe(true);
    expect(currencySchema.safeParse("US").success).toBe(false);
    expect(currencySchema.safeParse("USDD").success).toBe(false);
    expect(currencySchema.safeParse("U5D").success).toBe(false);
    expect(currencySchema.safeParse("$AR").success).toBe(false);
    expect(currencySchema.safeParse(" ARS").success).toBe(false);
  });

  it("only accepts YYYY-MM-DD looking dates", () => {
    expect(dateSchema.safeParse("2026-01-31").success).toBe(true);
    expect(dateSchema.safeParse("2026-1-1").success).toBe(false);
    expect(dateSchema.safeParse("31/01/2026").success).toBe(false);
    expect(dateSchema.safeParse("").success).toBe(false);
  });

  it("rejects syntactically valid but non-existent calendar dates", () => {
    expect(dateSchema.safeParse("2026-13-01").success).toBe(false);
    expect(dateSchema.safeParse("2026-02-29").success).toBe(false);
    expect(dateSchema.safeParse("2026-04-31").success).toBe(false);
    expect(dateSchema.safeParse("2026-00-10").success).toBe(false);
    expect(dateSchema.safeParse("2024-02-29").success).toBe(true);
  });

  it("coerces numeric strings and rejects non-finite values", () => {
    expect(moneySchema.safeParse(10.5).success).toBe(true);
    expect(moneySchema.safeParse("10.5").success).toBe(true);
    expect(moneySchema.safeParse("abc").success).toBe(false);
    expect(moneySchema.safeParse(Number.POSITIVE_INFINITY).success).toBe(false);
  });

  it(`allows values up to MAX_MONEY (${MAX_MONEY}) but rejects larger ones`, () => {
    expect(moneySchema.safeParse(MAX_MONEY).success).toBe(true);
    // Note: MAX_MONEY is not exactly representable as a double, so we assert
    // with a clearly out-of-range value rather than a one-cent increment.
    expect(moneySchema.safeParse(MAX_MONEY + 1).success).toBe(false);
  });

  it("caps notes at 500 characters", () => {
    expect(notesSchema.safeParse("a".repeat(500)).success).toBe(true);
    expect(notesSchema.safeParse("a".repeat(501)).success).toBe(false);
  });

  it("validates UUIDs and allows clearing optional selects", () => {
    expect(uuidSchema.safeParse(UUID).success).toBe(true);
    expect(uuidSchema.safeParse("not-a-uuid").success).toBe(false);
    expect(optionalIdSchema.safeParse("").success).toBe(true);
    expect(optionalIdSchema.safeParse(undefined).success).toBe(true);
    expect(optionalIdSchema.safeParse(UUID).success).toBe(true);
    expect(optionalIdSchema.safeParse("nope").success).toBe(false);
  });

  it("allows an empty optional date but rejects malformed ones", () => {
    expect(optionalDateSchema.safeParse("").success).toBe(true);
    expect(optionalDateSchema.safeParse(undefined).success).toBe(true);
    expect(optionalDateSchema.safeParse("2026-01-01").success).toBe(true);
    expect(optionalDateSchema.safeParse("01-01-2026").success).toBe(false);
  });
});

describe("auth schemas", () => {
  it("requires a valid email and password for login", () => {
    const valid = loginSchema.safeParse({
      email: "demo@atlassfin.app",
      password: "x",
    });
    expect(valid.success).toBe(true);

    expect(
      loginSchema.safeParse({ email: "not-email", password: "x" }).success,
    ).toBe(false);
    expect(
      loginSchema.safeParse({ email: "a@b.com", password: "" }).success,
    ).toBe(false);
    expect(
      loginSchema.safeParse({ email: "a@b.com", password: "x".repeat(73) })
        .success,
    ).toBe(false);
  });

  it("enforces the register password policy and password confirmation", () => {
    const base = {
      name: "Ana",
      email: "ana@example.com",
      password: "Password1",
      confirmPassword: "Password1",
    };
    expect(registerSchema.safeParse(base).success).toBe(true);

    expect(
      registerSchema.safeParse({
        ...base,
        password: "short1",
        confirmPassword: "short1",
      }).success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({
        ...base,
        password: "onlyletters",
        confirmPassword: "onlyletters",
      }).success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({
        ...base,
        password: "12345678",
        confirmPassword: "12345678",
      }).success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({
        ...base,
        password: "a1".repeat(40),
        confirmPassword: "a1".repeat(40),
      }).success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({ ...base, confirmPassword: "Different1" })
        .success,
    ).toBe(false);
  });

  it("trims the register name and rejects too-short or too-long names", () => {
    const parsed = registerSchema.safeParse({
      name: "  Ana  ",
      email: "ana@example.com",
      password: "Password1",
      confirmPassword: "Password1",
    });
    expect(parsed.success && parsed.data.name).toBe("Ana");

    expect(
      registerSchema.safeParse({
        name: "A",
        email: "ana@example.com",
        password: "Password1",
        confirmPassword: "Password1",
      }).success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({
        name: "A".repeat(81),
        email: "ana@example.com",
        password: "Password1",
        confirmPassword: "Password1",
      }).success,
    ).toBe(false);
  });

  it("validates forgot-password email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "a@b.com" }).success).toBe(
      true,
    );
    expect(forgotPasswordSchema.safeParse({ email: "nope" }).success).toBe(
      false,
    );
  });

  it("validates reset-password confirmation", () => {
    expect(
      resetPasswordSchema.safeParse({
        password: "Password1",
        confirmPassword: "Password1",
      }).success,
    ).toBe(true);
    expect(
      resetPasswordSchema.safeParse({
        password: "Password1",
        confirmPassword: "Password2",
      }).success,
    ).toBe(false);
  });
});

describe("account schema", () => {
  const valid = {
    name: "Caja",
    type: "cash" as const,
    currency: "ARS",
    initialBalance: 0,
    notes: "",
  };

  it("accepts a valid account", () => {
    expect(accountSchema.safeParse(valid).success).toBe(true);
  });

  it("trims the name and rejects empty/oversized names", () => {
    const parsed = accountSchema.safeParse({ ...valid, name: "  Caja  " });
    expect(parsed.success && parsed.data.name).toBe("Caja");
    expect(accountSchema.safeParse({ ...valid, name: "   " }).success).toBe(
      false,
    );
    expect(
      accountSchema.safeParse({ ...valid, name: "a".repeat(81) }).success,
    ).toBe(false);
  });

  it("rejects unknown account types", () => {
    expect(accountSchema.safeParse({ ...valid, type: "crypto" }).success).toBe(
      false,
    );
  });

  it("rejects negative balances beyond the numeric column cap", () => {
    expect(
      accountSchema.safeParse({ ...valid, initialBalance: MAX_MONEY }).success,
    ).toBe(true);
    expect(
      accountSchema.safeParse({ ...valid, initialBalance: MAX_MONEY * 2 })
        .success,
    ).toBe(false);
  });
});

describe("transaction schema", () => {
  const base = {
    type: "expense" as const,
    amount: 100,
    currency: "ARS",
    date: "2026-01-15",
    accountId: UUID,
    transferAccountId: "",
    categoryId: UUID_2,
    description: "Supermercado",
    notes: "",
  };

  it("accepts a valid expense", () => {
    expect(transactionSchema.safeParse(base).success).toBe(true);
  });

  it("rejects a zero or negative amount", () => {
    expect(transactionSchema.safeParse({ ...base, amount: 0 }).success).toBe(
      false,
    );
    expect(transactionSchema.safeParse({ ...base, amount: -5 }).success).toBe(
      false,
    );
  });

  it("requires a description with a 120 char ceiling", () => {
    expect(
      transactionSchema.safeParse({ ...base, description: "   " }).success,
    ).toBe(false);
    expect(
      transactionSchema.safeParse({ ...base, description: "a".repeat(121) })
        .success,
    ).toBe(false);
    expect(
      transactionSchema.safeParse({ ...base, description: "a".repeat(120) })
        .success,
    ).toBe(true);
  });

  it("requires a category for income/expense", () => {
    const result = transactionSchema.safeParse({ ...base, categoryId: "" });
    expect(result.success).toBe(false);
    expect(errorFor(result, "categoryId")).toBeDefined();
  });

  it("requires a destination account different from the origin for transfers", () => {
    const sameAccount = transactionSchema.safeParse({
      ...base,
      type: "transfer",
      categoryId: "",
      transferAccountId: UUID,
    });
    expect(sameAccount.success).toBe(false);

    const emptyDestination = transactionSchema.safeParse({
      ...base,
      type: "transfer",
      categoryId: "",
      transferAccountId: "",
    });
    expect(emptyDestination.success).toBe(false);

    const ok = transactionSchema.safeParse({
      ...base,
      type: "transfer",
      categoryId: "",
      transferAccountId: UUID_2,
    });
    expect(ok.success).toBe(true);
  });

  it("rejects an invalid origin account and invalid dates", () => {
    expect(
      transactionSchema.safeParse({ ...base, accountId: "abc" }).success,
    ).toBe(false);
    expect(
      transactionSchema.safeParse({ ...base, date: "15/01/2026" }).success,
    ).toBe(false);
  });
});

describe("budget schema", () => {
  const valid = {
    categoryId: UUID,
    period: "2026-01",
    limit: 100_000,
    currency: "ARS",
    recurring: false,
  };

  it("accepts a valid budget", () => {
    expect(budgetSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a negative limit but allows zero", () => {
    expect(budgetSchema.safeParse({ ...valid, limit: 0 }).success).toBe(true);
    expect(budgetSchema.safeParse({ ...valid, limit: -1 }).success).toBe(false);
  });

  it("requires a YYYY-MM period and a UUID category", () => {
    expect(budgetSchema.safeParse({ ...valid, period: "2026" }).success).toBe(
      false,
    );
    expect(budgetSchema.safeParse({ ...valid, period: "2026-1" }).success).toBe(
      false,
    );
    expect(budgetSchema.safeParse({ ...valid, categoryId: "x" }).success).toBe(
      false,
    );
  });
});

describe("asset, valuation, debt and position schemas", () => {
  it("accepts a valid asset and rejects a negative value", () => {
    const valid = {
      name: "Depto",
      type: "property" as const,
      currency: "ARS",
      initialValue: 85_000_000,
      date: "2026-01-01",
      notes: "",
    };
    expect(assetSchema.safeParse(valid).success).toBe(true);
    expect(assetSchema.safeParse({ ...valid, initialValue: -1 }).success).toBe(
      false,
    );
    expect(assetSchema.safeParse({ ...valid, type: "loan" }).success).toBe(
      false,
    );
    expect(
      assetSchema.safeParse({ ...valid, date: "2026-13-01" }).success,
    ).toBe(false);
  });

  it("validates a valuation", () => {
    expect(
      valuationSchema.safeParse({ value: 1000, date: "2026-01-01" }).success,
    ).toBe(true);
    expect(
      valuationSchema.safeParse({ value: -1, date: "2026-01-01" }).success,
    ).toBe(false);
  });

  it("validates a debt and its optional linked asset", () => {
    const valid = {
      name: "Hipoteca",
      type: "mortgage" as const,
      balance: 45_000_000,
      currency: "ARS",
      date: "2026-01-01",
      assetId: "",
    };
    expect(debtSchema.safeParse(valid).success).toBe(true);
    expect(debtSchema.safeParse({ ...valid, balance: -1 }).success).toBe(false);
    expect(debtSchema.safeParse({ ...valid, type: "credit" }).success).toBe(
      false,
    );
    expect(
      debtSchema.safeParse({ ...valid, assetId: "not-uuid" }).success,
    ).toBe(false);
  });

  it("validates a position and enforces symbol/instrument bounds", () => {
    const valid = {
      symbol: "BTC",
      instrument: "Bitcoin",
      quantity: 0.05,
      avgCost: 55_000,
      currency: "USD",
    };
    expect(positionSchema.safeParse(valid).success).toBe(true);
    expect(positionSchema.safeParse({ ...valid, symbol: "" }).success).toBe(
      false,
    );
    expect(
      positionSchema.safeParse({ ...valid, symbol: "A".repeat(21) }).success,
    ).toBe(false);
    expect(
      positionSchema.safeParse({ ...valid, instrument: "A".repeat(81) })
        .success,
    ).toBe(false);
    expect(positionSchema.safeParse({ ...valid, quantity: -1 }).success).toBe(
      false,
    );
    expect(positionSchema.safeParse({ ...valid, avgCost: -1 }).success).toBe(
      false,
    );
  });
});

describe("goal schema", () => {
  const valid = {
    name: "Vacaciones",
    savedAmount: 0,
    targetAmount: 500_000,
    currency: "ARS",
    targetDate: "",
    sourceAccountId: "",
  };

  it("accepts a valid goal", () => {
    expect(goalSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects negative amounts", () => {
    expect(goalSchema.safeParse({ ...valid, savedAmount: -1 }).success).toBe(
      false,
    );
    expect(goalSchema.safeParse({ ...valid, targetAmount: -1 }).success).toBe(
      false,
    );
  });

  it("accepts a cleared target date and linked account", () => {
    expect(goalSchema.safeParse(valid).success).toBe(true);
    expect(
      goalSchema.safeParse({
        ...valid,
        targetDate: "2026-07-01",
        sourceAccountId: UUID,
      }).success,
    ).toBe(true);
    expect(
      goalSchema.safeParse({ ...valid, targetDate: "07/01/2026" }).success,
    ).toBe(false);
  });
});

describe("category schema", () => {
  const valid = { name: "Comida", type: "expense" as const, color: "#ef4444" };

  it("accepts 3 and 6 digit hex colors", () => {
    expect(categorySchema.safeParse(valid).success).toBe(true);
    expect(categorySchema.safeParse({ ...valid, color: "#abc" }).success).toBe(
      true,
    );
  });

  it("rejects invalid colors, names and types", () => {
    expect(categorySchema.safeParse({ ...valid, color: "red" }).success).toBe(
      false,
    );
    expect(
      categorySchema.safeParse({ ...valid, color: "#12345" }).success,
    ).toBe(false);
    expect(categorySchema.safeParse({ ...valid, name: "" }).success).toBe(
      false,
    );
    expect(
      categorySchema.safeParse({ ...valid, name: "a".repeat(61) }).success,
    ).toBe(false);
    expect(categorySchema.safeParse({ ...valid, type: "both" }).success).toBe(
      false,
    );
  });
});

describe("settings schema", () => {
  const valid = {
    name: "Demo",
    baseCurrency: "ARS",
    aiEnabled: true,
    assistantDestructiveEnabled: false,
  };

  it("accepts valid settings", () => {
    expect(settingsSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a one-character name and invalid currency", () => {
    expect(settingsSchema.safeParse({ ...valid, name: "D" }).success).toBe(
      false,
    );
    expect(
      settingsSchema.safeParse({ ...valid, baseCurrency: "AR" }).success,
    ).toBe(false);
    expect(
      settingsSchema.safeParse({ ...valid, aiEnabled: "yes" }).success,
    ).toBe(false);
  });
});
