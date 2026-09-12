"use client";

import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { RowActionsMenuProps } from "./row-actions-menu.types";

export type { RowAction, RowActionsMenuProps } from "./row-actions-menu.types";

export const RowActionsMenu = ({
  label,
  actions,
  triggerLabel,
}: RowActionsMenuProps) => {
  const visibleActions = actions.filter((action) => !action.hidden);

  if (visibleActions.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={triggerLabel ?? `Acciones de ${label}`}
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {visibleActions.map((action) => {
          const Icon = action.icon;
          return (
            <DropdownMenuItem
              key={action.label}
              variant={action.variant}
              onClick={action.onSelect}
            >
              <Icon /> {action.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
