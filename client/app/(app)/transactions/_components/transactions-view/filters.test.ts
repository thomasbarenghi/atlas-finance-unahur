import { describe, expect, it } from "vitest";
import { makeTransaction } from "@/lib/test/factories";
import { filterTransactions } from "./filters";

const base = {
  search: "",
  type: "all" as const,
  accountId: "",
  categoryId: "",
  currency: "",
  range: { from: "2026-01-01", to: "2026-12-31" },
  categoryNameById: new Map([
    ["cat-super", "Supermercado"],
    ["cat-sueldo", "Sueldo"],
  ]),
  accountCurrencyById: new Map([
    ["acc-banco", "ARS"],
    ["acc-caja", "USD"],
  ]),
};

const transactions = [
  makeTransaction({
    id: "income",
    type: "income",
    amount: 900,
    description: "Sueldo",
    categoryId: "cat-sueldo",
    accountId: "acc-banco",
    date: "2026-10-05",
  }),
  makeTransaction({
    id: "expense",
    type: "expense",
    amount: 120,
    description: "Compra semanal",
    notes: "Verdulería",
    categoryId: "cat-super",
    accountId: "acc-caja",
    date: "2026-10-10",
  }),
  makeTransaction({
    id: "transfer",
    type: "transfer",
    amount: -50,
    description: "Ahorro",
    accountId: "acc-banco",
    transferAccountId: "acc-caja",
    date: "2026-09-15",
  }),
];

describe("filterTransactions", () => {
  it("filters by type, account, category and inclusive range", () => {
    expect(
      filterTransactions(transactions, { ...base, type: "expense" }).map(
        (item) => item.id,
      ),
    ).toEqual(["expense"]);
    expect(
      filterTransactions(transactions, { ...base, accountId: "acc-caja" }).map(
        (item) => item.id,
      ),
    ).toEqual(["expense", "transfer"]);
    expect(
      filterTransactions(transactions, {
        ...base,
        categoryId: "cat-sueldo",
      }).map((item) => item.id),
    ).toEqual(["income"]);
    expect(
      filterTransactions(transactions, {
        ...base,
        range: { from: "2026-10-01", to: "2026-10-31" },
      }).map((item) => item.id),
    ).toEqual(["income", "expense"]);
  });

  it("filters by the currency of either transfer leg", () => {
    expect(
      filterTransactions(transactions, { ...base, currency: "USD" }).map(
        (item) => item.id,
      ),
    ).toEqual(["expense", "transfer"]);
  });

  it("searches description, notes, category name and amount", () => {
    expect(
      filterTransactions(transactions, { ...base, search: "verduleria" }).map(
        (item) => item.id,
      ),
    ).toEqual(["expense"]);
    expect(
      filterTransactions(transactions, { ...base, search: "supermercado" }).map(
        (item) => item.id,
      ),
    ).toEqual(["expense"]);
    expect(
      filterTransactions(transactions, { ...base, search: "900" }).map(
        (item) => item.id,
      ),
    ).toEqual(["income"]);
  });
});
