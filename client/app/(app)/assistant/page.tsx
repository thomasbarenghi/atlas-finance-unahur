"use client";

import { useState } from "react";
import { History, Plus } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { AssistantChat } from "@/components/features/assistant/assistant-chat";
import { useAssistantChat } from "@/hooks/use-assistant-chat";

const AssistantPage = () => {
  const { startNewThread } = useAssistantChat();
  const [historyOpen, setHistoryOpen] = useState(false);

  return (
    <div className="flex h-[calc(100%+2rem)] flex-col md:h-full">
      <PageHeader
        title="Asistente"
        description="Respondé preguntas sobre tus propios datos. Es informativo y no constituye asesoramiento financiero."
        actions={
          <>
            <Button
              variant="outline"
              size="icon"
              aria-label="Nueva conversación"
              onClick={startNewThread}
            >
              <Plus />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Historial"
              onClick={() => setHistoryOpen(true)}
            >
              <History />
            </Button>
          </>
        }
      />
      <div className="mt-4 flex min-h-0 flex-1 flex-col">
        <AssistantChat
          showHeader={false}
          historyOpen={historyOpen}
          onHistoryOpenChange={setHistoryOpen}
        />
      </div>
    </div>
  );
};

export default AssistantPage;
