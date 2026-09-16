import React from "react";
import EmojiPicker, { type EmojiClickData, Theme } from "emoji-picker-react";
import { Smile } from "lucide-react";

export interface EmojiPickerPopoverProps {
  isOpen: boolean;
  onToggle: () => void;
  onEmojiSelect: (emoji: string) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  buttonClassName?: string;
  theme?: Theme;
  disabled?: boolean;
}

export const EmojiPickerPopover: React.FC<EmojiPickerPopoverProps> = ({
  isOpen,
  onToggle,
  onEmojiSelect,
  containerRef,
  position = "top-right",
  buttonClassName,
  theme = Theme.AUTO,
  disabled = false,
}) => {
  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiSelect(emojiData.emoji);
  };

  const positionClasses = {
    "top-right": "bottom-full right-0 mb-2",
    "top-left": "bottom-full left-0 mb-2",
    "bottom-right": "top-full right-0 mt-2",
    "bottom-left": "top-full left-0 mt-2",
  }[position];

  return (
    <div className="relative inline-block" ref={containerRef as React.RefObject<HTMLDivElement>}>
      <button
        type="button"
        disabled={disabled}
        onClick={onToggle}
        title="Insertar emoji"
        className={
          buttonClassName ??
          `p-1.5 rounded-md transition-colors ${
            isOpen
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          } disabled:opacity-40 disabled:cursor-not-allowed`
        }
      >
        <Smile className="w-4 h-4" />
      </button>

      {isOpen && !disabled && (
        <div
          className={`absolute z-50 shadow-2xl rounded-xl border border-border bg-card overflow-hidden animate-in fade-in-50 zoom-in-95 ${positionClasses}`}
        >
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            theme={theme}
            searchPlaceHolder="Buscar emoji..."
            width={320}
            height={400}
            previewConfig={{ showPreview: false }}
          />
        </div>
      )}
    </div>
  );
};
