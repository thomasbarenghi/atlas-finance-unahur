"use client";

import type { ComponentProps } from "react";
import { DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const SHEET_CLASSES =
  "max-lg:!top-auto max-lg:!bottom-0 max-lg:!left-0 max-lg:!right-0 max-lg:!w-full max-lg:!max-w-none max-lg:!translate-x-0 max-lg:!translate-y-0 max-lg:!rounded-b-none max-lg:!rounded-t-3xl max-lg:max-h-[90dvh] max-lg:overflow-y-auto max-lg:pb-[calc(1.5rem+env(safe-area-inset-bottom))] max-lg:data-open:slide-in-from-bottom max-lg:data-closed:slide-out-to-bottom max-lg:[&_[data-slot=dialog-title]]:text-lg";

export const ResponsiveDialogContent = ({
  className,
  ...props
}: ComponentProps<typeof DialogContent>) => {
  return <DialogContent className={cn(SHEET_CLASSES, className)} {...props} />;
};
