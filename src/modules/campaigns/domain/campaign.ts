export type CampaignStatus = "DRAFT" | "RUNNING" | "SUSPENDED" | "COMPLETED";

export type CampaignRecipient = {
  id?: string;
  number: string;
  name?: string;
  body?: string;
  variables?: Record<string, string>;
};

export type ChatRoutingConfig = {
  chatStatus: "open" | "pending" | "closed";
  departmentName?: string;
  assignedUserName?: string;
  keepAssigned: boolean;
  delegateToBot: boolean;
  forceChatUpdate: boolean;
};

export type ContactCustomField = {
  key: string;
  value: string;
};

export type ContactEnrichmentConfig = {
  tags: string[];
  customFields: ContactCustomField[];
  forceContactUpdate: boolean;
};

export type Campaign = {
  id: string;
  name: string;
  status: CampaignStatus;
  quickMode: boolean;
  intervalSeconds: number;
  messageText: string;
  sentCount: number;
  totalRecipients: number;
  createdAt: string;
  updatedAt: string;
  routingConfig: ChatRoutingConfig;
  contactConfig: ContactEnrichmentConfig;
  recipients?: CampaignRecipient[];
};

export type CreateCampaignPayload = {
  name: string;
  messageText: string;
  quickMode: boolean;
  intervalSeconds: number;
  recipients?: CampaignRecipient[];
  routingConfig: ChatRoutingConfig;
  contactConfig: ContactEnrichmentConfig;
};

export function validateCampaignName(name: string): { valid: boolean; error?: string } {
  const trimmed = name.trim();
  if (!trimmed) {
    return { valid: false, error: "El nombre de la campaña es obligatorio." };
  }
  if (trimmed.length > 50) {
    return { valid: false, error: "El nombre no puede superar 50 caracteres." };
  }
  return { valid: true };
}

export function validateCampaignMessage(message: string): { valid: boolean; error?: string } {
  if (!message.trim()) {
    return { valid: false, error: "El mensaje de la campaña no puede estar vacéo." };
  }
  return { valid: true };
}

export function normalizePhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[^0-9+]/g, "");
  if (!cleaned) return "";
  return cleaned.startsWith("+") ? cleaned : `+${cleaned}`;
}

export function parseCsvText(csvText: string): Array<Record<string, string>> {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const results: Array<Record<string, string>> = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || "";
    });
    results.push(row);
  }

  return results;
}

export function buildCampaignRecipientsFromRows(rows: Array<Record<string, string>>): {
  validRecipients: CampaignRecipient[];
  invalidCount: number;
} {
  const validRecipients: CampaignRecipient[] = [];
  let invalidCount = 0;

  for (const row of rows) {
    const rawNumber = row.number || row.telefono || row.phone || row.celular || "";
    const normalized = normalizePhoneNumber(rawNumber);

    if (!normalized || normalized.length < 8) {
      invalidCount++;
      continue;
    }

    const variables: Record<string, string> = {};
    Object.keys(row).forEach((k) => {
      if (
        !["number", "telefono", "phone", "celular", "name", "nombre", "body", "mensaje"].includes(
          k.toLowerCase(),
        )
      ) {
        variables[k] = row[k];
      }
    });

    validRecipients.push({
      number: normalized,
      name: row.name || row.nombre || "",
      body: row.body || row.mensaje || "",
      variables,
    });
  }

  return { validRecipients, invalidCount };
}

export function formatRoutingBehaviorSummary(config?: ChatRoutingConfig): string {
  if (!config) return "Cerrado · Sin departamento";
  const statusLabel =
    config.chatStatus === "open"
      ? "Abierto"
      : config.chatStatus === "pending"
        ? "En espera"
        : "Cerrado";
  const dept = config.departmentName ? config.departmentName : "Sin departamento";
  const assigned = config.assignedUserName ? ` · Asignado: ${config.assignedUserName}` : "";
  const bot = config.delegateToBot ? " · Delegado a bot" : "";
  return `${statusLabel} · ${dept}${assigned}${bot}`;
}

export function campaignStatusMeta(status: CampaignStatus | "FINISHED" | "IN_PROGRESS"): {
  label: string;
  badgeClass: string;
} {
  switch (status) {
    case "COMPLETED":
    case "FINISHED":
      return {
        label: "Terminado",
        badgeClass: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      };
    case "SUSPENDED":
      return {
        label: "Suspendido",
        badgeClass: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      };
    case "RUNNING":
    case "IN_PROGRESS":
      return {
        label: "En curso",
        badgeClass: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      };
    case "DRAFT":
    default:
      return {
        label: "Borrador",
        badgeClass: "bg-muted text-muted-foreground",
      };
  }
}
