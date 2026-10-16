import { describe, expect, it } from "vitest";
import {
  MAX_MONEY,
  dateSchema,
  moneySchema,
  notesSchema,
  optionalIdSchema,
  uuidSchema,
} from "@/lib/validation/common";
import { loginSchema, registerSchema } from "@/lib/validation/auth";
import { accountSchema } from "@/lib/validation/accounts";
import { transactionSchema } from "@/lib/validation/transactions";
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
      registerSchema.safeParse({ ...base, confirmPassword: "Different1" })
        .success,
    ).toBe(false);
  });
});

describe("account schema", () => {
  const valid = {
    name: "Caja",
    type: "cash" as const,
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

  it("rejects unknown or removed account types", () => {
    expect(accountSchema.safeParse({ ...valid, type: "crypto" }).success).toBe(
      false,
    );
    expect(accountSchema.safeParse({ ...valid, type: "card" }).success).toBe(
      false,
    );
  });

  it("rejects balances beyond the numeric column cap", () => {
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

describe("settings schema", () => {
  const valid = { name: "Demo" };

  it("accepts valid settings", () => {
    expect(settingsSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a one-character or oversized name", () => {
    expect(settingsSchema.safeParse({ name: "D" }).success).toBe(false);
    expect(settingsSchema.safeParse({ name: "a".repeat(81) }).success).toBe(
      false,
    );
  });
});
