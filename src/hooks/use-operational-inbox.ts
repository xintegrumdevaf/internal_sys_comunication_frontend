import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  assignCaseFn,
  cancelCaseFn,
  claimCaseFn,
  completeCaseFn,
  disableAutomationFn,
  getCaseFn,
  getCaseSummaryFn,
  getCaseTimelineFn,
  listCasesForConversationFn,
  listConversationsFn,
  listMessagesFn,
  reactivateAutomationFn,
  reassignCaseFn,
  replyAsHumanFn,
  takeControlFn,
  transferCaseFn,
} from "@/adapters/http/server-fns";
import type {
  CaseDto,
  CaseSummaryDto,
  CaseTimelineEntryDto,
  ConversationDto,
  MessageDto,
} from "@/adapters/http/dto";
import { useSession } from "@/lib/auth";
import { subscribeRealtimeEvents } from "@/lib/realtime-bus";

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.max(1, Math.round(diff / 60_000));
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}

export function messageClock(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

const WORKFLOW_LABELS: Record<string, { label: string; cls: string }> = {
  SUPPORT_INTERNET: { label: "Soporte", cls: "bg-red-100 text-red-700" },
  BILLING_BALANCE: { label: "Facturación", cls: "bg-green-100 text-green-700" },
  SALES_PACKAGES: { label: "Ventas", cls: "bg-amber-100 text-amber-700" },
  GENERAL_INQUIRY: { label: "Consulta", cls: "bg-blue-100 text-blue-700" },
  UNCLASSIFIED: { label: "Sin clasificar", cls: "bg-purple-100 text-purple-700" },
};

export function workflowLabel(workflowType?: string | null): { label: string; cls: string } {
  if (!workflowType) return { label: "Sin caso", cls: "bg-foreground/5 text-muted-foreground" };
  return (
    WORKFLOW_LABELS[workflowType] ?? {
      label: workflowType,
      cls: "bg-foreground/5 text-muted-foreground",
    }
  );
}

const CASE_STATUS_LABELS: Record<CaseDto["status"], string> = {
  NEW: "Nuevo",
  ACTIVE: "En curso (IA)",
  WAITING_USER: "Esperando cliente",
  PAUSED: "Pausado",
  ESCALATED: "Escalado",
  HUMAN_ACTIVE: "Atendido por humano",
  COMPLETED: "Completado",
  EXPIRED: "Expirado",
  CANCELLED: "Cancelado",
};

export function caseStatusLabel(status?: CaseDto["status"]): string {
  return status ? (CASE_STATUS_LABELS[status] ?? status) : "—";
}

/** Nombre del cliente si el caso activo ya lo validó (01_DATA_MODEL.md §4 del backend). */
export function clientNameFromCase(c?: CaseDto | null): string | null {
  if (!c) return null;
  const data = c.context?.data as { client?: { fullName?: string } } | undefined;
  return data?.client?.fullName ?? null;
}

type InboxOptions = {
  /** Filtra por departamento (id real). */
  departmentId?: string;
  /** Si true, solo conversaciones con un caso asignado a mí. */
  mineOnly?: boolean;
  /** Prefiere esta conversación al cargar (deep-link desde menciones internas / notificaciones). */
  initialConversationId?: string | null;
};

export function useOperationalInbox(options: InboxOptions = {}) {
  const session = useSession();
  const [conversations, setConversations] = useState<ConversationDto[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [cases, setCases] = useState<CaseDto[]>([]);
  const [caseSummary, setCaseSummary] = useState<CaseSummaryDto | null>(null);
  const [caseTimeline, setCaseTimeline] = useState<CaseTimelineEntryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const selectedIdRef = useRef<string | null>(null);
  selectedIdRef.current = selectedId;

  const reload = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!session) return;
      if (!opts?.silent) setLoading(true);
      try {
        const data = await listConversationsFn({
          data: {
            departmentId: options.departmentId,
            userId: options.mineOnly ? session.id : undefined,
            status: "open",
          },
        });
        setConversations(data);

        const prevId = selectedIdRef.current;
        const preferred = options.initialConversationId;
        const nextId =
          prevId && data.some((c) => c.id === prevId)
            ? prevId
            : preferred && data.some((c) => c.id === preferred)
              ? preferred
              : (data[0]?.id ?? null);
        setSelectedId(nextId);
        if (!nextId) {
          setMessages([]);
          setCases([]);
        }
      } catch (e) {
        if (!opts?.silent) {
          toast.error(e instanceof Error ? e.message : "Error cargando bandeja");
        }
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [session, options.departmentId, options.mineOnly, options.initialConversationId],
  );

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id, options.departmentId, options.mineOnly]);

  const loadThread = useCallback(async (conversationId: string) => {
    const [msgs, convCases] = await Promise.all([
      listMessagesFn({ data: { conversationId } }),
      listCasesForConversationFn({ data: { conversationId } }),
    ]);
    setMessages(msgs);
    setCases(convCases);
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      setCases([]);
      setCaseSummary(null);
      setCaseTimeline([]);
      return;
    }
    let cancelled = false;
    setCaseSummary(null);
    setCaseTimeline([]);
    (async () => {
      try {
        const [msgs, convCases] = await Promise.all([
          listMessagesFn({ data: { conversationId: selectedId } }),
          listCasesForConversationFn({ data: { conversationId: selectedId } }),
        ]);
        if (!cancelled) {
          setMessages(msgs);
          setCases(convCases);
        }
      } catch (e) {
        if (!cancelled) {
          toast.error(e instanceof Error ? e.message : "Error cargando chat");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  // Tiempo real: refresca hilo/lista según lo que llegue por SSE (03_REALTIME_NOTIFICATIONS.md §2).
  useEffect(() => {
    return subscribeRealtimeEvents((event) => {
      if (event.type === "MESSAGE_RECEIVED" || event.type === "MESSAGE_SENT") {
        if (event.conversationId === selectedIdRef.current) {
          void loadThread(event.conversationId);
        }
        void reload({ silent: true });
        return;
      }
      if (
        event.type === "CASE_ESCALATED" ||
        event.type === "CASE_CLAIMED" ||
        event.type === "HUMAN_ASSIGNED" ||
        event.type === "AUTOMATION_ENABLED"
      ) {
        void reload({ silent: true });
        if (selectedIdRef.current) void loadThread(selectedIdRef.current);
      }
    });
  }, [reload, loadThread]);

  const selected = conversations.find((c) => c.id === selectedId) ?? null;
  const activeCase = useMemo(() => {
    if (!selected) return null;
    return (
      cases.find((c) => c.id === selected.activeCaseId) ??
      cases.find((c) => c.status === "ESCALATED" || c.status === "HUMAN_ACTIVE") ??
      cases[0] ??
      null
    );
  }, [cases, selected]);

  const loadCaseSummary = useCallback(async (caseId: string) => {
    try {
      const [summary, timeline] = await Promise.all([
        getCaseSummaryFn({ data: { caseId } }),
        getCaseTimelineFn({ data: { caseId } }),
      ]);
      setCaseSummary(summary);
      setCaseTimeline(timeline);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo cargar el resumen del caso");
    }
  }, []);

  const refreshActiveCase = useCallback(async () => {
    if (!activeCase) return;
    try {
      const fresh = await getCaseFn({ data: { caseId: activeCase.id } });
      setCases((prev) => prev.map((c) => (c.id === fresh.id ? fresh : c)));
    } catch {
      // silencioso: el próximo reload silencioso lo corrige
    }
  }, [activeCase]);

  const sendReply = async (body: string) => {
    if (!session || !selectedId) return false;
    const trimmed = body.trim();
    if (!trimmed) return false;
    setBusy(true);
    try {
      const message = await replyAsHumanFn({
        data: { conversationId: selectedId, agentUserId: session.id, body: trimmed },
      });
      setMessages((prev) => [...prev, message]);
      await refreshActiveCase();
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo enviar");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const takeControl = async () => {
    if (!session || !selectedId) return;
    setBusy(true);
    try {
      await takeControlFn({ data: { conversationId: selectedId, agentUserId: session.id } });
      toast.success("Control tomado");
      await reload({ silent: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo tomar control");
    } finally {
      setBusy(false);
    }
  };

  const claim = async () => {
    if (!session || !activeCase) return;
    setBusy(true);
    try {
      await claimCaseFn({ data: { caseId: activeCase.id, agentUserId: session.id } });
      toast.success("Caso reclamado");
      await refreshActiveCase();
      await reload({ silent: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo reclamar el caso");
    } finally {
      setBusy(false);
    }
  };

  const assign = async (agentUserId: string) => {
    if (!session || !activeCase) return;
    setBusy(true);
    try {
      await assignCaseFn({
        data: { caseId: activeCase.id, agentUserId, actorAgentId: session.id },
      });
      toast.success("Caso asignado");
      await refreshActiveCase();
      await reload({ silent: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo asignar");
    } finally {
      setBusy(false);
    }
  };

  const reassign = async (agentUserId: string) => {
    if (!session || !activeCase) return;
    setBusy(true);
    try {
      await reassignCaseFn({
        data: { caseId: activeCase.id, agentUserId, actorAgentId: session.id },
      });
      toast.success("Caso reasignado");
      await refreshActiveCase();
      await reload({ silent: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo reasignar");
    } finally {
      setBusy(false);
    }
  };

  const complete = async (resolutionNote?: string) => {
    if (!session || !activeCase) return;
    setBusy(true);
    try {
      await completeCaseFn({
        data: { caseId: activeCase.id, agentUserId: session.id, resolutionNote },
      });
      toast.success("Caso completado");
      await refreshActiveCase();
      await reload({ silent: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo completar");
    } finally {
      setBusy(false);
    }
  };

  const cancel = async (reason: string) => {
    if (!session || !activeCase) return;
    setBusy(true);
    try {
      await cancelCaseFn({ data: { caseId: activeCase.id, reason, agentUserId: session.id } });
      toast.success("Caso cancelado");
      await refreshActiveCase();
      await reload({ silent: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo cancelar");
    } finally {
      setBusy(false);
    }
  };

  const transfer = async (toDepartmentId: string, reason: string) => {
    if (!session || !activeCase) return;
    setBusy(true);
    try {
      await transferCaseFn({
        data: { caseId: activeCase.id, toDepartmentId, reason, agentUserId: session.id },
      });
      toast.success("Caso transferido");
      await refreshActiveCase();
      await reload({ silent: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo transferir");
    } finally {
      setBusy(false);
    }
  };

  const disableAutomation = async (reason: string) => {
    if (!session || !activeCase) return;
    setBusy(true);
    try {
      await disableAutomationFn({
        data: { caseId: activeCase.id, reason, agentUserId: session.id },
      });
      toast.success("Automatización desactivada");
      await refreshActiveCase();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo desactivar");
    } finally {
      setBusy(false);
    }
  };

  const reactivateAutomation = async () => {
    if (!session || !activeCase) return;
    setBusy(true);
    try {
      await reactivateAutomationFn({ data: { caseId: activeCase.id, agentUserId: session.id } });
      toast.success("Automatización reactivada");
      await refreshActiveCase();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo reactivar");
    } finally {
      setBusy(false);
    }
  };

  return {
    session,
    conversations,
    selected,
    selectedId,
    setSelectedId,
    messages,
    cases,
    activeCase,
    caseSummary,
    caseTimeline,
    loadCaseSummary,
    loading,
    busy,
    reload,
    sendReply,
    takeControl,
    claim,
    assign,
    reassign,
    complete,
    cancel,
    transfer,
    disableAutomation,
    reactivateAutomation,
  };
}
