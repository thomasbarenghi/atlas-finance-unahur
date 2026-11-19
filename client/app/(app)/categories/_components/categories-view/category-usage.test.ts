import { describe, expect, it } from "vitest";
import { makeCategory, makeTransaction } from "@/lib/test/factories";
import { buildCategoryUsage } from "./category-usage";

const range = { from: "2026-10-01", to: "2026-10-31" };

describe("buildCategoryUsage", () => {
  it("sums amounts, counts rows, computes percentages and sorts by use", () => {
    const supermercado = makeCategory({
      id: "cat-super",
      name: "Supermercado",
      type: "expense",
      isSystem: true,
    });
    const transporte = makeCategory({
      id: "cat-transporte",
      name: "Transporte",
      type: "expense",
      isSystem: true,
    });
    const sueldo = makeCategory({
      id: "cat-sueldo",
      name: "Sueldo",
      type: "income",
      isSystem: true,
    });

    const result = buildCategoryUsage(
      [supermercado, transporte, sueldo],
      [
        makeTransaction({
          type: "expense",
          amount: 300,
          categoryId: supermercado.id,
          date: "2026-10-10",
        }),
        makeTransaction({
          type: "expense",
          amount: 100,
          categoryId: supermercado.id,
          date: "2026-10-12",
        }),
        makeTransaction({
          type: "expense",
          amount: 100,
          categoryId: transporte.id,
          date: "2026-10-15",
        }),
        makeTransaction({
          type: "expense",
          amount: 999,
          categoryId: transporte.id,
          date: "2026-09-15",
        }),
        makeTransaction({
          type: "income",
          amount: 5000,
          categoryId: sueldo.id,
          date: "2026-10-05",
        }),
      ],
      "expense",
      range,
    );

    expect(result.total).toBe(500);
    expect(result.items.map((item) => item.category.name)).toEqual([
      "Supermercado",
      "Transporte",
    ]);
    expect(result.items[0]).toMatchObject({ amount: 400, count: 2, pct: 0.8 });
    expect(result.items[1]).toMatchObject({ amount: 100, count: 1, pct: 0.2 });
  });

  it("includes every currency and converts the amounts to the display currency", () => {
    const supermercado = makeCategory({
      id: "cat-super",
      name: "Supermercado",
      type: "expense",
      isSystem: true,
    });
    const result = buildCategoryUsage(
      [supermercado],
      [
        makeTransaction({
          type: "expense",
          amount: 1180,
          categoryId: supermercado.id,
          accountId: "acc-ars",
          date: "2026-10-10",
        }),
        makeTransaction({
          type: "expense",
          amount: 1,
          categoryId: supermercado.id,
          accountId: "acc-usd",
          date: "2026-10-12",
        }),
      ],
      "expense",
      range,
      "USD",
      new Map([
        ["acc-ars", "ARS"],
        ["acc-usd", "USD"],
      ]),
      [
        {
          currency: "USD",
          name: "Dólar",
          symbol: "US$",
          rate: 1180,
          rateDate: "2026-10-25",
          source: "api",
        },
      ],
      "ARS",
    );

    expect(result.total).toBeCloseTo(2, 6);
    expect(result.items[0].amount).toBeCloseTo(2, 6);
    expect(result.items[0].count).toBe(2);
  });
});
