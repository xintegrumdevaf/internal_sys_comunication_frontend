import {
  AlertCircle,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Bot,
  Search,
  User,
  CheckCheck,
  CheckCircle2,
  RotateCw,
  Wifi,
  WifiOff,
  UserRound,
  Lock,
  ShieldCheck,
  UserCheck,
  PanelRightClose,
  Info,
  ArrowLeft,
  Edit2,
  Zap,
  FileText,
  ChevronUp,
  ChevronDown,
  X,
  ArrowUp,
  Loader2,
  Paperclip,
  SendHorizontal,
  Image as ImageIcon,
  Video,
  File as FileIcon,
  Mic,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { MessageMediaBody } from "@/modules/conversations/ui/MessageMediaBody";
import { InboxStatusTabs } from "./InboxStatusTabs";
import { ConversationListItem, ConversationListItemSkeleton } from "./ConversationListItem";
import { usePreservedListScroll } from "./use-preserved-list-scroll";
import { ChatHeader } from "./ChatHeader";
import { ChatSearchBar } from "./ChatSearchBar";
import { ChatMessageItem } from "./ChatMessageItem";
import { ChatComposer } from "./ChatComposer";
import { ConversationAvatar, MessageAvatar } from "./ConversationAvatars";
import { formatDeliveryError } from "./delivery-error";
import { InboxInternalNoteComposer } from "@/modules/internal-chat/ui/InboxInternalNoteComposer";
import { CasePanel } from "@/modules/cases/ui/CasePanel";
import { CaseSummaryDialog } from "@/modules/cases/ui/CaseSummaryDialog";
import { CompleteCaseModal } from "@/modules/cases/ui/CompleteCaseModal";
import { ScheduleCaseModal } from "@/modules/cases/ui/ScheduleCaseModal";
import type { CloseReason } from "@/modules/cases/infrastructure/case.gateway";
import { ZernioSyncControl } from "@/modules/conversations/ui/ZernioSyncControl";
import { SendTemplateModal } from "@/modules/conversations/ui/SendTemplateModal";
import { CloseConversationModal } from "@/modules/conversations/ui/CloseConversationModal";
import { QuickReplyDropdown } from "@/components/chat/QuickReplyDropdown";
import { useQuickReplyAutocomplete } from "@/hooks/useQuickReplyAutocomplete";
import { useEmojiInsertion } from "@/hooks/useEmojiInsertion";
import { EmojiPickerPopover } from "@/components/common/EmojiPickerPopover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { ZernioSyncStatus } from "@/types/department";
import { useSlaConfig } from "@/modules/sla/application/use-sla-config";
import { calculateConversationSla, formatSlaWaitTime } from "@/modules/sla/domain/sla-config";
import { SlaSettingsModal } from "@/modules/sla/ui/SlaSettingsModal";
import { ContactDialog } from "@/modules/customers/ui/ContactDialog";
import { customerGateway } from "@/modules/customers/infrastructure/customer.gateway";
import type { CustomerDto } from "@/modules/customers/domain/customer";
import { searchConversations } from "@/modules/conversations/infrastructure/conversation.gateway";

import {
  caseStatusLabel,
  extractSchedulingMetadata,
  workflowLabel,
  type CaseDto,
} from "@/modules/cases/domain/case";
import {
  conversationDisplayName,
  conversationStatusLabel,
  formatWaPhone,
  matchesConversationSearch,
  type ConversationDto,
  type ConversationStatus,
  type MessageAuthor,
  type MessagePreviewDto,
} from "@/modules/conversations/domain/conversation";
import { messageClock, relativeTime, dayLabel } from "@/shared/datetime";
import { avatarColorFromSeed } from "@/shared/avatar-color";
import {
  isCustomerServiceWindowClosed,
  isWhatsAppSessionWindowError,
} from "@/modules/conversations/domain/customer-service-window";
import { useOperationalInbox } from "@/modules/conversations/application/use-operational-inbox";
import {
  filesFromClipboard,
  formatOutboundFileSize,
  OUTBOUND_MEDIA_RULES,
  validateOutboundMedia,
  type OutboundMediaKind,
} from "@/modules/conversations/domain/outbound-media";
import { resolvePastedClipboardFile } from "@/modules/conversations/ui/paste-outbound-image";
import {
  useDepartmentsQuery,
  useDirectoryUsers,
  useSession,
} from "@/modules/identity/application/use-session";
import {
  canAccessDepartment,
  isSupervisorSession,
} from "@/modules/identity/application/access-control";
import { useRealtimeConnected } from "@/modules/realtime/application/use-realtime";

export type InboxTab = "open" | "unassigned" | "unattended" | "pending" | "resolved" | "closed";

function pasteTargetBlocksChat(
  target: EventTarget | null,
  composer: HTMLTextAreaElement | null,
): boolean {
  if (!(target instanceof Node)) return false;
  if (composer && (target === composer || composer.contains(target))) return false;
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
}

export type Props = {
  initialDepartmentId?: string;
  initialAgentId?: string;
  initialConversationId?: string | null;
  initialStatus?: ConversationStatus;
  initialTab?: InboxTab;
  initialFilter?: "unassigned" | "unattended";
  onClearInitialConversation?: () => void;
  onFilterChange?: (filters: { departmentId?: string; agentId?: string; tab?: InboxTab }) => void;
};

const STATUS_TABS: { value: ConversationStatus; label: string }[] = [
  { value: "open", label: "Abiertas" },
  { value: "pending", label: "En espera" },
  { value: "resolved", label: "Resueltas" },
  { value: "closed", label: "Cerradas" },
];

function formatLastMessagePreview(preview: MessagePreviewDto | null | undefined): string {
  if (!preview || !preview.body) return "Todavía no hay mensajes";
  const body = preview.body.trim();
  if (/^\[?(image|imagen|photo|foto)\]?$/i.test(body)) {
    return "📷 Foto";
  }
  if (/^\[?(audio|voice note|nota de voz)\]?$/i.test(body)) {
    return "🎵 Audio";
  }
  if (/^\[?(video)\]?$/i.test(body)) {
    return "🎥 Video";
  }
  if (/^\[?(document|documento|archivo|file)\]?$/i.test(body)) {
    return "📄 Documento";
  }
  if (/^\[?(sticker)\]?$/i.test(body)) {
    return "💟 Sticker";
  }
  if (body.startsWith("Ubicación GPS") || body.includes("google.com/maps")) {
    return "📍 Ubicación";
  }
  return body;
}

const MEDIA_ATTACH_OPTIONS: Array<{
  kind: OutboundMediaKind;
  label: string;
  icon: typeof ImageIcon;
  bubble: string;
}> = [
  {
    kind: "image",
    label: "Imagen",
    icon: ImageIcon,
    bubble: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  },
  {
    kind: "video",
    label: "Video",
    icon: Video,
    bubble: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  },
  {
    kind: "audio",
    label: "Audio",
    icon: Mic,
    bubble: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  },
  {
    kind: "document",
    label: "Documento",
    icon: FileIcon,
    bubble: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  },
];

export function OperationalInbox({
  initialDepartmentId,
  initialAgentId,
  initialConversationId,
  initialStatus,
  initialTab,
  initialFilter,
  onClearInitialConversation,
  onFilterChange,
}: Props) {
  const [activeTab, setActiveTab] = useState<InboxTab>(
    initialTab ??
      (initialFilter ? (initialFilter as InboxTab) : ((initialStatus as InboxTab) ?? "open")),
  );
  const session = useSession();
  const { data: departments = [] } = useDepartmentsQuery();
  const directory = useDirectoryUsers();

  const [departmentId, setDepartmentId] = useState<string | undefined>(
    initialDepartmentId ?? session?.primaryDepartmentId ?? undefined,
  );

  const isSupervisorOrAdmin = isSupervisorSession(session);

  // Para supervisores/admins: ven todas las áreas activas.
  // Para agentes estándar: ven únicamente sus departamentos asignados.
  const visibleDepartments = useMemo(() => {
    if (!session) return [];
    if (isSupervisorOrAdmin) {
      return departments.filter((d) => d.active && canAccessDepartment(session, d));
    }
    const userDeptIds = new Set(
      [session.primaryDepartmentId, ...(session.departmentIds ?? [])].filter((id): id is string =>
        Boolean(id),
      ),
    );
    return departments.filter((d) => d.active && userDeptIds.has(d.id));
  }, [departments, session, isSupervisorOrAdmin]);

  // Si es un agente estándar, asegurar que departmentId esté acotado a su departamento asignado
  useEffect(() => {
    if (!isSupervisorOrAdmin && session?.primaryDepartmentId) {
      if (!departmentId || !visibleDepartments.some((d) => d.id === departmentId)) {
        setDepartmentId(session.primaryDepartmentId);
      }
    }
  }, [isSupervisorOrAdmin, session?.primaryDepartmentId, departmentId, visibleDepartments]);

  const [agentFilter, setAgentFilter] = useState<"all" | "mine" | string>(initialAgentId ?? "all");

  // Sincronizar estado si cambian los props iniciales por navegación
  useEffect(() => {
    if (initialDepartmentId !== undefined) {
      setDepartmentId(initialDepartmentId);
    }
  }, [initialDepartmentId]);

  useEffect(() => {
    if (initialAgentId !== undefined) {
      setAgentFilter(initialAgentId);
    }
  }, [initialAgentId]);

  useEffect(() => {
    if (initialTab !== undefined) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Notificar al contenedor para conservar filtros en la URL al recargar con F5
  useEffect(() => {
    onFilterChange?.({
      departmentId,
      agentId: agentFilter === "all" || agentFilter === "mine" ? undefined : agentFilter,
      tab: activeTab,
    });
  }, [departmentId, agentFilter, activeTab, onFilterChange]);

  // Filtrar agentes según el departamento activo y el rol del usuario
  const visibleAgents = useMemo(() => {
    return directory.filter((a) => {
      if (!a.active || a.id === session?.id) return false;
      if (departmentId) {
        return a.primaryDepartmentId === departmentId || a.departmentIds.includes(departmentId);
      }
      if (!isSupervisorOrAdmin && session) {
        const myDepts = new Set([session.primaryDepartmentId, ...(session.departmentIds ?? [])]);
        return (
          (a.primaryDepartmentId && myDepts.has(a.primaryDepartmentId)) ||
          a.departmentIds.some((dId) => myDepts.has(dId))
        );
      }
      return true;
    });
  }, [directory, session, departmentId, isSupervisorOrAdmin]);

  // Si cambia el departamento y el agente filtrado no pertenece a él, volver a 'all'
  useEffect(() => {
    if (departmentId && agentFilter !== "all" && agentFilter !== "mine") {
      const selectedAgent = directory.find((a) => a.id === agentFilter);
      if (
        selectedAgent &&
        selectedAgent.primaryDepartmentId !== departmentId &&
        !selectedAgent.departmentIds.includes(departmentId)
      ) {
        setAgentFilter("all");
      }
    }
  }, [departmentId, agentFilter, directory]);
  const backendStatus: ConversationStatus =
    activeTab === "pending"
      ? "pending"
      : activeTab === "resolved"
        ? "resolved"
        : activeTab === "closed"
          ? "closed"
          : "open";
  const [search, setSearch] = useState("");
  const [deepSearchResults, setDeepSearchResults] = useState<ConversationDto[]>([]);
  const [isSearchingServer, setIsSearchingServer] = useState(false);

  useEffect(() => {
    const query = search.trim();
    if (query.length < 3) {
      setDeepSearchResults([]);
      setIsSearchingServer(false);
      return;
    }

    let isCurrent = true;
    setIsSearchingServer(true);

    const timer = setTimeout(async () => {
      try {
        const results = await searchConversations(query, {
          departmentId: departmentId || undefined,
          limit: 30,
        });
        if (isCurrent) {
          setDeepSearchResults(results);
        }
      } catch {
        if (isCurrent) {
          setDeepSearchResults([]);
        }
      } finally {
        if (isCurrent) {
          setIsSearchingServer(false);
        }
      }
    }, 350);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [search, departmentId]);

  const agentIdParam =
    agentFilter === "all" ? undefined : agentFilter === "mine" ? session?.id : agentFilter;

  const {
    session: _session,
    conversations,
    selected: hookSelected,
    selectedId,
    setSelectedId: rawSetSelectedId,
    messages,
    hasMoreMessages,
    loadingOlderMessages,
    loadOlderMessages,
    loadUntilFound,
    activeCase,
    automationState,
    caseSummary,
    caseTimeline,
    loadCaseSummary,
    loading,
    busy,
    reload,
    takeControl,
    claim,
    complete,
    schedule,
    cancel,
    transfer,
    disableAutomation,
    reactivateAutomation,
    advanceCase,
    syncCaseData,
    diagnoseCase,
    syncBalance,
    sendReply,
    sendMedia,
    sendTemplate,
    closeConversation,
    deriveConversation,
  } = useOperationalInbox({
    departmentId,
    agentId: agentIdParam,
    status: "all",
    initialConversationId,
  });

  const setSelectedId = useCallback(
    (id: string | null) => {
      rawSetSelectedId(id);
      if (initialConversationId && id !== initialConversationId) {
        onClearInitialConversation?.();
      }
    },
    [rawSetSelectedId, initialConversationId, onClearInitialConversation],
  );

  const syncedDeepLinkIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!initialConversationId) {
      syncedDeepLinkIdRef.current = null;
      return;
    }
    if (
      hookSelected &&
      hookSelected.id === initialConversationId &&
      syncedDeepLinkIdRef.current !== initialConversationId
    ) {
      syncedDeepLinkIdRef.current = initialConversationId;
      if (
        hookSelected.status === "pending" ||
        hookSelected.status === "resolved" ||
        hookSelected.status === "closed"
      ) {
        setActiveTab(hookSelected.status);
      }
    }
  }, [initialConversationId, hookSelected]);

  // Mantener la conversación abierta mientras el agente esté trabajando en ella,
  // incluso si en segundo plano cambia de estado (ej. de "pending" a "open" al recibir mensaje).
  // Solo se limpia explícitamente al cambiar de pestaña (`handleTabChange`) o finalizar (`handleComplete`).
  const selected = hookSelected;

  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);

  const handleSchedule = async (
    scheduledAt: string,
    scheduleTag?: string,
    reminderReason?: string,
  ) => {
    const ok = await schedule(scheduledAt, scheduleTag, reminderReason);
    if (ok !== false) {
      setActiveTab("pending");
      await reload({ silent: true });
    }
    return ok;
  };

  const handleComplete = async (closeReason?: CloseReason, resolutionNote?: string) => {
    const ok = await complete(closeReason, resolutionNote);
    if (ok !== false) {
      setSelectedId(null);
      await reload({ silent: true });
    }
    return ok;
  };

  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);

  const handleCloseConversation = () => {
    setCloseConfirmOpen(true);
  };

  const handleDeriveConversation = async (departmentId: string, reason: string) => {
    await deriveConversation(departmentId, reason);
  };

  const confirmCloseConversation = async () => {
    const ok = await closeConversation();
    if (ok) {
      setCloseConfirmOpen(false);
      setSelectedId(null);
      await reload({ silent: true });
    }
  };

  const connected = useRealtimeConnected();
  const [draft, setDraft] = useState("");
  const draftRef = useRef("");
  const setComposerDraft = useCallback((value: string | ((prev: string) => string)) => {
    setDraft((prev) => {
      const next = typeof value === "function" ? value(prev) : value;
      draftRef.current = next;
      return next;
    });
  }, []);
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
  const attachMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pickKindRef = useRef<OutboundMediaKind>("document");
  const [pendingAttachment, setPendingAttachment] = useState<{
    file: File;
    kind: OutboundMediaKind;
    previewUrl: string | null;
  } | null>(null);
  const pendingPreviewUrlRef = useRef<string | null>(null);
  const attachmentSeqRef = useRef(0);

  useEffect(() => {
    pendingPreviewUrlRef.current = pendingAttachment?.previewUrl ?? null;
  }, [pendingAttachment]);

  useEffect(() => {
    return () => {
      if (pendingPreviewUrlRef.current) URL.revokeObjectURL(pendingPreviewUrlRef.current);
    };
  }, []);

  const clearPendingAttachment = useCallback(() => {
    setPendingAttachment((current) => {
      if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
      return null;
    });
  }, []);

  const openFilePicker = (kind: OutboundMediaKind) => {
    pickKindRef.current = kind;
    const input = fileInputRef.current;
    if (!input) return;
    input.accept = OUTBOUND_MEDIA_RULES[kind].accept;
    input.value = "";
    setIsAttachMenuOpen(false);
    input.click();
  };

  const stageOutboundFile = useCallback((file: File, kind: OutboundMediaKind) => {
    attachmentSeqRef.current += 1;
    const check = validateOutboundMedia(file, kind);
    if (!check.ok) {
      toast.error(check.message);
      return false;
    }
    const previewUrl = check.kind === "document" ? null : URL.createObjectURL(file);
    setPendingAttachment((current) => {
      if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
      return { file, kind: check.kind, previewUrl };
    });
    return true;
  }, []);

  const handlePickedFile = (list: FileList | null) => {
    const file = list?.[0];
    if (!file) return;
    stageOutboundFile(file, pickKindRef.current);
  };

  useEffect(() => {
    if (!isAttachMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target as Node)) {
        setIsAttachMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isAttachMenuOpen]);

  const {
    isOpen: isEmojiOpen,
    setIsOpen: setIsEmojiOpen,
    inputRef: chatInputRef,
    containerRef: emojiContainerRef,
    insertEmoji,
  } = useEmojiInsertion<HTMLTextAreaElement>(draft, setComposerDraft);

  const stagePastedFile = useCallback(
    async (file: File, hasMore: boolean) => {
      const seq = ++attachmentSeqRef.current;
      const resolved = await resolvePastedClipboardFile(file);
      if (seq !== attachmentSeqRef.current) return;
      if (!resolved.ok) {
        toast.error(resolved.message);
        return;
      }
      const staged = stageOutboundFile(resolved.file, resolved.kind);
      if (!staged) return;
      if (hasMore) {
        toast.info("Solo se adjunta el primer archivo. El chat envía un archivo a la vez.");
      }
      chatInputRef.current?.focus();
    },
    [chatInputRef, stageOutboundFile],
  );

  const adjustTextareaHeight = useCallback(() => {
    const el = chatInputRef.current;
    if (!el) return;
    el.style.height = "auto";
    const scrollHeight = el.scrollHeight;
    if (scrollHeight > 140) {
      el.style.height = "140px";
      el.style.overflowY = "auto";
    } else {
      el.style.height = `${Math.max(scrollHeight, 40)}px`;
      el.style.overflowY = "hidden";
    }
  }, [chatInputRef]);

  useEffect(() => {
    adjustTextareaHeight();
  }, [draft, adjustTextareaHeight]);

  const currentConversationDepartmentId =
    activeCase?.departmentId ?? selected?.activeCase?.departmentId ?? departmentId;

  const {
    isOpen: isQuickReplyOpen,
    filtered: quickReplyFiltered,
    selectedIndex: quickReplySelectedIndex,
    selectReply: selectQuickReply,
    handleKeyDown: handleQuickReplyKeyDown,
  } = useQuickReplyAutocomplete({
    inputText: draft,
    departmentId: currentConversationDepartmentId,
    conversationId: selectedId ?? undefined,
    onSelect: (interpolatedText) => {
      const normalized = interpolatedText.replace(/\\n/g, "\n").replace(/\r\n/g, "\n");
      setComposerDraft((prev) => {
        const slashIndex = prev.lastIndexOf("/");
        if (slashIndex !== -1) {
          return prev.slice(0, slashIndex) + normalized;
        }
        return normalized;
      });
      setTimeout(() => {
        if (chatInputRef.current) {
          chatInputRef.current.focus();
          chatInputRef.current.style.height = "auto";
          const newHeight = Math.min(Math.max(chatInputRef.current.scrollHeight, 36), 140);
          chatInputRef.current.style.height = `${newHeight}px`;
        }
      }, 50);
    },
  });

  const [summaryOpen, setSummaryOpen] = useState(false);
  const messagesScrollRef = useRef<HTMLDivElement>(null);

  const [currentSyncStatus, setCurrentSyncStatus] = useState<ZernioSyncStatus | null>(null);
  const [syncCompletedBanner, setSyncCompletedBanner] = useState<{
    show: boolean;
    count: number;
  } | null>(null);

  useEffect(() => {
    const handleRefresh = () => {
      void reload({ silent: true });
    };

    const handleSyncStatusChanged = (event: Event) => {
      const customEvent = event as CustomEvent<ZernioSyncStatus | null>;
      if (customEvent.detail !== undefined) {
        setCurrentSyncStatus(customEvent.detail);
      }
    };

    const handleSyncComplete = (event: Event) => {
      const customEvent = event as CustomEvent<ZernioSyncStatus>;
      const detail = customEvent.detail;
      if (detail) {
        setCurrentSyncStatus(detail);
        setSyncCompletedBanner({
          show: true,
          count: detail.totalMessagesSynced ?? 0,
        });
      }
      void reload({ silent: true });
    };

    window.addEventListener("refresh-conversations", handleRefresh);
    window.addEventListener("zernio-sync-status-changed", handleSyncStatusChanged);
    window.addEventListener("zernio-sync-completed", handleSyncComplete);

    return () => {
      window.removeEventListener("refresh-conversations", handleRefresh);
      window.removeEventListener("zernio-sync-status-changed", handleSyncStatusChanged);
      window.removeEventListener("zernio-sync-completed", handleSyncComplete);
    };
  }, [reload]);

  // Panel de detalles: se abre solo cuando hay un caso con informacion util
  // y se puede plegar a una pestania angosta (como un sidebar) — nunca
  // ocupa espacio mostrando un aviso vacio si no hace falta. El agente
  // igual puede abrirlo/cerrarlo a mano; la eleccion manual se olvida al
  // cambiar de conversacion para que el comportamiento automatico siga
  // siendo predecible.
  const [detailsOverride, setDetailsOverride] = useState<boolean | null>(null);
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  useEffect(() => {
    setDetailsOverride(null);
    setMobileDetailsOpen(false);
  }, [selectedId]);
  const detailsOpen = detailsOverride ?? Boolean(activeCase);

  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDto | null>(null);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [, setLoadingContact] = useState(false);

  const selectedPhone = selected?.waPhone;
  useEffect(() => {
    let active = true;
    if (!selectedPhone) {
      setSelectedCustomer(null);
      return;
    }
    customerGateway
      .list({ search: selectedPhone, limit: 1 })
      .then((res) => {
        if (!active) return;
        const found = res.data?.find(
          (c) => c.waPhone?.replace(/\D/g, "") === selectedPhone.replace(/\D/g, ""),
        );
        setSelectedCustomer(found ?? null);
      })
      .catch(() => {
        if (active) setSelectedCustomer(null);
      });

    return () => {
      active = false;
    };
  }, [selectedPhone]);

  const handleOpenContact = async () => {
    if (!selected) return;
    if (selectedCustomer) {
      setContactDialogOpen(true);
      return;
    }
    setLoadingContact(true);
    try {
      const res = await customerGateway.list({ search: selected.waPhone, limit: 1 });
      const found = res.data?.find(
        (c) => c.waPhone?.replace(/\D/g, "") === selected.waPhone.replace(/\D/g, ""),
      );
      if (found) {
        setSelectedCustomer(found);
      }
      setContactDialogOpen(true);
    } catch {
      setContactDialogOpen(true);
    } finally {
      setLoadingContact(false);
    }
  };

  const { config: slaConfig } = useSlaConfig();
  const [slaModalOpen, setSlaModalOpen] = useState(false);
  const [slaAlertsOnly, setSlaAlertsOnly] = useState(false);
  const [, setTicker] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTicker((t) => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  const breachedSlaCount = useMemo(() => {
    return conversations.filter((c) => calculateConversationSla(c, slaConfig).isBreached).length;
  }, [conversations, slaConfig]);

  const openConversations = useMemo(
    () => conversations.filter((c) => c.status === "open"),
    [conversations],
  );

  const openCount = openConversations.length;

  const unassignedCount = useMemo(
    () => openConversations.filter((c) => !c.activeCase?.assignedAgentId).length,
    [openConversations],
  );

  const unattendedCount = useMemo(
    () =>
      openConversations.filter(
        (c) => (c.unreadCount ?? 0) > 0 || calculateConversationSla(c, slaConfig).isBreached,
      ).length,
    [openConversations, slaConfig],
  );

  const pendingCount = useMemo(
    () => conversations.filter((c) => c.status === "pending").length,
    [conversations],
  );

  const resolvedCount = useMemo(
    () => conversations.filter((c) => c.status === "resolved").length,
    [conversations],
  );

  const closedCount = useMemo(
    () => conversations.filter((c) => c.status === "closed").length,
    [conversations],
  );

  const filteredConversations = useMemo(() => {
    let list: ConversationDto[] = [];
    if (activeTab === "open") {
      list = openConversations;
    } else if (activeTab === "unassigned") {
      // Estrictamente abiertas y sin agente asignado
      list = openConversations.filter((c) => !c.activeCase?.assignedAgentId);
    } else if (activeTab === "unattended") {
      // Estrictamente abiertas con cliente en espera o SLA vencido
      list = openConversations.filter(
        (c) => (c.unreadCount ?? 0) > 0 || calculateConversationSla(c, slaConfig).isBreached,
      );
    } else if (activeTab === "pending") {
      // Casos en pausa, agendados o esperando respuesta del cliente
      list = conversations.filter((c) => c.status === "pending");
    } else if (activeTab === "resolved") {
      list = conversations.filter((c) => c.status === "resolved");
    } else if (activeTab === "closed") {
      list = conversations.filter((c) => c.status === "closed");
    }

    if (slaAlertsOnly) {
      list = list.filter((c) => calculateConversationSla(c, slaConfig).isBreached);
    }
    if (agentFilter === "unassigned") {
      list = list.filter((c) => !c.activeCase?.assignedAgentId && !c.lastAttendedBy?.agentId);
    }
    if (!search.trim()) return list;

    // 1. Filtrado instantáneo en memoria para la bandeja actual
    const inMemoryMatches = list.filter((c) => {
      const attendedName =
        c.lastAttendedBy?.agentName?.trim() ||
        (c.lastAttendedBy?.agentId
          ? c.lastAttendedBy.agentId === session?.id
            ? session?.name || "Tú"
            : directory.find((a) => a.id === c.lastAttendedBy?.agentId)?.name
          : null);
      return matchesConversationSearch(c, search, { attendedName });
    });

    if (search.trim().length < 3 || deepSearchResults.length === 0) {
      return inMemoryMatches;
    }

    // 2. Combinación con resultados de búsqueda profunda desde PostgreSQL
    const serverMap = new Map<string, ConversationDto>();
    for (const item of deepSearchResults) {
      serverMap.set(item.id, item);
    }

    const inMemoryIds = new Set(inMemoryMatches.map((c) => c.id));

    // Si la conversación ya está en memoria, enriquecerla con matchedMessage si el servidor lo encontró
    const enrichedInMemory = inMemoryMatches.map((c) => {
      const serverMatch = serverMap.get(c.id);
      if (serverMatch?.matchedMessage) {
        return { ...c, matchedMessage: serverMatch.matchedMessage };
      }
      return c;
    });

    // Conversaciones adicionales encontradas en el historial de la base de datos
    const extraMatches = deepSearchResults.filter((c) => !inMemoryIds.has(c.id));

    return [...enrichedInMemory, ...extraMatches];
  }, [
    conversations,
    openConversations,
    activeTab,
    slaAlertsOnly,
    slaConfig,
    agentFilter,
    search,
    session,
    directory,
    deepSearchResults,
  ]);

  // Un chat nuevo reordena la lista. Sin esto el scroll vuelve a 0 y el agente
  // pierde la fila que estaba mirando. Si ya estaba arriba, se queda arriba.
  const conversationListScroll = usePreservedListScroll(filteredConversations);

  const handleTabChange = (newTab: InboxTab) => {
    setActiveTab(newTab);
    setSelectedId(null);
  };

  // Estado del buscador interactivo dentro de la conversación
  const [isChatSearchOpen, setIsChatSearchOpen] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const [isSearchingHistory, setIsSearchingHistory] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  // Atajo Ctrl+F para abrir el buscador dentro de la conversación activa
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f" && selected) {
        e.preventDefault();
        setIsChatSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selected]);

  // Coincidencias en los mensajes cargados actualmente
  const matchingMessageIds = useMemo(() => {
    const q = chatSearchQuery.trim().toLowerCase();
    if (!q) return [];
    return messages
      .filter(
        (m) =>
          (m.body || "").toLowerCase().includes(q) || (m.caption || "").toLowerCase().includes(q),
      )
      .map((m) => m.id);
  }, [messages, chatSearchQuery]);

  const scrollToMatch = useCallback((msgId: string) => {
    setHighlightedMessageId(msgId);
    setTimeout(() => {
      const el = document.getElementById(`msg-${msgId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 40);
  }, []);

  const handleNextMatch = () => {
    if (matchingMessageIds.length === 0) return;
    const nextIdx = (activeMatchIndex + 1) % matchingMessageIds.length;
    setActiveMatchIndex(nextIdx);
    scrollToMatch(matchingMessageIds[nextIdx]);
  };

  const handlePrevMatch = () => {
    if (matchingMessageIds.length === 0) return;
    const prevIdx = (activeMatchIndex - 1 + matchingMessageIds.length) % matchingMessageIds.length;
    setActiveMatchIndex(prevIdx);
    scrollToMatch(matchingMessageIds[prevIdx]);
  };

  const handleSearchOlder = async () => {
    const q = chatSearchQuery.trim().toLowerCase();
    if (!q) return;
    setIsSearchingHistory(true);
    try {
      const found = await loadUntilFound(
        (m) =>
          (m.body || "").toLowerCase().includes(q) || (m.caption || "").toLowerCase().includes(q),
      );
      if (!found) {
        toast.info("No se encontraron más coincidencias en todo el historial");
      }
    } finally {
      setIsSearchingHistory(false);
    }
  };

  useEffect(() => {
    if (matchingMessageIds.length > 0) {
      setActiveMatchIndex(0);
      scrollToMatch(matchingMessageIds[0]);
    } else {
      setHighlightedMessageId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatSearchQuery]);

  const assignedAgentName = useMemo(() => {
    if (activeCase?.assignedAgentName) return activeCase.assignedAgentName;
    if (selected?.activeCase?.assignedAgentName) return selected.activeCase.assignedAgentName;
    const activeAgentId = activeCase?.assignedAgentId || selected?.activeCase?.assignedAgentId;
    if (activeAgentId) {
      if (session && activeAgentId === session.id) return session.name || "Tú";
      return (
        directory.find((a) => a.id === activeAgentId)?.name ??
        (selected?.activeCase?.departmentId ? "Agente de Área" : "Agente Asignado")
      );
    }
    // Solo para conversaciones resueltas o cerradas históricas, mostrar quién la atendió por última vez
    if (selected && (selected.status === "resolved" || selected.status === "closed")) {
      if (selected.lastAttendedBy?.agentName) return selected.lastAttendedBy.agentName;
      if (selected.lastAttendedBy?.agentId) {
        if (session && selected.lastAttendedBy.agentId === session.id) return session.name || "Tú";
        return directory.find((a) => a.id === selected.lastAttendedBy?.agentId)?.name ?? null;
      }
    }
    return null;
  }, [
    activeCase?.assignedAgentName,
    activeCase?.assignedAgentId,
    selected?.activeCase?.assignedAgentName,
    selected?.activeCase?.assignedAgentId,
    selected?.activeCase?.departmentId,
    selected?.status,
    selected?.lastAttendedBy,
    directory,
    session,
  ]);

  const draftsByConvRef = useRef<Record<string, string>>({});
  const prevSelectedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (selectedId) {
      draftsByConvRef.current[selectedId] = draft;
    }
  }, [draft, selectedId]);

  useEffect(() => {
    if (prevSelectedIdRef.current === selectedId) return;
    prevSelectedIdRef.current = selectedId;
    setComposerDraft(selectedId ? (draftsByConvRef.current[selectedId] ?? "") : "");
    setIsEmojiOpen(false);
    setIsAttachMenuOpen(false);
    clearPendingAttachment();
    adjustTextareaHeight();
  }, [selectedId, setIsEmojiOpen, adjustTextareaHeight, clearPendingAttachment, setComposerDraft]);

  useEffect(() => {
    const el = messagesScrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length, selectedId]);

  const focusComposer = () => {
    const el = chatInputRef.current;
    if (!el || el.disabled) return;
    if (document.activeElement !== el) el.focus();
  };

  const handleSend = async () => {
    if (pendingAttachment) {
      const caption = draftRef.current.trim();
      const snapshot = pendingAttachment;
      setPendingAttachment((current) => {
        if (current?.file !== snapshot.file) return current;
        if (current.previewUrl) URL.revokeObjectURL(current.previewUrl);
        return null;
      });
      if (draftRef.current.trim() === caption) {
        if (selectedId) delete draftsByConvRef.current[selectedId];
        setComposerDraft("");
        if (chatInputRef.current) chatInputRef.current.style.height = "auto";
      }
      focusComposer();
      await sendMedia(snapshot.file, snapshot.kind, caption);
      focusComposer();
      return;
    }
    const body = draftRef.current.trim();
    if (!body) return;
    if (selectedId) {
      delete draftsByConvRef.current[selectedId];
    }
    setComposerDraft("");
    if (chatInputRef.current) {
      chatInputRef.current.style.height = "auto";
    }
    focusComposer();
    const ok = await sendReply(body);
    if (!ok && !draftRef.current.trim()) {
      if (selectedId) {
        draftsByConvRef.current[selectedId] = body;
      }
      setComposerDraft(body);
    }
    focusComposer();
  };

  const canWriteCase =
    Boolean(session) &&
    (!activeCase ||
      activeCase?.assignedAgentId === session?.id ||
      activeCase?.assignedAgentId == null ||
      session?.role === "manager" ||
      session?.role === "admin");

  const is24hWindowClosed = useMemo(() => isCustomerServiceWindowClosed(messages), [messages]);

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

  const isClosedRecord = Boolean(
    selected &&
    (selected.status === "resolved" || selected.status === "closed") &&
    (!activeCase ||
      activeCase.status === "COMPLETED" ||
      activeCase.status === "EXPIRED" ||
      activeCase.status === "CANCELLED"),
  );

  const isAutomationActive = useMemo(() => {
    // Si la conversación o el caso están finalizados/cerrados, no hay automatización activa:
    if (isClosedRecord) {
      return false;
    }
    if (selected && (selected.status === "resolved" || selected.status === "closed")) {
      return false;
    }
    if (
      activeCase &&
      (activeCase.status === "COMPLETED" ||
        activeCase.status === "CANCELLED" ||
        activeCase.status === "EXPIRED")
    ) {
      return false;
    }

    // Si no hay caso activo (conversación nueva, sin flujo activo o vacía),
    // la IA no está respondiendo y el agente puede escribir directamente:
    const isTerminalCase = (status?: string) =>
      status === "COMPLETED" || status === "CANCELLED" || status === "EXPIRED";

    if (
      (!activeCase || isTerminalCase(activeCase.status)) &&
      (!selected?.activeCase || isTerminalCase(selected.activeCase.status))
    ) {
      return false;
    }

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

    // Por defecto, toda conversación con caso activo no tomado por un humano está en manos del Asistente IA
    return true;
  }, [activeCase, selected?.activeCase, selected?.status, automationState, isClosedRecord]);

  const closedByName = useMemo(() => {
    if (!isClosedRecord) return null;
    const ctx = activeCase?.context as Record<string, unknown> | undefined;
    if (ctx?.closedByAgentName && typeof ctx.closedByAgentName === "string") {
      return ctx.closedByAgentName;
    }
    if (selected?.lastAttendedBy?.agentName?.trim()) {
      return selected.lastAttendedBy.agentName.trim();
    }
    if (selected?.lastAttendedBy?.agentId) {
      if (selected.lastAttendedBy.agentId === session?.id) return "Tú";
      const found = directory.find((a) => a.id === selected.lastAttendedBy?.agentId);
      if (found?.name) return found.name;
    }
    if (activeCase?.assignedAgentName?.trim()) {
      return activeCase.assignedAgentName.trim();
    }
    if (activeCase?.assignedAgentId) {
      if (activeCase.assignedAgentId === session?.id) return "Tú";
      const found = directory.find((a) => a.id === activeCase.assignedAgentId);
      if (found?.name) return found.name;
    }
    return assignedAgentName ?? null;
  }, [isClosedRecord, activeCase, selected, directory, session, assignedAgentName]);

  const closedReasonLabel = useMemo(() => {
    const ctx = activeCase?.context as Record<string, unknown> | undefined;
    if (ctx?.closeReason === "CLIENT_NO_RESPONSE") return "Cliente no respondió";
    return "Resuelto";
  }, [activeCase]);

  const closedAtFormatted = useMemo(() => {
    const ctx = activeCase?.context as Record<string, unknown> | undefined;
    const rawDate =
      ctx?.closedAt ||
      (activeCase?.status === "COMPLETED" ? activeCase.lastActivityAt : null) ||
      selected?.updatedAt;
    if (!rawDate) return null;
    try {
      return new Date(String(rawDate)).toLocaleString("es-EC", {
        dateStyle: "short",
        timeStyle: "short",
      });
    } catch {
      return null;
    }
  }, [activeCase, selected]);

  const closedResolutionNote = useMemo(() => {
    const ctx = activeCase?.context as Record<string, unknown> | undefined;
    return typeof ctx?.resolutionNote === "string" ? ctx.resolutionNote : null;
  }, [activeCase]);

  const alreadyInControl = activeCase?.status === "HUMAN_ACTIVE" && isAssignedToMe;
  const showTakeControl = isAutomationActive && canWriteCase && !showClaim && !alreadyInControl;
  const readOnly = Boolean(activeCase) && !canWriteCase;

  const pasteGuardRef = useRef<{ active: boolean; blockedReason: string | null }>({
    active: false,
    blockedReason: null,
  });
  pasteGuardRef.current = {
    active: Boolean(selected),
    blockedReason: !selected
      ? null
      : readOnly
        ? "Esta conversación está asignada a otro agente."
        : isAutomationActive
          ? "Toma el control manual para pegar un archivo."
          : null,
  };

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      if (!pasteGuardRef.current.active) return;
      if (pasteTargetBlocksChat(event.target, chatInputRef.current)) return;
      const dialogOpen = document.querySelector(
        "[role='dialog'][data-state='open'], [role='alertdialog'][data-state='open']",
      );
      if (dialogOpen) return;
      const files = filesFromClipboard(event.clipboardData);
      if (files.length === 0) return;
      event.preventDefault();
      const blockedReason = pasteGuardRef.current.blockedReason;
      if (blockedReason) {
        toast.error(blockedReason);
        return;
      }
      void stagePastedFile(files[0], files.length > 1);
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [chatInputRef, stagePastedFile]);

  let lastRenderedDay = "";
  let lastRenderedSender = "";

  const isSyncRunning = currentSyncStatus?.status === "running";

  return (
    <div className="flex flex-col gap-4 h-full flex-1 min-h-0 min-w-0 max-w-full animate-fade-up">
      {/* Banner de Sincronización en Ejecución con Barra de Progreso y Porcentaje */}
      {isSyncRunning && (
        <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/30 text-primary flex items-center justify-between gap-3 animate-pulse shadow-xs">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <RotateCw className="size-4 animate-spin text-primary shrink-0" />
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="truncate">
                  Sincronizando mensajes y conversaciones de WhatsApp...
                </span>
                <span className="font-mono text-xs font-extrabold ml-2 shrink-0">
                  {currentSyncStatus.progress != null
                    ? `${currentSyncStatus.progress}%`
                    : `${currentSyncStatus.totalMessagesSynced.toLocaleString()} importados`}
                </span>
              </div>
              <div className="w-full bg-primary/20 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        8,
                        currentSyncStatus.progress ??
                          (currentSyncStatus.totalMessagesSynced > 0 ? 65 : 15),
                      ),
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Banner de Sincronización Finalizada Exitosamente */}
      {!isSyncRunning && syncCompletedBanner?.show && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-3 animate-fade-in shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
            <p className="text-xs font-semibold">
              Sincronización finalizada: Se han importado{" "}
              <span className="font-extrabold font-mono">
                {syncCompletedBanner.count.toLocaleString()}
              </span>{" "}
              mensajes históricos. La bandeja de entrada se encuentra totalmente actualizada.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSyncCompletedBanner(null)}
            className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline px-2 py-0.5 cursor-pointer"
          >
            Descartar
          </button>
        </div>
      )}

      {/* Barra de filtros unificada y compacta */}
      <div
        className={`bg-card border border-border rounded-xl p-2.5 sm:p-3 shrink-0 shadow-xs ${
          selectedId ? "hidden lg:block" : "block"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Categorías de conversación */}
          <InboxStatusTabs
            activeTab={activeTab}
            onTabChange={handleTabChange}
            openCount={openCount}
            unassignedCount={unassignedCount}
            unattendedCount={unattendedCount}
            pendingCount={pendingCount}
            resolvedCount={resolvedCount}
            closedCount={closedCount}
          />

          {/* Filtros operativos y acciones */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Área:
              </span>
              <Select
                value={departmentId ?? "all"}
                onValueChange={(val) => setDepartmentId(val === "all" ? undefined : val)}
              >
                <SelectTrigger className="h-8 text-xs min-w-[140px] max-w-[190px] bg-background">
                  <SelectValue placeholder="Todas las áreas" />
                </SelectTrigger>
                <SelectContent>
                  {isSupervisorOrAdmin && <SelectItem value="all">Todas las áreas</SelectItem>}
                  {visibleDepartments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Agente:
              </span>
              <Select value={agentFilter} onValueChange={(val) => setAgentFilter(val)}>
                <SelectTrigger className="h-8 text-xs min-w-[140px] max-w-[190px] bg-background">
                  <SelectValue placeholder="Todos los agentes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los agentes</SelectItem>
                  <SelectItem value="mine">Mis conversaciones</SelectItem>
                  <SelectItem value="unassigned">Sin asignar (En cola)</SelectItem>
                  {visibleAgents.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <button
              type="button"
              onClick={() => setSlaAlertsOnly(!slaAlertsOnly)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                slaAlertsOnly
                  ? "bg-danger text-white shadow-xs"
                  : breachedSlaCount > 0
                    ? "bg-danger/10 text-danger ring-1 ring-danger/30 hover:bg-danger/20 animate-pulse"
                    : "bg-background text-muted-foreground ring-1 ring-border hover:bg-foreground/5"
              }`}
              title={
                breachedSlaCount > 0
                  ? `${breachedSlaCount} conversaciones con SLA vencido`
                  : "Sin alertas de SLA activas"
              }
            >
              <ShieldAlert className="size-3.5" />
              <span>Alertas SLA</span>
              {breachedSlaCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-mono">
                  {breachedSlaCount}
                </span>
              )}
            </button>

            <ZernioSyncControl />
          </div>
        </div>
      </div>

      <section className="grid grid-cols-12 lg:grid-rows-1 gap-4 flex-1 min-h-0 min-w-0 w-full">
        {/* Lista de conversaciones */}
        <div
          className={`col-span-12 lg:col-span-4 bg-card border border-border rounded-xl flex flex-col overflow-hidden min-h-0 min-w-0 h-full shadow-xs ${
            selectedId ? "hidden lg:flex" : "flex"
          }`}
        >
          <div className="p-3 sm:p-3.5 border-b border-border bg-background/60 flex justify-between items-center shrink-0">
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-primary animate-ping" />
                <span className="text-xs font-bold text-muted-foreground animate-pulse">
                  Cargando conversaciones…
                </span>
              </div>
            ) : (
              <h3 className="text-xs font-bold text-muted-foreground">
                {`${filteredConversations.length} conversaciones`}
              </h3>
            )}
            {!connected && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-500 animate-pulse">
                <WifiOff className="size-3" />
                <span>Reconectando…</span>
              </span>
            )}
          </div>
          {/* Buscador integrado estilo WhatsApp Web */}
          <div className="p-2 sm:px-3 sm:py-2 border-b border-border bg-background/50 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre, teléfono o mensaje..."
                className="w-full pl-9 pr-8 py-1.5 bg-background border border-border rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60 transition-all"
              />
              {isSearchingServer ? (
                <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-primary animate-spin" />
              ) : search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full hover:bg-foreground/5 cursor-pointer"
                  title="Limpiar búsqueda"
                >
                  <X className="size-3.5" />
                </button>
              ) : null}
            </div>
          </div>
          <div
            ref={conversationListScroll.ref}
            onScroll={conversationListScroll.onScroll}
            className="flex-1 min-h-0 overflow-y-auto divide-y divide-border [overflow-anchor:none]"
          >
            {loading ? (
              <div className="divide-y divide-border/60">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ConversationListItemSkeleton key={i} />
                ))}
              </div>
            ) : (
              filteredConversations.map((c) => (
                <ConversationListItem
                  key={c.id}
                  conversation={c}
                  active={c.id === selected?.id}
                  onSelect={setSelectedId}
                  selectedCustomerId={selected?.id}
                  selectedCustomerFullName={selectedCustomer?.fullName}
                  activeCase={activeCase}
                  slaConfig={slaConfig}
                  session={session}
                  directory={directory}
                  departments={departments}
                />
              ))
            )}
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
          className={`@container/chat col-span-12 bg-card border border-border rounded-xl flex flex-col overflow-hidden min-h-0 min-w-0 max-w-full h-full shadow-xs transition-[grid-column] ${
            selectedId ? "flex" : "hidden lg:flex"
          } ${detailsOpen ? "lg:col-span-5" : "lg:col-span-8"}`}
        >
          {selected ? (
            <>
              <ChatHeader
                selected={selected}
                selectedCustomer={selectedCustomer}
                activeCase={activeCase}
                isAutomationActive={isAutomationActive}
                isClosedRecord={isClosedRecord}
                assignedAgentName={assignedAgentName}
                isAssignedToMe={isAssignedToMe}
                isAssignedToOther={isAssignedToOther}
                showClaim={showClaim}
                showTakeControl={showTakeControl}
                busy={busy}
                detailsOpen={detailsOpen}
                mobileDetailsOpen={mobileDetailsOpen}
                onBack={() => setSelectedId(null)}
                onOpenContact={() => void handleOpenContact()}
                onClaim={() => void claim()}
                onTakeControl={() => void takeControl()}
                onCloseConversation={() => void handleCloseConversation()}
                onToggleDetails={() => {
                  if (typeof window !== "undefined" && window.innerWidth < 1024) {
                    setMobileDetailsOpen((v) => !v);
                  } else {
                    setDetailsOverride(!detailsOpen);
                  }
                }}
              />

              <ChatSearchBar
                open={isChatSearchOpen}
                query={chatSearchQuery}
                onQueryChange={setChatSearchQuery}
                matchIndex={activeMatchIndex}
                totalMatches={matchingMessageIds.length}
                onPrev={handlePrevMatch}
                onNext={handleNextMatch}
                onClose={() => {
                  setIsChatSearchOpen(false);
                  setChatSearchQuery("");
                  setHighlightedMessageId(null);
                }}
              />

              {is24hWindowClosed && (
                <div className="px-3 py-1.5 border-b border-border/40">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-200 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                    <Clock className="size-3 text-amber-600 dark:text-amber-400 shrink-0" />
                    Ventana de 24h inactiva
                  </span>
                </div>
              )}

              {selected &&
                (() => {
                  const selectedSla = calculateConversationSla(selected, slaConfig);
                  if (!selectedSla.isBreached) return null;
                  return (
                    <div className="p-3 bg-danger/10 border-b border-danger/30 text-danger flex items-start gap-2 text-xs font-semibold shrink-0 min-w-0 animate-fade-in">
                      <div className="flex items-start gap-2 min-w-0">
                        <AlertTriangle className="size-4 shrink-0 text-danger animate-pulse mt-0.5" />
                        <span className="min-w-0 break-words">
                          <strong className="font-extrabold uppercase">
                            Alerta de No Respuesta:
                          </strong>{" "}
                          El cliente ha estado esperando{" "}
                          <strong className="font-extrabold font-mono text-sm">
                            {selectedSla.formattedFull}
                          </strong>{" "}
                          sin respuesta (Límite configurado por el admin:{" "}
                          {formatSlaWaitTime(slaConfig.responseThresholdMinutes, "short")}).
                          Responda pronto para no afectar la métrica de eficiencia.
                        </span>
                      </div>
                    </div>
                  );
                })()}

              <div
                ref={messagesScrollRef}
                className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain p-2.5 sm:p-3 space-y-1 bg-background/40"
              >
                {hasMoreMessages && (
                  <div className="flex justify-center my-3">
                    <button
                      type="button"
                      onClick={() => void loadOlderMessages()}
                      disabled={loadingOlderMessages}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-background border border-border/80 text-xs font-semibold shadow-xs hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer disabled:opacity-50"
                    >
                      {loadingOlderMessages ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin text-primary" />
                          <span>Cargando mensajes anteriores...</span>
                        </>
                      ) : (
                        <>
                          <ArrowUp className="size-3.5 text-primary" />
                          <span>Cargar mensajes anteriores</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
                {messages.map((m) => {
                  const day = dayLabel(m.createdAt);
                  const showDaySeparator = day !== lastRenderedDay;
                  lastRenderedDay = day;

                  const fromCustomer = m.author === "customer";
                  const senderKey = showDaySeparator
                    ? ""
                    : m.author === "agent"
                      ? `agent_${m.agentId || m.agentName || "unknown"}`
                      : m.author;
                  const showSenderLabel = !fromCustomer && senderKey !== lastRenderedSender;
                  lastRenderedSender = senderKey;

                  return (
                    <ChatMessageItem
                      key={m.id}
                      message={m}
                      conversation={selected}
                      directory={directory}
                      session={session}
                      isAssignedToMe={isAssignedToMe}
                      assignedAgentName={assignedAgentName}
                      showDaySeparator={showDaySeparator}
                      day={day}
                      showSenderLabel={showSenderLabel}
                      onOpenTemplateModal={() => setIsTemplateModalOpen(true)}
                    />
                  );
                })}
                {isClosedRecord &&
                  !messages.some(
                    (m) =>
                      m.author === "system" &&
                      (m.body?.includes("Caso completado") ||
                        m.body?.includes("🔒") ||
                        m.body?.toLowerCase().includes("caso cerrado") ||
                        m.body?.toLowerCase().includes("completado por")),
                  ) && (
                    <div className="flex justify-center my-4 px-2 min-w-0 animate-fade-in">
                      <div className="flex flex-col items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 text-xs font-semibold border border-emerald-500/30 shadow-xs max-w-md text-center leading-normal">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                          <span className="font-bold">
                            Caso completado {closedByName ? `por ${closedByName}` : ""}
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                          <span>Motivo: {closedReasonLabel}</span>
                          {closedAtFormatted && (
                            <>
                              <span>•</span>
                              <span>{closedAtFormatted}</span>
                            </>
                          )}
                        </div>
                        {closedResolutionNote && (
                          <p className="text-[10px] italic text-muted-foreground/90 mt-1 border-t border-emerald-500/20 pt-1 w-full">
                            "{closedResolutionNote}"
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                {messages.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center mt-8">
                    Todavía no hay mensajes en esta conversación.
                  </p>
                )}
              </div>
              {readOnly ? (
                <div className="p-2.5 border-t border-border bg-warning/5 flex items-start gap-2 text-[11px] text-foreground shrink-0 min-w-0">
                  <Lock className="size-3.5 text-warning shrink-0 mt-0.5" />
                  <span className="min-w-0 break-words">
                    Esta conversación está asignada a{" "}
                    <span className="font-bold">{assignedAgentName}</span> — solo esa persona puede
                    responder. Tú puedes seguir viéndola.
                  </span>
                </div>
              ) : (
                <div className="flex flex-col border-t border-border bg-background/60 shrink-0 min-w-0">
                  {isAutomationActive && !isClosedRecord && (
                    <div className="px-3 py-2 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between gap-2 text-xs min-w-0">
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
                  <ChatComposer
                    draft={draft}
                    onDraftChange={setComposerDraft}
                    onSend={() => void handleSend()}
                    isAutomationActive={isAutomationActive}
                    isClosedRecord={isClosedRecord}
                    assignedAgentName={assignedAgentName}
                    busy={busy}
                    pendingAttachment={pendingAttachment}
                    onClearPendingAttachment={clearPendingAttachment}
                    onOpenTemplateModal={() => setIsTemplateModalOpen(true)}
                    onPickKind={openFilePicker}
                    onFilePicked={handlePickedFile}
                    isQuickReplyOpen={isQuickReplyOpen}
                    quickReplyFiltered={quickReplyFiltered}
                    quickReplySelectedIndex={quickReplySelectedIndex}
                    onSelectQuickReply={selectQuickReply}
                    onQuickReplyKeyDown={handleQuickReplyKeyDown}
                    chatInputRef={chatInputRef}
                    fileInputRef={fileInputRef}
                  />
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
          <div className="hidden lg:flex lg:col-span-3 min-h-0 min-w-0 h-full flex-col gap-2 overflow-hidden">
            <div className="bg-card border border-border rounded-xl px-3 py-2 flex items-center justify-between shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Detalles
              </span>
              <div className="flex items-center gap-1">
                {activeCase && (
                  <button
                    type="button"
                    onClick={() => {
                      void loadCaseSummary(activeCase.id);
                      setSummaryOpen(true);
                    }}
                    title="Ver detalles completos del caso (modal)"
                    className="p-1 rounded-md hover:bg-foreground/5 text-muted-foreground hover:text-foreground transition"
                  >
                    <FileText className="size-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setDetailsOverride(false)}
                  title="Ocultar panel de detalles"
                  className="p-1 rounded-md hover:bg-foreground/5 text-muted-foreground hover:text-foreground transition"
                >
                  <PanelRightClose className="size-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto space-y-4">
              <CasePanel
                caseDto={activeCase}
                customerName={
                  selectedCustomer?.fullName ||
                  (selected ? conversationDisplayName(selected) : undefined)
                }
                customerPhone={selected ? formatWaPhone(selected.waPhone) : undefined}
                customerTags={selectedCustomer?.tags}
                customerContractsCount={selectedCustomer?.contracts?.length}
                customerContracts={selectedCustomer?.contracts}
                onOpenContact={() => void handleOpenContact()}
                busy={busy}
                canWrite={canWriteCase}
                departments={departments}
                agents={directory}
                assignedAgentName={assignedAgentName}
                onOpenSummary={() => {
                  if (activeCase) void loadCaseSummary(activeCase.id);
                  setSummaryOpen(true);
                }}
                onSyncData={() => void (syncCaseData ? syncCaseData() : syncBalance())}
                onSyncBalance={() => void (syncCaseData ? syncCaseData() : syncBalance())}
                onDiagnose={(contractId) => void diagnoseCase(contractId)}
                onCloseConversation={
                  !activeCase &&
                  selected &&
                  (selected.status === "open" || selected.status === "pending")
                    ? handleCloseConversation
                    : undefined
                }
                onDeriveConversation={
                  !activeCase &&
                  selected &&
                  (selected.status === "open" || selected.status === "pending")
                    ? handleDeriveConversation
                    : undefined
                }
                onComplete={(closeReason, note) => void handleComplete(closeReason, note)}
                onSchedule={(at, reason) => void handleSchedule(at, reason)}
                onCancel={(reason) => void cancel(reason)}
                onTransfer={(toDepartmentId, reason, toAgentId) =>
                  void transfer(toDepartmentId, reason, toAgentId)
                }
                onDisableAutomation={(reason) => void disableAutomation(reason)}
                onReactivateAutomation={() => void reactivateAutomation()}
                onAdvance={(entities) => void advanceCase(entities)}
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
            {activeCase && (
              <button
                type="button"
                onClick={() => {
                  void loadCaseSummary(activeCase.id);
                  setSummaryOpen(true);
                }}
                title="Ver detalles completos del caso (modal)"
                className="p-1 rounded-md hover:bg-foreground/5 text-muted-foreground hover:text-foreground transition"
              >
                <FileText className="size-4" />
              </button>
            )}
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
            <CasePanel
              caseDto={activeCase}
              customerName={
                selectedCustomer?.fullName ||
                (selected ? conversationDisplayName(selected) : undefined)
              }
              customerPhone={selected ? formatWaPhone(selected.waPhone) : undefined}
              customerTags={selectedCustomer?.tags}
              customerContractsCount={selectedCustomer?.contracts?.length}
              customerContracts={selectedCustomer?.contracts}
              onOpenContact={() => void handleOpenContact()}
              busy={busy}
              canWrite={canWriteCase}
              departments={departments}
              agents={directory}
              assignedAgentName={assignedAgentName}
              onOpenSummary={() => {
                if (activeCase) void loadCaseSummary(activeCase.id);
                setSummaryOpen(true);
              }}
              onSyncData={() => void (syncCaseData ? syncCaseData() : syncBalance())}
              onSyncBalance={() => void (syncCaseData ? syncCaseData() : syncBalance())}
              onDiagnose={(contractId) => void diagnoseCase(contractId)}
              onCloseConversation={
                !activeCase &&
                selected &&
                (selected.status === "open" || selected.status === "pending")
                  ? handleCloseConversation
                  : undefined
              }
              onDeriveConversation={
                !activeCase &&
                selected &&
                (selected.status === "open" || selected.status === "pending")
                  ? handleDeriveConversation
                  : undefined
              }
              onComplete={(closeReason, note) => void handleComplete(closeReason, note)}
              onSchedule={(at, reason) => void handleSchedule(at, reason)}
              onCancel={(reason) => void cancel(reason)}
              onTransfer={(toDepartmentId, reason, toAgentId) =>
                void transfer(toDepartmentId, reason, toAgentId)
              }
              onDisableAutomation={(reason) => void disableAutomation(reason)}
              onReactivateAutomation={() => void reactivateAutomation()}
              onAdvance={(entities) => void advanceCase(entities)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <CaseSummaryDialog
        open={summaryOpen}
        onOpenChange={setSummaryOpen}
        summary={caseSummary}
        timeline={caseTimeline}
        caseDto={activeCase}
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

      <SlaSettingsModal open={slaModalOpen} onOpenChange={setSlaModalOpen} />

      <SendTemplateModal
        open={isTemplateModalOpen}
        onOpenChange={setIsTemplateModalOpen}
        onConfirm={sendTemplate}
        busy={busy}
      />
      <CompleteCaseModal
        open={completeModalOpen}
        onOpenChange={setCompleteModalOpen}
        onConfirm={handleComplete}
        busy={busy}
      />

      <ContactDialog
        open={contactDialogOpen}
        onOpenChange={setContactDialogOpen}
        customer={selectedCustomer}
        initialPhone={selected?.waPhone}
        initialName={selected?.waProfileName ?? undefined}
        onSuccess={(saved: CustomerDto) => {
          setSelectedCustomer(saved);
          void reload({ silent: true });
        }}
      />

      <ScheduleCaseModal
        open={scheduleModalOpen}
        onOpenChange={setScheduleModalOpen}
        currentScheduleTag={extractSchedulingMetadata(activeCase)?.scheduleTag}
        onConfirm={handleSchedule}
        busy={busy}
      />

      <CloseConversationModal
        open={closeConfirmOpen}
        onOpenChange={setCloseConfirmOpen}
        onConfirm={confirmCloseConversation}
        busy={busy}
      />
    </div>
  );
}
