import { apiGet, apiPut, apiPost } from "@/shared/http/http-client";
import { DEFAULT_SLA_CONFIG, type SlaConfigDto } from "@/modules/sla/domain/sla-config";

const LOCAL_STORAGE_KEY = "internal_sys_sla_config";

export const slaService = {
  /**
   * Obtiene la configuración de SLA de respuesta desde el backend.
   * Si falla o aún no está disponible en el servidor, retorna lo almacenado localmente o los valores predeterminados.
   */
  getSlaConfig: async (): Promise<SlaConfigDto> => {
    try {
      const remote = await apiGet<SlaConfigDto>("/api/settings/sla");
      if (remote && typeof remote.responseThresholdMinutes === "number") {
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(remote));
        } catch {
          // Ignore storage errors
        }
        return remote;
      }
    } catch {
      // Intenta leer el respaldo local
    }

    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.responseThresholdMinutes === "number") {
          return { ...DEFAULT_SLA_CONFIG, ...parsed };
        }
      }
    } catch {
      // Ignore
    }

    return DEFAULT_SLA_CONFIG;
  },

  /**
   * Actualiza y persiste la configuración de SLA de respuesta en el backend.
   */
  updateSlaConfig: async (config: SlaConfigDto): Promise<SlaConfigDto> => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config));
    } catch {
      // Ignore
    }

    try {
      const updated = await apiPut<SlaConfigDto>("/api/settings/sla", config);
      if (updated && typeof updated.responseThresholdMinutes === "number") {
        return updated;
      }
    } catch (err) {
      console.warn("Backend no respondió al guardar SLA; usando respaldo local:", err);
    }

    return config;
  },

  /**
   * Registra un evento de auditoría persistente en el backend cuando se detecta o resuelve una alerta de tiempo de respuesta.
   */
  logSlaAuditEvent: async (payload: {
    conversationId: string;
    agentId?: string | null;
    departmentId?: string | null;
    minutesWaiting: number;
    action: "SLA_BREACH_ALERT" | "SLA_LATE_RESPONSE";
  }): Promise<void> => {
    try {
      await apiPost("/api/audit", {
        category: "operational",
        action: payload.action,
        resourceType: "conversation",
        resourceId: payload.conversationId,
        actorId: payload.agentId || null,
        departmentId: payload.departmentId || null,
        metadata: {
          minutesWaiting: payload.minutesWaiting,
          timestamp: new Date().toISOString(),
        },
      });
    } catch {
      // Registrar silenciosamente sin interrumpir la operación
    }
  },
};
