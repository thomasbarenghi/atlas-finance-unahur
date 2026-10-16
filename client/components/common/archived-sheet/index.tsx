"use client";

import { Fragment } from "react";
import { Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { ArchivedSheetProps } from "./archived-sheet.types";

/**
 * Generic, domain-agnostic access point for archived items. Renders a "Ver
 * archivados (N)" trigger (hidden when there is nothing archived) that opens a
 * bottom sheet with the caller-provided rows, so archived items stay out of the
 * main lists without becoming unreachable.
 */
export const ArchivedSheet = <T,>({
  label,
  items,
  getKey,
  renderItem,
}: ArchivedSheetProps<T>) => {
  if (items.length === 0) return null;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground w-fit gap-1.5 px-2 text-xs"
        >
          <Archive className="size-3.5" aria-hidden />
          Ver archivados ({items.length})
        </Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="max-h-[80dvh] overflow-y-auto rounded-t-3xl"
      >
        <SheetHeader>
          <SheetTitle>Archivados</SheetTitle>
          <SheetDescription>
            Estas {label} no aparecen en las listas principales.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-2 px-4 pb-6">
          {items.map((item) => (
            <Fragment key={getKey(item)}>{renderItem(item)}</Fragment>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};
