"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { useAssistantConversation } from "./hooks/use-assistant-conversation";
import { AssistantComposer } from "./components/assistant-composer";
import { AssistantEmptyState } from "./components/assistant-empty-state";
import { AssistantMessages } from "./components/assistant-messages";

export const AssistantChat = () => {
  const { bottomRef, messages, input, setInput, isBusy, submit, cancelStream } =
    useAssistantConversation();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto flex w-full max-w-[780px] flex-col gap-4 py-4">
          {messages.length === 0 ? (
            <AssistantEmptyState onSelect={submit} />
          ) : (
            <AssistantMessages messages={messages} isBusy={isBusy} />
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <AssistantComposer
        input={input}
        onInputChange={setInput}
        isBusy={isBusy}
        onSubmit={submit}
        onCancel={cancelStream}
      />
    </div>
  );
};
