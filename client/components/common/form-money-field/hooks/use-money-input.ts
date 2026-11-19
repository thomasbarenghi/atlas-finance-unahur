"use client";

import { useEffect, useRef, useState } from "react";
import {
  formatMoneyInput,
  formatMoneyTyping,
  parseMoneyInput,
} from "@/lib/format";

interface UseMoneyInputOptions {
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  onBlur?: () => void;
}

export const useMoneyInput = ({
  value,
  onChange,
  onBlur,
}: UseMoneyInputOptions) => {
  const [text, setText] = useState(() => formatMoneyInput(value));
  const isEditing = useRef(false);

  useEffect(() => {
    if (!isEditing.current) setText(formatMoneyInput(value));
  }, [value]);

  const handleChange = (raw: string) => {
    isEditing.current = true;
    const formatted = formatMoneyTyping(raw);
    setText(formatted);
    onChange(parseMoneyInput(formatted));
  };

  const handleBlur = () => {
    isEditing.current = false;
    setText(formatMoneyInput(value));
    onBlur?.();
  };

  return { text, handleChange, handleBlur };
};
