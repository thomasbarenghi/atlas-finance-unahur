"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Settings, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
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

export const UserMenu = () => {
  const { user, signOut, isSigningOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Sesión cerrada");
      router.replace("/login");
    } catch {
      toast.error("No se pudo cerrar la sesión");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Cuenta">
          <UserIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52">
        <DropdownMenuLabel>
          <span className="flex flex-col">
            <span className="text-foreground text-sm font-medium">
              {user?.name}
            </span>
            <span className="text-muted-foreground text-xs">{user?.email}</span>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings /> Ajustes
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          disabled={isSigningOut}
          onClick={handleSignOut}
        >
          <LogOut /> Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
