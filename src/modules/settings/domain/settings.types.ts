export type ChannelProvider = "meta" | "zernio";
export type AiProvider = "gemini" | "ollama";

export interface WhatsAppChannelSettings {
  provider: ChannelProvider;
  phoneNumberId: string;
  wabaId: string;
  accessToken: string;
  appSecret: string;
  verifyToken: string;
  zernioApiKey: string;
  zernioAccountId: string;
  zernioWebhookSecret: string;
  zernioBaseUrl: string;
  messageDebounceMs?: number;
}

export interface AiProviderSettings {
  provider: AiProvider;
  geminiApiKey: string;
  geminiModel: string;
  geminiEmbeddingModel: string;
  geminiEmbeddingDimension: number;
  ollamaBaseUrl: string;
  ollamaModel: string;
  ollamaEmbeddingModel: string;
  ollamaEmbeddingDimension: number;
  aiCallTimeoutMs: number;
  aiQualityTimeoutMs: number;
}

export interface SystemSetupStatus {
  isChannelConfigured: boolean;
  isAiConfigured: boolean;
  hasDepartments: boolean;
  hasAgents: boolean;
  isInitialSetupComplete: boolean;
  activeChannelProvider: ChannelProvider;
  activeAiProvider: AiProvider;
}

export interface TestConnectionResult {
  ok: boolean;
  latencyMs: number;
  message: string;
  warning?: boolean;
  details?: Record<string, unknown>;
}

export interface SystemSettingsData {
  channels: WhatsAppChannelSettings;
  ai: AiProviderSettings;
}
