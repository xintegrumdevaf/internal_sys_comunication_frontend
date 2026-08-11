import { Bot, User, CheckCheck, Wifi, WifiOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MessageMediaBody } from "@/modules/conversations/ui/MessageMediaBody";
import { InboxInternalNoteComposer } from "@/modules/internal-chat/ui/InboxInternalNoteComposer";
import { CasePanel } from "@/modules/cases/ui/CasePanel";
import { CaseSummaryDialog } from "@/modules/cases/ui/CaseSummaryDialog";
import { caseStatusLabel, workflowLabel } from "@/modules/cases/domain/case";
import { messageClock, relativeTime } from "@/shared/datetime";
import { useOperationalInbox } from "@/modules/conversations/application/use-operational-inbox";
import { useDepartmentsQuery } from "@/modules/identity/application/use-session";
import { useRealtimeConnected } from "@/modules/realtime/application/use-realtime";

type Props = {
  departmentId?: string;
  mineOnly?: boolean;
  subtitle?: string;
  initialConversationId?: string | null;
};

export function OperationalInbox({
  departmentId,
  mineOnly = false,
  subtitle,
  initialConversationId,
}: Props) {
  const {
    session,
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
  } = useOperationalInbox({ departmentId, mineOnly, initialConversationId });

  const { data: departments = [] } = useDepartmentsQuery();
  const connected = useRealtimeConnected();
  const [draft, setDraft] = useState("");
  const [summaryOpen, setSummaryOpen] = useState(false);
  const messagesScrollRef = useRef<HTMLDivElement>(null);

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

  return (
    <section className="grid grid-cols-12 gap-6 h-[min(780px,calc(100vh-14rem))] min-h-[560px] animate-fade-up">
      <div className="col-span-12 lg:col-span-4 bg-card border border-border rounded-xl flex flex-col overflow-hidden min-h-0 h-full">
        <div className="p-4 border-b border-border bg-background/60 flex justify-between items-center shrink-0">
          <h3 className="text-xs font-extrabold uppercase tracking-widest">
            {loading ? "Cargando…" : `${conversations.length} conversaciones`}
          </h3>
          <span className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
            {connected ? (
              <Wifi className="size-3 text-primary" />
            ) : (
              <WifiOff className="size-3 text-warning" />
            )}
            {subtitle ?? "isp-customer-service-api"}
          </span>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-border">
          {conversations.map((c) => {
            const active = c.id === selectedId;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`w-full text-left p-4 transition-colors ${
                  active
                    ? "bg-primary/5 border-l-4 border-primary"
                    : "hover:bg-foreground/5 border-l-4 border-transparent"
                }`}
              >
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-bold">{c.waPhone}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {relativeTime(c.lastActivityAt)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {c.lastMessagePreview?.body ?? "Sin mensajes"}
                </p>
                <div className="mt-2 flex gap-1.5 flex-wrap items-center">
                  <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-foreground/5 text-muted-foreground">
                    {c.status}
                  </span>
                  {c.activeCaseId && (
                    <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-blue-100 text-blue-700">
                      Con caso activo
                    </span>
                  )}
                </div>
              </button>
            );
          })}
          {!loading && conversations.length === 0 && (
            <p className="p-6 text-xs text-muted-foreground">
              No hay conversaciones abiertas para este filtro.
            </p>
          )}
        </div>
      </div>

      <div className="col-span-12 lg:col-span-5 bg-card border border-border rounded-xl flex flex-col overflow-hidden min-h-0 h-full">
        {selected ? (
          <>
            <div className="p-4 border-b border-border bg-background/60 flex items-center justify-between gap-2 shrink-0">
              <div className="min-w-0">
                <p className="text-xs font-bold truncate">{selected.waPhone}</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {activeCase ? caseStatusLabel(activeCase.status) : "Sin caso activo"}
                  {activeCase ? ` · ${workflowLabel(activeCase.workflowType).label}` : ""}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                {activeCase?.assignedAgentId == null &&
                  (activeCase?.status === "ESCALATED" || activeCase?.status === "HUMAN_ACTIVE") && (
                    <button
                      disabled={busy}
                      onClick={() => void claim()}
                      className="text-[10px] px-3 py-1.5 rounded bg-danger text-danger-foreground font-bold uppercase disabled:opacity-40"
                    >
                      Reclamar caso
                    </button>
                  )}
                <button
                  disabled={busy}
                  onClick={() => void takeControl()}
                  className="text-[10px] px-3 py-1.5 rounded border border-border font-bold uppercase disabled:opacity-40"
                >
                  Tomar Control
                </button>
              </div>
            </div>

            <div
              ref={messagesScrollRef}
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-3 bg-background/40"
            >
              {messages.map((m) => {
                const fromCustomer = m.author === "customer";
                return (
                  <div
                    key={m.id}
                    className={`flex ${fromCustomer ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[75%] px-3 py-2 rounded-2xl text-[12px] leading-snug shadow-sm ${
                        fromCustomer
                          ? "bg-card border border-border"
                          : "bg-primary text-primary-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 opacity-80">
                        {fromCustomer ? <User className="size-3" /> : <Bot className="size-3" />}
                        <span className="text-[9px] uppercase font-bold tracking-widest">
                          {fromCustomer
                            ? "Cliente"
                            : m.author === "agent"
                              ? "Agente"
                              : "IA"}
                        </span>
                      </div>
                      <MessageMediaBody message={m} />
                      <div
                        className={`flex items-center justify-end gap-1 mt-1.5 ${
                          fromCustomer ? "text-muted-foreground" : "text-primary-foreground/80"
                        }`}
                      >
                        <span className="text-[10px] tabular-nums">
                          {messageClock(m.createdAt)}
                        </span>
                        {!fromCustomer && <CheckCheck className="size-3.5 opacity-80" />}
                      </div>
                    </div>
                  </div>
                );
              })}
              {messages.length === 0 && (
                <p className="text-xs text-muted-foreground">Sin mensajes en el hilo.</p>
              )}
            </div>
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
                placeholder="Escribe un mensaje (se envía por WhatsApp Cloud API)"
                className="flex-1 px-3 py-2 bg-card border border-border rounded-md text-xs outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
              />
              <button
                type="button"
                disabled={busy || !draft.trim()}
                onClick={() => void handleSend()}
                className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-md disabled:opacity-40"
              >
                Enviar
              </button>
            </div>
            <div className="shrink-0 max-h-[40%] overflow-y-auto">
              <InboxInternalNoteComposer
                conversation={selected}
                assignedAgentId={activeCase?.assignedAgentId}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 grid place-items-center text-xs text-muted-foreground">
            Selecciona una conversación
          </div>
        )}
      </div>

      <div className="col-span-12 lg:col-span-3 space-y-4 min-h-0 h-full overflow-y-auto">
        <CasePanel
          caseDto={activeCase}
          busy={busy}
          canWrite={canWriteCase}
          departments={departments}
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

      <CaseSummaryDialog
        open={summaryOpen}
        onOpenChange={setSummaryOpen}
        summary={caseSummary}
        timeline={caseTimeline}
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
    </section>
  );
}
