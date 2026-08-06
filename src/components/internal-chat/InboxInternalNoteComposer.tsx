import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { MessagesSquare, Send } from "lucide-react";
import type { ConversationDto } from "@/adapters/http/dto";
import { isSupervisorSession, useDirectoryUsers, useSession } from "@/lib/auth";
import { mentionMarker } from "@/lib/internal-chat-mentions";
import type { Mention } from "@/lib/internal-chat-types";
import { getOrCreateThread, sendInternalMessage } from "@/lib/internal-chat-store";
import { toast } from "sonner";

function mentionFromConversation(c: ConversationDto): Mention {
  const label = `${c.customerName ?? c.waPhone}${
    c.contractId ? ` — Contrato #${c.contractId}` : ""
  }`;
  return {
    type: "conversation",
    targetId: c.id,
    label,
  };
}

export function InboxInternalNoteComposer({
  conversation,
}: {
  conversation: ConversationDto;
}) {
  const session = useSession();
  const directory = useDirectoryUsers();
  const navigate = useNavigate();
  const supervisor = isSupervisorSession(session);

  const peers = useMemo(
    () => directory.filter((u) => u.active && u.id !== session?.id),
    [directory, session?.id],
  );

  const defaultPeerId = useMemo(() => {
    if (conversation.assigneeId && peers.some((p) => p.id === conversation.assigneeId)) {
      return conversation.assigneeId;
    }
    return peers[0]?.id ?? "";
  }, [conversation.assigneeId, peers]);

  const [peerId, setPeerId] = useState(defaultPeerId);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setPeerId(defaultPeerId);
    setNote("");
  }, [conversation.id, defaultPeerId]);

  const effectivePeerId = peers.some((p) => p.id === peerId) ? peerId : defaultPeerId;

  if (!session || !supervisor) return null;

  const mention = mentionFromConversation(conversation);

  const handleSend = () => {
    const text = note.trim();
    if (!text) {
      toast.error("Escribe la nota interna");
      return;
    }
    if (!effectivePeerId) {
      toast.error("Selecciona un agente");
      return;
    }
    setSending(true);
    try {
      const thread = getOrCreateThread(session.id, effectivePeerId);
      const body = `${mentionMarker(mention)} ${text}`;
      sendInternalMessage({
        threadId: thread.id,
        authorId: session.id,
        body,
        mentions: [mention],
      });
      setNote("");
      toast.success("Nota interna enviada (el cliente no la ve)", {
        action: {
          label: "Ver chat",
          onClick: () => {
            void navigate({ to: "/chat-interno" });
          },
        },
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo enviar la nota");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-3 border-t border-amber-500/30 bg-amber-500/5 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <MessagesSquare className="size-3.5 text-amber-800 shrink-0" />
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-amber-900">
            Nota interna · solo staff
          </p>
        </div>
        <Link
          to="/chat-interno"
          className="text-[10px] font-bold text-amber-900/80 hover:underline shrink-0"
        >
          Abrir chat interno
        </Link>
      </div>
      <p className="text-[10px] text-muted-foreground">
        Se menciona automáticamente este caso. No se envía al cliente por WhatsApp.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex max-w-full truncate rounded bg-sky-500/15 px-1.5 py-0.5 text-[11px] font-semibold text-sky-800">
          @{mention.label}
        </span>
        <select
          value={effectivePeerId}
          onChange={(e) => setPeerId(e.target.value)}
          className="text-xs px-2 py-1.5 border border-border rounded bg-card min-w-[10rem]"
          aria-label="Agente destinatario"
        >
          {peers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Ej: la respuesta no explicó el diagnóstico; pedir cédula y validar potencia ONU…"
          className="flex-1 px-3 py-2 bg-card border border-border rounded-md text-xs outline-none focus:ring-2 focus:ring-amber-500/30 resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button
          type="button"
          disabled={sending || !note.trim() || !effectivePeerId}
          onClick={handleSend}
          className="self-end inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-amber-800 text-white text-[11px] font-bold uppercase disabled:opacity-40 hover:bg-amber-900"
        >
          <Send className="size-3.5" />
          Enviar
        </button>
      </div>
    </div>
  );
}
