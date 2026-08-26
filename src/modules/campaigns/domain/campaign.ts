export type RecipientStatus = "pending" | "sent" | "delivered" | "read" | "failed";

export type CampaignRecipient = {
  phone: string;
  variables: Record<string, string>;
  status?: RecipientStatus;
  errorMessage?: string;
  sentAt?: string;
};

export type CampaignStatus = "draft" | "scheduled" | "in_progress" | "completed" | "failed";

export type WhatsAppCampaign = {
  id: string;
  name: string;
  templateId: string;
  templateName: string;
  area?: string;
  status: CampaignStatus;
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  progress: number;
  recipients?: CampaignRecipient[];
  createdAt: string;
  completedAt?: string;
};

export type CsvMapping = Record<string, string>; // e.g. { "1": "Nombre", "2": "Monto" }

/**
 * Parsea un texto CSV y retorna los nombres de columnas y las filas de datos.
 */
export function parseCsvText(csvText: string): { headers: string[]; rows: Record<string, string>[] } {
  if (!csvText || !csvText.trim()) {
    return { headers: [], rows: [] };
  }

  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return { headers: [], rows: [] };

  // Detectar separador (coma, punto y coma o tabulación)
  const firstLine = lines[0];
  const separator = firstLine.includes(";") ? ";" : firstLine.includes("\t") ? "\t" : ",";

  const headers = firstLine.split(separator).map((h) => h.trim().replace(/^["']|["']$/g, ""));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(separator).map((v) => v.trim().replace(/^["']|["']$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? "";
    });
    rows.push(row);
  }

  return { headers, rows };
}

/**
 * Normaliza números de teléfono (elimina espacios, guiones y asegura prefijo si aplica).
 */
export function normalizePhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, "");
  return cleaned;
}

/**
 * Convierte las filas CSV en destinatarios con sus variables mapeadas.
 */
export function buildCampaignRecipients(
  rows: Record<string, string>[],
  phoneColumn: string,
  mapping: CsvMapping, // { "1": "ColumnaCSV", "2": "OtraColumna" }
): { recipients: CampaignRecipient[]; invalidRows: number } {
  const recipients: CampaignRecipient[] = [];
  let invalidRows = 0;

  for (const row of rows) {
    const rawPhone = row[phoneColumn];
    if (!rawPhone) {
      invalidRows++;
      continue;
    }

    const phone = normalizePhoneNumber(rawPhone);
    if (!phone || phone.length < 7) {
      invalidRows++;
      continue;
    }

    const variables: Record<string, string> = {};
    for (const [varNum, colName] of Object.entries(mapping)) {
      variables[varNum] = row[colName] ?? "";
    }

    recipients.push({
      phone,
      variables,
      status: "pending",
    });
  }

  return { recipients, invalidRows };
}

/**
 * Calcula un costo aproximado estimado de mensajes masivos en WhatsApp Business Cloud API.
 * Aproximación estándar: ~$0.045 - $0.055 USD por mensaje según categoría Marketing/Utility.
 */
export function estimateCampaignCost(recipientCount: number, pricePerMessage = 0.05): number {
  return Number((recipientCount * pricePerMessage).toFixed(2));
}
