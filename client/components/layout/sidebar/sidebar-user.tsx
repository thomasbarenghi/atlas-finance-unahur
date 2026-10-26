"use client";

import Link from "next/link";
import { UserIdentity } from "@/components/layout/user-identity";
import { useAuth } from "@/hooks/use-auth";

export const SidebarUser = () => {
  const { user } = useAuth();

  return (
    <div className="border-line2 mt-auto border-t pt-[14px] pb-0.5">
      <Link
        href="/profile"
        aria-label="Mi perfil"
        className="flex h-[31px] w-full items-center gap-2.5 rounded-lg px-1 text-left"
      >
        <UserIdentity
          name={user?.name}
          email={user?.email}
          compact
          className="flex-1 gap-2.5"
        />
      </Link>
    </div>
  );
};
