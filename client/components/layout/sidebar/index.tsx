"use client";

import { Brand } from "@/components/layout/brand";
import { SidebarAccounts } from "./sidebar-accounts";
import { SidebarNav } from "./sidebar-nav";
import { SidebarUser } from "./sidebar-user";

export const Sidebar = () => {
  return (
    <aside className="bg-sidebar text-sidebar-foreground border-border sticky top-0 hidden h-dvh w-[260px] shrink-0 flex-col border-r px-3.5 py-5 md:flex">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <Brand className="px-1.5" />
        <div className="mt-6">
          <SidebarNav />
        </div>
        <SidebarAccounts />
      </div>
      <SidebarUser />
    </aside>
  );
};
