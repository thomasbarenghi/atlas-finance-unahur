"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AuthGuard } from "@/components/layout/auth-guard";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { Sidebar } from "@/components/layout/sidebar";
import { cn } from "@/lib/utils";

const AppLayout = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const isAssistant = pathname === "/assistant";

  return (
    <AuthGuard>
      <div className="bg-background flex h-dvh w-full overflow-hidden">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <main
            className={cn(
              "relative flex-1",
              isAssistant ? "min-h-0 overflow-hidden" : "overflow-y-auto",
            )}
          >
            <div
              className={cn(
                "mx-auto flex w-full max-w-[1180px] flex-col px-4 md:px-10",
                isAssistant
                  ? "h-full min-h-0 pt-5 pb-24 md:pt-7 md:pb-7"
                  : "pt-5 pb-28 md:pt-7 md:pb-10",
              )}
            >
              {children}
            </div>
          </main>
        </div>
        <MobileTabBar />
      </div>
    </AuthGuard>
  );
};

export default AppLayout;
