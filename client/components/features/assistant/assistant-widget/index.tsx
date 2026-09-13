"use client";

import { usePathname } from "next/navigation";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAssistantPanel } from "@/hooks/use-assistant-panel";
import { useMediaQuery } from "@/hooks/use-media-query";
import { AssistantChat } from "@/components/features/assistant/assistant-chat";

export const AssistantWidget = () => {
  const { isOpen, toggle, close } = useAssistantPanel();
  const pathname = usePathname();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (pathname.startsWith("/assistant")) return null;

  const fab = (
    <Button
      type="button"
      size="icon-lg"
      aria-label={isOpen ? "Cerrar asistente" : "Abrir asistente"}
      aria-expanded={isOpen}
      onClick={toggle}
      className="fixed right-4 bottom-24 z-50 size-14 rounded-full shadow-xl md:right-6 md:bottom-6"
    >
      {isOpen ? <X className="size-6" /> : <Sparkles className="size-6" />}
    </Button>
  );

  if (!isDesktop) return null;

  return (
    <>
      {isOpen ? (
        <div className="bg-background fixed right-6 bottom-20 z-50 flex h-[min(560px,calc(100dvh-8rem))] w-[380px] flex-col overflow-hidden rounded-2xl border shadow-2xl">
          <AssistantChat onClose={close} />
        </div>
      ) : null}
      {fab}
    </>
  );
};
