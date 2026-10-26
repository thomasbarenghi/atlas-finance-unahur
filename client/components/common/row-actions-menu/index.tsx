"use client";

import type { LucideIcon } from "lucide-react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MENU_ITEM_MD, MENU_SURFACE } from "@/components/common/ui-classes";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface RowAction {
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  variant?: "default" | "destructive";
}

export interface RowActionsMenuProps {
  label: string;
  actions: RowAction[];
}

export const RowActionsMenu = ({ label, actions }: RowActionsMenuProps) => {
  if (actions.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Acciones de ${label}`}
          className="text-muted-foreground -mr-2 size-6 rounded-full"
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className={cn(MENU_SURFACE, "w-[208px]")}
      >
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <DropdownMenuItem
              key={action.label}
              variant={action.variant}
              onClick={action.onSelect}
              className={cn(
                MENU_ITEM_MD,
                "data-[variant=destructive]:bg-[#FDF3F2]",
              )}
            >
              <Icon /> {action.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
