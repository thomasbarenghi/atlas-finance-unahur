"use client";

import type { LucideIcon } from "lucide-react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  hidden?: boolean;
}

export interface RowActionsMenuProps {
  label: string;
  actions: RowAction[];
  triggerLabel?: string;
}

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
