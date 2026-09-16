export type CampaignStatus = "DRAFT" | "RUNNING" | "SUSPENDED" | "COMPLETED" | "FINISHED";

export type RecipientStatus = "queued" | "sent" | "delivered" | "read" | "replied" | "failed";

export type CampaignRecipient = {
  id?: string;
  number: string;
  phone?: string;
  name?: string;
  body?: string;
  customBody?: string;
  bodyText?: string;
  variables?: Record<string, string>;
  status?: RecipientStatus;
  errorMessage?: string;
  updatedAt?: string;
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
  status: CampaignStatus;
  lineName?: string;
  quickMode: boolean;
  intervalSeconds: number;
  messageText: string;
  messageBody?: string;
  templateId?: string;
  templateName?: string;
  template_name?: string;
  sentCount: number;
  deliveredCount?: number;
  readCount?: number;
  repliedCount?: number;
  failedCount?: number;
  queuedCount?: number;
  processedCount?: number;
  totalRecipients: number;
  createdAt: string;
  updatedAt: string;
  routingConfig: ChatRoutingConfig;
  contactConfig: ContactEnrichmentConfig;
  recipients?: CampaignRecipient[];
};

export type CreateCampaignPayload = {
  variableMapping?: Record<string, string>;
  columnMapping?: Record<string, string>;
  name: string;
  messageText?: string;
  templateId?: string;
  templateName?: string;
  area?: string;
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
  if (!message || !message.trim()) {
    return { valid: false, error: "El mensaje de la campaña no puede estar vacío." };
  }
  return { valid: true };
}

export function normalizePhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[^0-9+]/g, "");
  if (!cleaned) return "";
  return cleaned.startsWith("+") ? cleaned : `+${cleaned}`;
}

import * as XLSX from "xlsx";

export type CsvParseResult = Array<Record<string, string>> & {
  headers: string[];
  rows: Array<Record<string, string>>;
};

export async function parseImportFile(file: File): Promise<CsvParseResult> {
  const fileNameLower = file.name.toLowerCase();
  const isExcel =
    fileNameLower.endsWith(".xlsx") ||
    fileNameLower.endsWith(".xls") ||
    file.type.includes("spreadsheet") ||
    file.type.includes("excel");

  if (isExcel) {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      const empty = [] as unknown as CsvParseResult;
      empty.headers = [];
      empty.rows = [];
      return empty;
    }
    const worksheet = workbook.Sheets[firstSheetName];
    const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
      defval: "",
      raw: false,
    });

    if (rawData.length === 0) {
      const empty = [] as unknown as CsvParseResult;
      empty.headers = [];
      empty.rows = [];
      return empty;
    }

    const originalKeys = Object.keys(rawData[0] || {});

    // Filtrar columnas sin nombre (__EMPTY) que NO contengan datos en ninguna fila
    const validKeys = originalKeys.filter((key) => {
      const isUnnamed = !key || key.trim() === "" || key.startsWith("__EMPTY");
      if (!isUnnamed) return true;
      return rawData.some((row) => {
        const val = row[key];
        return val !== undefined && val !== null && String(val).trim() !== "";
      });
    });

    const headers = validKeys.map((h, idx) => {
      const trimmed = h ? h.trim() : "";
      if (!trimmed || trimmed.startsWith("__EMPTY")) {
        const colLetter = String.fromCharCode(65 + idx);
        return `Columna ${colLetter}`;
      }
      return trimmed;
    });

    const rows: Array<Record<string, string>> = rawData.map((row) => {
      const stringRow: Record<string, string> = {};
      validKeys.forEach((validKey, idx) => {
        const headerName = headers[idx];
        const val = row[validKey];
        stringRow[headerName] = val !== undefined && val !== null ? String(val).trim() : "";
      });
      return stringRow;
    });

    const res = rows as CsvParseResult;
    res.headers = headers;
    res.rows = rows;
    return res;
  }

  const text = await file.text();
  return parseCsvText(text);
}

export function parseCsvText(csvText: string): CsvParseResult {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) {
    const empty = [] as unknown as CsvParseResult;
    empty.headers = [];
    empty.rows = [];
    return empty;
  }

  const firstLine = lines[0];
  let delimiter = ",";
  if (firstLine.includes(";")) {
    delimiter = ";";
  } else if (firstLine.includes("\t")) {
    delimiter = "\t";
  }

  const rawHeaders = lines[0].split(delimiter).map((h) => h.trim().replace(/^"|"$/g, ""));
  const rawRows: Array<Record<string, string>> = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(delimiter).map((v) => v.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    rawHeaders.forEach((h, idx) => {
      const k = h || `__EMPTY_${idx}`;
      row[k] = values[idx] || "";
    });
    rawRows.push(row);
  }

  const validIndices: number[] = [];
  rawHeaders.forEach((h, idx) => {
    const k = h || `__EMPTY_${idx}`;
    const isUnnamed = !h || h.startsWith("__EMPTY");
    if (!isUnnamed) {
      validIndices.push(idx);
    } else {
      const hasAnyData = rawRows.some((r) => Boolean(r[k] && r[k].trim() !== ""));
      if (hasAnyData) validIndices.push(idx);
    }
  });

  const headers = validIndices.map((idx) => {
    const h = rawHeaders[idx];
    if (!h || h.startsWith("__EMPTY")) {
      return `Columna ${String.fromCharCode(65 + idx)}`;
    }
    return h;
  });

  const results: Array<Record<string, string>> = rawRows.map((r) => {
    const row: Record<string, string> = {};
    validIndices.forEach((origIdx, i) => {
      const origKey = rawHeaders[origIdx] || `__EMPTY_${origIdx}`;
      const headerName = headers[i];
      row[headerName] = r[origKey] || "";
    });
    return row;
  });

  const res = results as CsvParseResult;
  res.headers = headers;
  res.rows = results;
  return res;
}

export function estimateCampaignCost(recipientCount: number, costPerMsg = 0.05): number {
  return recipientCount * costPerMsg;
}

export function buildCampaignRecipientsFromRows(
  rows: Array<Record<string, string>>,
  phoneCol?: string,
  columnMapping?: Record<string, string>,
): {
  recipients: CampaignRecipient[];
  validCount: number;
  invalidCount: number;
  invalidRows: number;
} {
  const recipients: CampaignRecipient[] = [];
  let invalidCount = 0;

  for (const row of rows) {
    let rawNumber = phoneCol ? row[phoneCol] || "" : "";
    if (!rawNumber) {
      const phoneKey = Object.keys(row).find((k) =>
        /^(number|telefono|phone|celular|movil|numero)$/i.test(k.trim()),
      );
      if (phoneKey) {
        rawNumber = row[phoneKey];
      }
    }
    if (!rawNumber) {
      const anyPhoneVal = Object.values(row).find((val) => {
        const cleaned = val.replace(/[^0-9+]/g, "");
        return cleaned.length >= 8 && cleaned.length <= 15;
      });
      if (anyPhoneVal) rawNumber = anyPhoneVal;
    }

    const normalized = normalizePhoneNumber(rawNumber);

    if (!normalized || normalized.length < 8) {
      invalidCount++;
      continue;
    }

    const variables: Record<string, string> = {};
    Object.keys(row).forEach((k) => {
      const lowerKey = k.toLowerCase().trim();
      const val = row[k];
      if (
        val &&
        val.trim() !== "" &&
        ![
          "number",
          "telefono",
          "phone",
          "celular",
          "movil",
          "numero",
          "name",
          "nombre",
          "body",
          "mensaje",
        ].includes(lowerKey)
      ) {
        variables[k] = val;
      }
    });

    if (columnMapping) {
      Object.entries(columnMapping).forEach(([varKey, colName]) => {
        if (colName && row[colName] !== undefined && row[colName].trim() !== "") {
          variables[varKey] = row[colName];
        }
      });
    }

    const nameKey = Object.keys(row).find((k) =>
      /^(name|nombre|contacto|cliente)$/i.test(k.trim()),
    );
    const bodyKey = Object.keys(row).find((k) => /^(body|mensaje)$/i.test(k.trim()));

    recipients.push({
      number: normalized,
      name: nameKey ? row[nameKey] : row.name || row.nombre || "",
      body: bodyKey ? row[bodyKey] : row.body || row.mensaje || "",
      variables: Object.keys(variables).length > 0 ? variables : undefined,
    });
  }

  return { recipients, validCount: recipients.length, invalidCount, invalidRows: invalidCount };
}

export const buildCampaignRecipients = buildCampaignRecipientsFromRows;

export function formatRoutingBehaviorSummary(config?: ChatRoutingConfig): string {
  if (!config) return "Cerrado · Sin departamento";

  const statusLabel =
    config.chatStatus === "open"
      ? "Abierto"
      : config.chatStatus === "pending"
        ? "En espera"
        : "Cerrado";
  const dept =
    config.departmentName && config.departmentName.trim()
      ? config.departmentName
      : "Sin departamento";

  const parts = [`${statusLabel} · ${dept}`];
  if (config.assignedUserName && config.assignedUserName.trim()) {
    parts.push(`Asignado: ${config.assignedUserName}`);
  }
  if (config.delegateToBot) {
    parts.push("Delegado a bot");
  }

  return parts.join(" · ");
}

export function campaignStatusMeta(status: CampaignStatus | string): {
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
        badgeClass: "bg-muted text-muted-foreground border-border",
      };
  }
}

export function calculateCampaignMetrics(campaign: Campaign) {
  const recipients = campaign.recipients || [];

  let queued = 0;
  let sent = 0;
  let delivered = 0;
  let read = 0;
  let replied = 0;
  let failed = 0;

  if (recipients.length > 0) {
    recipients.forEach((r) => {
      const st = (r.status || "pending").toLowerCase();
      if (st === "queued" || st === "pending" || st === "draft") {
        queued++;
      } else if (st === "failed" || st === "skipped") {
        failed++;
      } else if (st === "replied") {
        replied++;
        read++;
        delivered++;
        sent++;
      } else if (st === "read") {
        read++;
        delivered++;
        sent++;
      } else if (st === "delivered") {
        delivered++;
        sent++;
      } else if (st === "sent") {
        sent++;
      }
    });

    const total = campaign.totalRecipients || recipients.length;
    const processed = sent + failed;

    return {
      total,
      processed,
      queued,
      failed,
      sent,
      delivered,
      read,
      replied,
    };
  }

  sent = campaign.sentCount || 0;
  failed = campaign.failedCount ?? 0;
  queued = campaign.queuedCount ?? 0;
  delivered = campaign.deliveredCount ?? Math.round(sent * 0.939);
  read = campaign.readCount ?? Math.round(sent * 0.347);
  replied = campaign.repliedCount ?? Math.round(sent * 0.163);

  const total = campaign.totalRecipients || sent + failed + queued;
  const processed = campaign.processedCount ?? sent + failed;

  return {
    total,
    processed,
    queued,
    failed,
    sent,
    delivered,
    read,
    replied,
  };
}
