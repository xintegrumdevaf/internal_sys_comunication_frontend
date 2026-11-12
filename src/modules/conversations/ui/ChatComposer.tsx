import {
  FileIcon,
  FileText,
  ImageIcon,
  Mic,
  Paperclip,
  Reply,
  SendHorizontal,
  Video,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { QuickReplyDropdown } from "@/components/chat/QuickReplyDropdown";
import { EmojiPickerPopover } from "@/components/common/EmojiPickerPopover";
import type { MessageDto } from "@/modules/conversations/domain/conversation";
import { formatQuotedMessageSnippet } from "@/modules/conversations/domain/conversation";
import {
  formatOutboundFileSize,
  OUTBOUND_MEDIA_RULES,
  type OutboundMediaKind,
} from "@/modules/conversations/domain/outbound-media";
import type { QuickReply } from "@/types/quick-reply";

export interface PendingAttachment {
  file: File;
  kind: OutboundMediaKind;
  previewUrl: string | null;
}

export const MEDIA_ATTACH_OPTIONS: Array<{
  kind: OutboundMediaKind;
  label: string;
  icon: typeof ImageIcon;
  bubble: string;
}> = [
  {
    kind: "image",
    label: "Imagen",
    icon: ImageIcon,
    bubble: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  },
  {
    kind: "video",
    label: "Video",
    icon: Video,
    bubble: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  },
  {
    kind: "audio",
    label: "Audio",
    icon: Mic,
    bubble: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  },
  {
    kind: "document",
    label: "Documento",
    icon: FileIcon,
    bubble: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  },
];

export interface ChatComposerProps {
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  isAutomationActive: boolean;
  isClosedRecord: boolean;
  assignedAgentName?: string | null;
  busy?: boolean;
  pendingAttachment: PendingAttachment | null;
  onClearPendingAttachment: () => void;
  onOpenTemplateModal: () => void;
  onPickKind: (kind: OutboundMediaKind) => void;
  onFilePicked: (files: FileList | null) => void;
  // Quick replies
  isQuickReplyOpen: boolean;
  quickReplyFiltered: QuickReply[];
  quickReplySelectedIndex: number;
  onSelectQuickReply: (reply: QuickReply) => void;
  onQuickReplyKeyDown: (e: React.KeyboardEvent) => boolean;
  // Replying/Quoting
  replyingToMessage?: MessageDto | null;
  onClearReply?: () => void;
  // Refs
  chatInputRef: React.RefObject<HTMLTextAreaElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export function ChatComposer({
  draft,
  onDraftChange,
  onSend,
  isAutomationActive,
  isClosedRecord,
  assignedAgentName,
  busy,
  pendingAttachment,
  onClearPendingAttachment,
  onOpenTemplateModal,
  onPickKind,
  onFilePicked,
  isQuickReplyOpen,
  quickReplyFiltered,
  quickReplySelectedIndex,
  onSelectQuickReply,
  onQuickReplyKeyDown,
  replyingToMessage,
  onClearReply,
  chatInputRef,
  fileInputRef,
}: ChatComposerProps) {
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const attachMenuRef = useRef<HTMLDivElement>(null);
  const emojiContainerRef = useRef<HTMLDivElement>(null);

  // Click outside listener para cerrar el popover de adjuntos
  useEffect(() => {
    if (!isAttachMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target as Node)) {
        setIsAttachMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isAttachMenuOpen]);

  const insertEmoji = (emoji: string) => {
    const textarea = chatInputRef.current;
    if (!textarea) {
      onDraftChange(draft + emoji);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const nextText = draft.substring(0, start) + emoji + draft.substring(end);
    onDraftChange(nextText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };

  return (
    <div className="shrink-0 bg-background/95 border-t border-border/60">
      {/* Vista previa del mensaje al que se está respondiendo (estilo WhatsApp) */}
      {replyingToMessage && (
        <div className="px-3 py-2 bg-muted/70 border-t border-border/70 flex items-center gap-2.5 animate-in slide-in-from-bottom-2 duration-150">
          <div className="w-1 self-stretch rounded-full bg-emerald-500 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <Reply className="size-3" />
              <span>
                Respondiendo a{" "}
                {replyingToMessage.author === "customer"
                  ? "Cliente"
                  : replyingToMessage.author === "ai"
                    ? "Asistente IA"
                    : replyingToMessage.agentName || "Agente"}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
              {formatQuotedMessageSnippet(replyingToMessage)}
            </p>
          </div>
          {onClearReply && (
            <button
              type="button"
              disabled={busy}
              onClick={onClearReply}
              title="Cancelar respuesta"
              className="size-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center shrink-0 disabled:opacity-40 cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Vista previa del archivo adjunto antes de enviar */}
      {pendingAttachment && (
        <div className="px-3 py-2 bg-muted/60 border-t border-border flex items-center gap-3 animate-in slide-in-from-bottom-2 duration-150">
          {pendingAttachment.kind === "image" && pendingAttachment.previewUrl && (
            <img
              src={pendingAttachment.previewUrl}
              alt="Vista previa"
              className="size-14 rounded-xl object-cover shrink-0 border border-border"
            />
          )}
          {pendingAttachment.kind === "video" && pendingAttachment.previewUrl && (
            <video
              src={pendingAttachment.previewUrl}
              className="size-14 rounded-xl object-cover shrink-0 bg-black"
              muted
              playsInline
              preload="metadata"
            />
          )}
          {pendingAttachment.kind === "audio" && (
            <div className="size-14 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Mic className="size-5" />
            </div>
          )}
          {pendingAttachment.kind === "document" && (
            <div className="size-14 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <FileIcon className="size-5" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold truncate">{pendingAttachment.file.name}</p>
            <p className="text-[10px] text-muted-foreground">
              {OUTBOUND_MEDIA_RULES[pendingAttachment.kind].label} ·{" "}
              {formatOutboundFileSize(pendingAttachment.file.size)}
              {pendingAttachment.kind === "audio"
                ? " · el texto se envía en un mensaje aparte"
                : " · el texto va como comentario"}
            </p>
            {pendingAttachment.kind === "audio" && pendingAttachment.previewUrl && (
              <audio
                src={pendingAttachment.previewUrl}
                controls
                className="mt-1 h-8 w-full max-w-xs"
              />
            )}
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={onClearPendingAttachment}
            title="Quitar adjunto"
            className="size-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center shrink-0 disabled:opacity-40"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      <div className="relative p-2 sm:p-2.5 flex gap-1.5 sm:gap-2 items-end min-w-0 bg-background/80 dark:bg-card/30 border-t border-border/40">
        <QuickReplyDropdown
          isOpen={isQuickReplyOpen}
          replies={quickReplyFiltered}
          selectedIndex={quickReplySelectedIndex}
          onSelect={onSelectQuickReply}
        />

        {/* Menú de adjuntos y opciones (Clip estilo WhatsApp) */}
        <div className="relative inline-block" ref={attachMenuRef}>
          <button
            type="button"
            disabled={isAutomationActive || isClosedRecord}
            onClick={() => setIsAttachMenuOpen(!isAttachMenuOpen)}
            title="Adjuntar y opciones"
            className={`size-10 flex items-center justify-center rounded-full transition-all shrink-0 ${
              isAttachMenuOpen
                ? "bg-primary/15 text-primary rotate-45"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            } disabled:opacity-40`}
          >
            <Paperclip className="size-5 transition-transform" />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            className="sr-only"
            onChange={(e) => {
              onFilePicked(e.target.files);
              e.target.value = "";
            }}
          />

          {isAttachMenuOpen && (
            <div className="absolute bottom-full left-0 mb-3 bg-popover/95 dark:bg-[#233138]/95 backdrop-blur-md border border-border/80 shadow-2xl rounded-2xl p-2 min-w-[260px] max-h-[min(70vh,440px)] overflow-y-auto flex flex-col gap-1 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
              {MEDIA_ATTACH_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.kind}
                    type="button"
                    disabled={isAutomationActive}
                    onClick={() => {
                      setIsAttachMenuOpen(false);
                      onPickKind(option.kind);
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium hover:bg-muted/80 text-foreground transition text-left group disabled:opacity-40"
                  >
                    <div
                      className={`size-8 rounded-full flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${option.bubble}`}
                    >
                      <Icon className="size-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground">{option.label}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {OUTBOUND_MEDIA_RULES[option.kind].menuHint}
                      </span>
                    </div>
                  </button>
                );
              })}
              <div className="my-1 border-t border-border/70" />
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setIsAttachMenuOpen(false);
                  onOpenTemplateModal();
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium hover:bg-muted/80 text-foreground transition text-left group"
              >
                <div className="size-8 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <FileText className="size-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground">Plantilla de WhatsApp</span>
                  <span className="text-[10px] text-muted-foreground">
                    Enviar plantilla aprobada (HSM)
                  </span>
                </div>
              </button>

              <button
                type="button"
                disabled={isAutomationActive}
                onClick={() => {
                  setIsAttachMenuOpen(false);
                  onDraftChange(draft.endsWith("/") ? draft : draft ? `${draft} /` : "/");
                  chatInputRef.current?.focus();
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium hover:bg-muted/80 text-foreground transition text-left group disabled:opacity-40"
              >
                <div className="size-8 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Zap className="size-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground">Respuestas rápidas</span>
                  <span className="text-[10px] text-muted-foreground">
                    Escribe / para autocompletar
                  </span>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Selector de Emojis / Stickers */}
        <EmojiPickerPopover
          isOpen={isEmojiOpen}
          onToggle={() => setIsEmojiOpen(!isEmojiOpen)}
          onEmojiSelect={insertEmoji}
          containerRef={emojiContainerRef}
          position="top-left"
          buttonClassName="size-10 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition shrink-0 disabled:opacity-40"
          iconClassName="size-5"
        />

        {/* Input textarea con auto-expansión dinámica y tipografía legible estilo WhatsApp */}
        <textarea
          ref={chatInputRef}
          rows={1}
          value={draft}
          disabled={isAutomationActive || isClosedRecord}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={(e) => {
            if (onQuickReplyKeyDown(e)) {
              return;
            }
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder={
            isClosedRecord
              ? assignedAgentName
                ? `Caso completado por ${assignedAgentName}`
                : "Caso completado"
              : isAutomationActive
                ? "🤖 IA activa... Haz clic en 'Tomar control' para escribir"
                : pendingAttachment
                  ? pendingAttachment.kind === "audio"
                    ? "Escribe un mensaje aparte (opcional)..."
                    : "Añade un comentario (opcional)..."
                  : "Escribe un mensaje, pega un archivo o '/' para respuestas rápidas"
          }
          title="Escribe un mensaje (Shift+Enter para salto de línea, Ctrl+V para pegar imagen, video o documento, '/' para respuestas rápidas)"
          className="flex-1 min-w-0 w-full px-3 sm:px-4 py-2 bg-card/90 dark:bg-[#202c33] border border-border/70 focus:border-emerald-500/60 rounded-2xl text-[14px] outline-none focus:ring-1 focus:ring-emerald-500/30 disabled:opacity-60 resize-none min-h-[40px] max-h-[140px] leading-5 font-sans text-foreground placeholder:text-muted-foreground/60 transition-all shadow-2xs overflow-hidden"
        />

        {/* Botón enviar circular característico de WhatsApp */}
        <button
          type="button"
          disabled={isAutomationActive || isClosedRecord || (!draft.trim() && !pendingAttachment)}
          onMouseDown={(e) => e.preventDefault()}
          onClick={onSend}
          title={pendingAttachment ? "Enviar adjunto (Enter)" : "Enviar mensaje (Enter)"}
          className="size-10 rounded-full bg-[#00a884] dark:bg-[#00a884] text-white flex items-center justify-center shadow-sm hover:brightness-110 active:scale-95 transition-all shrink-0 disabled:opacity-35 disabled:hover:brightness-100 disabled:active:scale-100 cursor-pointer"
        >
          <SendHorizontal className="size-5 translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}
