import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCheck,
  LogOut,
  MessageCircle,
  MoreVertical,
  Paperclip,
  Phone,
  Search,
  Send,
  Smile,
  Video,
} from "lucide-react";
import {
  listConversationsFn,
  listMessagesFn,
  sendWhatsAppReplyFn,
  simulateInboundMessageFn,
} from "@/adapters/http/server-fns";
import type { ConversationDto, MessageDto } from "@/adapters/http/dto";
import { relativeTime } from "@/hooks/use-operational-inbox";
import { useSession } from "@/lib/auth";
import { unlinkWhatsApp, type WaLinkedSession } from "@/lib/whatsapp-link";
import { toast } from "sonner";

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function formatClock(iso: string) {
  return new Date(iso).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function WhatsAppChatShell({
  link,
  cloudMode = false,
}: {
  link: WaLinkedSession;
  cloudMode?: boolean;
}) {
  const session = useSession();
  const [conversations, setConversations] = useState<ConversationDto[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const selectedIdRef = useRef<string | null>(null);
  const messageCountRef = useRef(0);

  selectedIdRef.current = selectedId;

  const selected = useMemo(
    () => conversations.find((c) => c.id === selectedId) ?? null,
    [conversations, selectedId],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) =>
        (c.customerName ?? "").toLowerCase().includes(q) ||
        c.waPhone.toLowerCase().includes(q) ||
        (c.lastMessagePreview ?? "").toLowerCase().includes(q),
    );
  }, [conversations, query]);

  const reload = async (opts?: { silent?: boolean }) => {
    if (!session) return;
    const data = await listConversationsFn({ data: { userId: session.id } });
    setConversations(data);

    const prevId = selectedIdRef.current;
    const nextId =
      prevId && data.some((c) => c.id === prevId) ? prevId : (data[0]?.id ?? null);
    setSelectedId(nextId);

    if (!nextId) {
      setMessages([]);
      messageCountRef.current = 0;
      return;
    }

    const msgs = await listMessagesFn({ data: { conversationId: nextId } });
    setMessages(msgs);
    if (!opts?.silent && msgs.length > messageCountRef.current) {
      // scroll handled by effect when count grows
    }
    messageCountRef.current = msgs.length;
  };

  useEffect(() => {
    void reload().catch((e) =>
      toast.error(e instanceof Error ? e.message : "Error cargando chats WA"),
    );
    if (!cloudMode) return;
    const id = window.setInterval(() => {
      void reload({ silent: true }).catch(() => undefined);
    }, 2500);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id, cloudMode]);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      messageCountRef.current = 0;
      return;
    }
    let cancelled = false;
    void listMessagesFn({ data: { conversationId: selectedId } }).then((msgs) => {
      if (cancelled) return;
      setMessages(msgs);
      messageCountRef.current = msgs.length;
    });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, selectedId]);

  const simulateIncoming = async () => {
    if (!session) return;
    setBusy(true);
    try {
      await simulateInboundMessageFn({
        data: {
          userId: session.id,
          body: "Hola, acabo de escribir por WhatsApp. ¿Me ayudan?",
        },
      });
      toast.success("Mensaje entrante simulado");
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo simular mensaje");
    } finally {
      setBusy(false);
    }
  };

  const sendLocal = async () => {
    if (!draft.trim() || !selectedId || !session) return;
    const body = draft.trim();
    setDraft("");
    setBusy(true);
    try {
      if (cloudMode) {
        const result = await sendWhatsAppReplyFn({
          data: {
            conversationId: selectedId,
            agentUserId: session.id,
            body,
          },
        });
        setMessages((prev) => [...prev, result.message]);
        toast.success("Enviado por Cloud API");
        await reload();
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `local_${Date.now()}`,
            conversationId: selectedId,
            direction: "outbound",
            author: "agent",
            body,
            createdAt: new Date().toISOString(),
          },
        ]);
        toast.message("Respuesta mock enviada (Meta pendiente)");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo enviar");
      setDraft(body);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="h-[760px] rounded-xl overflow-hidden border border-[#d1d7db] shadow-sm flex flex-col bg-[#111b21]">
      {/* Top linked bar */}
      <div className="h-12 bg-[#202c33] text-[#e9edef] flex items-center justify-between px-4 text-xs shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="size-2 rounded-full bg-[#00a884] animate-pulse" />
          <span className="font-semibold truncate">
            {link.displayName} · {link.phoneNumber}
          </span>
          <span className="text-[#8696a0] hidden sm:inline">
            vinculado · {link.deviceName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void simulateIncoming()}
            className="px-3 py-1.5 rounded-md bg-[#00a884] text-white font-semibold hover:bg-[#008f72] disabled:opacity-50"
          >
            {cloudMode ? "Inyectar prueba local" : "Simular mensaje entrante"}
          </button>
          {!cloudMode && (
            <button
              type="button"
              onClick={() => unlinkWhatsApp()}
              className="px-3 py-1.5 rounded-md border border-[#3b4a54] text-[#e9edef] font-semibold hover:bg-[#2a3942] inline-flex items-center gap-1"
            >
              <LogOut className="size-3.5" />
              Desvincular
            </button>
          )}
          {cloudMode && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void reload()}
              className="px-3 py-1.5 rounded-md border border-[#3b4a54] text-[#e9edef] font-semibold hover:bg-[#2a3942]"
            >
              Actualizar
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 min-h-0">
        {/* Chat list */}
        <aside className="col-span-12 md:col-span-4 bg-[#111b21] border-r border-[#2a3942] flex flex-col min-h-0">
          <div className="h-14 bg-[#202c33] flex items-center gap-3 px-3 shrink-0">
            <div className="size-9 rounded-full bg-[#6a7175] text-white grid place-items-center text-xs font-bold">
              {session?.initials ?? "WA"}
            </div>
            <div className="flex-1" />
            <MessageCircle className="size-5 text-[#aebac1]" />
            <MoreVertical className="size-5 text-[#aebac1]" />
          </div>
          <div className="px-3 py-2 bg-[#111b21] shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#8696a0]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar o empezar un chat nuevo"
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#202c33] text-[#e9edef] text-xs outline-none placeholder:text-[#8696a0]"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.map((c) => {
              const active = c.id === selectedId;
              const title = c.customerName ?? c.waPhone;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedId(c.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 text-left border-b border-[#222d34] ${
                    active ? "bg-[#2a3942]" : "hover:bg-[#202c33]"
                  }`}
                >
                  <div className="size-11 rounded-full bg-[#6b7c85] text-white grid place-items-center text-xs font-bold shrink-0">
                    {initials(title)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-2">
                      <p className="text-sm text-[#e9edef] font-medium truncate">{title}</p>
                      <span className="text-[10px] text-[#8696a0] shrink-0">
                        {relativeTime(c.updatedAt)}
                      </span>
                    </div>
                    <p className="text-xs text-[#8696a0] truncate mt-0.5">
                      {c.lastMessagePreview}
                    </p>
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="p-6 text-xs text-[#8696a0] text-center">
                No hay conversaciones en tu cola.
              </p>
            )}
          </div>
        </aside>

        {/* Thread */}
        <section className="col-span-12 md:col-span-8 flex flex-col min-h-0 bg-[#0b141a]">
          {selected ? (
            <>
              <div className="h-14 bg-[#202c33] flex items-center gap-3 px-4 shrink-0">
                <div className="size-10 rounded-full bg-[#6b7c85] text-white grid place-items-center text-xs font-bold">
                  {initials(selected.customerName ?? selected.waPhone)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-[#e9edef] font-medium truncate">
                    {selected.customerName ?? selected.waPhone}
                  </p>
                  <p className="text-[11px] text-[#8696a0] truncate">
                    {selected.waPhone}
                    {selected.contractId ? ` · Contrato #${selected.contractId}` : ""}
                  </p>
                </div>
                <Video className="size-5 text-[#aebac1]" />
                <Phone className="size-5 text-[#aebac1]" />
                <Search className="size-5 text-[#aebac1]" />
                <MoreVertical className="size-5 text-[#aebac1]" />
              </div>

              <div
                className="flex-1 overflow-y-auto px-4 md:px-10 py-4 space-y-2"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
                  backgroundColor: "#0b141a",
                }}
              >
                {messages.map((m) => {
                  const mine = m.author !== "customer";
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[75%] rounded-lg px-2.5 py-1.5 text-[13px] leading-snug shadow ${
                          mine
                            ? "bg-[#005c4b] text-[#e9edef] rounded-tr-none"
                            : "bg-[#202c33] text-[#e9edef] rounded-tl-none"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{m.body}</p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className="text-[10px] text-[#ffffff99]">
                            {formatClock(m.createdAt)}
                          </span>
                          {mine && <CheckCheck className="size-3.5 text-[#53bdeb]" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <div className="h-16 bg-[#202c33] flex items-center gap-2 px-3 shrink-0">
                <Smile className="size-6 text-[#8696a0]" />
                <Paperclip className="size-6 text-[#8696a0]" />
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void sendLocal();
                  }}
                  placeholder={
                    cloudMode
                      ? "Escribe un mensaje (se envía por Cloud API)"
                      : "Escribe un mensaje"
                  }
                  className="flex-1 mx-1 px-4 py-2.5 rounded-lg bg-[#2a3942] text-[#e9edef] text-sm outline-none placeholder:text-[#8696a0]"
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void sendLocal()}
                  className="size-10 rounded-full bg-[#00a884] text-white grid place-items-center hover:bg-[#008f72] disabled:opacity-50"
                >
                  <Send className="size-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 grid place-items-center text-center px-8">
              <div>
                <div className="mx-auto size-16 rounded-full bg-[#202c33] grid place-items-center mb-4">
                  <MessageCircle className="size-8 text-[#00a884]" />
                </div>
                <h3 className="text-2xl font-light text-[#e9edef]">WhatsApp NetOps</h3>
                <p className="text-sm text-[#8696a0] mt-2 max-w-md">
                  Línea vinculada. Selecciona un chat o simula un mensaje entrante para probar el
                  flujo.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
