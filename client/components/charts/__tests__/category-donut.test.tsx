import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CategoryDonut } from "@/components/charts/category-donut";
import { groupSmallCategories } from "@/components/charts/category-donut/category-donut.utils";

const items = [
  { categoryId: "a", name: "Comida", color: "#ef4444", value: 60 },
  { categoryId: "b", name: "Ocio", color: "#3b82f6", value: 40 },
];

describe("groupSmallCategories", () => {
  it("returns the data unchanged up to the slice limit", () => {
    expect(groupSmallCategories(items)).toBe(items);
  });

  it("groups the tail into a single 'Otros' slice", () => {
    const many = Array.from({ length: 10 }, (_, index) => ({
      categoryId: `c${index}`,
      name: `Cat ${index}`,
      color: "#000",
      value: 10,
    }));
    const grouped = groupSmallCategories(many);
    expect(grouped).toHaveLength(8);
    expect(grouped[grouped.length - 1]).toMatchObject({
      categoryId: "others",
      name: "Otros",
    });
  });
});

describe("CategoryDonut", () => {
  it("shows an empty state without data", () => {
    render(<CategoryDonut data={[]} currency="ARS" />);
    expect(screen.getByText("Sin gastos en el período")).toBeInTheDocument();
  });

  it("shows an empty state when the total is zero", () => {
    render(
      <CategoryDonut
        data={[{ categoryId: "a", name: "Comida", color: "#fff", value: 0 }]}
        currency="ARS"
      />,
    );
    expect(screen.getByText("Sin gastos en el período")).toBeInTheDocument();
  });

  it("renders the chart, legend and accessible data table", () => {
    render(<CategoryDonut data={items} currency="ARS" />);
    expect(
      screen.getByRole("img", { name: "Gastos por categoría" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Comida").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Ocio").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("table", { name: "Gastos por categoría" }),
    ).toBeInTheDocument();
  });

  it("supports a custom value label and empty copy", () => {
    render(
      <CategoryDonut
        data={items}
        currency="ARS"
        valueLabel="Ingreso"
        emptyTitle="Sin ingresos"
        emptyDescription="…"
      />,
    );
    expect(
      screen.getByRole("img", { name: "Ingresos por categoría" }),
    ).toBeInTheDocument();
  });
});
