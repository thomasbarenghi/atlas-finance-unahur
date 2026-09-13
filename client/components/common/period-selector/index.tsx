"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/common/date-picker";
import { usePeriod } from "@/hooks/use-period";
import { PERIOD_PRESETS, type PeriodPreset } from "@/lib/period";

export const PeriodSelector = () => {
  const { preset, range, setPreset, setCustomRange } = usePeriod();

  return (
    <div className="flex items-center gap-2">
      <Select
        value={preset}
        onValueChange={(value) => setPreset(value as PeriodPreset)}
      >
        <SelectTrigger size="sm" aria-label="Período">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PERIOD_PRESETS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {preset === "custom" ? (
        <div className="hidden items-center gap-2 lg:flex">
          <DatePicker
            value={range.from}
            onChange={(from) => setCustomRange({ ...range, from })}
            className="w-40"
          />
          <DatePicker
            value={range.to}
            onChange={(to) => setCustomRange({ ...range, to })}
            className="w-40"
          />
        </div>
      ) : null}
    </div>
  );
};
