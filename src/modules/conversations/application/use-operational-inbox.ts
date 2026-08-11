import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import * as conversationGateway from "@/modules/conversations/infrastructure/conversation.gateway";
import * as caseGateway from "@/modules/cases/infrastructure/case.gateway";
import { useCaseActions } from "@/modules/cases/application/use-case-actions";
import type { ConversationDto, MessageDto } from "@/modules/conversations/domain/conversation";
import type { CaseDto, CaseSummaryDto, CaseTimelineEntryDto } from "@/modules/cases/domain/case";
import { useSession } from "@/modules/identity/application/use-session";
import { subscribeRealtimeEvents } from "@/modules/realtime/infrastructure/realtime-bus";

type InboxOptions = {
  /** Filtra por departamento (id real). */
  departmentId?: string;
  /** Si true, solo conversaciones con un caso asignado a mí. */
  mineOnly?: boolean;
  /** Prefiere esta conversación al cargar (deep-link desde menciones internas / notificaciones). */
  initialConversationId?: string | null;
};

/**
 * Caso de uso "bandeja operativa": orquesta conversations + cases + realtime.
 * Las acciones de caso viven en cases/application/use-case-actions (DRY, se
 * comparte con escalations y assignment).
 */
export function useOperationalInbox(options: InboxOptions = {}) {
  const session = useSession();
  const [conversations, setConversations] = useState<ConversationDto[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [cases, setCases] = useState<CaseDto[]>([]);
  const [caseSummary, setCaseSummary] = useState<CaseSummaryDto | null>(null);
  const [caseTimeline, setCaseTimeline] = useState<CaseTimelineEntryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const selectedIdRef = useRef<string | null>(null);
  selectedIdRef.current = selectedId;

  const reload = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!session) return;
      if (!opts?.silent) setLoading(true);
      try {
        const data = await conversationGateway.listConversations({
          departmentId: options.departmentId,
          userId: options.mineOnly ? session.id : undefined,
          status: "open",
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
      conversationGateway.listMessages(conversationId),
      conversationGateway.listCasesForConversation(conversationId),
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
          conversationGateway.listMessages(selectedId),
          conversationGateway.listCasesForConversation(selectedId),
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

  const refreshActiveCase = useCallback(async () => {
    if (!activeCase) return;
    try {
      const fresh = await caseGateway.getCase(activeCase.id);
      setCases((prev) => prev.map((c) => (c.id === fresh.id ? fresh : c)));
    } catch {
      // silencioso: el próximo reload silencioso lo corrige
    }
  }, [activeCase]);

  const loadCaseSummary = useCallback(async (caseId: string) => {
    try {
      const [summary, timeline] = await Promise.all([
        caseGateway.getCaseSummary(caseId),
        caseGateway.getCaseTimeline(caseId),
      ]);
      setCaseSummary(summary);
      setCaseTimeline(timeline);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo cargar el resumen del caso");
    }
  }, []);

  const caseActions = useCaseActions(session, async () => {
    await refreshActiveCase();
    await reload({ silent: true });
  });

  const sendReply = async (body: string) => {
    if (!session || !selectedId) return false;
    const trimmed = body.trim();
    if (!trimmed) return false;
    setSending(true);
    try {
      const message = await conversationGateway.replyAsHuman(selectedId, session.id, trimmed);
      setMessages((prev) => [...prev, message]);
      await refreshActiveCase();
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo enviar");
      return false;
    } finally {
      setSending(false);
    }
  };

  const takeControl = async () => {
    if (!session || !selectedId) return;
    setSending(true);
    try {
      await conversationGateway.takeControl(selectedId, session.id);
      toast.success("Control tomado");
      await reload({ silent: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo tomar control");
    } finally {
      setSending(false);
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
    busy: sending || caseActions.busy,
    reload,
    sendReply,
    takeControl,
    claim: () => (activeCase ? caseActions.claim(activeCase.id) : Promise.resolve(false)),
    assign: (agentUserId: string) =>
      activeCase ? caseActions.assign(activeCase.id, agentUserId) : Promise.resolve(false),
    reassign: (agentUserId: string) =>
      activeCase ? caseActions.reassign(activeCase.id, agentUserId) : Promise.resolve(false),
    complete: (note?: string) =>
      activeCase ? caseActions.complete(activeCase.id, note) : Promise.resolve(false),
    cancel: (reason: string) =>
      activeCase ? caseActions.cancel(activeCase.id, reason) : Promise.resolve(false),
    transfer: (toDepartmentId: string, reason: string) =>
      activeCase ? caseActions.transfer(activeCase.id, toDepartmentId, reason) : Promise.resolve(false),
    disableAutomation: (reason: string) =>
      activeCase ? caseActions.disableAutomation(activeCase.id, reason) : Promise.resolve(false),
    reactivateAutomation: () =>
      activeCase ? caseActions.reactivateAutomation(activeCase.id) : Promise.resolve(false),
  };
}
