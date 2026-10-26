import { describe, expect, it } from "vitest";
import { toCsv, transactionsToCsv } from "@/lib/csv";

describe("csv", () => {
  it("escapes quotes and separators", () => {
    expect(toCsv(["Nombre", "Nota"], [['Caja "ARS"', "uno, dos"]])).toBe(
      '"Nombre","Nota"\r\n"Caja ""ARS""","uno, dos"',
    );
  });

  it("serializes transactions with the expected headers", () => {
    const csv = transactionsToCsv([
      {
        date: "2026-10-22",
        type: "Ingreso",
        description: "Trabajo freelance",
        category: "Freelance",
        account: "Banco",
        currency: "ARS",
        amount: "$ 180.000,00",
        notes: "",
      },
    ]);

    expect(csv.split("\r\n")[0]).toBe(
      '"Fecha","Tipo","Descripción","Categoría","Cuenta","Moneda","Monto","Notas"',
    );
    expect(csv).toContain('"Trabajo freelance"');
  });
});
