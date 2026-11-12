import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import * as conversationGateway from "@/modules/conversations/infrastructure/conversation.gateway";
import * as caseGateway from "@/modules/cases/infrastructure/case.gateway";
import { useCaseActions } from "@/modules/cases/application/use-case-actions";
import type {
  ConversationDto,
  ConversationStatus,
  MessageDto,
} from "@/modules/conversations/domain/conversation";
import type { OutboundMediaKind } from "@/modules/conversations/domain/outbound-media";
import {
  isLocalMessage,
  createLocalMessageId,
  reconcileThread,
} from "@/modules/conversations/domain/optimistic-messages";
import type { CaseDto, CaseSummaryDto, CaseTimelineEntryDto } from "@/modules/cases/domain/case";
import { useSession } from "@/modules/identity/application/use-session";
import { subscribeRealtimeEvents } from "@/modules/realtime/infrastructure/realtime-bus";
import {
  setActiveChatId,
  setUnreadConversations,
  markConversationRead,
} from "@/modules/realtime/application/unread.state";
import type { AutomationStateDto } from "@/modules/cases/domain/case";

type InboxOptions = {
  /** Filtra por departamento (id real). undefined = todos los departamentos visibles. */
  departmentId?: string;
  /** Filtra por agente asignado (puede ser "a mí mismo" o cualquier otro agente). undefined = todos. */
  agentId?: string;
  /** Filtra por estado de conversación. Por defecto "open" (las que requieren atención). */
  status?: ConversationStatus | "all";
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
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const messagesRef = useRef<MessageDto[]>([]);
  messagesRef.current = messages;
  const hasMoreMessagesRef = useRef(false);
  hasMoreMessagesRef.current = hasMoreMessages;
  const loadingOlderRef = useRef(false);
  loadingOlderRef.current = loadingOlderMessages;
  const MESSAGES_PAGE_SIZE = 50;
  const [cases, setCases] = useState<CaseDto[]>([]);
  const [caseSummary, setCaseSummary] = useState<CaseSummaryDto | null>(null);
  const [caseTimeline, setCaseTimeline] = useState<CaseTimelineEntryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [automationState, setAutomationState] = useState<{
    caseId: string;
    enabled: boolean;
    disabledReason: string | null;
  } | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  selectedIdRef.current = selectedId;
  const activeCaseIdRef = useRef<string | null>(null);
  const reloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const outboundQueueRef = useRef<Promise<void>>(Promise.resolve());
  const pendingMessagesRef = useRef<Map<string, MessageDto>>(new Map());
  const localBlobUrlsRef = useRef<Map<string, string>>(new Map());
  const conversationsRef = useRef<ConversationDto[]>([]);
  conversationsRef.current = conversations;
  const consumedInitialIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!options.initialConversationId) {
      consumedInitialIdRef.current = null;
    }
  }, [options.initialConversationId]);

  const reload = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!session?.id) return;
      if (!opts?.silent) setLoading(true);
      try {
        let data = await conversationGateway.listConversations({
          departmentId: options.departmentId,
          userId: options.agentId,
          status: options.status === "all" ? undefined : (options.status ?? "open"),
        });

        const prevId = selectedIdRef.current;

        // Solo aplicar initialConversationId una única vez y únicamente si el usuario
        // aún no tiene otra conversación seleccionada activamente.
        const shouldApplyInitial =
          !opts?.silent &&
          !prevId &&
          Boolean(options.initialConversationId) &&
          consumedInitialIdRef.current !== options.initialConversationId;

        const preferred = shouldApplyInitial ? options.initialConversationId : null;
        if (preferred) {
          consumedInitialIdRef.current = preferred;
          if (!data.some((c) => c.id === preferred)) {
            try {
              const single = await conversationGateway.getConversation(preferred);
              if (single) {
                data = [single, ...data];
              }
            } catch {
              // silencioso
            }
          }
        }

        // Si el usuario tiene una conversación abierta que no vino en `data` (por filtro o recarga),
        // preservarla en memoria para jamás sacarlo del chat en el que está escribiendo.
        if (prevId && !data.some((c) => c.id === prevId)) {
          const existing = conversationsRef.current.find((c) => c.id === prevId);
          if (existing) {
            data = [existing, ...data];
          }
        }

        const nextId = prevId
          ? prevId
          : preferred && data.some((c) => c.id === preferred)
            ? preferred
            : null;

        // La conversación activa actual no debe tener conteo no leído en la UI
        const normalizedData = data.map((c) => (c.id === nextId ? { ...c, unreadCount: 0 } : c));
        setConversations(normalizedData);

        const unreadIds = normalizedData
          .filter((c) => {
            if ((c.unreadCount || 0) <= 0 || c.id === nextId) return false;
            // Para agente: solo contar sus asignadas o en cola de su área
            if (session?.role === "agent") {
              const isAssignedToMe = c.activeCase?.assignedAgentId === session?.id;
              const isMyDeptUnassigned = Boolean(
                c.activeCase?.departmentId &&
                session?.departmentIds?.includes(c.activeCase.departmentId) &&
                !c.activeCase.assignedAgentId,
              );
              return isAssignedToMe || isMyDeptUnassigned;
            }
            // Para managers y admins: visión general
            return true;
          })
          .map((c) => c.id);
        setUnreadConversations(unreadIds);

        if (nextId !== selectedIdRef.current) {
          selectedIdRef.current = nextId;
          setSelectedId(nextId);
        }
        if (nextId) {
          setActiveChatId(nextId);
          const activeConv = data.find((c) => c.id === nextId);
          if (activeConv && (activeConv.unreadCount ?? 0) > 0) {
            void conversationGateway.markAsRead(nextId).catch(() => {});
          }
        } else if (!opts?.silent) {
          setActiveChatId(null);
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
    [
      session?.id,
      options.departmentId,
      options.agentId,
      options.status,
      options.initialConversationId,
    ],
  );

  const scheduleSilentReload = useCallback(
    (delayMs = 350) => {
      if (reloadTimerRef.current) {
        clearTimeout(reloadTimerRef.current);
      }
      reloadTimerRef.current = setTimeout(() => {
        reloadTimerRef.current = null;
        void reload({ silent: true });
      }, delayMs);
    },
    [reload],
  );

  const selectConversation = useCallback(
    (id: string | null) => {
      if (options.initialConversationId) {
        consumedInitialIdRef.current = options.initialConversationId;
      }
      selectedIdRef.current = id;
      setSelectedId(id);
      setActiveChatId(id);
      if (id) {
        markConversationRead(id);
        setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)));
        void conversationGateway.markAsRead(id).catch(() => {});
      }
    },
    [options.initialConversationId],
  );

  useEffect(() => {
    void reload();
    const blobUrls = localBlobUrlsRef.current;
    return () => {
      setActiveChatId(null);
      if (reloadTimerRef.current) {
        clearTimeout(reloadTimerRef.current);
        reloadTimerRef.current = null;
      }
      for (const blobUrl of blobUrls.values()) {
        URL.revokeObjectURL(blobUrl);
      }
      blobUrls.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id, options.departmentId, options.agentId, options.status]);

  useEffect(() => {
    if (
      options.initialConversationId &&
      consumedInitialIdRef.current !== options.initialConversationId
    ) {
      void reload();
    }
  }, [options.initialConversationId, reload]);

  const loadThread = useCallback(async (conversationId: string) => {
    const [msgs, convCases] = await Promise.all([
      conversationGateway.listMessages(conversationId, { limit: MESSAGES_PAGE_SIZE }),
      conversationGateway.listCasesForConversation(conversationId),
    ]);
    if (selectedIdRef.current !== conversationId) return;
    setMessages(
      (prev) =>
        reconcileThread(prev, msgs, [...pendingMessagesRef.current.values()], conversationId)
          .messages,
    );
    setHasMoreMessages(msgs.length === MESSAGES_PAGE_SIZE);
    hasMoreMessagesRef.current = msgs.length === MESSAGES_PAGE_SIZE;
    setCases(convCases);
  }, []);

  const loadOlderMessages = useCallback(async (): Promise<number> => {
    if (!selectedId || loadingOlderRef.current || !hasMoreMessagesRef.current) return 0;
    const currentMsgs = messagesRef.current;
    const oldest = currentMsgs[0];
    if (!oldest) return 0;
    setLoadingOlderMessages(true);
    loadingOlderRef.current = true;
    try {
      const older = await conversationGateway.listMessages(selectedId, {
        limit: MESSAGES_PAGE_SIZE,
        cursor: oldest.createdAt,
      });
      if (older.length < MESSAGES_PAGE_SIZE) {
        setHasMoreMessages(false);
        hasMoreMessagesRef.current = false;
      }
      if (older.length > 0) {
        const existingIds = new Set(currentMsgs.map((m) => m.id));
        const uniqueOlder = older.filter((m) => !existingIds.has(m.id));
        setMessages((prev) => [...uniqueOlder, ...prev]);
        return uniqueOlder.length;
      }
      return 0;
    } catch {
      toast.error("Error cargando mensajes anteriores");
      return 0;
    } finally {
      setLoadingOlderMessages(false);
      loadingOlderRef.current = false;
    }
  }, [selectedId]);

  const loadUntilFound = useCallback(
    async (predicate: (m: MessageDto) => boolean): Promise<boolean> => {
      if (!selectedId) return false;
      if (messagesRef.current.some(predicate)) return true;
      while (hasMoreMessagesRef.current) {
        const loaded = await loadOlderMessages();
        if (loaded === 0) break;
        if (messagesRef.current.some(predicate)) return true;
      }
      return messagesRef.current.some(predicate);
    },
    [selectedId, loadOlderMessages],
  );

  useEffect(() => {
    if (!selectedId) {
      setLoadingThread(false);
      setMessages([]);
      setHasMoreMessages(false);
      hasMoreMessagesRef.current = false;
      setCases([]);
      setCaseSummary(null);
      setCaseTimeline([]);
      setAutomationState(null);
      setActiveChatId(null);
      return;
    }
    let cancelled = false;
    const controller = new AbortController();
    setLoadingThread(true);
    setMessages([]);
    setHasMoreMessages(false);
    hasMoreMessagesRef.current = false;
    setCases([]);
    setCaseSummary(null);
    setCaseTimeline([]);
    setAutomationState(null);
    setActiveChatId(selectedId);
    markConversationRead(selectedId);

    // Optimísticamente garantizar que la conversación abierta tenga 0 en el badge local
    setConversations((prev) =>
      prev.map((c) => (c.id === selectedId ? { ...c, unreadCount: 0 } : c)),
    );
    void conversationGateway.markAsRead(selectedId).catch(() => {});

    const isAbortError = (err: unknown) => err instanceof Error && err.name === "AbortError";

    (async () => {
      try {
        const needsFetchConv = !conversationsRef.current.some((c) => c.id === selectedId);
        const [singleConvRes, msgsRes, casesRes, automationRes] = await Promise.allSettled([
          needsFetchConv
            ? conversationGateway.getConversation(selectedId, { signal: controller.signal })
            : Promise.resolve(null),
          conversationGateway.listMessages(
            selectedId,
            { limit: MESSAGES_PAGE_SIZE },
            { signal: controller.signal },
          ),
          conversationGateway.listCasesForConversation(selectedId, { signal: controller.signal }),
          conversationGateway.getConversationAutomation(selectedId, { signal: controller.signal }),
        ]);

        if (cancelled || controller.signal.aborted) return;

        if (singleConvRes.status === "fulfilled" && singleConvRes.value) {
          const singleConv = singleConvRes.value;
          setConversations((prev) =>
            prev.some((c) => c.id === singleConv.id) ? prev : [singleConv, ...prev],
          );
        }

        if (casesRes.status === "fulfilled") {
          setCases(casesRes.value);
        }

        if (automationRes.status === "fulfilled") {
          setAutomationState(automationRes.value);
        }

        if (msgsRes.status === "fulfilled") {
          const msgs = msgsRes.value;
          setMessages(
            (prev) =>
              reconcileThread(prev, msgs, [...pendingMessagesRef.current.values()], selectedId)
                .messages,
          );
          setHasMoreMessages(msgs.length === MESSAGES_PAGE_SIZE);
          hasMoreMessagesRef.current = msgs.length === MESSAGES_PAGE_SIZE;
        }

        const primaryError =
          (msgsRes.status === "rejected" && !isAbortError(msgsRes.reason) && msgsRes.reason) ||
          (casesRes.status === "rejected" && !isAbortError(casesRes.reason) && casesRes.reason) ||
          null;
        if (primaryError) {
          toast.error(primaryError instanceof Error ? primaryError.message : "Error cargando chat");
        }
      } finally {
        if (!cancelled) {
          setLoadingThread(false);
        }
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [selectedId]);

  const selected = conversations.find((c) => c.id === selectedId) ?? null;
  const activeCase = useMemo(() => {
    if (!selected) return null;
    const isTerminal = (status?: string) =>
      status === "COMPLETED" || status === "EXPIRED" || status === "CANCELLED";

    // 1. Caso explícitamente asociado a la conversación si aún sigue activo
    const explicitActive = selected.activeCaseId
      ? cases.find((c) => c.id === selected.activeCaseId)
      : null;
    if (explicitActive && !isTerminal(explicitActive.status)) {
      return explicitActive;
    }

    // 2. Cualquier caso en progreso no terminal
    const inProgressCase =
      cases.find((c) => c.status === "WAITING_USER" || c.status === "ACTIVE") ??
      cases.find((c) => c.status === "ESCALATED" || c.status === "HUMAN_ACTIVE") ??
      cases.find((c) => c.status === "NEW" || c.status === "PAUSED");
    if (inProgressCase) {
      return inProgressCase;
    }

    // 3. Si la conversación está resuelta o cerrada, mostrar el último caso completado para consulta histórica
    if (selected.status === "resolved" || selected.status === "closed") {
      return explicitActive ?? cases[0] ?? null;
    }

    // 4. Si la conversación está abierta o en espera pero no tiene un caso en curso, no hay caso activo
    return null;
  }, [cases, selected]);
  activeCaseIdRef.current = activeCase?.id ?? null;

  // Tiempo real: refresca hilo/lista según lo que llegue por SSE (03_REALTIME_NOTIFICATIONS.md §2).
  useEffect(() => {
    return subscribeRealtimeEvents((event) => {
      if (event.type === "MESSAGE_EDITED") {
        const { conversationId, messageId, newBody, editedAt } = event;
        // Actualizar la lista de mensajes en memoria/estado si es la conversación abierta
        if (conversationId === selectedIdRef.current) {
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.id === messageId
                ? {
                    ...msg,
                    body: newBody,
                    editedAt,
                  }
                : msg,
            ),
          );
        }
        // Si la conversación tiene lastMessagePreview, actualizar el snippet si corresponde
        setConversations((prevList) =>
          prevList.map((conv) =>
            conv.id === conversationId && conv.lastMessagePreview
              ? {
                  ...conv,
                  lastMessagePreview: {
                    ...conv.lastMessagePreview,
                    body: newBody,
                    editedAt,
                  },
                }
              : conv,
          ),
        );
        return;
      }
      if (
        event.type === "MESSAGE_RECEIVED" ||
        event.type === "MESSAGE_SENT" ||
        event.type === "MESSAGE_STATUS_UPDATED"
      ) {
        if (
          event.type === "MESSAGE_STATUS_UPDATED" &&
          (event as { status?: string }).status === "failed"
        ) {
          const errRaw = String((event as { errorMessage?: string }).errorMessage || "");
          const is24h =
            errRaw.toLowerCase().includes("24 horas") ||
            errRaw.toLowerCase().includes("24-hour") ||
            errRaw.toLowerCase().includes("131047") ||
            errRaw.toLowerCase().includes("re-engagement") ||
            errRaw.toLowerCase().includes("plantilla") ||
            errRaw.toLowerCase().includes("template");
          if (is24h) {
            toast.error(
              "Ventana de 24h de WhatsApp cerrada: No se pudo entregar el mensaje. Debes enviar una plantilla aprobada (Template) para reabrir la conversación.",
              { duration: 8000 },
            );
          } else {
            toast.error(`Fallo al entregar mensaje en WhatsApp: ${errRaw || "Error de entrega"}`, {
              duration: 5000,
            });
          }
        }
        if (event.conversationId === selectedIdRef.current) {
          void loadThread(event.conversationId);
          void conversationGateway.markAsRead(event.conversationId).catch(() => {});
        }
        scheduleSilentReload();
        return;
      }
      if (
        event.type === "CASE_ESCALATED" ||
        event.type === "CASE_CLAIMED" ||
        event.type === "HUMAN_ASSIGNED" ||
        event.type === "AUTOMATION_ENABLED" ||
        event.type === "AUTOMATION_DISABLED" ||
        event.type === "CASE_SCHEDULED_REMINDER"
      ) {
        const currentCaseId = activeCaseIdRef.current;
        const isCurrentConv =
          ("conversationId" in event && event.conversationId === selectedIdRef.current) ||
          Boolean(currentCaseId && "caseId" in event && event.caseId === currentCaseId);

        if (event.type === "AUTOMATION_DISABLED" && isCurrentConv) {
          setAutomationState({
            caseId: currentCaseId ?? event.caseId,
            enabled: false,
            disabledReason: "manual_override",
          });
        }
        scheduleSilentReload();
        if (selectedIdRef.current && isCurrentConv) {
          void loadThread(selectedIdRef.current);
        }
      }
    });
  }, [scheduleSilentReload, loadThread]);

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
    const currentCaseId = activeCaseIdRef.current;
    if (currentCaseId) void loadCaseSummary(currentCaseId);
    scheduleSilentReload();
  });

  const enqueueOutbound = <T>(task: () => Promise<T>): Promise<T> => {
    const run = outboundQueueRef.current.then(task, task);
    outboundQueueRef.current = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  };

  const releaseLocalBlob = (id: string) => {
    const url = localBlobUrlsRef.current.get(id);
    if (!url) return;
    URL.revokeObjectURL(url);
    localBlobUrlsRef.current.delete(id);
  };

  const dropPending = (id: string) => {
    pendingMessagesRef.current.delete(id);
    releaseLocalBlob(id);
  };

  useEffect(() => {
    if (!selectedId) return;
    const threadMatches =
      messages.length === 0 ||
      messages.every(
        (message) => message.conversationId === selectedId || isLocalMessage(message.id),
      );
    if (!threadMatches) return;
    for (const [id, message] of pendingMessagesRef.current) {
      if (message.conversationId !== selectedId) continue;
      if (!messages.some((item) => item.id === id)) pendingMessagesRef.current.delete(id);
    }
    for (const id of [...localBlobUrlsRef.current.keys()]) {
      if (pendingMessagesRef.current.has(id)) continue;
      if (messages.some((item) => item.id === id)) continue;
      releaseLocalBlob(id);
    }
  }, [messages, selectedId]);

  const showLocalMessage = (message: MessageDto) => {
    pendingMessagesRef.current.set(message.id, message);
    if (selectedIdRef.current === message.conversationId) {
      setMessages((prev) =>
        prev.some((item) => item.id === message.id) ? prev : [...prev, message],
      );
    }
    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === message.conversationId
          ? {
              ...conversation,
              lastActivityAt: message.createdAt,
              lastMessagePreview: {
                body: message.caption || message.body || message.filename || "Archivo",
                author: "agent",
                direction: "outbound",
                createdAt: message.createdAt,
              },
            }
          : conversation,
      ),
    );
  };

  const replaceLocalMessage = (tempId: string, real: MessageDto) => {
    pendingMessagesRef.current.delete(tempId);
    if (selectedIdRef.current !== real.conversationId) {
      releaseLocalBlob(tempId);
      return;
    }
    setMessages((prev) => {
      if (prev.some((message) => message.id === real.id)) {
        return prev.filter((message) => message.id !== tempId);
      }
      const index = prev.findIndex((message) => message.id === tempId);
      if (index === -1) return [...prev, real];
      const next = prev.slice();
      next[index] = real;
      return next;
    });
  };

  const failLocalMessage = (tempId: string, errorMessage: string) => {
    const current = pendingMessagesRef.current.get(tempId);
    if (!current) return;
    const failed: MessageDto = { ...current, status: "failed", errorMessage };
    pendingMessagesRef.current.set(tempId, failed);
    if (selectedIdRef.current !== current.conversationId) return;
    setMessages((prev) => prev.map((message) => (message.id === tempId ? failed : message)));
  };

  const createLocalMessage = (
    conversationId: string,
    agentId: string,
    partial: Pick<MessageDto, "body" | "type"> & Partial<MessageDto>,
  ): MessageDto => ({
    id: createLocalMessageId(),
    conversationId,
    caseId: activeCase?.id ?? null,
    direction: "outbound",
    author: "agent",
    agentId,
    agentName: session?.name ?? null,
    createdAt: new Date().toISOString(),
    ...partial,
  });

  const sendReply = (body: string) => {
    if (!session || !selectedId) return Promise.resolve(false);
    const trimmed = body.trim();
    if (!trimmed) return Promise.resolve(false);
    const conversationId = selectedId;
    const agentId = session.id;
    const local = createLocalMessage(conversationId, agentId, { body: trimmed, type: "text" });
    showLocalMessage(local);
    return enqueueOutbound(async () => {
      try {
        const message = await conversationGateway.replyAsHuman(conversationId, agentId, trimmed);
        replaceLocalMessage(local.id, message);
        void refreshActiveCase();
        return true;
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "No se pudo enviar";
        failLocalMessage(local.id, errorMessage);
        toast.error(errorMessage);
        return true;
      }
    });
  };

  const sendMedia = (
    file: File,
    kind: OutboundMediaKind,
    caption: string,
  ): Promise<"sent" | "failed" | "text-failed"> => {
    if (!session || !selectedId) {
      toast.error("No se pudo enviar el archivo");
      return Promise.resolve("failed");
    }
    const trimmedCaption = caption.trim();
    const conversationId = selectedId;
    const agentId = session.id;
    const previewUrl = URL.createObjectURL(file);
    const local = createLocalMessage(conversationId, agentId, {
      body: kind === "audio" ? "" : trimmedCaption,
      caption: kind === "audio" ? undefined : trimmedCaption || undefined,
      type: kind,
      filename: file.name,
      mimeType: file.type || undefined,
      mediaUrl: previewUrl,
    });
    localBlobUrlsRef.current.set(local.id, previewUrl);
    showLocalMessage(local);
    const textLocal =
      kind === "audio" && trimmedCaption
        ? createLocalMessage(conversationId, agentId, { body: trimmedCaption, type: "text" })
        : null;
    if (textLocal) showLocalMessage(textLocal);
    return enqueueOutbound(async () => {
      try {
        const message = await conversationGateway.replyWithMedia(conversationId, file, {
          type: kind,
          caption: kind === "audio" ? undefined : trimmedCaption,
        });
        replaceLocalMessage(local.id, message);
        if (textLocal) {
          try {
            const textMessage = await conversationGateway.replyAsHuman(
              conversationId,
              agentId,
              trimmedCaption,
            );
            replaceLocalMessage(textLocal.id, textMessage);
          } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "No se pudo enviar el texto";
            failLocalMessage(textLocal.id, errorMessage);
            toast.error(`El audio se envió, pero el texto no: ${errorMessage}`);
            void refreshActiveCase();
            return "text-failed";
          }
        }
        void refreshActiveCase();
        return "sent";
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "No se pudo enviar el archivo";
        failLocalMessage(local.id, errorMessage);
        if (textLocal) dropPending(textLocal.id);
        if (selectedIdRef.current === conversationId) {
          setMessages((prev) => prev.filter((message) => message.id !== textLocal?.id));
        }
        toast.error(errorMessage);
        return "failed";
      }
    });
  };

  const sendTemplate = async (
    templateName: string,
    languageCode = "es",
    parameters: string[] = [],
  ): Promise<boolean> => {
    if (!selectedId) return false;
    setSending(true);
    try {
      const message = await conversationGateway.sendTemplate(
        selectedId,
        templateName,
        languageCode,
        parameters,
      );
      setMessages((prev) => [...prev, message]);
      await refreshActiveCase();
      toast.success("Plantilla enviada exitosamente");
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al enviar plantilla");
      return false;
    } finally {
      setSending(false);
    }
  };

  const closeConversation = async () => {
    if (!selectedId) return false;
    setSending(true);
    try {
      await conversationGateway.closeConversation(selectedId);
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === selectedId ? { ...conversation, status: "closed" } : conversation,
        ),
      );
      toast.success("Conversación cerrada");
      scheduleSilentReload();
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo cerrar la conversación");
      return false;
    } finally {
      setSending(false);
    }
  };

  const deriveConversation = async (departmentId: string, reason: string) => {
    if (!selectedId) return false;
    setSending(true);
    try {
      const result = await conversationGateway.deriveConversation(selectedId, departmentId, reason);
      toast.success(`Conversación derivada a ${result.departmentName}`);
      await loadThread(selectedId);
      scheduleSilentReload();
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo derivar la conversación");
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
      setAutomationState({
        caseId: activeCase?.id ?? "",
        enabled: false,
        disabledReason: "manual_override",
      });
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedId
            ? {
                ...c,
                activeCase: c.activeCase
                  ? {
                      ...c.activeCase,
                      automationEnabled: false,
                      status: "HUMAN_ACTIVE",
                      assignedAgentId: session.id,
                      assignedAgentName: session.name,
                    }
                  : undefined,
              }
            : c,
        ),
      );
      setCases((prev) =>
        prev.map((cs) =>
          cs.id === activeCase?.id
            ? {
                ...cs,
                status: "HUMAN_ACTIVE",
                assignedAgentId: session.id,
                automation: {
                  ...cs.automation,
                  enabled: false,
                  disabledReason: "manual_override",
                  disabledAt: new Date().toISOString(),
                },
              }
            : cs,
        ),
      );
      toast.success("Control tomado");
      scheduleSilentReload();
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
    setSelectedId: selectConversation,
    messages,
    cases,
    activeCase,
    automationState,
    caseSummary,
    caseTimeline,
    loadCaseSummary,
    loading,
    loadingThread,
    busy: sending || caseActions.busy,
    reload,
    hasMoreMessages,
    loadingOlderMessages,
    loadOlderMessages,
    loadUntilFound,
    sendReply,
    sendMedia,
    sendTemplate,
    takeControl,
    closeConversation,
    deriveConversation,
    claim: () => (activeCase ? caseActions.claim(activeCase.id) : Promise.resolve(false)),
    assign: (agentUserId: string) =>
      activeCase ? caseActions.assign(activeCase.id, agentUserId) : Promise.resolve(false),
    reassign: (agentUserId: string) =>
      activeCase ? caseActions.reassign(activeCase.id, agentUserId) : Promise.resolve(false),
    complete: (closeReason?: caseGateway.CloseReason, note?: string) =>
      activeCase
        ? caseActions.complete(activeCase.id, closeReason ?? "RESOLVED", note)
        : Promise.resolve(false),
    schedule: (scheduledAt: string, scheduleTag?: string, reminderReason?: string) =>
      activeCase
        ? caseActions.schedule(activeCase.id, scheduledAt, scheduleTag, reminderReason)
        : Promise.resolve(false),
    cancel: (reason: string) =>
      activeCase ? caseActions.cancel(activeCase.id, reason) : Promise.resolve(false),
    transfer: (toDepartmentId: string | undefined, reason: string, toAgentId?: string) =>
      activeCase
        ? caseActions.transfer(activeCase.id, toDepartmentId, reason, toAgentId)
        : Promise.resolve(false),
    disableAutomation: (reason: string) =>
      activeCase ? caseActions.disableAutomation(activeCase.id, reason) : Promise.resolve(false),
    reactivateAutomation: () =>
      activeCase ? caseActions.reactivateAutomation(activeCase.id) : Promise.resolve(false),
    advanceCase: (entities: Record<string, unknown>) =>
      activeCase ? caseActions.advance(activeCase.id, entities) : Promise.resolve(false),
    syncCaseData: () => (activeCase ? caseActions.syncData(activeCase.id) : Promise.resolve(false)),
    syncBalance: () =>
      activeCase ? caseActions.syncBalance(activeCase.id) : Promise.resolve(false),
    diagnoseCase: (contractId?: string) =>
      activeCase ? caseActions.diagnose(activeCase.id, contractId) : Promise.resolve(false),
  };
}
