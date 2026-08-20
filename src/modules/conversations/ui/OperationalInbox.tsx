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
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
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
  useEffect(() => {
    setDetailsOverride(null);
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
    if (!activeCase?.assignedAgentId) return null;
    return directory.find((a) => a.id === activeCase.assignedAgentId)?.name ?? null;
  }, [activeCase, directory]);

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
    Boolean(activeCase) &&
    (activeCase?.assignedAgentId === session?.id ||
      activeCase?.assignedAgentId == null ||
      session?.role === "manager" ||
      session?.role === "admin");

  const isAssignedToMe = Boolean(activeCase?.assignedAgentId && activeCase.assignedAgentId === session?.id);
  const isAssignedToOther = Boolean(
    activeCase?.assignedAgentId && activeCase.assignedAgentId !== session?.id,
  );
  const showClaim =
    Boolean(activeCase) &&
    !activeCase?.assignedAgentId &&
    (activeCase?.status === "ESCALATED" || activeCase?.status === "HUMAN_ACTIVE");
  const alreadyInControl = activeCase?.status === "HUMAN_ACTIVE" && isAssignedToMe;
  const showTakeControl = canWriteCase && !showClaim && !alreadyInControl;
  const readOnly = Boolean(activeCase) && !canWriteCase;

  let lastRenderedDay = "";
  let lastRenderedSender = "";

  return (
    <div className="flex flex-col gap-3 h-[min(820px,calc(100vh-12rem))] min-h-[600px] animate-fade-up">
      {/* Barra de filtros: departamento y agente son opciones aquí, no pantallas separadas */}
      <div className="bg-card border border-border rounded-xl p-3 space-y-2.5 shrink-0">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg bg-background border border-border p-1 gap-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-colors ${statusFilter === tab.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por teléfono o mensaje..."
              className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-md text-xs outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground shrink-0">
            Área:
          </span>
          <button
            type="button"
            onClick={() => setDepartmentId(undefined)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${!departmentId
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
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${departmentId === d.id
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
            className="text-[11px] px-2.5 py-1 rounded-full bg-background ring-1 ring-border font-semibold outline-none"
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
        <div className="col-span-12 lg:col-span-4 bg-card border border-border rounded-xl flex flex-col overflow-hidden min-h-0 h-full">
          <div className="p-3 border-b border-border bg-background/60 flex justify-between items-center shrink-0">
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
                  className={`w-full text-left p-3 transition-colors flex gap-3 ${active ? "bg-primary/5 border-l-4 border-primary" : "hover:bg-foreground/5 border-l-4 border-transparent"
                    }`}
                >
                  <ConversationAvatar conversation={c} />
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-2">
                      <span className="text-sm font-bold truncate">{conversationDisplayName(c)}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {relativeTime(c.lastActivityAt)}
                      </span>
                    </div>
                    {c.waProfileName && (
                      <p className="text-[10px] text-muted-foreground truncate">{formatWaPhone(c.waPhone)}</p>
                    )}
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {c.lastMessagePreview?.body ?? "Todavía no hay mensajes"}
                    </p>
                    <div className="mt-1.5 flex gap-1.5 flex-wrap items-center">
                      <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-foreground/5 text-muted-foreground">
                        {conversationStatusLabel(c.status)}
                      </span>
                      {c.activeCaseId && (
                        <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-blue-100 text-blue-700">
                          Con caso abierto
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
          className={`col-span-12 bg-card border border-border rounded-xl flex flex-col overflow-hidden min-h-0 h-full transition-[grid-column] ${detailsOpen ? "lg:col-span-5" : "lg:col-span-8"
            }`}
        >
          {selected ? (
            <>
              <div className="p-3 border-b border-border bg-background/60 flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <ConversationAvatar conversation={selected} size="size-9" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{conversationDisplayName(selected)}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {selected.waProfileName ? `${formatWaPhone(selected.waPhone)} · ` : ""}
                      {activeCase ? caseStatusLabel(activeCase.status) : "Sin caso activo"}
                      {activeCase ? ` · ${workflowLabel(activeCase.workflowType).label}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {assignedAgentName && (
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold ${isAssignedToMe
                          ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                          : "bg-foreground/5 text-muted-foreground ring-1 ring-border"
                        }`}
                      title={isAssignedToOther ? "Solo esta persona puede responder" : undefined}
                    >
                      {isAssignedToMe ? (
                        <UserCheck className="size-3.5" />
                      ) : (
                        <Lock className="size-3" />
                      )}
                      {isAssignedToMe ? "Asignado a ti" : assignedAgentName}
                    </span>
                  )}
                  {showClaim && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void claim()}
                      className="inline-flex items-center gap-1.5 text-[11px] px-3.5 py-1.5 rounded-full bg-warning text-white font-bold shadow-sm hover:brightness-95 transition disabled:opacity-40"
                    >
                      <ShieldCheck className="size-3.5" />
                      Reclamar caso
                    </button>
                  )}
                  {showTakeControl && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void takeControl()}
                      className="inline-flex items-center gap-1.5 text-[11px] px-3.5 py-1.5 rounded-full border border-border font-bold hover:bg-foreground/5 transition disabled:opacity-40"
                    >
                      <UserCheck className="size-3.5" />
                      Tomar control
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setDetailsOverride(!detailsOpen)}
                    title={
                      detailsOpen
                        ? "Ocultar los datos del cliente y del caso"
                        : "Ver los datos del cliente y del caso"
                    }
                    className={`inline-flex items-center gap-1.5 text-[11px] px-3.5 py-1.5 rounded-full font-bold transition ${detailsOpen
                        ? "bg-primary text-primary-foreground shadow-sm hover:brightness-95"
                        : "border border-border hover:bg-foreground/5"
                      }`}
                  >
                    {detailsOpen ? (
                      <PanelRightClose className="size-3.5" />
                    ) : (
                      <Info className="size-3.5" />
                    )}
                    Detalles
                    {!detailsOpen && activeCase && (
                      <span className="size-1.5 rounded-full bg-primary" />
                    )}
                  </button>
                </div>
              </div>

              <div
                ref={messagesScrollRef}
                className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-1 bg-background/40"
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
                        <div className="flex justify-center my-3">
                          <span className="px-3 py-1 rounded-full bg-foreground/5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                            {day}
                          </span>
                        </div>
                      )}
                      <div className={`flex items-end gap-2 mb-2 ${fromCustomer ? "justify-start" : "justify-end"}`}>
                        {fromCustomer && <MessageAvatar author={m.author} conversation={selected} />}
                        <div
                          className={`max-w-[70%] px-3 py-2 rounded-2xl text-[12px] leading-snug shadow-sm ${fromCustomer
                              ? "bg-card border border-border rounded-bl-md"
                              : "bg-primary text-primary-foreground rounded-br-md"
                            }`}
                        >
                          {showSenderLabel && (
                            <p
                              className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${fromCustomer ? "text-muted-foreground" : "text-primary-foreground/75"
                                }`}
                            >
                              {fromCustomer
                                ? conversationDisplayName(selected)
                                : m.author === "agent"
                                  ? assignedAgentName ?? "Agente"
                                  : "Asistente IA"}
                            </p>
                          )}
                          <MessageMediaBody message={m} />
                          <div
                            className={`flex items-center justify-end gap-1 mt-1.5 ${fromCustomer ? "text-muted-foreground" : "text-primary-foreground/80"
                              }`}
                          >
                            <span className="text-[10px] tabular-nums">{messageClock(m.createdAt)}</span>
                            {!fromCustomer && <CheckCheck className="size-3.5 opacity-80" />}
                          </div>
                        </div>
                        {!fromCustomer && (
                          <MessageAvatar author={m.author} conversation={selected} agentName={assignedAgentName} />
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
                <div className="p-3 border-t border-border bg-warning/5 flex items-center gap-2 text-[11px] text-foreground shrink-0">
                  <Lock className="size-3.5 text-warning shrink-0" />
                  <span>
                    Esta conversación está asignada a{" "}
                    <span className="font-bold">{assignedAgentName}</span> — solo esa persona puede
                    responder. Tú puedes seguir viéndola.
                  </span>
                </div>
              ) : (
                <div className="p-3 border-t border-border bg-background/60 flex gap-2 shrink-0">
                  <input
                    value={draft}
                    disabled={busy}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void handleSend();
                      }
                    }}
                    placeholder="Escribe tu respuesta… se envía por WhatsApp"
                    className="flex-1 px-3.5 py-2.5 bg-card border border-border rounded-full text-xs outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
                  />
                  <button
                    type="button"
                    disabled={busy || !draft.trim()}
                    onClick={() => void handleSend()}
                    className="px-5 py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-full shadow-sm hover:brightness-95 transition disabled:opacity-40"
                  >
                    Enviar
                  </button>
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

        {/* Panel de detalles del cliente/caso: pestaña colapsable, como un sidebar */}
        {detailsOpen ? (
          <div className="col-span-12 lg:col-span-3 min-h-0 h-full flex flex-col gap-2">
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
