import { useState, useCallback, useRef, useEffect } from "react";

export function useEmojiInsertion<T extends HTMLInputElement | HTMLTextAreaElement>(
  value: string,
  onChange: (newValue: string) => void,
  externalRef?: React.RefObject<T | null>,
) {
  const [isOpen, setIsOpen] = useState(false);
  const internalRef = useRef<T>(null);
  const inputRef = externalRef ?? internalRef;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const insertEmoji = useCallback(
    (emoji: string) => {
      const el = inputRef.current;
      if (!el) {
        onChange(value + emoji);
        return;
      }

      const start = el.selectionStart ?? value.length;
      const end = el.selectionEnd ?? value.length;

      const updatedText = value.substring(0, start) + emoji + value.substring(end);
      onChange(updatedText);

      const nextCursorPos = start + emoji.length;
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(nextCursorPos, nextCursorPos);
      });
    },
    [value, onChange, inputRef],
  );

  return {
    isOpen,
    setIsOpen,
    inputRef,
    containerRef,
    insertEmoji,
  };
}
