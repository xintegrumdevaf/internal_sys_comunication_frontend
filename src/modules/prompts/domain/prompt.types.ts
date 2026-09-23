export interface PromptModelConfig {
  temperature?: number;
  model?: string;
  maxTokens?: number;
  topP?: number;
  [key: string]: unknown;
}

export interface PromptVersionDto {
  id: string;
  versionNumber: number;
  systemPrompt: string;
  userTemplate: string;
  modelConfig?: PromptModelConfig;
  changeNotes?: string;
  isPublished?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface PromptVariableDefinition {
  key: string;
  label: string;
  description: string;
  placeholder?: string;
  example?: string;
  required?: boolean;
}

export interface BusinessInterpretation {
  actionBadge: {
    label: string;
    variant: "success" | "info" | "warning" | "destructive" | "secondary";
    description: string;
  };
  intentTitle: string;
  departmentName: string;
  resolutionPath: string;
  confidencePercent: number;
  confidenceBadge: "ALTA" | "MEDIA" | "BAJA";
  summary: string;
  extractedDetails?: Array<{ label: string; value: string }>;
}

export interface PromptDto {
  id: string;
  slug: string;
  name: string;
  description: string;
  allowedVariables: string[];
  variableDefinitions?: PromptVariableDefinition[];
  activeVersion?: PromptVersionDto | null;
  versionsCount: number;
  versions?: PromptVersionDto[];
}

export interface CreatePromptVersionPayload {
  systemPrompt: string;
  userTemplate: string;
  changeNotes?: string;
  modelConfig?: PromptModelConfig;
  publishImmediately?: boolean;
}

export interface SimulatePromptPayload {
  systemPrompt: string;
  userTemplate: string;
  testVariables: Record<string, string>;
  modelConfig?: PromptModelConfig;
}

export interface SimulatePromptResponse {
  interpolatedSystem: string;
  interpolatedUser: string;
  rawResponse: string;
  parsedResponse?: unknown;
  businessInterpretation?: BusinessInterpretation;
  isValidJson: boolean;
  durationMs: number;
}
