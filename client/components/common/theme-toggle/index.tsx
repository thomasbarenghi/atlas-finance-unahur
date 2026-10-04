"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useMounted } from "@/hooks/use-mounted";
import type { Theme } from "@/lib/api/types";
import { useUpdateMe } from "@/lib/query/users";

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const updateMe = useUpdateMe();
  const mounted = useMounted();

  const changeTheme = (next: Theme) => {
    setTheme(next);
    if (user) {
      updateMe.mutate({ theme: next });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Cambiar tema">
          {!mounted || theme === "system" ? (
            <Monitor />
          ) : theme === "dark" ? (
            <Moon />
          ) : (
            <Sun />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => changeTheme("light")}>
          <Sun /> Claro
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeTheme("dark")}>
          <Moon /> Oscuro
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeTheme("system")}>
          <Monitor /> Sistema
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
