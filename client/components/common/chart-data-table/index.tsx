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
  // The wrapper (not the table) carries `sr-only`: a table ignores the 1 px
  // height, so an absolutely positioned table keeps its real height and can
  // extend the document, enabling a page-level scroll behind the app shell.
  return (
    <div className="sr-only">
      <table>
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
    </div>
  );
};
