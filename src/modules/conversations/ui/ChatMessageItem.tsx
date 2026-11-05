import { AlertCircle, AlertTriangle, CheckCheck, Clock, FileText, Info } from "lucide-react";
import type { ConversationDto, MessageDto } from "@/modules/conversations/domain/conversation";
import { conversationDisplayName } from "@/modules/conversations/domain/conversation";
import type { SessionUser } from "@/modules/identity/domain/session";
import { MessageMediaBody } from "./MessageMediaBody";
import { MessageAvatar } from "./ConversationAvatars";
import { formatDeliveryError } from "./delivery-error";

export interface ChatMessageItemProps {
  message: MessageDto;
  conversation: ConversationDto;
  directory: SessionUser[];
  session: SessionUser | null;
  isAssignedToMe: boolean;
  assignedAgentName: string | null;
  showDaySeparator: boolean;
  day: string;
  showSenderLabel: boolean;
  onOpenTemplateModal: () => void;
}

function messageClock(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export function ChatMessageItem({
  message: m,
  conversation: selected,
  directory,
  session,
  isAssignedToMe,
  assignedAgentName,
  showDaySeparator,
  day,
  showSenderLabel,
  onOpenTemplateModal,
}: ChatMessageItemProps) {
  if (m.author === "system") {
    return (
      <div>
        {showDaySeparator && (
          <div className="flex justify-center my-2">
            <span className="px-2.5 py-0.5 rounded-full bg-foreground/5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              {day}
            </span>
          </div>
        )}
        <div className="flex justify-center my-2.5 px-2 min-w-0">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-muted/80 text-muted-foreground text-[11px] font-medium border border-border/60 shadow-xs max-w-full min-w-0 text-center leading-normal">
            <Info className="size-3.5 shrink-0 text-primary" />
            <span className="min-w-0 break-words">{m.body}</span>
            <span className="text-[9px] opacity-70 ml-1 whitespace-nowrap shrink-0">
              {messageClock(m.createdAt)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  const fromCustomer = m.author === "customer";
  const messageAgentName =
    m.agentName ||
    (m.agentId ? directory.find((a) => a.id === m.agentId)?.name : null) ||
    (m.agentId && session && m.agentId === session.id ? session.name || "Tú" : null) ||
    (isAssignedToMe && !m.agentId ? "Tú" : null) ||
    (!m.agentId ? assignedAgentName : null) ||
    "Agente";

  return (
    <div>
      {showDaySeparator && (
        <div className="flex justify-center my-2">
          <span className="px-2.5 py-0.5 rounded-full bg-foreground/5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            {day}
          </span>
        </div>
      )}
      <div
        className={`flex items-end gap-1.5 sm:gap-2 mb-1.5 min-w-0 max-w-full ${fromCustomer ? "justify-start" : "justify-end"}`}
      >
        {fromCustomer && <MessageAvatar author={m.author} conversation={selected} />}
        <div
          className={`min-w-0 max-w-[min(85%,100%)] px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-2xl text-xs leading-relaxed shadow-xs break-words ${
            fromCustomer
              ? "bg-[var(--chat-in-bg)] text-[var(--chat-in-fg)] border border-border/70 rounded-bl-xs"
              : "bg-[var(--chat-out-bg)] text-[var(--chat-out-fg)] rounded-br-xs"
          }`}
        >
          {showSenderLabel && (
            <p
              className={`text-[9px] font-extrabold uppercase tracking-widest mb-1 ${
                fromCustomer ? "text-primary" : "text-emerald-700 dark:text-emerald-300 font-bold"
              }`}
            >
              {fromCustomer
                ? conversationDisplayName(selected)
                : m.author === "agent"
                  ? messageAgentName
                  : "Asistente IA"}
            </p>
          )}
          <MessageMediaBody message={m} />
          <div
            className={`flex items-center justify-end gap-1 mt-1 text-[10px] tabular-nums ${
              fromCustomer
                ? "text-muted-foreground"
                : "text-emerald-800/80 dark:text-emerald-200/80"
            }`}
          >
            {m.editedAt && (
              <span
                className="italic text-[9px] opacity-75 mr-0.5"
                title={`Editado el ${new Date(m.editedAt).toLocaleTimeString()}`}
              >
                (editado)
              </span>
            )}
            <span>{messageClock(m.createdAt)}</span>
            {!fromCustomer &&
              (m.status === "failed" ? (
                <span
                  className="inline-flex items-center gap-1 text-rose-500 font-semibold cursor-help"
                  title={formatDeliveryError(m.errorMessage).detail}
                >
                  <AlertCircle className="size-3.5 text-rose-500 shrink-0" />
                  <span className="text-[9px] font-bold">
                    {formatDeliveryError(m.errorMessage).short}
                  </span>
                </span>
              ) : m.id.startsWith("local:") ? (
                <span title="Enviando…">
                  <Clock className="size-3.5 opacity-70" />
                </span>
              ) : m.status === "delivered" || m.status === "read" ? (
                <CheckCheck className="size-3.5 text-sky-500 dark:text-sky-400" />
              ) : (
                <CheckCheck className="size-3.5 text-sky-500/70 dark:text-sky-400/70" />
              ))}
          </div>
          {!fromCustomer && m.status === "failed" && formatDeliveryError(m.errorMessage).is24h && (
            <div className="mt-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-[11px] flex flex-col gap-1.5 shadow-xs">
              <div className="flex items-center gap-1.5 font-bold text-rose-800 dark:text-rose-200">
                <AlertTriangle className="size-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>Ventana de WhatsApp (24h) cerrada</span>
              </div>
              <p className="text-[10px] text-rose-700/90 dark:text-rose-300/90 leading-relaxed">
                El mensaje no pudo entregarse porque pasaron más de 24h desde el último mensaje del
                cliente. Debes enviar una plantilla aprobada (Template) para reabrir el chat.
              </p>
              <button
                type="button"
                onClick={onOpenTemplateModal}
                className="self-start inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600 text-white font-bold text-[10px] shadow-xs hover:bg-rose-700 transition cursor-pointer"
              >
                <FileText className="size-3" />
                Enviar plantilla aprobada
              </button>
            </div>
          )}
        </div>
        {!fromCustomer && (
          <MessageAvatar
            author={m.author}
            conversation={selected}
            agentName={m.author === "agent" ? messageAgentName : assignedAgentName}
          />
        )}
      </div>
    </div>
  );
}
