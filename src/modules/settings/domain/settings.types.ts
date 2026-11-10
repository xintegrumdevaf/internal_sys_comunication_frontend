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
  telegram?: TelegramSettings;
}

export type AiModelType = "inference" | "embedding";
export type AiModelTier = "economy" | "balanced" | "performance" | "specialized";

export interface AiModelInfo {
  id: string;
  name: string;
  provider: AiProvider;
  type: AiModelType;
  tier: AiModelTier;
  tierLabel: string;
  description?: string;
  recommended?: boolean;
  costTier: 1 | 2 | 3;
  contextWindow?: number;
  defaultDimension?: number;
}

export interface ListAiModelsResult {
  provider: AiProvider;
  inferenceModels: AiModelInfo[];
  embeddingModels: AiModelInfo[];
}

export type OltBrand = "v-sol" | "huawei" | "c-data" | "kingtype" | "s/m";

export interface NetworkOltConfig {
  id: string;
  routerId: string;
  name: string;
  displayName: string;
  ip: string;
  brand: OltBrand;
  username: string;
  password?: string;
  hasPassword: boolean;
  slot?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface NetworkRouterConfig {
  id: string;
  name: string;
  displayName: string;
  host: string;
  port: number;
  username: string;
  password?: string;
  hasPassword: boolean;
  isActive: boolean;
  olts: NetworkOltConfig[];
  createdAt?: string;
  updatedAt?: string;
}

export interface TestNetworkConnectionResult {
  success: boolean;
  latencyMs: number;
  message: string;
  error?: string;
  details?: {
    router?: { success: boolean; latencyMs: number };
    olts?: Array<{
      id: string;
      name: string;
      displayName?: string | null;
      success: boolean;
      latencyMs: number;
      error?: string;
    }>;
  };
}

export type TelegramTopicCategory =
  | "SLA"
  | "INFRASTRUCTURE"
  | "DIGEST"
  | "QUEUE"
  | "QUALITY"
  | "GENERAL";

export interface TelegramTopicConfig {
  id: string;
  name: string;
  category: TelegramTopicCategory;
  threadId: number;
  enabled: boolean;
}

export type TelegramAlertRuleCategory = "SLA" | "INFRASTRUCTURE" | "QUEUE";

export interface TelegramAlertRuleConfig {
  id: string;
  name: string;
  category: TelegramAlertRuleCategory;
  threshold: number;
  unit: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  enabled: boolean;
  description: string;
}

export interface TelegramSettings {
  enabled: boolean;
  botToken: string;
  defaultChatId: string;
  topicsEnabled?: boolean;
  topics?: TelegramTopicConfig[];
  slaTopicId?: number | null;
  infraTopicId?: number | null;
  digestsTopicId?: number | null;
  digestsEnabled: boolean;
  digestHours: string[];
  timeZone: string;
  alertRules?: TelegramAlertRuleConfig[];
  slaThresholdMinutes: number;
  infraAlertMinCases: number;
  queueSaturationThreshold: number;
  webhookSecret?: string;
  commandsEnabled: boolean;
  aiCopilotEnabled: boolean;
}

export interface TestTelegramAlertInput {
  category: TelegramAlertRuleCategory;
  chatId?: string;
  botToken?: string;
  messageThreadId?: number;
}

export interface TestTelegramTopicInput {
  threadId?: number;
  topicName?: string;
  chatId?: string;
  botToken?: string;
}

export interface TestTelegramMessageResult {
  ok: boolean;
  messageId?: number;
  chatId?: string;
  date?: number;
  migratedToChatId?: string;
}

export interface TestTelegramResult {
  ok: boolean;
  bot?: {
    id: number;
    is_bot: boolean;
    first_name: string;
    username?: string;
  };
  messageSent?: boolean;
  error?: string;
  migratedToChatId?: string;
}

export interface SetTelegramWebhookResult {
  webhookUrl: string;
  registered: boolean;
}

export interface TelegramDetectedChat {
  id: string;
  title: string;
  type: string;
}

export interface DetectTelegramChatsResult {
  chats: TelegramDetectedChat[];
}
