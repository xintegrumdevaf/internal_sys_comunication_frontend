import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AtSign, Send, ArrowLeft } from "lucide-react";
import { listConversations } from "@/modules/conversations/infrastructure/conversation.gateway";
import { MentionPicker } from "@/modules/internal-chat/ui/MentionPicker";
import { MentionsPanel } from "@/modules/internal-chat/ui/MentionsPanel";
import { MessageBodyWithMentions } from "@/modules/internal-chat/ui/MessageBodyWithMentions";
import { QualityQuoteCard } from "@/modules/internal-chat/ui/QualityQuoteCard";
import { useInternalChat } from "@/modules/internal-chat/application/use-internal-chat";
import { relativeTime } from "@/shared/datetime";
import { isSupervisorSession } from "@/modules/identity/application/access-control";
import { useDirectoryUsers } from "@/modules/identity/application/use-session";
import { detectAtQuery, insertMentionAt } from "@/modules/internal-chat/domain/mention-parser";
import { targetsFromConversations } from "@/modules/internal-chat/application/build-mention-targets";
import {
  qualityFindingsChatMessage,
  qualityReviewMessageMarker,
} from "@/modules/internal-chat/domain/deep-link";
import type { Mention, MentionTarget } from "@/modules/internal-chat/domain/internal-chat";
import { getQualityReview } from "@/modules/quality/infrastructure/quality.gateway";
import { toast } from "sonner";

export function InternalChatShell({
  mentionsOpen,
  onMentionsOpenChange,
  initialThreadId,
  initialPeerId,
  initialQualityReviewId,
}: {
  mentionsOpen: boolean;
  onMentionsOpenChange: (open: boolean) => void;
  /** Deep-link a hilo específico o desde /calidad */
  initialThreadId?: string;
  initialPeerId?: string;
  initialQualityReviewId?: string;
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
    openThreadWith,
    send,
  } = useInternalChat(initialThreadId);

  const [targets, setTargets] = useState<MentionTarget[]>([]);
  const [draft, setDraft] = useState("");
  const [draftMentions, setDraftMentions] = useState<Mention[]>([]);
  const [caret, setCaret] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const deepLinkApplied = useRef(false);

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
  }, [session?.id]);

  // Deep-link calidad → abrir o crear hilo y opcionalmente enviar mensaje de briefing
  useEffect(() => {
    if (!session || deepLinkApplied.current) return;
    if (initialThreadId) {
      setSelectedThreadId(initialThreadId);
      deepLinkApplied.current = true;
      return;
    }
    if (!initialPeerId && !initialQualityReviewId) return;
    deepLinkApplied.current = true;

    void (async () => {
      try {
        let peerId = initialPeerId;
        let review = null as Awaited<ReturnType<typeof getQualityReview>> | null;

        if (initialQualityReviewId) {
          review = await getQualityReview(initialQualityReviewId);
          peerId = peerId || review.agentId;
        }

        if (!peerId) return;
        const thread = await openThreadWith(peerId, initialQualityReviewId);
        if (!thread) return;

        setDraft("");

        if (!review) return;

        const marker = qualityReviewMessageMarker(review.id);
        const already = messages.some((m) => m.body.includes(marker));
        if (already) return;

        await send(qualityFindingsChatMessage(review), [], "text");
        toast.success("Hallazgos publicados en el chat con el agente");
      } catch {
        toast.error("No se pudo publicar el briefing de calidad en el chat");
      }
    })();
  }, [
    session,
    initialThreadId,
    initialPeerId,
    initialQualityReviewId,
    openThreadWith,
    messages,
    send,
    setSelectedThreadId,
  ]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, selectedThreadId]);

  const atQuery = useMemo(() => detectAtQuery(draft, caret), [draft, caret]);

  const applyMention = (mention: Mention) => {
    const next = insertMentionAt(draft, caret, mention);
    setDraft(next.text);
    setCaret(next.caret);
    setDraftMentions((prev) => {
      const exists = prev.some((m) => m.type === mention.type && m.targetId === mention.targetId);
      return exists ? prev : [...prev, mention];
    });
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(next.caret, next.caret);
    });
  };

  const handleSend = async () => {
    const ok = await send(draft, draftMentions, "text");
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
    <div className="w-full h-full flex-1 flex flex-col animate-fade-up">
      <section className="grid grid-cols-12 gap-6 min-h-[560px] flex-1">
        <div
          className={`col-span-12 lg:col-span-4 bg-card border border-border rounded-xl flex flex-col overflow-hidden shadow-xs ${
            selectedThreadId ? "hidden lg:flex" : "flex"
          }`}
        >
          <div className="p-4 border-b border-border bg-background/60">
            <h3 className="text-xs font-extrabold uppercase tracking-widest">Agentes</h3>
            <p className="text-[10px] text-muted-foreground mt-1">
              Chat interno 1:1 · no visible para el cliente
            </p>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {peers.map((peer) => {
              const existing = threads.find((t) => t.peerId === peer.id);
              const active = existing?.thread.id === selectedThreadId;
              const unread = existing?.unreadCount ?? 0;
              return (
                <button
                  key={peer.id}
                  type="button"
                  onClick={() => void openThreadWith(peer.id)}
                  className={`w-full text-left p-4 hover:bg-foreground/5 transition-colors ${
                    active ? "bg-primary/5 border-l-4 border-primary" : "border-l-4 border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative h-9 w-9 rounded-full bg-primary/15 text-primary grid place-items-center text-xs font-bold shrink-0">
                      {peer.initials}
                      {unread > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-extrabold text-primary-foreground shadow-xs">
                          {unread}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-center gap-2">
                        <p className="text-sm font-semibold truncate">{peer.name}</p>
                        {existing && (
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {relativeTime(existing.thread.updatedAt)}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {existing?.preview ?? "Iniciar conversación"}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div
          className={`col-span-12 lg:col-span-8 bg-card border border-border rounded-xl flex flex-col overflow-hidden min-h-[520px] shadow-xs ${
            selectedThreadId ? "flex" : "hidden lg:flex"
          }`}
        >
          <div className="p-4 border-b border-border bg-background/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => setSelectedThreadId(null)}
                className="lg:hidden p-1.5 -ml-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/5 shrink-0"
                aria-label="Volver a la lista de agentes"
              >
                <ArrowLeft className="size-4" />
              </button>
              <div className="min-w-0">
                <h3 className="text-sm font-bold truncate">
                  {selectedThread?.peerName ?? "Selecciona un agente"}
                </h3>
                <p className="text-[11px] text-muted-foreground truncate">
                  Mensajería interna · usa @ para mencionar un caso
                </p>
              </div>
            </div>
            {supervisor && (
              <button
                type="button"
                onClick={() => onMentionsOpenChange(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide hover:bg-foreground/5 shrink-0"
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
              const senderId = m.senderAgentId || (m as { authorId?: string }).authorId || "";
              const mine = senderId === session.id;
              const author = directory.find((u) => u.id === senderId);
              const senderName = m.senderAgentName || author?.name || senderId;
              const isQualityQuote = m.type === "quality_quote";
              const isQualityBrief = !isQualityQuote && m.body?.includes("[[quality-review:");
              const displayBody = m.body?.replace(/\[\[quality-review:[^\]]+\]\]\n?/g, "") ?? "";

              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-xs whitespace-pre-wrap ${
                      isQualityQuote
                        ? "bg-card border border-border text-foreground"
                        : isQualityBrief
                          ? "bg-amber-50 border border-amber-200 text-foreground rounded-br-xs dark:bg-amber-950/40 dark:border-amber-800"
                          : mine
                            ? "bg-[var(--chat-out-bg)] text-[var(--chat-out-fg)] rounded-br-xs"
                            : "bg-[var(--chat-in-bg)] text-[var(--chat-in-fg)] border border-border/70 rounded-bl-xs"
                    }`}
                  >
                    {!mine && (
                      <p className="text-[10px] font-bold mb-1 opacity-70">
                        {senderName}
                      </p>
                    )}

                    {isQualityQuote ? (
                      <QualityQuoteCard
                        message={m}
                        onNavigateToAudit={(reviewId) => {
                          void navigate({
                            to: "/calidad",
                            search: { reviewId },
                          });
                        }}
                      />
                    ) : (
                      <>
                        {isQualityBrief && (
                          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-800 dark:text-amber-200 mb-2">
                            Briefing de calidad
                          </p>
                        )}
                        <div
                          className={
                            mine && !isQualityBrief
                              ? "[&_button]:text-primary-foreground [&_button]:bg-primary/20 [&_button:hover]:bg-primary/30 [&_.text-sky-700]:text-primary [&_.text-sky-800]:text-primary"
                              : ""
                          }
                        >
                          <MessageBodyWithMentions
                            body={displayBody}
                            mentions={(m as { mentions?: Mention[] }).mentions ?? []}
                            targets={targets}
                            onOpenConversation={openCase}
                          />
                        </div>
                      </>
                    )}

                    <p
                      className={`text-[10px] mt-1 ${
                        mine && !isQualityBrief && !isQualityQuote
                          ? "text-emerald-800/80 dark:text-emerald-200/80 text-right"
                          : "text-muted-foreground"
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

          <div className="p-3 border-t border-border bg-card relative">
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
                    void handleSend();
                  }
                }}
                placeholder={
                  selectedThreadId
                    ? "Escribe un mensaje… usa @ para mencionar un caso"
                    : "Selecciona un agente"
                }
                className="flex-1 rounded-xl border border-border bg-background px-3.5 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 font-medium"
              />
              <button
                type="button"
                disabled={!selectedThreadId || !draft.trim()}
                onClick={() => void handleSend()}
                className="inline-flex items-center justify-center size-9 rounded-xl bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors shadow-xs cursor-pointer"
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
          recent={[]}
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
    </div>
  );
}
