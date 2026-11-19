/**
 * Shared Tailwind class recipes for composed shadcn/ui primitives.
 *
 * They live in TypeScript (instead of `@layer components`) so `cn` and
 * tailwind-merge can resolve them against the utilities baked into the
 * generated components (`Button`, `Input`, `Dialog*`, `DropdownMenu*`).
 */
export const MENU_SURFACE =
  "border-line flex flex-col gap-0.5 rounded-[12px] border p-1.5 shadow-none ring-0";

export const MENU_ITEM =
  "gap-2 rounded-[7px] px-[9px] text-[11.5px] leading-[16px] [&_svg]:size-[13px]";

export const MENU_ITEM_MD =
  "h-[38px] gap-[9px] rounded-[8px] px-2.5 text-[12px] leading-[16px] font-medium [&_svg]:size-[14px]";

export const DIALOG_HEADER =
  "gap-[3px] px-[18px] pt-0 pb-0 pr-14 sm:px-[22px] sm:pt-5";

export const DIALOG_TITLE =
  "text-[17px] leading-[21px] font-semibold sm:text-[18px] sm:leading-[23px]";

export const DIALOG_DESCRIPTION =
  "hidden text-[11.5px] leading-[16px] sm:block";

export const DIALOG_FOOTER =
  "border-line2 mt-3 border-t px-[18px] pt-1 pb-[18px] sm:mt-0 sm:px-[22px] sm:pt-[14px] sm:pb-5";

export const DIALOG_BUTTON =
  "h-11 w-full px-4 text-[12.5px] leading-[17px] font-semibold sm:h-[38px] sm:w-auto";

export const FIELD_LABEL =
  "text-muted-foreground text-[10.5px] leading-[14px] font-semibold";

export const FIELD_INPUT =
  "border-border bg-card rounded-[10px] text-[12.5px] shadow-none md:text-[12.5px]";

export const FIELD_SELECT =
  "border-border bg-card h-10 rounded-[10px] text-[12px] shadow-none data-[size=default]:h-10! data-[size=default]:py-0 sm:h-[42px] sm:text-[12.5px] sm:data-[size=default]:h-[42px]! md:text-[12.5px]";

export const AUTH_SUBMIT = "h-11 rounded-[10px] text-[13px] font-semibold";

export const PRIMARY_ACTION_BUTTON =
  "h-10 gap-2 rounded-full px-[18px] text-[13px] leading-[18px] font-semibold";

export const SHEET_POSITION =
  "max-lg:!top-auto max-lg:!bottom-0 max-lg:!left-0 max-lg:!right-0 max-lg:!w-full max-lg:!max-w-none max-lg:!translate-x-0 max-lg:!translate-y-0 max-lg:!rounded-b-none";
