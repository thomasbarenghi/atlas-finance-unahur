import type { ReactNode } from "react";

export interface ChartDataTableRow {
  key: string;
  cells: ReactNode[];
}

export interface ChartDataTableProps {
  caption: string;
  headers: string[];
  rows: ChartDataTableRow[];
}

export const ChartDataTable = ({
  caption,
  headers,
  rows,
}: ChartDataTableProps) => {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>
          {headers.map((header) => (
            <th key={header}>{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.key}>
            {row.cells.map((cell, index) => (
              <td key={index}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
