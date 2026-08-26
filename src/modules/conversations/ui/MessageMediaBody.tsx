import { useState } from "react";
import { Download, ExternalLink, FileText, Image as ImageIcon } from "lucide-react";
import type { MessageDto } from "@/modules/conversations/domain/conversation";
import { resolveApiUrl } from "@/shared/http/api-base";

type Props = {
  message: MessageDto;
  /** Extra classes for media elements. */
  mediaClassName?: string;
  captionClassName?: string;
};

/**
 * Renderiza archivos multimedia al estilo WhatsApp Web (con vista previa de PDF e imágenes).
 */
export function MessageMediaBody({
  message,
  mediaClassName = "w-full max-w-sm rounded-xl",
  captionClassName = "mt-2 whitespace-pre-wrap text-[12px] leading-snug",
}: Props) {
  const [iframeError, setIframeError] = useState(false);
  const mediaUrl = message.mediaUrl
    ? resolveApiUrl(message.mediaUrl)
    : message.mediaId
      ? resolveApiUrl(`/api/media/${message.mediaId}`)
      : undefined;

  const isPdf =
    message.mimeType?.includes("pdf") ||
    message.filename?.toLowerCase().endsWith(".pdf") ||
    (message.type === "document" && !message.mimeType);

  const isDocument =
    message.type === "document" ||
    isPdf ||
    Boolean(message.filename) ||
    message.mimeType?.includes("document") ||
    message.mimeType?.includes("sheet") ||
    message.mimeType?.includes("zip");

  const isImage = message.type === "image" || message.mimeType?.startsWith("image/");

  const isAudio = message.type === "audio" || message.mimeType?.startsWith("audio/");

  const caption = message.caption?.trim() || "";
  const bodyText = message.body?.trim() || "";
  const displayCaption = caption || (bodyText && bodyText !== message.filename ? bodyText : "");

  // Tarjeta de Documento / PDF estilo WhatsApp
  if (isDocument) {
    const filename =
      message.filename?.trim() || caption || (isPdf ? "Comprobante.pdf" : "Documento");
    const targetUrl = mediaUrl || (message.mediaId ? `/api/media/${message.mediaId}` : "#");

    return (
      <div className="space-y-1.5 my-1 max-w-xs">
        <div
          onClick={() => targetUrl !== "#" && window.open(targetUrl, "_blank")}
          className="rounded-xl overflow-hidden border border-border/80 bg-background/60 hover:bg-background/90 transition shadow-sm cursor-pointer group select-none"
        >
          {/* Vista previa superior (estilo WhatsApp) */}
          {isPdf && targetUrl !== "#" && !iframeError ? (
            <div className="relative w-full h-44 bg-muted/40 overflow-hidden border-b border-border/60 flex items-center justify-center">
              <iframe
                src={`${targetUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                title={filename}
                onError={() => setIframeError(true)}
                className="w-full h-full pointer-events-none scale-100 origin-top"
              />
              <div className="absolute inset-0 bg-transparent" />
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-[9px] font-bold text-white uppercase tracking-wider flex items-center gap-1">
                <span>PDF</span>
                <ExternalLink className="size-2.5 opacity-80" />
              </div>
            </div>
          ) : (
            <div className="w-full h-24 bg-gradient-to-br from-red-500/10 via-red-500/5 to-background border-b border-border/60 flex items-center justify-center">
              <div className="size-12 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shadow-inner">
                <FileText className="size-6" />
              </div>
            </div>
          )}

          {/* Barra de información inferior */}
          <div className="p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="size-8 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <FileText className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-xs truncate text-foreground group-hover:text-primary transition-colors">
                  {filename}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5 font-medium">
                  {message.mimeType?.split("/")[1]?.toUpperCase() || "DOCUMENTO PDF"}
                </p>
              </div>
            </div>
            <div className="size-8 rounded-full bg-foreground/5 group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center shrink-0 transition-colors">
              <Download className="size-4" />
            </div>
          </div>
        </div>

        {displayCaption && displayCaption !== filename && (
          <p className={captionClassName}>{displayCaption}</p>
        )}
      </div>
    );
  }

  // Vista de Imagen estilo WhatsApp
  if (isImage) {
    const targetUrl = mediaUrl || (message.mediaId ? `/api/media/${message.mediaId}` : undefined);

    return (
      <div className="space-y-1.5 my-1 max-w-xs">
        {targetUrl ? (
          <div
            onClick={() => window.open(targetUrl, "_blank")}
            className="relative group overflow-hidden rounded-xl cursor-pointer border border-border/60 shadow-sm bg-muted/20"
          >
            <img
              src={targetUrl}
              alt={displayCaption || "Imagen adjunta"}
              className={`${mediaClassName} max-h-80 object-cover hover:scale-[1.02] transition-transform duration-200`}
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 rounded-xl border border-border bg-foreground/5 text-xs text-muted-foreground">
            <ImageIcon className="size-4" />
            <span>Imagen no disponible</span>
          </div>
        )}
        {displayCaption && <p className={captionClassName}>{displayCaption}</p>}
      </div>
    );
  }

  // Audio estilo WhatsApp
  if (isAudio && mediaUrl) {
    return (
      <div className="space-y-1.5 my-1">
        <audio controls preload="metadata" src={mediaUrl} className="w-full max-w-xs">
          Tu navegador no soporta audio.
        </audio>
        {displayCaption && <p className={captionClassName}>{displayCaption}</p>}
      </div>
    );
  }

  // Texto normal o fallback
  if (bodyText) {
    return <p className="whitespace-pre-wrap">{bodyText}</p>;
  }

  if (displayCaption) {
    return <p className="whitespace-pre-wrap">{displayCaption}</p>;
  }

  return (
    <div className="flex items-center gap-1.5 text-muted-foreground italic text-xs py-0.5">
      <FileText className="size-3.5" />
      <span>Archivo adjunto</span>
    </div>
  );
}
