export type N8nWorkflowCategory = "case_action" | "admin_action";

export type N8nWorkflowEntryDto = {
  action: string;
  category: N8nWorkflowCategory;
  url: string;
  description?: string | null;
  timeoutMs: number;
  maxRetries: number;
  active: boolean;
  updatedAt: string;
  updatedBy?: string | null;
};
