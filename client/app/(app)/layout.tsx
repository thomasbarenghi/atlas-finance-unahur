"use client";

import type { ReactNode } from "react";
import { AuthGuard } from "@/components/layout/auth-guard";
import { Header } from "@/components/layout/header";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { Sidebar } from "@/components/layout/sidebar";
import { AssistantWidget } from "@/components/features/assistant/assistant-widget";
import { AssistantChatProvider } from "@/providers/assistant-chat-provider";
import { AssistantPanelProvider } from "@/providers/assistant-panel-provider";

const AppLayout = ({ children }: { children: ReactNode }) => {
  return (
    <AuthGuard>
      <AssistantPanelProvider>
        <AssistantChatProvider>
          <div className="flex h-dvh w-full overflow-hidden">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
              <Header />
              <main className="mx-auto w-full max-w-6xl flex-1 overflow-y-auto px-4 pt-5 pb-28 md:pb-10">
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
