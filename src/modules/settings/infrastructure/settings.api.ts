import { apiGet, apiPut, apiPost } from "@/shared/http/http-client";
import type {
  SystemSettingsData,
  WhatsAppChannelSettings,
  AiProviderSettings,
  SystemSetupStatus,
  TestConnectionResult,
} from "../domain/settings.types";

function unwrap<T>(response: unknown): T {
  if (response && typeof response === "object" && "data" in response) {
    return (response as { data: T }).data;
  }
  return response as T;
}

export const settingsApi = {
  /**
   * Consulta las configuraciones activas del sistema (con secretos enmascarados).
   */
  getSettings: async (): Promise<SystemSettingsData> => {
    const res = await apiGet<SystemSettingsData | { data: SystemSettingsData }>(
      "/api/admin/settings",
    );
    return unwrap<SystemSettingsData>(res);
  },

  /**
   * Actualiza la configuración de canales (Meta / Zernio).
   */
  updateChannels: async (
    payload: Partial<WhatsAppChannelSettings>,
  ): Promise<WhatsAppChannelSettings> => {
    const res = await apiPut<WhatsAppChannelSettings | { data: WhatsAppChannelSettings }>(
      "/api/admin/settings/channels",
      payload,
    );
    return unwrap<WhatsAppChannelSettings>(res);
  },

  /**
   * Actualiza la configuración del proveedor de IA y modelos.
   */
  updateAi: async (payload: Partial<AiProviderSettings>): Promise<AiProviderSettings> => {
    const res = await apiPut<AiProviderSettings | { data: AiProviderSettings }>(
      "/api/admin/settings/ai",
      payload,
    );
    return unwrap<AiProviderSettings>(res);
  },

  /**
   * Consulta el estado general del setup/onboarding.
   */
  getSetupStatus: async (): Promise<SystemSetupStatus> => {
    const res = await apiGet<SystemSetupStatus | { data: SystemSetupStatus }>(
      "/api/admin/settings/setup-status",
    );
    return unwrap<SystemSetupStatus>(res);
  },

  /**
   * Prueba en vivo la conexión con el proveedor de IA.
   */
  testAi: async (payload: Partial<AiProviderSettings>): Promise<TestConnectionResult> => {
    const res = await apiPost<TestConnectionResult | { data: TestConnectionResult }>(
      "/api/admin/settings/test-ai",
      payload,
    );
    return unwrap<TestConnectionResult>(res);
  },

  /**
   * Prueba en vivo las credenciales del canal de mensajería.
   */
  testChannels: async (
    payload: Partial<WhatsAppChannelSettings>,
  ): Promise<TestConnectionResult> => {
    const res = await apiPost<TestConnectionResult | { data: TestConnectionResult }>(
      "/api/admin/settings/test-channels",
      payload,
    );
    return unwrap<TestConnectionResult>(res);
  },
};
