import { useMemo, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type {
  Mention,
  MentionTarget,
  RecentMentionEntry,
} from "@/modules/internal-chat/domain/internal-chat";
import { resolveConversationId } from "@/modules/internal-chat/domain/mention-parser";
import type { SessionUser } from "@/modules/identity/domain/session";
import {
  peerIdOfThread,
  getInternalChatSnapshot,
} from "@/modules/internal-chat/infrastructure/internal-chat.store";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targets: MentionTarget[];
  recent: RecentMentionEntry[];
  selfId: string;
  directory: SessionUser[];
  onInsertMention: (mention: Mention) => void;
  onOpenCase: (conversationId: string) => void;
  onOpenThread: (threadId: string) => void;
};

export function MentionsPanel({
  open,
  onOpenChange,
  targets,
  recent,
  selfId,
  directory,
  onInsertMention,
  onOpenCase,
  onOpenThread,
}: Props) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return targets;
    return targets.filter(
      (t) =>
        t.label.toLowerCase().includes(needle) ||
        t.customerName.toLowerCase().includes(needle) ||
        (t.contractId ?? "").includes(needle),
    );
  }, [targets, q]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Menciones</SheetTitle>
          <SheetDescription>
            Solo visible para supervisores. El cliente no ve este contenido.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <section>
            <h3 className="text-xs font-extrabold uppercase tracking-widest mb-2">
              Mencionar caso
            </h3>
            <Command className="rounded-lg border border-border" shouldFilter={false}>
              <CommandInput
                placeholder="Buscar conversación o cliente…"
                value={q}
                onValueChange={setQ}
              />
              <CommandList className="max-h-52">
                <CommandEmpty>Sin resultados</CommandEmpty>
                <CommandGroup heading="Resultados">
                  {filtered.slice(0, 20).map((t) => (
                    <CommandItem
                      key={`${t.type}:${t.targetId}`}
                      value={`${t.type}-${t.targetId}`}
                      onSelect={() => {
                        onInsertMention({
                          type: t.type,
                          targetId: t.targetId,
                          label: t.label,
                        });
                        onOpenChange(false);
                      }}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{t.label}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {t.type === "conversation" ? "Conversación" : "Cliente"}
                          {t.department ? ` · ${t.department}` : ""}
                        </p>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </section>

          <section>
            <h3 className="text-xs font-extrabold uppercase tracking-widest mb-2">Recientes</h3>
            {recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aún no has mencionado casos.</p>
            ) : (
              <ul className="space-y-2">
                {recent.slice(0, 15).map((entry) => {
                  const state = getInternalChatSnapshot();
                  const thread = state.threads.find((t) => t.id === entry.threadId);
                  const peerId = thread ? peerIdOfThread(thread, selfId) : null;
                  const peerName =
                    (peerId ? directory.find((u) => u.id === peerId)?.name : null) ?? "Agente";
                  const conversationId = resolveConversationId(entry.mention, targets);

                  return (
                    <li key={entry.id} className="rounded-lg border border-border p-3 space-y-2">
                      <p className="text-sm font-semibold">@{entry.mention.label}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Con {peerName} ·{" "}
                        {new Date(entry.createdAt).toLocaleString("es-CO", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="text-[11px] font-bold uppercase tracking-wide text-sky-700 hover:underline"
                          onClick={() => onOpenThread(entry.threadId)}
                        >
                          Abrir chat
                        </button>
                        {conversationId ? (
                          <button
                            type="button"
                            className="text-[11px] font-bold uppercase tracking-wide text-sky-700 hover:underline"
                            onClick={() => onOpenCase(conversationId)}
                          >
                            Abrir caso
                          </button>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">
                            Caso no disponible
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
