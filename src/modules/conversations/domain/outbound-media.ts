/**
 * Límites de envío alineados con WhatsApp Cloud API y con
 * `resolveWhatsAppMediaType` del backend (imagen 5 MB, video/audio 16 MB,
 * documento 100 MB).
 */
export type OutboundMediaKind = "image" | "video" | "audio" | "document";

export type OutboundMediaRule = {
  label: string;
  menuHint: string;
  rejectHint: string;
  accept: string;
  maxBytes: number;
  /** Vacío = cualquier archivo (documentos). */
  extensions: string[];
  mimes: string[];
};

const MB = 1024 * 1024;

export const OUTBOUND_MEDIA_RULES: Record<OutboundMediaKind, OutboundMediaRule> = {
  image: {
    label: "imagen",
    menuHint: "JPG, PNG o WEBP · máx. 5 MB",
    rejectHint: "Selecciona una imagen JPG, PNG o WEBP.",
    accept: "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp",
    maxBytes: 5 * MB,
    extensions: ["jpg", "jpeg", "png", "webp"],
    mimes: ["image/jpeg", "image/png", "image/webp"],
  },
  video: {
    label: "video",
    menuHint: "MP4, 3GP o MOV · máx. 16 MB",
    rejectHint: "Selecciona un video MP4, 3GP o MOV.",
    accept: "video/mp4,video/3gpp,video/quicktime,.mp4,.3gp,.3gpp,.mov",
    maxBytes: 16 * MB,
    extensions: ["mp4", "3gp", "3gpp", "mov"],
    mimes: ["video/mp4", "video/3gpp", "video/quicktime"],
  },
  audio: {
    label: "audio",
    menuHint: "MP3, M4A, AAC, OGG · máx. 16 MB",
    rejectHint: "Selecciona un audio MP3, M4A, AAC, OGG u OPUS.",
    accept: "audio/mpeg,audio/mp4,audio/aac,audio/amr,audio/ogg,audio/opus,.mp3,.m4a,.aac,.amr,.ogg,.opus",
    maxBytes: 16 * MB,
    extensions: ["mp3", "m4a", "aac", "amr", "ogg", "opus"],
    mimes: ["audio/mpeg", "audio/mp4", "audio/aac", "audio/amr", "audio/ogg", "audio/opus"],
  },
  document: {
    label: "documento",
    menuHint: "PDF, Office y otros · máx. 100 MB",
    rejectHint: "No se pudo adjuntar ese documento.",
    accept:
      ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain",
    maxBytes: 100 * MB,
    extensions: [],
    mimes: [],
  },
};

export type OutboundMediaValidation =
  | { ok: true; kind: OutboundMediaKind }
  | { ok: false; message: string };

function extensionOf(filename: string): string {
  const base = filename.split(/[/\\]/).pop() ?? filename;
  const dot = base.lastIndexOf(".");
  if (dot <= 0) return "";
  return base.slice(dot + 1).toLowerCase();
}

function matchesKind(file: File, kind: OutboundMediaKind): boolean {
  const rule = OUTBOUND_MEDIA_RULES[kind];
  if (kind === "document") return true;
  const ext = extensionOf(file.name);
  const mime = file.type.toLowerCase().split(";")[0]?.trim() ?? "";
  if (ext && rule.extensions.includes(ext)) return true;
  if (mime && rule.mimes.includes(mime)) return true;
  return false;
}

function limitLabel(bytes: number): string {
  return `${Math.round(bytes / MB)} MB`;
}

export function validateOutboundMedia(file: File, kind: OutboundMediaKind): OutboundMediaValidation {
  const rule = OUTBOUND_MEDIA_RULES[kind];
  if (file.size <= 0) {
    return { ok: false, message: "El archivo está vacío." };
  }
  if (!matchesKind(file, kind)) {
    return { ok: false, message: rule.rejectHint };
  }
  if (file.size > rule.maxBytes) {
    return {
      ok: false,
      message: `El ${rule.label} supera el límite de ${limitLabel(rule.maxBytes)} de WhatsApp.`,
    };
  }
  return { ok: true, kind };
}

export function formatOutboundFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < MB) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  const mb = bytes / MB;
  return mb >= 10 ? `${Math.round(mb)} MB` : `${mb.toFixed(1)} MB`;
}
