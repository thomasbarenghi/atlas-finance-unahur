"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AuthGuard } from "@/components/layout/auth-guard";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { Sidebar } from "@/components/layout/sidebar";
import { UserMenu } from "@/components/layout/user-menu";
import { AssistantWidget } from "@/app/(app)/_components/assistant/assistant-widget";
import { AssistantChatProvider } from "@/providers/assistant-chat-provider";
import { AssistantPanelProvider } from "@/providers/assistant-panel-provider";
import { cn } from "@/lib/utils";

const AppLayout = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const isAssistant = pathname === "/assistant";

  return (
    <AuthGuard>
      <AssistantPanelProvider>
        <AssistantChatProvider>
          <div className="flex h-dvh w-full overflow-hidden">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
              <header className="bg-background/95 supports-backdrop-filter:bg-background/70 sticky top-0 z-30 hidden items-center gap-3 border-b px-4 py-3 backdrop-blur md:flex">
                <div className="ml-auto flex items-center gap-2">
                  <UserMenu />
                </div>
              </header>
              <main
                className={cn(
                  "mx-auto w-full max-w-6xl px-4 pt-5",
                  isAssistant
                    ? "flex min-h-0 flex-1 flex-col overflow-hidden pb-[90px]"
                    : "flex-1 overflow-y-auto pb-28 md:pb-10",
                )}
              >
                {children}
              </main>
            </div>
            <MobileTabBar />
            <AssistantWidget />
          </div>
        </AssistantChatProvider>
      </AssistantPanelProvider>
    </AuthGuard>
  );
};

export default AppLayout;
