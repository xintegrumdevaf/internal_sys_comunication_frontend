import {
  classifyPastedClipboardFile,
  type OutboundMediaKind,
  type PastedClipboardClassification,
} from "@/modules/conversations/domain/outbound-media";

export type ResolvedPastedFile =
  { ok: true; file: File; kind: OutboundMediaKind } | { ok: false; message: string };

function stampName(now: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `imagen-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.png`;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("No se pudo leer la imagen del portapapeles."));
    image.src = url;
  });
}

/** Convierte capturas BMP, GIF u otros formatos que el navegador decodifica a PNG, que WhatsApp acepta. */
export async function rasterToPngFile(file: File, now = new Date()): Promise<File> {
  const url = URL.createObjectURL(file);
  try {
    const image = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    if (!canvas.width || !canvas.height) {
      throw new Error("La imagen del portapapeles está vacía.");
    }
    const context = canvas.getContext("2d");
    if (!context) throw new Error("No se pudo preparar la imagen.");
    context.drawImage(image, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("No se pudo convertir la imagen.");
    return new File([blob], stampName(now), { type: "image/png" });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function rejectionMessage(result: PastedClipboardClassification): string {
  if (result.status === "rejected") return result.message;
  return "No se pudo pegar esa imagen. Usa JPG, PNG o WEBP.";
}

export async function resolvePastedClipboardFile(file: File): Promise<ResolvedPastedFile> {
  const classified = classifyPastedClipboardFile(file);
  if (classified.status === "ready") {
    return { ok: true, file: classified.file, kind: classified.kind };
  }
  if (classified.status === "rejected") return { ok: false, message: classified.message };
  try {
    const png = await rasterToPngFile(file);
    const converted = classifyPastedClipboardFile(png);
    if (converted.status === "ready") {
      return { ok: true, file: converted.file, kind: converted.kind };
    }
    return { ok: false, message: rejectionMessage(converted) };
  } catch {
    return { ok: false, message: "No se pudo pegar esa imagen. Usa JPG, PNG o WEBP." };
  }
}
