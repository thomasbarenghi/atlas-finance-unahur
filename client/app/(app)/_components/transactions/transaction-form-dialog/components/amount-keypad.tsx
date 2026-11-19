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
    <div className="grid grid-cols-4 gap-1.5">
      {ROWS.flat().map((key) => (
        <button
          type="button"
          key={key}
          onClick={() => onKey(key)}
          aria-label={key === "backspace" ? "Borrar" : labelFor(key)}
          className="text-ink flex h-[42px] items-center justify-center rounded-[12px] bg-[#F5F6F8] text-[14px] leading-[19px] font-medium transition-colors hover:bg-[#EFF1F4] active:bg-[#EFF1F4] sm:h-[46px] sm:text-[15px] sm:leading-[20px]"
        >
          {key === "backspace" ? (
            <Delete className="size-4 sm:size-[18px]" aria-hidden />
          ) : (
            labelFor(key)
          )}
        </button>
      ))}
    </div>
  );
};
