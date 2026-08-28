import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useSession } from "@/modules/identity/application/use-session";
import type {
  MessageTemplate,
  TemplateCategory,
  TemplateStatus,
  WabaConnectionDto,
} from "@/modules/message-templates/domain/message-template";
import {
  extractTemplateVariables,
  validateMetaTemplateName,
  validateTemplateBody,
} from "@/modules/message-templates/domain/message-template";
import {
  createMessageTemplate as apiCreateTemplate,
  deleteMessageTemplate as apiDeleteTemplate,
  listMessageTemplates as apiListTemplates,
  listWabaConnections as apiListConnections,
  type CreateMessageTemplatePayload,
} from "@/modules/message-templates/infrastructure/message-template.gateway";

export type MessageTemplateFilters = {
  search: string;
  category: TemplateCategory | "";
  connectionId: string;
  status: TemplateStatus | "";
};

const INITIAL_FILTERS: MessageTemplateFilters = {
  search: "",
  category: "",
  connectionId: "",
  status: "",
};

// Datos muestra por defecto para replicar la experiencia si el backend no retorna conexiones
const DEFAULT_CONNECTIONS: WabaConnectionDto[] = [
  { id: "default", name: "Línea Oficial WhatsApp", status: "active" },
];

const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    id: "tpl_1",
    name: "incumplimientopago",
    category: "UTILITY",
    language: "pt_BR",
    languageLabel: "BR Português (BR)",
    connectionId: "default",
    connectionName: "Línea Oficial WhatsApp",
    status: "APPROVED",
    header: { type: "NONE" },
    body: "Estimado/a cliente: Hasta el momento no hemos recibido el pago acordado. Para evitar la suspensión temporal del servicio, le solicitamos realizar el pago a la brevedad.",
    variables: [],
    createdAt: "2026-08-20T10:00:00Z",
  },
  {
    id: "tpl_2",
    name: "corte_servicio",
    category: "MARKETING",
    language: "es_MX",
    languageLabel: "MX Español (México)",
    connectionId: "default",
    connectionName: "Línea Oficial WhatsApp",
    status: "APPROVED",
    header: { type: "NONE" },
    body: "Aviso: Estimado cliente, *su pago continúa pendiente y el servicio podría interrumpirse.* Le invitamos a regularizar su cuenta.",
    variables: [],
    createdAt: "2026-08-21T11:30:00Z",
  },
  {
    id: "tpl_3",
    name: "validacion_pago_cuenca",
    category: "UTILITY",
    language: "es_MX",
    languageLabel: "MX Español (México)",
    connectionId: "default",
    connectionName: "Línea Oficial WhatsApp",
    status: "APPROVED",
    header: { type: "NONE" },
    body: "Estimado cliente XGO: 🤝 Su factura correspondiente a Agosto aún registra saldo pendiente. Regularice su pago hoy mismo.",
    variables: [],
    createdAt: "2026-08-22T09:15:00Z",
  },
  {
    id: "tpl_4",
    name: "bienvenida_xgo",
    category: "MARKETING",
    language: "es",
    languageLabel: "ES Español",
    connectionId: "default",
    connectionName: "Línea Oficial WhatsApp",
    status: "APPROVED",
    header: { type: "NONE" },
    body: "¡Hola! Bienvenido a XGO, tu conexión confiable 🚀 Estamos aquí para ayudarte a sacar el máximo provecho a tu plan.",
    variables: [],
    createdAt: "2026-08-23T14:20:00Z",
  },
  {
    id: "tpl_5",
    name: "primer_aviso_pago",
    category: "UTILITY",
    language: "es",
    languageLabel: "ES Español",
    connectionId: "default",
    connectionName: "Línea Oficial WhatsApp",
    status: "PENDING",
    header: { type: "NONE" },
    body: "Estimado cliente {{1}}: Recordamos que su factura {{2}} vence pronto.",
    variables: ["1", "2"],
    createdAt: "2026-08-27T10:00:00Z",
  },
];

const PENDING_POLL_INTERVAL_MS = 10_000;

export function useMessageTemplates(opts?: { pausePolling?: boolean }) {
  const session = useSession();
  const pausePolling = opts?.pausePolling === true;

  const [filters, setFilters] = useState<MessageTemplateFilters>(INITIAL_FILTERS);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [connections, setConnections] = useState<WabaConnectionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Modales
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [deletingTemplate, setDeletingTemplate] = useState<MessageTemplate | null>(null);

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Carga inicial y recarga
  const reload = useCallback(
    async (optsReload?: { silent?: boolean }) => {
      if (!optsReload?.silent) setLoading(true);
      const agentId = session?.id;

      try {
        const templatesRes = await apiListTemplates({
          query: filters.search || undefined,
          category: filters.category || undefined,
          connectionId: filters.connectionId || undefined,
          status: filters.status || undefined,
          agentUserId: agentId,
        });
        setTemplates(templatesRes);
      } catch {
        // Fallback a DEFAULT_TEMPLATES solo si la API falla o no está disponible
        setTemplates(DEFAULT_TEMPLATES);
      }

      try {
        const connectionsRes = await apiListConnections(agentId);
        if (Array.isArray(connectionsRes) && connectionsRes.length > 0) {
          setConnections(connectionsRes);
        } else {
          setConnections(DEFAULT_CONNECTIONS);
        }
      } catch {
        setConnections(DEFAULT_CONNECTIONS);
      } finally {
        if (!optsReload?.silent) setLoading(false);
      }
    },
    [session?.id, filters],
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  // Polling para plantillas en estado PENDING
  const hasPendingTemplates = useMemo(() => {
    return templates.some((t) => t.status === "PENDING");
  }, [templates]);

  useEffect(() => {
    if (pausePolling || !hasPendingTemplates) {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      return;
    }

    pollTimerRef.current = setInterval(() => {
      void reload({ silent: true });
    }, PENDING_POLL_INTERVAL_MS);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [pausePolling, hasPendingTemplates, reload]);

  // Filtros aplicados localmente sobre el listado actual
  const filteredTemplates = useMemo(() => {
    return templates.filter((tpl) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const matchesName = tpl.name.toLowerCase().includes(q);
        const matchesBody = tpl.body.toLowerCase().includes(q);
        if (!matchesName && !matchesBody) return false;
      }
      if (filters.category && tpl.category !== filters.category) return false;
      if (filters.connectionId && tpl.connectionId !== filters.connectionId) return false;
      if (filters.status && tpl.status !== filters.status) return false;
      return true;
    });
  }, [templates, filters]);

  // Crear plantilla
  const createTemplate = useCallback(
    async (payload: CreateMessageTemplatePayload): Promise<boolean> => {
      const nameVal = validateMetaTemplateName(payload.name);
      if (!nameVal.valid) {
        toast.error(nameVal.error);
        return false;
      }
      const bodyVal = validateTemplateBody(payload.body);
      if (!bodyVal.valid) {
        toast.error(bodyVal.error);
        return false;
      }

      setSubmitting(true);
      try {
        const agentId = session?.id;
        const created = await apiCreateTemplate(payload, agentId);

        setTemplates((prev) => [created, ...prev.filter((t) => t.id !== created.id)]);
        toast.success(`Plantilla "${payload.name}" guardada y enviada a Meta.`);
        setIsFormOpen(false);
        await reload({ silent: true });
        return true;
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "Error al guardar la plantilla en el backend.",
        );
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [session?.id, reload],
  );

  // Eliminar plantilla
  const deleteTemplate = useCallback(
    async (id: string): Promise<boolean> => {
      const target = templates.find((t) => t.id === id);
      const name = target?.name || id;

      try {
        const agentId = session?.id;
        await apiDeleteTemplate(id, agentId);
        setTemplates((prev) => prev.filter((t) => t.id !== id));
        toast.success(`Plantilla "${name}" eliminada.`);
        setDeletingTemplate(null);
        await reload({ silent: true });
        return true;
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo eliminar la plantilla.");
        return false;
      }
    },
    [templates, session?.id, reload],
  );

  // Abrir detalle
  const openDetail = useCallback((tpl: MessageTemplate) => {
    setSelectedTemplate(tpl);
    setIsDetailOpen(true);
  }, []);

  const closeDetail = useCallback(() => {
    setSelectedTemplate(null);
    setIsDetailOpen(false);
  }, []);

  return {
    session,
    loading,
    submitting,
    templates: filteredTemplates,
    allTemplates: templates,
    connections,
    filters,
    setFilters,
    viewMode,
    setViewMode,
    isFormOpen,
    setIsFormOpen,
    selectedTemplate,
    isDetailOpen,
    openDetail,
    closeDetail,
    deletingTemplate,
    setDeletingTemplate,
    reload,
    createTemplate,
    deleteTemplate,
  };
}
