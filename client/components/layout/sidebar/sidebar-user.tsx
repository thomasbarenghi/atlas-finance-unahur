"use client";

import { ChevronsUpDown } from "lucide-react";
import { UserMenu } from "@/components/layout/user-menu";
import { UserIdentity } from "@/components/layout/user-identity";
import { useAuth } from "@/hooks/use-auth";

export const SidebarUser = () => {
  const { user } = useAuth();

  return (
    <div className="border-line2 mt-auto border-t pt-[14px] pb-0.5">
      <UserMenu>
        <button
          type="button"
          aria-label="Cuenta"
          className="hover:bg-muted flex h-[31px] w-full items-center gap-2.5 rounded-lg px-1 text-left transition-colors"
        >
          <UserIdentity
            name={user?.name}
            email={user?.email}
            compact
            className="flex-1 gap-2.5"
          />
          <ChevronsUpDown
            className="text-muted-foreground size-[13px] shrink-0"
            aria-hidden
          />
        </button>
      </UserMenu>
    </div>
  );
};
