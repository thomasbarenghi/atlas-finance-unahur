"use client";

import { ArrowUpRight, MessageCircleQuestion, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const SUGGESTED_QUESTIONS = [
  {
    question: "¿En qué gasté más este mes?",
    description: "Mirá el detalle por categoría.",
  },
  {
    question: "¿Cuánto ahorré en el período?",
    description: "Compará ingresos y gastos.",
  },
  {
    question: "¿Cómo fueron mis ingresos y gastos?",
    description: "Revisá la evolución mensual.",
  },
  {
    question: "¿Cómo evolucionó mi saldo?",
    description: "Seguí el patrimonio en el tiempo.",
  },
];

export interface AssistantEmptyStateProps {
  onSelect: (question: string) => void;
}

export const AssistantEmptyState = ({ onSelect }: AssistantEmptyStateProps) => {
  return (
    <div className="flex flex-col items-center gap-3 pt-[22px] pb-10 text-center sm:gap-5 sm:py-10">
      <span className="bg-accent flex size-[52px] items-center justify-center rounded-full sm:size-14">
        <Sparkles className="text-primary size-6" aria-hidden />
      </span>
      <div className="flex flex-col gap-3 sm:gap-1.5">
        <h2 className="font-heading text-ink text-[21px] leading-[26px] font-semibold sm:leading-normal">
          ¿En qué te ayudo?
        </h2>
        <p className="text-muted-foreground max-w-sm text-[11.5px] leading-[16px]">
          Preguntá por tus gastos, ingresos y ahorro.
        </p>
      </div>
      <div className="grid w-full max-w-[640px] gap-2 pt-2 sm:grid-cols-2 sm:pt-0">
        {SUGGESTED_QUESTIONS.map((item, index) => (
          <button
            type="button"
            key={item.question}
            onClick={() => onSelect(item.question)}
            className={cn(
              "interactive-card flex h-[50px] items-center gap-2.5 rounded-[14px] border px-3.5 text-left transition-colors sm:h-auto sm:items-start sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-3",
              index === 3 && "max-md:hidden",
            )}
          >
            <MessageCircleQuestion
              className="text-primary size-5 shrink-0 sm:mt-0.5 sm:size-4"
              aria-hidden
            />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-ink2 text-[11.5px] leading-[16px] sm:text-ink sm:text-[12.5px] sm:font-semibold">
                {item.question}
              </span>
              <span className="text-muted-foreground hidden text-[10.5px] sm:block">
                {item.description}
              </span>
            </span>
            <ArrowUpRight
              className="text-muted-foreground size-3.5 shrink-0 sm:mt-0.5"
              aria-hidden
            />
          </button>
        ))}
      </div>
    </div>
  );
};
