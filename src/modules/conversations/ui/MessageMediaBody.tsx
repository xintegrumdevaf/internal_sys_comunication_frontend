import { useState } from "react";
import { Download, ExternalLink, FileText, Image as ImageIcon, Reply } from "lucide-react";
import type { MessageDto } from "@/modules/conversations/domain/conversation";
import { resolveApiUrl } from "@/shared/http/api-base";
import { WhatsAppAudioPlayer } from "./WhatsAppAudioPlayer";

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
    const isPlaceholder = (text: string) => {
      const t = text.trim().toLowerCase();
      return (
        t === "[audio]" ||
        t === "audio" ||
        t === "[voice note]" ||
        t === "[nota de voz]" ||
        t.startsWith("[audio/")
      );
    };
    const hasValidCaption = displayCaption && !isPlaceholder(displayCaption);

    return (
      <div className="space-y-1.5 my-1">
        <WhatsAppAudioPlayer mediaUrl={mediaUrl} messageId={message.id} author={message.author} />
        {hasValidCaption ? <p className={captionClassName}>{displayCaption}</p> : null}
      </div>
    );
  }

  // Mensaje Interactivo (botones o lista rápida estilo WhatsApp)
  const isInteractive =
    message.type === "interactive" ||
    (Boolean(message.caption) &&
      (message.caption!.includes('"type":"buttons"') || message.caption!.includes('"type":"list"')));

  let interactiveData:
    | { type: "buttons"; buttons: Array<{ id: string; title: string }> }
    | { type: "list"; buttonText: string; sections: Array<{ title: string; rows: Array<{ id: string; title: string; description?: string }> }> }
    | null = null;

  if (isInteractive && message.caption) {
    try {
      interactiveData = JSON.parse(message.caption);
    } catch {
      interactiveData = null;
    }
  }

  if (isInteractive && interactiveData) {
    return (
      <div className="space-y-2.5 max-w-sm">
        {bodyText && <p className="whitespace-pre-wrap leading-relaxed">{bodyText}</p>}
        {interactiveData.type === "buttons" && interactiveData.buttons?.length > 0 && (
          <div className="flex flex-col gap-1.5 pt-1">
            {interactiveData.buttons.map((btn) => (
              <div
                key={btn.id}
                className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-primary/30 bg-background/80 hover:bg-muted/60 transition-colors shadow-2xs text-xs font-semibold text-primary cursor-default select-none"
              >
                <Reply className="size-3.5 rotate-180 text-primary/70 shrink-0" />
                <span className="truncate">{btn.title}</span>
              </div>
            ))}
          </div>
        )}
        {interactiveData.type === "list" && interactiveData.sections && (
          <div className="flex flex-col gap-1 pt-1">
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
              📋 {interactiveData.buttonText || "Opciones disponibles"}:
            </div>
            {interactiveData.sections.flatMap((s) => s.rows).map((row) => (
              <div
                key={row.id}
                className="p-2 rounded-lg border border-primary/20 bg-background/70 text-xs space-y-0.5"
              >
                <p className="font-semibold text-primary">{row.title}</p>
                {row.description && <p className="text-[11px] text-muted-foreground">{row.description}</p>}
              </div>
            ))}
          </div>
        )}
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
