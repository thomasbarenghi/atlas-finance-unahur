"use client";

import { Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePeriod } from "@/hooks/use-period";
import {
  getPeriodLabel,
  PERIOD_PRESETS,
  type PeriodPreset,
} from "@/lib/period";

export interface PeriodSelectorProps {
  showCalendar?: boolean;
}

const TRIGGER_CLASS =
  "bg-card border-border text-ink2 h-[30px]! w-fit gap-[5px] rounded-full px-3 py-0 text-[11.5px] leading-[16px] font-medium shadow-none md:h-[38px]! md:gap-[7px] md:px-4 md:text-[13px] md:leading-[18px] [&_svg]:size-3 md:[&_svg]:size-3.5";

export const PeriodSelector = ({
  showCalendar = false,
}: PeriodSelectorProps) => {
  const { preset, range, setPreset } = usePeriod();
  const value = getPeriodLabel(preset, range);

  return (
    <Select
      value={preset}
      onValueChange={(next) => setPreset(next as PeriodPreset)}
    >
      <SelectTrigger aria-label="Período" className={TRIGGER_CLASS}>
        {showCalendar ? (
          <Calendar
            className="text-muted-foreground size-3 md:size-3.5"
            aria-hidden
          />
        ) : null}
        <SelectValue>{value}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {PERIOD_PRESETS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
