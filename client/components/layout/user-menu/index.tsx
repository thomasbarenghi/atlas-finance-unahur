"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { LogOut, Settings, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useSignOut } from "@/hooks/use-sign-out";
import { MENU_ITEM, MENU_SURFACE } from "@/components/common/ui-classes";
import { cn } from "@/lib/utils";

export interface UserMenuProps {
  children?: ReactNode;
}

export const UserMenu = ({ children }: UserMenuProps) => {
  const { user } = useAuth();
  const { signOut, isSigningOut } = useSignOut();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children ?? (
          <Button variant="ghost" size="icon" aria-label="Cuenta">
            <UserIcon />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className={cn(MENU_SURFACE, "w-[240px]")}
      >
        <DropdownMenuLabel className="flex flex-col gap-px px-2.5 py-2">
          <span className="text-ink truncate text-[12px] leading-[16px] font-bold">
            {user?.name}
          </span>
          <span className="text-muted-foreground truncate text-[10px] leading-[14px]">
            {user?.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="mx-0 my-0 h-px bg-[#F1F3F6]" />
        <DropdownMenuItem asChild className={cn(MENU_ITEM, "h-[34px]")}>
          <Link href="/profile">
            <UserIcon /> Perfil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className={cn(MENU_ITEM, "h-[34px]")}>
          <Link href="/settings">
            <Settings /> Ajustes
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          disabled={isSigningOut}
          onClick={signOut}
          className={cn(MENU_ITEM, "h-[34px] font-normal")}
        >
          <LogOut /> Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
