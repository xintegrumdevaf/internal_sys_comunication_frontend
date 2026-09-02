import {
  Bot,
  Search,
  User,
  CheckCheck,
  Wifi,
  WifiOff,
  UserRound,
  Lock,
  ShieldCheck,
  UserCheck,
  PanelRightClose,
  Info,
  ArrowLeft,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { MessageMediaBody } from "@/modules/conversations/ui/MessageMediaBody";
import { InboxInternalNoteComposer } from "@/modules/internal-chat/ui/InboxInternalNoteComposer";
import { CasePanel } from "@/modules/cases/ui/CasePanel";
import { CaseSummaryDialog } from "@/modules/cases/ui/CaseSummaryDialog";
import { caseStatusLabel, workflowLabel } from "@/modules/cases/domain/case";
import {
  conversationDisplayName,
  conversationStatusLabel,
  formatWaPhone,
  type ConversationDto,
  type ConversationStatus,
  type MessageAuthor,
} from "@/modules/conversations/domain/conversation";
import { messageClock, relativeTime, dayLabel } from "@/shared/datetime";
import { avatarColorFromSeed } from "@/shared/avatar-color";
import { useOperationalInbox } from "@/modules/conversations/application/use-operational-inbox";
import {
  useDepartmentsQuery,
  useDirectoryUsers,
  useSession,
} from "@/modules/identity/application/use-session";
import { canAccessDepartment } from "@/modules/identity/application/access-control";
import { useRealtimeConnected } from "@/modules/realtime/application/use-realtime";

type Props = {
  /** Preselecciona un departamento (deep-link desde la campana de notificaciones o el menú lateral). */
  initialDepartmentId?: string;
  initialConversationId?: string | null;
};

const STATUS_TABS: { value: ConversationStatus; label: string }[] = [
  { value: "open", label: "Abiertas" },
  { value: "pending", label: "En espera" },
  { value: "resolved", label: "Resueltas" },
  { value: "closed", label: "Cerradas" },
];

function initialsFromProfileName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (
    parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

/**
 * WhatsApp no permite obtener la foto de perfil vía la API oficial de Meta
 * (restricción de privacidad — aplica a cualquier negocio, no es una
 * limitación nuestra). Mostramos iniciales del nombre real cuando ya lo
 * conocemos; si no, un ícono genérico — nunca una foto inventada.
 */
function ConversationAvatar({
  conversation,
  size = "size-11",
}: {
  conversation: Pick<ConversationDto, "waPhone" | "waProfileName">;
  size?: string;
}) {
  const color = avatarColorFromSeed(conversation.waPhone);
  return (
    <div
      className={`${size} rounded-full grid place-items-center shrink-0 font-bold text-sm ${color.bg} ${color.text}`}
    >
      {conversation.waProfileName ? (
        initialsFromProfileName(conversation.waProfileName)
      ) : (
        <User className="size-1/2" />
      )}
    </div>
  );
}

/**
 * Avatar redondo por mensaje, como en los grupos de WhatsApp: quién habla se
 * identifica por un círculo con su inicial (o un ícono para el asistente),
 * nunca con un ícono suelto metido dentro de la burbuja.
 */
function MessageAvatar({
  author,
  conversation,
  agentName,
}: {
  author: MessageAuthor;
  conversation: Pick<ConversationDto, "waPhone" | "waProfileName">;
  agentName?: string | null;
}) {
  if (author === "customer") {
    return <ConversationAvatar conversation={conversation} size="size-7" />;
  }
  if (author === "agent") {
    return (
      <div className="size-7 rounded-full grid place-items-center shrink-0 bg-primary/15 text-primary font-bold text-[10px]">
        {agentName ? initialsFromProfileName(agentName) : <UserCheck className="size-3.5" />}
      </div>
    );
  }
  return (
    <div className="size-7 rounded-full grid place-items-center shrink-0 bg-emerald-100 text-emerald-700">
      <Bot className="size-3.5" />
    </div>
  );
}

/**
 * Bandeja unificada estilo Chatwoot/Whaticket: departamento y agente son
 * FILTROS dentro de esta pantalla (no rutas separadas) — ver
 * docs/skills/ui-ux-design-principles.md.
 */
export function OperationalInbox({ initialDepartmentId, initialConversationId }: Props) {
  const session = useSession();
  const { data: departments = [] } = useDepartmentsQuery();
  const directory = useDirectoryUsers();

  const [departmentId, setDepartmentId] = useState<string | undefined>(initialDepartmentId);
  const [agentFilter, setAgentFilter] = useState<"all" | "mine" | string>("all");
  const [statusFilter, setStatusFilter] = useState<ConversationStatus>("open");
  const [search, setSearch] = useState("");

  const visibleDepartments = useMemo(
    () => departments.filter((d) => d.active && canAccessDepartment(session, d)),
    [departments, session],
  );

  const agentIdParam =
    agentFilter === "all" ? undefined : agentFilter === "mine" ? session?.id : agentFilter;

  const {
    session: _session,
    conversations,
    selected,
    selectedId,
    setSelectedId,
    messages,
    activeCase,
    automationState,
    caseSummary,
    caseTimeline,
    loadCaseSummary,
    loading,
    busy,
    takeControl,
    claim,
    complete,
    cancel,
    transfer,
    disableAutomation,
    reactivateAutomation,
    sendReply,
  } = useOperationalInbox({
    departmentId,
    agentId: agentIdParam,
    status: statusFilter,
    initialConversationId,
  });

  const connected = useRealtimeConnected();
  const [draft, setDraft] = useState("");
  const [summaryOpen, setSummaryOpen] = useState(false);
  const messagesScrollRef = useRef<HTMLDivElement>(null);

  // Panel de detalles: se abre solo cuando hay un caso con informacion util
  // y se puede plegar a una pestania angosta (como un sidebar) — nunca
  // ocupa espacio mostrando un aviso vacio si no hace falta. El agente
  // igual puede abrirlo/cerrarlo a mano; la eleccion manual se olvida al
  // cambiar de conversacion para que el comportamiento automatico siga
  // siendo predecible.
  const [detailsOverride, setDetailsOverride] = useState<boolean | null>(null);
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false);
  useEffect(() => {
    setDetailsOverride(null);
    setMobileDetailsOpen(false);
  }, [selectedId]);
  const detailsOpen = detailsOverride ?? Boolean(activeCase);

  const filteredConversations = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) =>
        c.waPhone.toLowerCase().includes(q) ||
        (c.lastMessagePreview?.body ?? "").toLowerCase().includes(q),
    );
  }, [conversations, search]);

  const assignedAgentName = useMemo(() => {
    if (activeCase?.assignedAgentName) return activeCase.assignedAgentName;
    if (selected?.activeCase?.assignedAgentName) return selected.activeCase.assignedAgentName;
    const agentId = activeCase?.assignedAgentId || selected?.activeCase?.assignedAgentId;
    if (!agentId) return null;
    if (session && agentId === session.id) return session.name || "Tú";
    return (
      directory.find((a) => a.id === agentId)?.name ??
      (selected?.activeCase?.departmentId ? "Agente de Área" : "Agente Asignado")
    );
  }, [activeCase, selected?.activeCase, directory, session]);

  useEffect(() => {
    setDraft("");
  }, [selectedId]);

  useEffect(() => {
    const el = messagesScrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length, selectedId]);

  const handleSend = async () => {
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    const ok = await sendReply(body);
    if (!ok) setDraft(body);
  };

  const canWriteCase =
    Boolean(session) &&
    (!activeCase ||
      activeCase?.assignedAgentId === session?.id ||
      activeCase?.assignedAgentId == null ||
      session?.role === "manager" ||
      session?.role === "admin");

  const isAssignedToMe = Boolean(
    activeCase?.assignedAgentId && activeCase.assignedAgentId === session?.id,
  );
  const isAssignedToOther = Boolean(
    activeCase?.assignedAgentId && activeCase.assignedAgentId !== session?.id,
  );
  const showClaim =
    Boolean(activeCase) &&
    !activeCase?.assignedAgentId &&
    (activeCase?.status === "ESCALATED" || activeCase?.status === "HUMAN_ACTIVE");

  const isAutomationActive = useMemo(() => {
    // 1. Si el caso está en atención humana activa o fue transferido a un humano:
    if (activeCase?.status === "HUMAN_ACTIVE" || selected?.activeCase?.status === "HUMAN_ACTIVE") {
      return false;
    }

    // 2. Si la automatización fue explícitamente apagada en el caso:
    if (activeCase?.automation && activeCase.automation.enabled === false) {
      return false;
    }
    if (selected?.activeCase && selected.activeCase.automationEnabled === false) {
      return false;
    }

    // 3. Si la automatización fue apagada manualmente:
    if (automationState && !automationState.enabled && automationState.disabledReason) {
      return false;
    }

    // Por defecto, toda conversación no tomada por un humano está en manos del Asistente IA
    return true;
  }, [activeCase, selected?.activeCase, automationState]);

  const alreadyInControl = activeCase?.status === "HUMAN_ACTIVE" && isAssignedToMe;
  const showTakeControl = isAutomationActive && canWriteCase && !showClaim && !alreadyInControl;
  const readOnly = Boolean(activeCase) && !canWriteCase;

  let lastRenderedDay = "";
  let lastRenderedSender = "";

  return (
    <div className="flex flex-col gap-4 h-full flex-1 min-h-0 animate-fade-up">
      {/* Barra de filtros: departamento y agente son opciones aquí, no pantallas separadas */}
      <div
        className={`bg-card border border-border rounded-xl p-3 sm:p-4 space-y-3 shrink-0 shadow-xs ${
          selectedId ? "hidden lg:block" : "block"
        }`}
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex rounded-lg bg-background border border-border p-0.5 gap-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-colors ${
                  statusFilter === tab.value
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por teléfono o mensaje..."
              className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/60">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground shrink-0">
            Área:
          </span>
          <button
            type="button"
            onClick={() => setDepartmentId(undefined)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
              !departmentId
                ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                : "bg-background text-muted-foreground hover:bg-foreground/5 ring-1 ring-border"
            }`}
          >
            Todas
          </button>
          {visibleDepartments.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setDepartmentId(d.id)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                departmentId === d.id
                  ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                  : "bg-background text-muted-foreground hover:bg-foreground/5 ring-1 ring-border"
              }`}
            >
              {d.name}
            </button>
          ))}

          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground shrink-0 ml-2">
            Agente:
          </span>
          <select
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="text-[11px] px-3 py-1 rounded-full bg-background ring-1 ring-border font-semibold outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">Todos los agentes</option>
            <option value="mine">Mis conversaciones</option>
            {directory
              .filter((a) => a.active && a.id !== session?.id)
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      <section className="grid grid-cols-12 gap-4 flex-1 min-h-0">
        {/* Lista de conversaciones */}
        <div
          className={`col-span-12 lg:col-span-4 bg-card border border-border rounded-xl flex flex-col overflow-hidden min-h-0 h-full shadow-xs ${
            selectedId ? "hidden lg:flex" : "flex"
          }`}
        >
          <div className="p-3 sm:p-3.5 border-b border-border bg-background/60 flex justify-between items-center shrink-0">
            <h3 className="text-xs font-bold text-muted-foreground">
              {loading ? "Cargando…" : `${filteredConversations.length} conversaciones`}
            </h3>
            <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
              {connected ? (
                <Wifi className="size-3 text-primary" />
              ) : (
                <WifiOff className="size-3 text-warning" />
              )}
              {connected ? "En vivo" : "Reconectando…"}
            </span>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-border">
            {filteredConversations.map((c) => {
              const active = c.id === selectedId;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`w-full text-left p-3.5 transition-colors flex gap-3 ${
                    active
                      ? "bg-primary/5 border-l-4 border-primary"
                      : "hover:bg-foreground/5 border-l-4 border-transparent"
                  }`}
                >
                  <div className="relative shrink-0">
                    <ConversationAvatar conversation={c} />
                    {!active && (c.unreadCount ?? 0) > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-danger text-[9px] font-bold text-white ring-2 ring-background">
                        {c.unreadCount > 99 ? "99+" : c.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-2">
                      <span className="text-sm font-bold truncate">
                        {conversationDisplayName(c)}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {relativeTime(c.lastActivityAt)}
                      </span>
                    </div>
                    {c.waProfileName && (
                      <p className="text-[10px] text-muted-foreground truncate">
                        {formatWaPhone(c.waPhone)}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {c.lastMessagePreview?.body ?? "Todavía no hay mensajes"}
                    </p>
                    <div className="mt-1.5 flex gap-1.5 flex-wrap items-center">
                      <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-foreground/5 text-muted-foreground">
                        {conversationStatusLabel(c.status)}
                      </span>
                      {c.activeCase ? (
                        <>
                          <span
                            className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded flex items-center gap-1 ${
                              !c.activeCase.automationEnabled ||
                              c.activeCase.status === "HUMAN_ACTIVE"
                                ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/30"
                                : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30"
                            }`}
                          >
                            {!c.activeCase.automationEnabled ||
                            c.activeCase.status === "HUMAN_ACTIVE" ? (
                              <>
                                <User className="size-2.5" />
                                <span>
                                  {c.activeCase.assignedAgentName ||
                                    (c.activeCase.assignedAgentId === session?.id
                                      ? "Tú"
                                      : directory.find(
                                          (a) => a.id === c.activeCase?.assignedAgentId,
                                        )?.name) ||
                                    "Humano"}
                                </span>
                              </>
                            ) : (
                              <>
                                <Bot className="size-2.5 text-emerald-500" />
                                <span>IA</span>
                              </>
                            )}
                          </span>
                          {c.activeCase.departmentId && (
                            <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 flex items-center gap-1">
                              {departments.find((d) => d.id === c.activeCase!.departmentId)?.name ||
                                "Dpto"}
                            </span>
                          )}
                        </>
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
            })}
            {!loading && filteredConversations.length === 0 && (
              <div className="p-8 text-center">
                <UserRound className="size-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">
                  No hay conversaciones que coincidan con estos filtros.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Hilo de conversación */}
        <div
          className={`col-span-12 bg-card border border-border rounded-xl flex flex-col overflow-hidden min-h-0 h-full shadow-xs transition-[grid-column] ${
            selectedId ? "flex" : "hidden lg:flex"
          } ${detailsOpen ? "lg:col-span-5" : "lg:col-span-8"}`}
        >
          {selected ? (
            <>
              <div className="p-2.5 sm:p-3.5 border-b border-border bg-background/60 flex items-center justify-between gap-1.5 sm:gap-2 shrink-0">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => setSelectedId(null)}
                    className="lg:hidden p-1.5 -ml-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/5 shrink-0"
                    aria-label="Volver a la lista de conversaciones"
                  >
                    <ArrowLeft className="size-4" />
                  </button>
                  <div className="relative shrink-0">
                    <ConversationAvatar conversation={selected} size="size-8 sm:size-9" />
                    {isAutomationActive && (
                      <span className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 text-white rounded-full p-0.5 ring-2 ring-background">
                        <Bot className="size-2 sm:size-2.5" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-bold truncate">
                      {conversationDisplayName(selected)}
                    </p>
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">
                      {selected.waProfileName ? `${formatWaPhone(selected.waPhone)} · ` : ""}
                      {activeCase ? caseStatusLabel(activeCase.status) : "Sin caso activo"}
                      {activeCase ? ` · ${workflowLabel(activeCase.workflowType).label}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                  {isAutomationActive || activeCase?.status !== "HUMAN_ACTIVE" ? (
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
                            : "Atención Manual"}
                      </span>
                      <span className="sm:hidden">{isAssignedToMe ? "Tú" : "Humano"}</span>
                    </span>
                  )}
                  {showClaim && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void claim()}
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
                      onClick={() => void takeControl()}
                      className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] px-2 sm:px-3.5 py-1 sm:py-1.5 rounded-full border border-border font-bold hover:bg-foreground/5 transition disabled:opacity-40"
                    >
                      <UserCheck className="size-3 sm:size-3.5" />
                      <span className="hidden sm:inline">Tomar control</span>
                      <span className="sm:hidden">Control</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== "undefined" && window.innerWidth < 1024) {
                        setMobileDetailsOpen((v) => !v);
                      } else {
                        setDetailsOverride(!detailsOpen);
                      }
                    }}
                    title={
                      detailsOpen || mobileDetailsOpen
                        ? "Ocultar los datos del cliente y del caso"
                        : "Ver los datos del cliente y del caso"
                    }
                    className={`inline-flex items-center gap-1 text-[10px] sm:text-[11px] px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full font-bold transition ${
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

              <div
                ref={messagesScrollRef}
                className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 space-y-1 bg-background/40"
              >
                {messages.map((m) => {
                  const fromCustomer = m.author === "customer";
                  const day = dayLabel(m.createdAt);
                  const showDaySeparator = day !== lastRenderedDay;
                  lastRenderedDay = day;
                  const senderKey = showDaySeparator ? "" : m.author;
                  // El nombre del cliente ya se muestra en el encabezado del chat: repetirlo en
                  // cada burbuja es ruido. Del lado del equipo sí distinguimos IA vs. agente humano.
                  const showSenderLabel = !fromCustomer && senderKey !== lastRenderedSender;
                  lastRenderedSender = m.author;
                  return (
                    <div key={m.id}>
                      {showDaySeparator && (
                        <div className="flex justify-center my-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-foreground/5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                            {day}
                          </span>
                        </div>
                      )}
                      <div
                        className={`flex items-end gap-2 mb-1.5 ${fromCustomer ? "justify-start" : "justify-end"}`}
                      >
                        {fromCustomer && (
                          <MessageAvatar author={m.author} conversation={selected} />
                        )}
                        <div
                          className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                            fromCustomer
                              ? "bg-[var(--chat-in-bg)] text-[var(--chat-in-fg)] border border-border/70 rounded-bl-xs"
                              : "bg-[var(--chat-out-bg)] text-[var(--chat-out-fg)] rounded-br-xs"
                          }`}
                        >
                          {showSenderLabel && (
                            <p
                              className={`text-[9px] font-extrabold uppercase tracking-widest mb-1 ${
                                fromCustomer
                                  ? "text-primary"
                                  : "text-emerald-700 dark:text-emerald-300 font-bold"
                              }`}
                            >
                              {fromCustomer
                                ? conversationDisplayName(selected)
                                : m.author === "agent"
                                  ? (assignedAgentName ?? "Agente")
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
                            <span>{messageClock(m.createdAt)}</span>
                            {!fromCustomer && (
                              <CheckCheck className="size-3.5 text-sky-500 dark:text-sky-400" />
                            )}
                          </div>
                        </div>
                        {!fromCustomer && (
                          <MessageAvatar
                            author={m.author}
                            conversation={selected}
                            agentName={assignedAgentName}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
                {messages.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center mt-8">
                    Todavía no hay mensajes en esta conversación.
                  </p>
                )}
              </div>
              {readOnly ? (
                <div className="p-2.5 border-t border-border bg-warning/5 flex items-center gap-2 text-[11px] text-foreground shrink-0">
                  <Lock className="size-3.5 text-warning shrink-0" />
                  <span>
                    Esta conversación está asignada a{" "}
                    <span className="font-bold">{assignedAgentName}</span> — solo esa persona puede
                    responder. Tú puedes seguir viéndola.
                  </span>
                </div>
              ) : (
                <div className="flex flex-col border-t border-border bg-background/60 shrink-0">
                  {isAutomationActive && (
                    <div className="px-3.5 py-2 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 font-semibold text-[11px] min-w-0">
                        <Bot className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="truncate">
                          <strong className="font-extrabold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                            Atención de IA activa
                          </strong>{" "}
                          — El Asistente IA está respondiendo automáticamente
                          {assignedAgentName ? ` (Supervisado por ${assignedAgentName})` : ""}.
                        </span>
                      </div>
                      {showTakeControl && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void takeControl()}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm hover:bg-emerald-700 transition shrink-0 disabled:opacity-40"
                        >
                          <UserCheck className="size-3" />
                          Tomar control manual
                        </button>
                      )}
                    </div>
                  )}
                  <div className="p-2 flex gap-2">
                    <input
                      value={draft}
                      disabled={busy || isAutomationActive}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          void handleSend();
                        }
                      }}
                      placeholder={
                        isAutomationActive
                          ? "🤖 El Asistente IA está respondiendo... Haz clic en 'Tomar control' para escribir"
                          : "Escribe tu respuesta… se envía por WhatsApp"
                      }
                      className="flex-1 px-3.5 py-1.5 bg-card border border-border rounded-full text-xs outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
                    />
                    <button
                      type="button"
                      disabled={busy || !draft.trim() || isAutomationActive}
                      onClick={() => void handleSend()}
                      className="px-4 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-full shadow-sm hover:brightness-95 transition disabled:opacity-40"
                    >
                      Enviar
                    </button>
                  </div>
                </div>
              )}
              {/* <div className="shrink-0 max-h-[40%] overflow-y-auto">
                <InboxInternalNoteComposer
                  conversation={selected}
                  assignedAgentId={activeCase?.assignedAgentId}
                />
              </div> */}
            </>
          ) : (
            <div className="flex-1 grid place-items-center text-center px-6">
              <div>
                <UserRound className="size-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm font-semibold">Selecciona una conversación</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Elige un chat de la lista para ver los mensajes y responder.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Panel de detalles del cliente/caso: en desktop como sidebar inline */}
        {detailsOpen ? (
          <div className="hidden lg:flex lg:col-span-3 min-h-0 h-full flex-col gap-2">
            <div className="bg-card border border-border rounded-xl px-3 py-2 flex items-center justify-between shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Detalles
              </span>
              <button
                type="button"
                onClick={() => setDetailsOverride(false)}
                title="Ocultar panel de detalles"
                className="p-1 rounded-md hover:bg-foreground/5 text-muted-foreground hover:text-foreground transition"
              >
                <PanelRightClose className="size-4" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto space-y-4">
              <CasePanel
                caseDto={activeCase}
                customerName={selected ? conversationDisplayName(selected) : undefined}
                customerPhone={selected ? formatWaPhone(selected.waPhone) : undefined}
                busy={busy}
                canWrite={canWriteCase}
                departments={departments}
                assignedAgentName={assignedAgentName}
                onOpenSummary={() => {
                  if (activeCase) void loadCaseSummary(activeCase.id);
                  setSummaryOpen(true);
                }}
                onComplete={(note) => void complete(note)}
                onCancel={(reason) => void cancel(reason)}
                onTransfer={(toDepartmentId, reason) => void transfer(toDepartmentId, reason)}
                onDisableAutomation={(reason) => void disableAutomation(reason)}
                onReactivateAutomation={() => void reactivateAutomation()}
              />
            </div>
          </div>
        ) : null}
      </section>

      {/* Drawer para detalles en dispositivos móviles (no apila ni desplaza el chat) */}
      <Sheet open={mobileDetailsOpen} onOpenChange={setMobileDetailsOpen}>
        <SheetContent
          side="bottom"
          className="h-[85vh] p-0 flex flex-col rounded-t-2xl sm:max-w-none border-t border-border z-50 bg-card"
        >
          <div className="p-3.5 border-b border-border flex items-center justify-between shrink-0 bg-muted/30">
            <SheetTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Detalles del Caso y Cliente
            </SheetTitle>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
            <CasePanel
              caseDto={activeCase}
              customerName={selected ? conversationDisplayName(selected) : undefined}
              customerPhone={selected ? formatWaPhone(selected.waPhone) : undefined}
              busy={busy}
              canWrite={canWriteCase}
              departments={departments}
              assignedAgentName={assignedAgentName}
              onOpenSummary={() => {
                if (activeCase) void loadCaseSummary(activeCase.id);
                setSummaryOpen(true);
              }}
              onComplete={(note) => void complete(note)}
              onCancel={(reason) => void cancel(reason)}
              onTransfer={(toDepartmentId, reason) => void transfer(toDepartmentId, reason)}
              onDisableAutomation={(reason) => void disableAutomation(reason)}
              onReactivateAutomation={() => void reactivateAutomation()}
            />
          </div>
        </SheetContent>
      </Sheet>

      <CaseSummaryDialog
        open={summaryOpen}
        onOpenChange={setSummaryOpen}
        summary={caseSummary}
        timeline={caseTimeline}
        departments={departments}
        onClaim={
          activeCase?.assignedAgentId == null
            ? () => {
                void claim();
                setSummaryOpen(false);
              }
            : undefined
        }
        claimDisabled={busy}
      />
    </div>
  );
}
