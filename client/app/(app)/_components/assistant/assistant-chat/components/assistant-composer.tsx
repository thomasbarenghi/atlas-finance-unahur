"use client";

import { ArrowUp, Calendar, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { usePeriod } from "@/hooks/use-period";
import {
  getPeriodLabel,
  PERIOD_PRESETS,
  type PeriodPreset,
} from "@/lib/period";

export interface AssistantComposerProps {
  input: string;
  onInputChange: (value: string) => void;
  isBusy: boolean;
  onSubmit: (question: string) => void;
  onCancel: () => void;
}

export const AssistantComposer = ({
  input,
  onInputChange,
  isBusy,
  onSubmit,
  onCancel,
}: AssistantComposerProps) => {
  const { preset, range, setPreset } = usePeriod();
  const periodLabel = getPeriodLabel(preset, range);

  return (
    <div className="mx-auto flex w-full max-w-[780px] flex-col gap-2 pt-2 pb-3">
      <div className="flex items-center gap-2">
        <Select
          value={preset}
          onValueChange={(value) => setPreset(value as PeriodPreset)}
        >
          <SelectTrigger
            aria-label="Período del asistente"
            className="bg-card border-line text-ink2 h-[26px]! w-fit gap-[5px] rounded-full px-2.5 py-0 text-[10px] leading-[14px] font-medium shadow-none [&_svg]:size-3 md:px-2.5"
          >
            <Calendar
              className="text-muted-foreground size-[11px]!"
              aria-hidden
            />
            <SelectValue>{periodLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {PERIOD_PRESETS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-muted-foreground text-[9.5px] leading-[13px]">
          El asistente solo consulta tus datos.
        </span>
      </div>

      <form
        className="flex items-end gap-2.5"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(input);
        }}
      >
        <div className="bg-card border-line focus-within:border-ring flex min-h-12 flex-1 items-center rounded-[14px] border px-4">
          <Textarea
            value={input}
            onChange={(event) => onInputChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                onSubmit(input);
              }
            }}
            placeholder="Escribí tu pregunta…"
            rows={1}
            maxLength={1000}
            className="max-h-32 min-h-0 resize-none border-0 bg-transparent px-0 py-3 text-[12.5px] shadow-none focus-visible:ring-0 md:text-[12.5px]"
            aria-label="Pregunta para el asistente"
          />
        </div>
        {isBusy ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Detener respuesta"
            onClick={onCancel}
            className="size-11 rounded-full"
          >
            <Square className="size-4" />
          </Button>
        ) : (
          <Button
            type="submit"
            size="icon"
            aria-label="Enviar pregunta"
            className="size-11 rounded-full"
          >
            <ArrowUp className="size-4" />
          </Button>
        )}
      </form>
    </div>
  );
};
