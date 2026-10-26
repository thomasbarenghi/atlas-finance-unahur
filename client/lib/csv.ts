export interface CsvRow {
  date: string;
  type: string;
  description: string;
  category: string;
  account: string;
  currency: string;
  amount: string;
  notes: string;
}

const escapeCell = (value: string): string => `"${value.replace(/"/g, '""')}"`;

export const toCsv = (headers: string[], rows: string[][]): string =>
  [headers, ...rows]
    .map((row) => row.map((cell) => escapeCell(cell)).join(","))
    .join("\r\n");

export const transactionsToCsv = (rows: CsvRow[]): string =>
  toCsv(
    [
      "Fecha",
      "Tipo",
      "Descripción",
      "Categoría",
      "Cuenta",
      "Moneda",
      "Monto",
      "Notas",
    ],
    rows.map((row) => [
      row.date,
      row.type,
      row.description,
      row.category,
      row.account,
      row.currency,
      row.amount,
      row.notes,
    ]),
  );

export const downloadCsv = (filename: string, content: string): void => {
  const blob = new Blob([`\uFEFF${content}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};
