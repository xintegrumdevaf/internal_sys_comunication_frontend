import React from "react";
import { Camera, FileText, MapPin, Mic, Smile, Video as VideoIcon } from "lucide-react";
import type { MessagePreviewDto } from "@/modules/conversations/domain/conversation";

/**
 * Renderiza el snippet del último mensaje al estilo WhatsApp Web (con ícono y texto contextual).
 */
export function renderLastMessagePreview(
  preview: MessagePreviewDto | null | undefined,
): React.ReactNode {
  if (!preview) return "Sin mensajes";

  const rawBody = preview.body?.trim() ?? "";
  const type = preview.type?.toLowerCase();
  const caption = preview.caption?.trim();
  const filename = preview.filename?.trim();

  // 1. Audio / Nota de voz
  if (
    type === "audio" ||
    /^\[?(audio|voice note|nota de voz)\]?$/i.test(rawBody) ||
    rawBody.startsWith("[audio/")
  ) {
    return (
      <span className="inline-flex items-center gap-1 truncate text-foreground/85 dark:text-foreground/90">
        <Mic className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span>Audio</span>
      </span>
    );
  }

  // 2. Imagen / Foto
  if (
    type === "image" ||
    /^\[?(image|imagen|photo|foto)\]?$/i.test(rawBody) ||
    rawBody.startsWith("[image/") ||
    rawBody.startsWith("[Adjunto: foto") ||
    rawBody.startsWith("[Adjunto imagen")
  ) {
    let text = "Foto";
    if (rawBody.startsWith("[Adjunto imagen:")) {
      const desc = rawBody
        .replace(/^\[Adjunto imagen:\s*/i, "")
        .replace(/\]$/, "")
        .trim();
      text = desc || "Foto";
    } else if (caption) {
      text = caption;
    } else if (
      !/^\[?(image|imagen|photo|foto)\]?$/i.test(rawBody) &&
      !rawBody.startsWith("[image/") &&
      rawBody
    ) {
      text = rawBody;
    }

    return (
      <span className="inline-flex items-center gap-1 truncate text-foreground/85 dark:text-foreground/90">
        <Camera className="size-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
        <span className="truncate">{text}</span>
      </span>
    );
  }

  // 3. Video
  if (type === "video" || /^\[?(video)\]?$/i.test(rawBody) || rawBody.startsWith("[video/")) {
    const text =
      caption ||
      (!/^\[?(video)\]?$/i.test(rawBody) && !rawBody.startsWith("[video/") ? rawBody : "Video");
    return (
      <span className="inline-flex items-center gap-1 truncate text-foreground/85 dark:text-foreground/90">
        <VideoIcon className="size-3.5 text-purple-500 dark:text-purple-400 shrink-0" />
        <span className="truncate">{text}</span>
      </span>
    );
  }

  // 4. Documento / Archivo
  if (
    type === "document" ||
    type === "file" ||
    /^\[?(document|documento|archivo|file)\]?$/i.test(rawBody) ||
    rawBody.startsWith("[document/") ||
    rawBody.startsWith("[file/")
  ) {
    const text =
      filename ||
      caption ||
      (!/^\[?(document|documento|archivo|file)\]?$/i.test(rawBody) &&
      !rawBody.startsWith("[document/") &&
      rawBody
        ? rawBody
        : "Documento");
    return (
      <span className="inline-flex items-center gap-1 truncate text-foreground/85 dark:text-foreground/90">
        <FileText className="size-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
        <span className="truncate">{text}</span>
      </span>
    );
  }

  // 5. Sticker
  if (type === "sticker" || /^\[?(sticker)\]?$/i.test(rawBody)) {
    return (
      <span className="inline-flex items-center gap-1 truncate text-foreground/85 dark:text-foreground/90">
        <Smile className="size-3.5 text-pink-500 dark:text-pink-400 shrink-0" />
        <span>Sticker</span>
      </span>
    );
  }

  // 6. Ubicación
  if (
    type === "location" ||
    rawBody.startsWith("Ubicación GPS") ||
    rawBody.includes("google.com/maps") ||
    rawBody === "📍 Location" ||
    rawBody.includes("Location")
  ) {
    return (
      <span className="inline-flex items-center gap-1 truncate text-foreground/85 dark:text-foreground/90">
        <MapPin className="size-3.5 text-rose-500 dark:text-rose-400 shrink-0" />
        <span>Ubicación</span>
      </span>
    );
  }

  if (!rawBody) return "Sin mensajes";
  return rawBody;
}
