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
import type { CustomerDto } from "@/modules/customers/domain/customer";
import { ConversationAvatar } from "./ConversationAvatars";

export interface ChatHeaderProps {
  selected: ConversationDto;
  selectedCustomer: CustomerDto | null;
  activeCase: CaseDto | null;
  isAutomationActive: boolean;
  isClosedRecord: boolean;
  assignedAgentName: string | null;
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
    <div className="p-2.5 sm:p-3.5 border-b border-border bg-background/60 flex items-center justify-between gap-1.5 sm:gap-2 shrink-0">
      <div className="flex items-center gap-2 min-w-0 flex-1">
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
          <div className="flex items-center gap-2">
            <p className="text-xs sm:text-sm font-bold truncate">
              {selectedCustomer?.fullName || conversationDisplayName(selected)}
            </p>
            <button
              type="button"
              onClick={onOpenContact}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold text-muted-foreground hover:text-primary bg-muted/70 hover:bg-primary/10 border border-border transition cursor-pointer shrink-0"
              title="Editar datos del contacto (Nombre, cédula, contratos ISP, etiquetas)"
            >
              <Edit2 className="size-2.5 text-primary" />
              <span className="hidden sm:inline">Editar contacto</span>
              <span className="sm:hidden">Editar</span>
            </button>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-muted-foreground truncate">
            <span className="truncate">
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
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {isClosedRecord ? (
          <span
            className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-foreground/5 text-muted-foreground ring-1 ring-border"
            title="Última persona que atendió este caso"
          >
            <UserCheck className="size-3 sm:size-3.5" />
            <span className="hidden sm:inline truncate max-w-[180px]">
              {assignedAgentName ? `Atendió ${assignedAgentName}` : "Sin agente registrado"}
            </span>
            <span className="sm:hidden truncate max-w-[90px]">
              {assignedAgentName ?? "Sin agente"}
            </span>
          </span>
        ) : !activeCase && !selected?.activeCase ? (
          <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-primary/10 text-primary ring-1 ring-primary/30">
            <UserCheck className="size-3 sm:size-3.5" />
            <span className="hidden sm:inline">Atención directa</span>
            <span className="sm:hidden">Directo</span>
          </span>
        ) : isAutomationActive ? (
          <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30">
            <Bot className="size-3 sm:size-3.5 text-emerald-500 animate-pulse shrink-0" />
            <span className="hidden sm:inline">Asistente IA</span>
            <span className="sm:hidden">IA</span>
            {assignedAgentName && (
              <span className="hidden md:inline text-emerald-700/70 dark:text-emerald-300/70 font-normal">
                · {isAssignedToMe ? "Tú" : assignedAgentName}
              </span>
            )}
          </span>
        ) : (
          <span
            className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-bold ${
              isAssignedToMe
                ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                : "bg-foreground/5 text-muted-foreground ring-1 ring-border"
            }`}
            title={isAssignedToOther ? "Solo esta persona puede responder" : undefined}
          >
            {isAssignedToMe ? (
              <UserCheck className="size-3 sm:size-3.5" />
            ) : (
              <Lock className="size-2.5 sm:size-3" />
            )}
            <span className="hidden sm:inline">
              {isAssignedToMe
                ? "Atención Humana (Tú)"
                : assignedAgentName
                  ? `Atendido por ${assignedAgentName}`
                  : "Atención Humana (Sin asignar)"}
            </span>
            <span className="sm:hidden">
              {isAssignedToMe ? "Tú" : (assignedAgentName ?? "Sin Asignar")}
            </span>
          </span>
        )}
        {showClaim && (
          <button
            type="button"
            disabled={busy}
            onClick={onClaim}
            className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] px-2 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-warning text-white font-bold shadow-sm hover:brightness-95 transition disabled:opacity-40"
          >
            <ShieldCheck className="size-3 sm:size-3.5" />
            <span className="hidden sm:inline">Reclamar caso</span>
            <span className="sm:hidden">Reclamar</span>
          </button>
        )}
        {showTakeControl && (
          <button
            type="button"
            disabled={busy}
            onClick={onTakeControl}
            className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] px-2 sm:px-3.5 py-1 sm:py-1.5 rounded-full border border-border font-bold hover:bg-foreground/5 transition disabled:opacity-40"
          >
            <UserCheck className="size-3 sm:size-3.5" />
            <span className="hidden sm:inline">Tomar control</span>
            <span className="sm:hidden">Control</span>
          </button>
        )}
        {!activeCase &&
          !selected.activeCase &&
          (selected.status === "open" || selected.status === "pending") && (
            <button
              type="button"
              disabled={busy}
              onClick={onCloseConversation}
              title="Cerrar la conversación y sacarla de abiertas"
              className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] px-2 sm:px-3.5 py-1 sm:py-1.5 rounded-full border border-border font-bold hover:bg-foreground/5 transition disabled:opacity-40"
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
          className={`inline-flex items-center gap-1 text-[10px] sm:text-[11px] px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full font-bold transition cursor-pointer ${
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
          <span className="hidden xs:inline">Detalles</span>
          {activeCase && <span className="size-1.5 rounded-full bg-primary" />}
        </button>
      </div>
    </div>
  );
}
