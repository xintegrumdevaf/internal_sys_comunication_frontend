import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AtSign, Send } from "lucide-react";
import { listConversations } from "@/modules/conversations/infrastructure/conversation.gateway";
import { MentionPicker } from "@/modules/internal-chat/ui/MentionPicker";
import { MentionsPanel } from "@/modules/internal-chat/ui/MentionsPanel";
import { MessageBodyWithMentions } from "@/modules/internal-chat/ui/MessageBodyWithMentions";
import { useInternalChat } from "@/modules/internal-chat/application/use-internal-chat";
import { relativeTime } from "@/shared/datetime";
import { isSupervisorSession } from "@/modules/identity/application/access-control";
import { useDirectoryUsers } from "@/modules/identity/application/use-session";
import { detectAtQuery, insertMentionAt } from "@/modules/internal-chat/domain/mention-parser";
import { targetsFromConversations } from "@/modules/internal-chat/application/build-mention-targets";
import type { Mention, MentionTarget } from "@/modules/internal-chat/domain/internal-chat";
import { toast } from "sonner";

export function InternalChatShell({
  mentionsOpen,
  onMentionsOpenChange,
}: {
  mentionsOpen: boolean;
  onMentionsOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const directory = useDirectoryUsers();
  const {
    session,
    peers,
    threads,
    selectedThreadId,
    setSelectedThreadId,
    selectedThread,
    messages,
    recentMentions,
    openThreadWith,
    send,
  } = useInternalChat();

  const [targets, setTargets] = useState<MentionTarget[]>([]);
  const [draft, setDraft] = useState("");
  const [draftMentions, setDraftMentions] = useState<Mention[]>([]);
  const [caret, setCaret] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const supervisor = isSupervisorSession(session);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await listConversations({ userId: session.id });
        if (cancelled) return;
        setTargets(targetsFromConversations(data));
      } catch {
        if (!cancelled) setTargets([]);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, selectedThreadId]);

  const atQuery = useMemo(() => detectAtQuery(draft, caret), [draft, caret]);

  const applyMention = (mention: Mention) => {
    const next = insertMentionAt(draft, caret, mention);
    setDraft(next.text);
    setCaret(next.caret);
    setDraftMentions((prev) => {
      const exists = prev.some(
        (m) => m.type === mention.type && m.targetId === mention.targetId,
      );
      return exists ? prev : [...prev, mention];
    });
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(next.caret, next.caret);
    });
  };

  const handleSend = () => {
    const ok = send(draft, draftMentions);
    if (ok) {
      setDraft("");
      setDraftMentions([]);
      setCaret(0);
    }
  };

  const openCase = (conversationId: string) => {
    void navigate({
      to: "/bandeja",
      search: { conversationId },
    });
  };

  if (!session) return null;

  return (
    <>
      <section className="grid grid-cols-12 gap-6 min-h-[680px] animate-fade-up">
        <div className="col-span-12 lg:col-span-4 bg-card border border-border rounded-xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border bg-background/60">
            <h3 className="text-xs font-extrabold uppercase tracking-widest">
              Agentes
            </h3>
            <p className="text-[10px] text-muted-foreground mt-1">
              Chat interno 1:1 · no visible para el cliente
            </p>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {peers.map((peer) => {
              const existing = threads.find((t) => t.peerId === peer.id);
              const active = existing?.thread.id === selectedThreadId;
              return (
                <button
                  key={peer.id}
                  type="button"
                  onClick={() => openThreadWith(peer.id)}
                  className={`w-full text-left p-4 hover:bg-muted/40 transition-colors ${
                    active ? "bg-muted/60" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-foreground/10 grid place-items-center text-xs font-bold">
                      {peer.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between gap-2">
                        <p className="text-sm font-semibold truncate">{peer.name}</p>
                        {existing && (
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {relativeTime(existing.thread.updatedAt)}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {existing?.preview ?? "Iniciar conversación"}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 bg-card border border-border rounded-xl flex flex-col overflow-hidden min-h-[520px]">
          <div className="p-4 border-b border-border bg-background/60 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold">
                {selectedThread?.peerName ?? "Selecciona un agente"}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Mensajería interna · usa @ para mencionar un caso
              </p>
            </div>
            {supervisor && (
              <button
                type="button"
                onClick={() => onMentionsOpenChange(true)}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide hover:bg-muted"
              >
                <AtSign className="h-3.5 w-3.5" />
                Menciones
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
            {!selectedThreadId && (
              <p className="text-sm text-muted-foreground text-center mt-16">
                Elige un compañero para chatear. Estas notas nunca llegan al cliente.
              </p>
            )}
            {messages.map((m) => {
              const mine = m.authorId === session.id;
              const author = directory.find((u) => u.id === m.authorId);
              return (
                <div
                  key={m.id}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm ${
                      mine
                        ? "bg-sky-600 text-white rounded-br-md"
                        : "bg-background border border-border rounded-bl-md"
                    }`}
                  >
                    {!mine && (
                      <p className="text-[10px] font-bold mb-1 opacity-70">
                        {author?.name ?? m.authorId}
                      </p>
                    )}
                    <div className={mine ? "[&_button]:text-white [&_button]:bg-white/20 [&_button:hover]:bg-white/30 [&_.text-sky-700]:text-sky-100 [&_.text-sky-800]:text-white" : ""}>
                      <MessageBodyWithMentions
                        body={m.body}
                        mentions={m.mentions}
                        targets={targets}
                        onOpenConversation={openCase}
                      />
                    </div>
                    <p
                      className={`text-[10px] mt-1 ${
                        mine ? "text-white/70" : "text-muted-foreground"
                      }`}
                    >
                      {new Date(m.createdAt).toLocaleTimeString("es-CO", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          <div className="p-3 border-t border-border relative">
            <MentionPicker
              open={Boolean(selectedThreadId && atQuery)}
              query={atQuery?.query ?? ""}
              targets={targets}
              onSelect={applyMention}
            />
            <div className="flex gap-2">
              <input
                ref={inputRef}
                disabled={!selectedThreadId}
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  setCaret(e.target.selectionStart ?? e.target.value.length);
                }}
                onSelect={(e) => {
                  const el = e.currentTarget;
                  setCaret(el.selectionStart ?? 0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape" && atQuery) {
                    e.preventDefault();
                    setDraft((d) => d);
                    return;
                  }
                  if (e.key === "Enter" && !e.shiftKey) {
                    if (atQuery) return;
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={
                  selectedThreadId
                    ? "Escribe un mensaje… usa @ para mencionar un caso"
                    : "Selecciona un agente"
                }
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/30 disabled:opacity-50"
              />
              <button
                type="button"
                disabled={!selectedThreadId || !draft.trim()}
                onClick={handleSend}
                className="inline-flex items-center justify-center rounded-lg bg-sky-600 text-white px-3 py-2 disabled:opacity-40 hover:bg-sky-700"
                aria-label="Enviar"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {supervisor && (
        <MentionsPanel
          open={mentionsOpen}
          onOpenChange={onMentionsOpenChange}
          targets={targets}
          recent={recentMentions}
          selfId={session.id}
          directory={directory}
          onInsertMention={(mention) => {
            if (!selectedThreadId) {
              toast.message("Abre un chat con un agente e inserta la mención");
              return;
            }
            applyMention(mention);
          }}
          onOpenCase={openCase}
          onOpenThread={(threadId) => {
            setSelectedThreadId(threadId);
            onMentionsOpenChange(false);
          }}
        />
      )}
    </>
  );
}
