"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { AssistantThread } from "@/hooks/use-assistant-chat";
import { formatDateTime } from "@/lib/format";
import { useConversations, useDeleteConversation } from "@/lib/query/assistant";
import { cn } from "@/lib/utils";

export interface AssistantHistorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  threads: AssistantThread[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}

const formatWhen = (timestamp: number): string =>
  new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(timestamp);

export const AssistantHistorySheet = ({
  open,
  onOpenChange,
  threads,
  activeId,
  onSelect,
  onDelete,
  onNew,
}: AssistantHistorySheetProps) => {
  const sorted = [...threads].sort(
    (first, second) => second.updatedAt - first.updatedAt,
  );
  const serverQuery = useConversations();
  const deleteConversation = useDeleteConversation();
  const serverConversations = serverQuery.data ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>Historial</SheetTitle>
          <SheetDescription>
            Tus conversaciones anteriores con el asistente.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-3 px-6 pb-6">
          <Button
            variant="outline"
            className="justify-start"
            onClick={() => {
              onNew();
              onOpenChange(false);
            }}
          >
            <Plus /> Nueva conversación
          </Button>

          {sorted.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Todavía no hay conversaciones guardadas.
            </p>
          ) : (
            <ScrollArea className="max-h-[40dvh]">
              <ul className="flex flex-col gap-1 pr-2">
                {sorted.map((thread) => (
                  <li key={thread.id} className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(thread.id);
                        onOpenChange(false);
                      }}
                      className={cn(
                        "hover:bg-muted flex min-w-0 flex-1 flex-col items-start gap-0.5 rounded-xl px-3 py-2 text-left transition-colors",
                        thread.id === activeId && "bg-muted",
                      )}
                    >
                      <span className="w-full truncate text-sm font-medium">
                        {thread.title}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {formatWhen(thread.updatedAt)}
                      </span>
                    </button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Eliminar conversación"
                      onClick={() => onDelete(thread.id)}
                    >
                      <Trash2 />
                    </Button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}

          <div className="border-t pt-3">
            <h3 className="text-muted-foreground mb-2 text-xs font-medium">
              Guardadas en el servidor
            </h3>
            {serverQuery.isLoading ? (
              <p className="text-muted-foreground text-sm">Cargando…</p>
            ) : serverConversations.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Sin conversaciones en el servidor.
              </p>
            ) : (
              <ScrollArea className="max-h-[30dvh]">
                <ul className="flex flex-col gap-1 pr-2">
                  {serverConversations.map((conversation) => (
                    <li
                      key={conversation.id}
                      className="flex items-center gap-1"
                    >
                      <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5 px-3 py-2 text-left">
                        <span className="w-full truncate text-sm font-medium">
                          {conversation.question}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {formatDateTime(conversation.createdAt)}
                        </span>
                      </span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Eliminar conversación del servidor"
                        disabled={deleteConversation.isPending}
                        onClick={() =>
                          deleteConversation.mutate(conversation.id)
                        }
                      >
                        <Trash2 />
                      </Button>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
