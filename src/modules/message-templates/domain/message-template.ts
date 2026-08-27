export type TemplateCategory = "MARKETING" | "UTILITY" | "AUTHENTICATION";

export type TemplateStatus = "PENDING" | "APPROVED" | "REJECTED";

export type TemplateHeaderType = "NONE" | "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT";

export type TemplateButtonType = "QUICK_REPLY" | "CALL_TO_ACTION";

export type TemplateHeader = {
  type: TemplateHeaderType;
  text?: string;
  mediaUrl?: string;
};

export type TemplateButton = {
  type: TemplateButtonType;
  text: string;
  url?: string;
  phoneNumber?: string;
};

export type WabaConnectionDto = {
  id: string;
  name: string;
  phoneNumber?: string;
  status: "active" | "inactive";
};

export type MessageTemplate = {
  id: string;
  name: string;
  category: TemplateCategory;
  language: string;
  languageLabel?: string;
  connectionId: string;
  connectionName: string;
  status: TemplateStatus;
  rejectedReason?: string;
  header?: TemplateHeader;
  body: string;
  footer?: string;
  buttons?: TemplateButton[];
  variables: string[];
  createdAt: string;
  updatedAt?: string;
};

// Raw Backend DTOs alineados exactamente con las especificaciones del backend
export type BackendRawButton = {
  type: string; // e.g. "URL" | "QUICK_REPLY" | "PHONE"
  text: string;
  url?: string;
  phoneNumber?: string;
};

export type RawBackendTemplate = {
  id: string;
  name: string;
  category: TemplateCategory;
  language: string;
  connectionId: string;
  headerType: TemplateHeaderType;
  headerContent?: string | null;
  bodyText: string;
  footerText?: string | null;
  buttons?: BackendRawButton[] | null;
  status: TemplateStatus;
  metaTemplateId?: string | null;
  rejectedReason?: string | null;
  createdAt: string;
  updatedAt?: string;
};

export type BackendTemplateListResponse = {
  templates: RawBackendTemplate[];
  total: number;
};

export type BackendCreateTemplatePayload = {
  name: string;
  category: TemplateCategory;
  language: string;
  connectionId: string;
  headerType: TemplateHeaderType;
  headerContent?: string | null;
  bodyText: string;
  footerText?: string | null;
  buttons?: BackendRawButton[] | null;
};

/**
 * Reglas de Meta para el nombre de la plantilla:
 * Solo letras minúsculas (a-z), números (0-9) y guiones bajos (_).
 * Sin espacios, mayúsculas ni caracteres especiales.
 */
export const META_TEMPLATE_NAME_REGEX = /^[a-z0-9_]+$/;

export function validateMetaTemplateName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim() === "") {
    return { valid: false, error: "El nombre de la plantilla es obligatorio." };
  }
  if (!META_TEMPLATE_NAME_REGEX.test(name)) {
    return {
      valid: false,
      error:
        "El nombre solo puede contener letras minúsculas (a-z), números (0-9) y guiones bajos (_).",
    };
  }
  if (name.length > 512) {
    return { valid: false, error: "El nombre no puede exceder los 512 caracteres." };
  }
  return { valid: true };
}

export function validateTemplateBody(body: string): { valid: boolean; error?: string } {
  if (!body || body.trim() === "") {
    return { valid: false, error: "El cuerpo del mensaje es obligatorio." };
  }
  if (body.length > 1024) {
    return { valid: false, error: "El cuerpo del mensaje no puede exceder 1024 caracteres." };
  }
  return { valid: true };
}

/**
 * Extrae las variables del cuerpo del mensaje en formato {{1}}, {{2}}, {{3}}...
 * Retorna las llaves únicas ordenadas (ej: ["1", "2"]).
 */
export function extractTemplateVariables(bodyText: string): string[] {
  if (!bodyText) return [];
  const regex = /\{\{(\d+)\}\}/g;
  const matches = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = regex.exec(bodyText)) !== null) {
    if (match[1]) {
      matches.add(match[1]);
    }
  }

  return Array.from(matches).sort((a, b) => Number(a) - Number(b));
}

/**
 * Reemplaza las variables {{1}}, {{2}}... en el texto con valores dados o un marcador visual.
 */
export function substituteTemplateVariables(
  text: string,
  variables?: Record<string, string>,
): string {
  if (!text) return "";
  return text.replace(/\{\{(\d+)\}\}/g, (match, varNum) => {
    if (variables && variables[varNum] !== undefined && variables[varNum] !== "") {
      return variables[varNum];
    }
    return `[Variable ${varNum}]`;
  });
}

const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  MARKETING: "Marketing",
  UTILITY: "Utilidad",
  AUTHENTICATION: "Autenticación",
};

export function templateCategoryLabel(category: TemplateCategory): string {
  return CATEGORY_LABELS[category] ?? category;
}

export function templateStatusMeta(status: TemplateStatus): {
  label: string;
  color: string;
  badgeClass: string;
  dotClass: string;
} {
  switch (status) {
    case "APPROVED":
      return {
        label: "Aprobado",
        color: "#10b981",
        badgeClass: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        dotClass: "bg-emerald-500",
      };
    case "PENDING":
      return {
        label: "Pendiente",
        color: "#f59e0b",
        badgeClass: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        dotClass: "bg-amber-500 animate-pulse",
      };
    case "REJECTED":
      return {
        label: "Rechazado",
        color: "#ef4444",
        badgeClass: "bg-rose-500/10 text-rose-500 border-rose-500/20",
        dotClass: "bg-rose-500",
      };
    default:
      return {
        label: status,
        color: "#6b7280",
        badgeClass: "bg-muted text-muted-foreground border-border",
        dotClass: "bg-muted-foreground",
      };
  }
}

const LANGUAGE_LABELS: Record<string, string> = {
  es: "ES Español",
  es_MX: "MX Español (México)",
  es_EC: "EC Español (Ecuador)",
  pt_BR: "BR Português (BR)",
  en: "EN English",
};

export function mapRawBackendTemplateToDomain(raw: RawBackendTemplate): MessageTemplate {
  const variables = extractTemplateVariables(raw.bodyText || "");
  const languageLabel = LANGUAGE_LABELS[raw.language] || raw.language;
  const connectionName =
    raw.connectionId === "default" || !raw.connectionId
      ? "Línea Oficial WhatsApp"
      : `Conexión ${raw.connectionId}`;

  return {
    id: raw.id,
    name: raw.name,
    category: raw.category,
    language: raw.language,
    languageLabel,
    connectionId: raw.connectionId || "default",
    connectionName,
    status: raw.status,
    rejectedReason: raw.rejectedReason || undefined,
    header:
      raw.headerType && raw.headerType !== "NONE"
        ? {
            type: raw.headerType,
            text: raw.headerContent || undefined,
          }
        : undefined,
    body: raw.bodyText || "",
    footer: raw.footerText || undefined,
    buttons:
      raw.buttons && raw.buttons.length > 0
        ? raw.buttons.map((b) => ({
            type: b.type === "URL" ? "CALL_TO_ACTION" : "QUICK_REPLY",
            text: b.text,
            url: b.url,
            phoneNumber: b.phoneNumber,
          }))
        : undefined,
    variables,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}
