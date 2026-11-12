import {
  ArrowLeft,
  Bot,
  Edit2,
  FileText,
  Info,
  Lock,
  PanelRightClose,
  ShieldCheck,
  UserCheck,
  X,
} from "lucide-react";
import type { ConversationDto } from "@/modules/conversations/domain/conversation";
import {
  conversationDisplayName,
  formatWaPhone,
} from "@/modules/conversations/domain/conversation";
import type { CaseDto } from "@/modules/cases/domain/case";
import { caseStatusLabel, workflowLabel } from "@/modules/cases/domain/case";
import { describeHumanHandling } from "@/modules/cases/domain/escalation-reason";
import type { CustomerDto } from "@/modules/customers/domain/customer";
import { ConversationAvatar } from "./ConversationAvatars";

export interface ChatHeaderProps {
  selected: ConversationDto;
  selectedCustomer: CustomerDto | null;
  activeCase: CaseDto | null;
  isAutomationActive: boolean;
  isClosedRecord: boolean;
  assignedAgentName: string | null;
  automationDisabledReason?: string | null;
  isAssignedToMe: boolean;
  isAssignedToOther: boolean;
  showClaim: boolean;
  showTakeControl: boolean;
  busy: boolean;
  detailsOpen: boolean;
  mobileDetailsOpen: boolean;
  onBack: () => void;
  onOpenContact: () => void;
  onClaim: () => void;
  onTakeControl: () => void;
  onCloseConversation: () => void;
  onToggleDetails: () => void;
}

export function ChatHeader({
  selected,
  selectedCustomer,
  activeCase,
  isAutomationActive,
  isClosedRecord,
  assignedAgentName,
  automationDisabledReason,
  isAssignedToMe,
  isAssignedToOther,
  showClaim,
  showTakeControl,
  busy,
  detailsOpen,
  mobileDetailsOpen,
  onBack,
  onOpenContact,
  onClaim,
  onTakeControl,
  onCloseConversation,
  onToggleDetails,
}: ChatHeaderProps) {
  return (
    <div className="p-2 sm:p-3 border-b border-border bg-background/60 flex flex-wrap items-center gap-x-2 gap-y-1.5 shrink-0 min-w-0 max-w-full">
      <div className="flex items-center gap-2 min-w-0 flex-1 basis-full @min-[24rem]/chat:basis-[12rem]">
        <button
          type="button"
          onClick={onBack}
          className="lg:hidden p-1.5 -ml-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/5 shrink-0"
          aria-label="Volver a la lista de conversaciones"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div className="relative shrink-0">
          <ConversationAvatar conversation={selected} size="size-8 sm:size-9" />
          {isAutomationActive && !isClosedRecord && (
            <span className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 text-white rounded-full p-0.5 ring-2 ring-background">
              <Bot className="size-2 sm:size-2.5" />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <p className="text-xs sm:text-sm font-bold truncate min-w-0">
              {selectedCustomer?.fullName || conversationDisplayName(selected)}
            </p>
            <button
              type="button"
              onClick={onOpenContact}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold text-muted-foreground hover:text-primary bg-muted/70 hover:bg-primary/10 border border-border transition cursor-pointer shrink-0"
              title="Editar datos del contacto (Nombre, cédula, contratos ISP, etiquetas)"
            >
              <Edit2 className="size-2.5 text-primary" />
              <span className="hidden @min-[32rem]/chat:inline">Editar contacto</span>
            </button>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-muted-foreground min-w-0 overflow-hidden">
            <span className="truncate min-w-0">
              {[
                selected.waProfileName ? formatWaPhone(selected.waPhone) : null,
                !activeCase
                  ? "Sin caso activo"
                  : activeCase.status === "HUMAN_ACTIVE"
                    ? null
                    : caseStatusLabel(activeCase.status),
                activeCase ? workflowLabel(activeCase.workflowType).label : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
            {selectedCustomer?.contracts && selectedCustomer.contracts.length > 0 && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-primary/10 text-primary border border-primary/20 shrink-0 ml-1">
                <FileText className="size-2.5" />
                {selectedCustomer.contracts.length === 1
                  ? "1 contrato"
                  : `${selectedCustomer.contracts.length} contratos`}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-1 min-w-0 max-w-full">
        {isClosedRecord ? (
          (() => {
            const closedName = (activeCase?.context as Record<string, unknown>)?.closedByAgentName
              ? String((activeCase?.context as Record<string, unknown>).closedByAgentName)
              : assignedAgentName;
            return (
              <span
                className="inline-flex items-center gap-1 min-w-0 max-w-full px-2 py-1 rounded-full text-[9px] sm:text-[10px] font-bold bg-foreground/5 text-muted-foreground ring-1 ring-border"
                title={closedName ? `Caso cerrado por: ${closedName}` : "Caso cerrado"}
              >
                <UserCheck className="size-3 sm:size-3.5 shrink-0" />
                <span className="hidden @min-[36rem]/chat:inline truncate min-w-0">
                  {closedName ? `Cerró ${closedName}` : "Sin agente registrado"}
                </span>
                <span className="@min-[36rem]/chat:hidden truncate min-w-0">
                  {closedName ? `Cerró ${closedName}` : "Sin agente"}
                </span>
              </span>
            );
          })()
        ) : !activeCase &&
          (!selected?.activeCase ||
            selected.activeCase.status === "COMPLETED" ||
            selected.activeCase.status === "CANCELLED" ||
            selected.activeCase.status === "EXPIRED") ? (
          <span className="inline-flex items-center gap-1 min-w-0 max-w-full px-2 py-1 rounded-full text-[9px] sm:text-[10px] font-bold bg-primary/10 text-primary ring-1 ring-primary/30">
            <UserCheck className="size-3 sm:size-3.5 shrink-0" />
            <span className="hidden @min-[36rem]/chat:inline truncate min-w-0">
              Atención directa
            </span>
            <span className="@min-[36rem]/chat:hidden truncate min-w-0">Directo</span>
          </span>
        ) : isAutomationActive ? (
          <span className="inline-flex items-center gap-1 min-w-0 max-w-full px-2 py-1 rounded-full text-[9px] sm:text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30">
            <Bot className="size-3 sm:size-3.5 text-emerald-500 animate-pulse shrink-0" />
            <span className="hidden @min-[36rem]/chat:inline truncate min-w-0">Asistente IA</span>
            <span className="@min-[36rem]/chat:hidden truncate min-w-0">IA</span>
            {assignedAgentName && (
              <span className="hidden @min-[42rem]/chat:inline truncate min-w-0 text-emerald-700/70 dark:text-emerald-300/70 font-normal">
                · {isAssignedToMe ? "Tú" : assignedAgentName}
              </span>
            )}
          </span>
        ) : (
          (() => {
            const effectiveStatus = activeCase?.status ?? selected.activeCase?.status;
            const effectiveReason =
              automationDisabledReason ??
              activeCase?.automation?.disabledReason ??
              selected.activeCase?.disabledReason;
            const humanDesc = describeHumanHandling({
              status: effectiveStatus,
              assignedAgentName: isAssignedToMe ? "Tú" : assignedAgentName,
              disabledReason: effectiveReason,
            });
            const pillToneCls =
              humanDesc.tone === "danger"
                ? "bg-red-500/10 text-red-600 dark:text-red-400 ring-1 ring-red-500/30"
                : humanDesc.tone === "warning"
                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/30"
                  : isAssignedToMe
                    ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                    : "bg-foreground/5 text-muted-foreground ring-1 ring-border";

            return (
              <span
                className={`inline-flex items-center gap-1 min-w-0 max-w-full px-2 py-1 rounded-full text-[9px] sm:text-[10px] font-bold ${pillToneCls}`}
                title={
                  isAssignedToOther
                    ? `${humanDesc.detail} (Solo esta persona puede responder)`
                    : humanDesc.detail
                }
              >
                {isAssignedToMe ? (
                  <UserCheck className="size-3 sm:size-3.5 shrink-0" />
                ) : (
                  <Lock className="size-2.5 sm:size-3 shrink-0" />
                )}
                <span className="truncate min-w-0">{humanDesc.badgeLabel}</span>
              </span>
            );
          })()
        )}
        {showClaim && (
          <button
            type="button"
            disabled={busy}
            onClick={onClaim}
            className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] px-2 py-1 rounded-full bg-warning text-white font-bold shadow-sm hover:brightness-95 transition disabled:opacity-40 shrink-0"
          >
            <ShieldCheck className="size-3 sm:size-3.5" />
            <span className="hidden @min-[36rem]/chat:inline">Reclamar caso</span>
            <span className="@min-[36rem]/chat:hidden">Reclamar</span>
          </button>
        )}
        {showTakeControl && (
          <button
            type="button"
            disabled={busy}
            onClick={onTakeControl}
            className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] px-2 py-1 rounded-full border border-border font-bold hover:bg-foreground/5 transition disabled:opacity-40 shrink-0"
          >
            <UserCheck className="size-3 sm:size-3.5" />
            <span className="hidden @min-[36rem]/chat:inline">Tomar control</span>
            <span className="@min-[36rem]/chat:hidden">Control</span>
          </button>
        )}
        {!activeCase &&
          (!selected.activeCase ||
            selected.activeCase.status === "COMPLETED" ||
            selected.activeCase.status === "CANCELLED" ||
            selected.activeCase.status === "EXPIRED") &&
          (selected.status === "open" || selected.status === "pending") && (
            <button
              type="button"
              disabled={busy}
              onClick={onCloseConversation}
              title="Cerrar la conversación y sacarla de abiertas"
              className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] px-2 py-1 rounded-full border border-border font-bold hover:bg-foreground/5 transition disabled:opacity-40 shrink-0"
            >
              <X className="size-3 sm:size-3.5" />
              Cerrar
            </button>
          )}
        <button
          type="button"
          onClick={onToggleDetails}
          title={
            detailsOpen || mobileDetailsOpen
              ? "Ocultar los datos del cliente y del caso"
              : "Ver los datos del cliente y del caso"
          }
          className={`inline-flex items-center gap-1 text-[10px] sm:text-[11px] px-2 py-1 rounded-full font-bold transition cursor-pointer shrink-0 ${
            detailsOpen || mobileDetailsOpen
              ? "bg-primary text-primary-foreground shadow-sm hover:brightness-95"
              : "border border-border hover:bg-foreground/5"
          }`}
        >
          {detailsOpen ? (
            <PanelRightClose className="size-3 sm:size-3.5" />
          ) : (
            <Info className="size-3 sm:size-3.5" />
          )}
          <span className="hidden @min-[40rem]/chat:inline">Detalles</span>
          {activeCase && <span className="size-1.5 rounded-full bg-primary" />}
        </button>
      </div>
    </div>
  );
}
