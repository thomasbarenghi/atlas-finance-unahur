"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Info } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface MetricInfoProps {
  label: string;
  formula: string;
  description: string;
}

export const MetricInfo = ({
  label,
  formula,
  description,
}: MetricInfoProps) => {
  const id = useId();
  const descriptionId = `metric-info-${id}`;
  const openTimerRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const [open, setOpen] = useState(false);

  const clearTimers = () => {
    if (openTimerRef.current) {
      window.clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const openSoon = () => {
    clearTimers();
    openTimerRef.current = window.setTimeout(() => setOpen(true), 120);
  };

  const closeSoon = () => {
    clearTimers();
    closeTimerRef.current = window.setTimeout(() => setOpen(false), 120);
  };

  useEffect(() => {
    if (!open) return;

    const handleOtherOpen = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== id) {
        setOpen(false);
      }
    };
    const handleScroll = () => setOpen(false);

    window.addEventListener("metric-info-open", handleOtherOpen);
    window.addEventListener("scroll", handleScroll, true);
    window.dispatchEvent(new CustomEvent("metric-info-open", { detail: id }));

    return () => {
      window.removeEventListener("metric-info-open", handleOtherOpen);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [id, open]);

  return (
    <>
      <span id={descriptionId} className="sr-only">
        {label}: {formula}. {description}
      </span>
      <Popover
        open={open}
        onOpenChange={(nextOpen) => {
          clearTimers();
          setOpen(nextOpen);
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={`Información sobre ${label}`}
            aria-describedby={descriptionId}
            aria-expanded={open}
            onMouseEnter={openSoon}
            onMouseLeave={closeSoon}
            className="inline-flex size-4 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none"
          >
            <Info
              className={cn(
                "size-[9px] md:size-2.5",
                open ? "text-primary" : "text-metric-info",
              )}
              aria-hidden
            />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          side="top"
          sideOffset={6}
          collisionPadding={12}
          onMouseEnter={clearTimers}
          onMouseLeave={closeSoon}
          className="border-border bg-popover w-[452px] max-w-[calc(100vw-2rem)] rounded-lg p-0 px-3 py-[10px] shadow-[0_8px_24px_rgba(15,17,21,0.08)]"
        >
          <div className="flex flex-col gap-1">
            <p className="text-ink text-[12px] leading-4 font-semibold">
              {formula}
            </p>
            <p className="text-muted-foreground text-[11px] leading-[15px]">
              {description}
            </p>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
};
