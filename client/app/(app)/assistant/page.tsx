"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { ResponsiveActionButton } from "@/components/common/responsive-action-button";
import { AssistantChat } from "@/app/(app)/_components/assistant/assistant-chat";

const AssistantPage = () => {
  const [conversationKey, setConversationKey] = useState(0);

  const startNewConversation = () => {
    setConversationKey((key) => key + 1);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <PageHeader
        title="Asistente"
        actions={
          <ResponsiveActionButton
            label="Nuevo chat"
            icon={Plus}
            onClick={startNewConversation}
            className="md:px-4"
          />
        }
      />
      <div className="flex min-h-0 flex-1 flex-col md:pb-0">
        <AssistantChat key={conversationKey} />
      </div>
    </div>
  );
};

export default AssistantPage;
