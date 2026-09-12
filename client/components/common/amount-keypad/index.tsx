"use client";

import { Delete } from "lucide-react";

export type AmountKeypadKey =
  | "0"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "."
  | "backspace"
  | "+"
  | "−"
  | "×"
  | "÷";

export interface AmountKeypadProps {
  onKey: (key: AmountKeypadKey) => void;
}

const ROWS: AmountKeypadKey[][] = [
  ["7", "8", "9", "÷"],
  ["4", "5", "6", "×"],
  ["1", "2", "3", "−"],
  [".", "0", "backspace", "+"],
];

const labelFor = (key: AmountKeypadKey): string => (key === "." ? "," : key);

export const AmountKeypad = ({ onKey }: AmountKeypadProps) => {
  return (
    <div className="grid grid-cols-4 gap-2">
      {ROWS.flat().map((key) => (
        <button
          type="button"
          key={key}
          onClick={() => onKey(key)}
          aria-label={key === "backspace" ? "Borrar" : labelFor(key)}
          className="bg-muted/50 hover:bg-muted active:bg-muted flex h-12 items-center justify-center rounded-xl text-xl font-medium transition-colors"
        >
          {key === "backspace" ? (
            <Delete className="size-5" aria-hidden />
          ) : (
            labelFor(key)
          )}
        </button>
      ))}
    </div>
  );
};
