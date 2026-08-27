export type TemplateCategory = "MARKETING" | "UTILITY" | "AUTHENTICATION";

export type TemplateStatus = "draft" | "pending" | "approved" | "rejected" | "paused";

export type HeaderType = "NONE" | "TEXT" | "IMAGE" | "VIDEO";

export type ButtonType = "QUICK_REPLY" | "CALL_TO_ACTION";

export type CtaType = "URL" | "PHONE_NUMBER";

export type TemplateHeader = {
  type: HeaderType;
  text?: string;
  mediaUrl?: string;
};

export type TemplateBody = {
  text: string;
};

export type TemplateFooter = {
  text?: string;
};

export type TemplateButton = {
  type: ButtonType;
  text: string;
  ctaType?: CtaType;
  url?: string;
  phoneNumber?: string;
};

export type TemplateComponents = {
  header?: TemplateHeader;
  body: TemplateBody;
  footer?: TemplateFooter;
  buttons?: TemplateButton[];
};

export type WhatsAppTemplate = {
  id: string;
  name: string;
  category: TemplateCategory;
  language: string;
  status: TemplateStatus;
  rejectedReason?: string;
  components: TemplateComponents;
  variables: string[];
  createdAt: string;
  updatedAt?: string;
};

/**
 * Reglas de Meta para el nombre de la plantilla:
 * - Solo letras minúsculas, números y guiones bajos (lowercase alphanumeric and underscores).
 * - No se permiten espacios, mayúsculas ni caracteres especiales.
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
        "El nombre solo puede contener letras minúsculas (a-z), números (0-9) y guiones bajos (_). Sin espacios ni mayúsculas.",
    };
  }
  if (name.length > 512) {
    return { valid: false, error: "El nombre no puede exceder 512 caracteres." };
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
 * Reemplaza las variables {{1}}, {{2}}... en el texto con los valores dados.
 */
export function substituteVariables(
  text: string,
  variables: Record<string, string>,
  fallbackPlaceholder = true,
): string {
  if (!text) return "";
  return text.replace(/\{\{(\d+)\}\}/g, (match, varName) => {
    const val = variables[varName];
    if (val !== undefined && val !== null && val.trim() !== "") {
      return val;
    }
    return fallbackPlaceholder ? `[${match}]` : match;
  });
}
