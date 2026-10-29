import { apiGet, apiPut, apiPost, apiDelete } from "@/shared/http/http-client";
import type {
  SystemSettingsData,
  WhatsAppChannelSettings,
  AiProviderSettings,
  SystemSetupStatus,
  TestConnectionResult,
  AiProvider,
  ListAiModelsResult,
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
  /**
   * Consulta dinámicamente los modelos compatibles directamente de Gemini u Ollama.
   */
  listAiModels: async (payload: {
    provider?: AiProvider;
    apiKey?: string;
    baseUrl?: string;
  }): Promise<ListAiModelsResult> => {
    const res = await apiPost<ListAiModelsResult | { data: ListAiModelsResult }>(
      "/api/admin/settings/ai/models",
      payload,
    );
    return unwrap<ListAiModelsResult>(res);
  },
  /**
   * Obtiene la lista de routers MikroTik y sus OLTs configuradas.
   */
  listNetworkRouters: async (): Promise<NetworkRouterConfig[]> => {
    const res = await apiGet<NetworkRouterConfig[] | { data: NetworkRouterConfig[] }>(
      "/api/admin/settings/network/routers",
    );
    return unwrap<NetworkRouterConfig[]>(res);
  },

  /**
   * Registra un nuevo router MikroTik.
   */
  createNetworkRouter: async (
    payload: { name: string; displayName: string; host: string; port: number; username: string; password?: string }
  ): Promise<NetworkRouterConfig> => {
    const res = await apiPost<NetworkRouterConfig | { data: NetworkRouterConfig }>(
      "/api/admin/settings/network/routers",
      payload,
    );
    return unwrap<NetworkRouterConfig>(res);
  },

  /**
   * Actualiza un router MikroTik.
   */
  updateNetworkRouter: async (
    id: string,
    payload: Partial<{ displayName: string; host: string; port: number; username: string; password?: string; isActive: boolean }>
  ): Promise<NetworkRouterConfig> => {
    const res = await apiPut<NetworkRouterConfig | { data: NetworkRouterConfig }>(
      `/api/admin/settings/network/routers/${id}`,
      payload,
    );
    return unwrap<NetworkRouterConfig>(res);
  },

  /**
   * Elimina un router MikroTik.
   */
  deleteNetworkRouter: async (id: string): Promise<void> => {
    await apiDelete(`/api/admin/settings/network/routers/${id}`);
  },

  /**
   * Registra una OLT bajo un router MikroTik.
   */
  createNetworkOlt: async (
    routerId: string,
    payload: { name: string; displayName?: string; ip: string; brand: string; username?: string; password?: string; slot?: string }
  ): Promise<NetworkOltConfig> => {
    const res = await apiPost<NetworkOltConfig | { data: NetworkOltConfig }>(
      `/api/admin/settings/network/routers/${routerId}/olts`,
      payload,
    );
    return unwrap<NetworkOltConfig>(res);
  },

  /**
   * Actualiza una OLT.
   */
  updateNetworkOlt: async (
    routerId: string,
    oltId: string,
    payload: Partial<{ displayName: string; ip: string; brand: string; username?: string; password?: string; slot?: string; isActive: boolean }>
  ): Promise<NetworkOltConfig> => {
    const res = await apiPut<NetworkOltConfig | { data: NetworkOltConfig }>(
      `/api/admin/settings/network/routers/${routerId}/olts/${oltId}`,
      payload,
    );
    return unwrap<NetworkOltConfig>(res);
  },

  /**
   * Elimina una OLT.
   */
  deleteNetworkOlt: async (routerId: string, oltId: string): Promise<void> => {
    await apiDelete(`/api/admin/settings/network/routers/${routerId}/olts/${oltId}`);
  },

  /**
   * Obtiene la contraseña descifrada de un router MikroTik.
   */
  getRouterPassword: async (routerId: string): Promise<string> => {
    const res = await apiGet<{ success: boolean; password: string }>(
      `/api/admin/settings/network/routers/${routerId}/password`
    );
    return res.password;
  },

  /**
   * Obtiene la contraseña descifrada de una OLT.
   */
  getOltPassword: async (routerId: string, oltId: string): Promise<string> => {
    const res = await apiGet<{ success: boolean; password: string }>(
      `/api/admin/settings/network/routers/${routerId}/olts/${oltId}/password`
    );
    return res.password;
  },

  /**
   * Prueba conectividad SSH en vivo con un router MikroTik.
   */
  testNetworkConnection: async (
    payload: {
      type?: "router" | "olt";
      host?: string;
      port?: number;
      username?: string;
      password?: string;
      routerId?: string;
      routerName?: string;
      oltId?: string;
      oltName?: string;
      validateOlts?: boolean;
    }
  ): Promise<TestNetworkConnectionResult> => {
    const res = await apiPost<TestNetworkConnectionResult | { data: TestNetworkConnectionResult }>(
      "/api/admin/settings/network/test-connection",
      payload,
    );
    return unwrap<TestNetworkConnectionResult>(res);
  },
};
