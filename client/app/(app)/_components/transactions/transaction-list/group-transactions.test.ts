import { describe, expect, it } from "vitest";
import { makeTransaction } from "@/lib/test/factories";
import { groupTransactionsByMonth } from "./group-transactions";

describe("groupTransactionsByMonth", () => {
  it("groups rows by month preserving their order", () => {
    const groups = groupTransactionsByMonth([
      makeTransaction({
        id: "1",
        date: "2026-10-22",
        type: "income",
        amount: 100,
      }),
      makeTransaction({
        id: "2",
        date: "2026-10-10",
        type: "expense",
        amount: 40,
      }),
      makeTransaction({
        id: "3",
        date: "2026-09-05",
        type: "transfer",
        amount: -50,
      }),
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0]).toMatchObject({
      key: "2026-10",
      label: "OCTUBRE 2026",
    });
    expect(groups[0].items.map((item) => item.id)).toEqual(["1", "2"]);
    expect(groups[1]).toMatchObject({ key: "2026-09" });
    expect(groups[1].items.map((item) => item.id)).toEqual(["3"]);
  });
});
