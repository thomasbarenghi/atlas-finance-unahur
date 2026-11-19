import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChartDataTable } from "..";

describe("ChartDataTable", () => {
  it("keeps the table accessible while the sr-only wrapper handles the layout", () => {
    render(
      <ChartDataTable
        caption="Ingresos y gastos por semana"
        headers={["Semana", "Ingresos", "Gastos"]}
        rows={[{ key: "1", cells: ["1–7 oct", "$ 10", "$ 5"] }]}
      />,
    );

    const table = screen.getByRole("table", {
      name: "Ingresos y gastos por semana",
    });

    // A table ignores the 1px `sr-only` height, so applying it to the table
    // extends the document and enables the page-level scroll bug.
    expect(table).not.toHaveClass("sr-only");
    expect(table.parentElement).toHaveClass("sr-only");
    expect(screen.getByText("1–7 oct")).toBeInTheDocument();
  });
});
