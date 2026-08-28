export type CampaignStatus =
  "DRAFT" | "RUNNING" | "SUSPENDED" | "COMPLETED" | "in_progress" | "completed" | "draft";

export type CampaignRecipient = {
  id?: string;
  number: string;
  phone?: string;
  name?: string;
  body?: string;
  variables?: Record<string, string>;
  status?: "pending" | "sent" | "delivered" | "failed" | string;
  errorMessage?: string;
  sentAt?: string;
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
  area?: string;
  templateId?: string;
  status: CampaignStatus | string;
  quickMode?: boolean;
  intervalSeconds?: number;
  messageText?: string;
  sentCount: number;
  deliveredCount?: number;
  failedCount?: number;
  totalRecipients: number;
  progress?: number;
  createdAt: string;
  updatedAt: string;
  routingConfig?: ChatRoutingConfig;
  contactConfig?: ContactEnrichmentConfig;
  recipients?: CampaignRecipient[];
};

export type WhatsAppCampaign = Campaign;

export type CreateCampaignPayload = {
  name: string;
  templateId?: string;
  area?: string;
  messageText?: string;
  quickMode?: boolean;
  intervalSeconds?: number;
  recipients?: CampaignRecipient[];
  routingConfig?: ChatRoutingConfig;
  contactConfig?: ContactEnrichmentConfig;
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
    return { valid: false, error: "El mensaje de la campaña no puede estar vacío." };
  }
  return { valid: true };
}

export function normalizePhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[^0-9+]/g, "");
  if (!cleaned) return "";
  return cleaned.startsWith("+") ? cleaned : `+${cleaned}`;
}

export function parseCsvText(csvText: string): {
  headers: string[];
  rows: Array<Record<string, string>>;
} {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows: Array<Record<string, string>> = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || "";
    });
    rows.push(row);
  }

  return { headers, rows };
}

export function buildCampaignRecipients(
  rows: Array<Record<string, string>>,
  phoneColumn: string,
  columnMapping: Record<string, string>,
): { recipients: CampaignRecipient[]; invalidRows: number } {
  const recipients: CampaignRecipient[] = [];
  let invalidRows = 0;

  for (const row of rows) {
    const rawNumber =
      row[phoneColumn] || row.phone || row.number || row.telefono || row.celular || "";
    const normalized = normalizePhoneNumber(rawNumber);

    if (!normalized || normalized.length < 8) {
      invalidRows++;
      continue;
    }

    const variables: Record<string, string> = {};
    Object.entries(columnMapping).forEach(([varKey, colHeader]) => {
      if (colHeader && row[colHeader] !== undefined) {
        variables[varKey] = row[colHeader];
      }
    });

    recipients.push({
      number: normalized,
      phone: normalized,
      name: row.name || row.nombre || "",
      variables,
      status: "pending",
    });
  }

  return { recipients, invalidRows };
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
      phone: normalized,
      name: row.name || row.nombre || "",
      body: row.body || row.mensaje || "",
      variables,
      status: "pending",
    });
  }

  return { validRecipients, invalidCount };
}

export function estimateCampaignCost(recipientCount: number): number {
  return recipientCount * 0.05;
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

export function campaignStatusMeta(status: CampaignStatus | string): {
  label: string;
  badgeClass: string;
} {
  switch (status) {
    case "COMPLETED":
    case "FINISHED":
    case "completed":
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
    case "in_progress":
      return {
        label: "En curso",
        badgeClass: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      };
    case "DRAFT":
    case "draft":
    default:
      return {
        label: "Borrador",
        badgeClass: "bg-muted text-muted-foreground",
      };
  }
}
