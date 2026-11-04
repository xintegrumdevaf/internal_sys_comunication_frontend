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
    accept:
      "audio/mpeg,audio/mp4,audio/aac,audio/amr,audio/ogg,audio/opus,.mp3,.m4a,.aac,.amr,.ogg,.opus",
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
  { ok: true; kind: OutboundMediaKind } | { ok: false; message: string };

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

export function validateOutboundMedia(
  file: File,
  kind: OutboundMediaKind,
): OutboundMediaValidation {
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

const DOCUMENT_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "txt",
  "csv",
  "zip",
  "rar",
];

const DOCUMENT_EXT_TO_MIME: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  txt: "text/plain",
  csv: "text/csv",
  zip: "application/zip",
  rar: "application/vnd.rar",
};

const VIDEO_EXT_TO_MIME: Record<string, string> = {
  mp4: "video/mp4",
  "3gp": "video/3gpp",
  "3gpp": "video/3gpp",
  mov: "video/quicktime",
};

const AUDIO_EXT_TO_MIME: Record<string, string> = {
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  aac: "audio/aac",
  amr: "audio/amr",
  ogg: "audio/ogg",
  opus: "audio/opus",
};

const PASTE_MIME_TO_VIDEO: Record<string, { ext: string; type: string }> = {
  "video/mp4": { ext: "mp4", type: "video/mp4" },
  "video/3gpp": { ext: "3gp", type: "video/3gpp" },
  "video/quicktime": { ext: "mov", type: "video/quicktime" },
};

const PASTE_MIME_TO_AUDIO: Record<string, { ext: string; type: string }> = {
  "audio/mpeg": { ext: "mp3", type: "audio/mpeg" },
  "audio/mp4": { ext: "m4a", type: "audio/mp4" },
  "audio/aac": { ext: "aac", type: "audio/aac" },
  "audio/amr": { ext: "amr", type: "audio/amr" },
  "audio/ogg": { ext: "ogg", type: "audio/ogg" },
  "audio/opus": { ext: "opus", type: "audio/opus" },
};

const PASTE_MIME_TO_DOCUMENT: Record<string, { ext: string; type: string }> = {
  "application/pdf": { ext: "pdf", type: "application/pdf" },
  "application/msword": { ext: "doc", type: "application/msword" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    ext: "docx",
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
  "application/vnd.ms-excel": { ext: "xls", type: "application/vnd.ms-excel" },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
    ext: "xlsx",
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  },
  "application/vnd.ms-powerpoint": { ext: "ppt", type: "application/vnd.ms-powerpoint" },
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": {
    ext: "pptx",
    type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  },
  "text/plain": { ext: "txt", type: "text/plain" },
  "text/csv": { ext: "csv", type: "text/csv" },
  "application/zip": { ext: "zip", type: "application/zip" },
  "application/x-zip-compressed": { ext: "zip", type: "application/zip" },
  "application/vnd.rar": { ext: "rar", type: "application/vnd.rar" },
  "application/x-rar-compressed": { ext: "rar", type: "application/vnd.rar" },
};

const RASTER_EXTENSIONS = new Set([
  ...OUTBOUND_MEDIA_RULES.image.extensions,
  "gif",
  "bmp",
  "tif",
  "tiff",
  "avif",
  "heic",
  "heif",
  "jfif",
]);

const VIDEO_LIKE_EXTENSIONS = new Set([
  ...OUTBOUND_MEDIA_RULES.video.extensions,
  "webm",
  "mkv",
  "avi",
  "m4v",
]);

const AUDIO_LIKE_EXTENSIONS = new Set([
  ...OUTBOUND_MEDIA_RULES.audio.extensions,
  "wav",
  "flac",
  "weba",
]);

const PASTE_MIME_TO_IMAGE: Record<string, { ext: string; type: string }> = {
  "image/jpeg": { ext: "jpg", type: "image/jpeg" },
  "image/jpg": { ext: "jpg", type: "image/jpeg" },
  "image/pjpeg": { ext: "jpg", type: "image/jpeg" },
  "image/png": { ext: "png", type: "image/png" },
  "image/x-png": { ext: "png", type: "image/png" },
  "image/webp": { ext: "webp", type: "image/webp" },
};

type ClipboardFileItem = {
  kind: string;
  type: string;
  getAsFile: () => File | null;
};

export type ClipboardImageSource = {
  files?: ArrayLike<File> | null;
  items?: ArrayLike<ClipboardFileItem> | null;
};

export type PastedImageClassification =
  | { status: "ready"; file: File }
  | { status: "needs-conversion" }
  | { status: "rejected"; message: string };

export type PastedClipboardClassification =
  | { status: "ready"; file: File; kind: OutboundMediaKind }
  | { status: "needs-conversion" }
  | { status: "rejected"; message: string };

function mimeOf(file: File): string {
  return file.type.toLowerCase().split(";")[0]?.trim() ?? "";
}

function hasAllowedImageExtension(filename: string): boolean {
  const ext = extensionOf(filename);
  return Boolean(ext) && OUTBOUND_MEDIA_RULES.image.extensions.includes(ext);
}

function isClipboardImage(file: File): boolean {
  const mime = mimeOf(file);
  if (mime.startsWith("image/")) return true;
  const ext = extensionOf(file.name);
  return hasAllowedImageExtension(file.name) || RASTER_EXTENSIONS.has(ext);
}

function isVideoLike(file: File): boolean {
  if (mimeOf(file).startsWith("video/")) return true;
  return VIDEO_LIKE_EXTENSIONS.has(extensionOf(file.name));
}

function isAudioLike(file: File): boolean {
  if (mimeOf(file).startsWith("audio/")) return true;
  return AUDIO_LIKE_EXTENSIONS.has(extensionOf(file.name));
}

function isDocumentFile(file: File): boolean {
  const ext = extensionOf(file.name);
  if (DOCUMENT_EXTENSIONS.includes(ext)) return true;
  return Boolean(PASTE_MIME_TO_DOCUMENT[mimeOf(file)]);
}

function formatPasteStamp(now: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

/**
 * Archivos del portapapeles. El texto plano no entra aquí, así el pegado
 * de un mensaje sigue escribiéndose en el cuadro.
 */
export function filesFromClipboard(source: ClipboardImageSource | null | undefined): File[] {
  if (!source) return [];
  const listed = source.files ? Array.from(source.files) : [];
  if (listed.length > 0) return listed;
  if (!source.items) return [];
  const fromItems: File[] = [];
  for (const item of Array.from(source.items)) {
    if (item.kind !== "file") continue;
    const file = item.getAsFile();
    if (file) fromItems.push(file);
  }
  return fromItems;
}

export function namePastedImage(file: File, now = new Date()): File {
  if (hasAllowedImageExtension(file.name) && file.type) return file;
  if (hasAllowedImageExtension(file.name)) {
    const ext = extensionOf(file.name);
    const type = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : `image/${ext}`;
    return new File([file], file.name, { type, lastModified: file.lastModified });
  }
  const mapped = PASTE_MIME_TO_IMAGE[mimeOf(file)];
  if (!mapped) return file;
  return new File([file], `imagen-${formatPasteStamp(now)}.${mapped.ext}`, {
    type: mapped.type,
    lastModified: file.lastModified,
  });
}

export function classifyPastedImage(file: File, now = new Date()): PastedImageClassification {
  if (file.size <= 0) {
    return { status: "rejected", message: "El archivo está vacío." };
  }
  const named = namePastedImage(file, now);
  if (matchesKind(named, "image")) {
    const check = validateOutboundMedia(named, "image");
    if (!check.ok) return { status: "rejected", message: check.message };
    return { status: "ready", file: named };
  }
  const mime = mimeOf(file);
  const ext = extensionOf(file.name);
  if (mime.startsWith("image/") || RASTER_EXTENSIONS.has(ext)) {
    return { status: "needs-conversion" };
  }
  return { status: "rejected", message: OUTBOUND_MEDIA_RULES.image.rejectHint };
}

function mimeForExtension(kind: Exclude<OutboundMediaKind, "image">, ext: string): string {
  if (kind === "video") return VIDEO_EXT_TO_MIME[ext] ?? "";
  if (kind === "audio") return AUDIO_EXT_TO_MIME[ext] ?? "";
  return DOCUMENT_EXT_TO_MIME[ext] ?? "";
}

function mimeMapFor(
  kind: Exclude<OutboundMediaKind, "image">,
): Record<string, { ext: string; type: string }> {
  if (kind === "video") return PASTE_MIME_TO_VIDEO;
  if (kind === "audio") return PASTE_MIME_TO_AUDIO;
  return PASTE_MIME_TO_DOCUMENT;
}

function namePastedMedia(file: File, kind: Exclude<OutboundMediaKind, "image">, now: Date): File {
  const allowed = kind === "document" ? DOCUMENT_EXTENSIONS : OUTBOUND_MEDIA_RULES[kind].extensions;
  const ext = extensionOf(file.name);
  if (ext && allowed.includes(ext)) {
    if (file.type) return file;
    const type = mimeForExtension(kind, ext);
    if (!type) return file;
    return new File([file], file.name, { type, lastModified: file.lastModified });
  }
  const mapped = mimeMapFor(kind)[mimeOf(file)];
  if (!mapped) return file;
  const prefix = kind === "video" ? "video" : kind === "audio" ? "audio" : "documento";
  return new File([file], `${prefix}-${formatPasteStamp(now)}.${mapped.ext}`, {
    type: mapped.type,
    lastModified: file.lastModified,
  });
}

function classifyKnownKind(
  file: File,
  kind: Exclude<OutboundMediaKind, "image">,
  now: Date,
): PastedClipboardClassification {
  const named = namePastedMedia(file, kind, now);
  if (!matchesKind(named, kind)) {
    return { status: "rejected", message: OUTBOUND_MEDIA_RULES[kind].rejectHint };
  }
  const check = validateOutboundMedia(named, kind);
  if (!check.ok) return { status: "rejected", message: check.message };
  return { status: "ready", file: named, kind };
}

export function classifyPastedClipboardFile(
  file: File,
  now = new Date(),
): PastedClipboardClassification {
  if (file.size <= 0) {
    return { status: "rejected", message: "El archivo está vacío." };
  }
  if (isClipboardImage(file)) {
    const image = classifyPastedImage(file, now);
    if (image.status === "ready") return { status: "ready", file: image.file, kind: "image" };
    return image;
  }
  if (isVideoLike(file)) return classifyKnownKind(file, "video", now);
  if (isAudioLike(file)) return classifyKnownKind(file, "audio", now);
  if (isDocumentFile(file)) return classifyKnownKind(file, "document", now);
  return { status: "rejected", message: "No se pudo pegar ese archivo." };
}
