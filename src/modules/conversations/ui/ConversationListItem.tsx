import { Bot, CheckCheck, Clock, User } from "lucide-react";
import type { ConversationDto } from "@/modules/conversations/domain/conversation";
import {
  conversationDisplayName,
  conversationStatusLabel,
  formatWaPhone,
} from "@/modules/conversations/domain/conversation";
import { calculateConversationSla } from "@/modules/sla/domain/sla-config";
import type { SlaConfigDto } from "@/modules/sla/domain/sla-config";
import type { CaseDto } from "@/modules/cases/domain/case";
import { extractSchedulingMetadata } from "@/modules/cases/domain/case";
import type { DepartmentDto } from "@/modules/identity/domain/department";
import type { SessionUser } from "@/modules/identity/domain/session";
import { formatConversationTimestamp } from "@/shared/datetime";
import { ConversationAvatar } from "./ConversationAvatars";

export interface ConversationListItemProps {
  conversation: ConversationDto;
  active: boolean;
  onSelect: (id: string) => void;
  selectedCustomerId?: string | null;
  selectedCustomerFullName?: string | null;
  activeCase?: CaseDto | null;
  slaConfig: SlaConfigDto;
  session: SessionUser | null;
  directory: SessionUser[];
  departments: DepartmentDto[];
}

function formatLastMessagePreview(
  preview: ConversationDto["lastMessagePreview"] | null | undefined,
): string {
  if (!preview) return "Sin mensajes";
  const body = preview.body?.trim() ?? "";
  if (!body) return "Sin mensajes";
  return body;
}

export function ConversationListItem({
  conversation: c,
  active,
  onSelect,
  selectedCustomerId,
  selectedCustomerFullName,
  activeCase,
  slaConfig,
  session,
  directory,
  departments,
}: ConversationListItemProps) {
  const sla = calculateConversationSla(c, slaConfig);
  const hasUnread = (c.unreadCount ?? 0) > 0;

  return (
    <button
      type="button"
      data-conversation-id={c.id}
      onClick={() => onSelect(c.id)}
      className={`w-full text-left p-3.5 transition-colors flex gap-3 cursor-pointer ${
        active
          ? "bg-primary/5 border-l-4 border-primary"
          : sla.isBreached
            ? "bg-danger/5 hover:bg-danger/10 border-l-4 border-danger"
            : "hover:bg-foreground/5 border-l-4 border-transparent"
      }`}
    >
      <div className="relative shrink-0">
        <ConversationAvatar
          conversation={
            c.id === selectedCustomerId && selectedCustomerFullName
              ? { ...c, customerName: selectedCustomerFullName }
              : c
          }
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex justify-between items-start gap-2">
          <span
            className={`text-sm truncate ${
              hasUnread ? "font-bold text-foreground" : "font-semibold text-foreground/90"
            }`}
          >
            {conversationDisplayName(c)}
          </span>
          <span
            className={`text-[10px] shrink-0 ${
              hasUnread
                ? "text-[#25D366] dark:text-[#25D366] font-semibold"
                : "text-muted-foreground"
            }`}
          >
            {formatConversationTimestamp(c.lastActivityAt)}
          </span>
        </div>
        {c.waProfileName && (
          <p className="text-[10px] text-muted-foreground truncate">{formatWaPhone(c.waPhone)}</p>
        )}
        <div className="flex justify-between items-center gap-2 mt-0.5">
          <p
            className={`text-xs truncate flex items-center ${
              hasUnread ? "text-foreground font-medium" : "text-muted-foreground"
            }`}
          >
            {c.lastMessagePreview?.direction === "outbound" && (
              <CheckCheck className="size-3.5 inline mr-1 text-muted-foreground/70 shrink-0" />
            )}
            <span className="truncate">{formatLastMessagePreview(c.lastMessagePreview)}</span>
          </p>
          {hasUnread && (
            <span className="shrink-0 flex h-5 min-w-[20px] px-1.5 items-center justify-center rounded-full bg-[#25D366] dark:bg-[#00a884] text-white text-[11px] font-bold leading-none shadow-xs">
              {c.unreadCount > 99 ? "99+" : c.unreadCount}
            </span>
          )}
        </div>
        <div className="mt-1.5 flex gap-1.5 flex-wrap items-center">
          {sla.isBreached && (
            <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase rounded flex items-center gap-1 bg-danger/15 text-danger ring-1 ring-danger/30 animate-pulse">
              <Clock className="size-2.5 text-danger" />
              <span>Sin respuesta: {sla.formattedShort}</span>
            </span>
          )}
          {!sla.isBreached && sla.status === "warning" && (
            <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded flex items-center gap-1 bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/30">
              <Clock className="size-2.5 text-amber-500" />
              <span>Espera: {sla.formattedShort}</span>
            </span>
          )}
          {c.status === "pending" || c.activeCase?.status === "WAITING_USER" ? (
            (() => {
              const scheduling = extractSchedulingMetadata(
                c.id === selectedCustomerId ? activeCase : (c.activeCase as unknown as CaseDto),
              );
              const tagLabel = scheduling?.scheduleTag
                ? `En Espera: ${scheduling.scheduleTag}`
                : "En Espera";
              return (
                <span
                  className="px-2 py-0.5 text-[9px] font-extrabold uppercase rounded flex items-center gap-1 bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/30"
                  title={
                    scheduling?.reminderReason ? `Nota: ${scheduling.reminderReason}` : tagLabel
                  }
                >
                  <Clock className="size-2.5 text-amber-500" />
                  <span>{tagLabel}</span>
                </span>
              );
            })()
          ) : (
            <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-foreground/5 text-muted-foreground">
              {conversationStatusLabel(c.status)}
            </span>
          )}
          {c.activeCase ? (
            <>
              {(() => {
                const isHuman =
                  !c.activeCase.automationEnabled ||
                  c.activeCase.status === "HUMAN_ACTIVE" ||
                  c.activeCase.status === "ESCALATED";

                const agentName =
                  c.activeCase.assignedAgentName ||
                  (c.activeCase.assignedAgentId
                    ? c.activeCase.assignedAgentId === session?.id
                      ? "Tú"
                      : directory.find((a) => a.id === c.activeCase?.assignedAgentId)?.name ||
                        "Agente"
                    : null);

                const displayLabel = isHuman
                  ? agentName
                    ? `Humano: ${agentName}`
                    : "Humano (Sin asignar)"
                  : "IA";

                return (
                  <span
                    className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded flex items-center gap-1 max-w-[170px] ${
                      isHuman
                        ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/30"
                        : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30"
                    }`}
                    title={
                      isHuman
                        ? agentName
                          ? `Caso escalado/asignado a: ${agentName}`
                          : "Caso escalado a humano (Sin asignar a agente específico)"
                        : "Asistido por IA"
                    }
                  >
                    {isHuman ? (
                      <>
                        <User className="size-2.5 shrink-0" />
                        <span className="truncate">{displayLabel}</span>
                      </>
                    ) : (
                      <>
                        <Bot className="size-2.5 text-emerald-500 shrink-0" />
                        <span>IA</span>
                      </>
                    )}
                  </span>
                );
              })()}
              {c.activeCase.departmentId && (
                <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 flex items-center gap-1">
                  {departments.find((d) => d.id === c.activeCase!.departmentId)?.name || "Dpto"}
                </span>
              )}
            </>
          ) : c.status === "resolved" || c.status === "closed" ? (
            (() => {
              const attendedName =
                c.lastAttendedBy?.agentName?.trim() ||
                (c.lastAttendedBy?.agentId
                  ? c.lastAttendedBy.agentId === session?.id
                    ? "Tú"
                    : directory.find((a) => a.id === c.lastAttendedBy?.agentId)?.name
                  : null);
              if (!attendedName) return null;
              return (
                <span
                  className="px-2 py-0.5 text-[9px] font-bold uppercase rounded flex items-center gap-1 max-w-[170px] bg-foreground/5 text-muted-foreground ring-1 ring-border"
                  title={`Última persona que atendió este caso: ${attendedName}`}
                >
                  <User className="size-2.5 shrink-0" />
                  <span className="truncate">Atendió: {attendedName}</span>
                </span>
              );
            })()
          ) : (
            <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded flex items-center gap-1 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30">
              <Bot className="size-2.5 text-emerald-500" />
              <span>IA</span>
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
