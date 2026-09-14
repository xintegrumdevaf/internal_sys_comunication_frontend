import React, { useEffect, useRef } from "react";
import type { QuickReply } from "@/types/quick-reply";

interface QuickReplyDropdownProps {
  isOpen: boolean;
  replies: QuickReply[];
  selectedIndex: number;
  onSelect: (reply: QuickReply) => void;
}

export const QuickReplyDropdown: React.FC<QuickReplyDropdownProps> = ({
  isOpen,
  replies,
  selectedIndex,
  onSelect,
}) => {
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (listRef.current) {
      const selectedEl = listRef.current.children[selectedIndex] as HTMLElement | undefined;
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  if (!isOpen || replies.length === 0) return null;

  return (
    <div
      role="listbox"
      aria-label="Sugerencias de respuestas rápidas"
      className="absolute bottom-full left-0 mb-2 w-80 max-h-64 overflow-y-auto rounded-xl border border-border bg-card shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-150"
    >
      <div className="p-2 text-[11px] font-semibold text-muted-foreground border-b border-border flex items-center justify-between">
        <span>Respuestas Rápidas</span>
        <span className="text-[10px] font-normal text-muted-foreground/80">Tab / Enter para insertar</span>
      </div>
      <ul ref={listRef} className="py-1">
        {replies.map((item, idx) => {
          const isSelected = idx === selectedIndex;
          return (
            <li
              key={item.id}
              role="option"
              aria-selected={isSelected}
              onMouseDown={(e) => {
                // Prevenir que el input pierda foco antes del click
                e.preventDefault();
                onSelect(item);
              }}
              className={`flex flex-col px-3 py-2 cursor-pointer transition-colors ${
                isSelected
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "hover:bg-muted/50 text-foreground"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-primary">
                  /{item.shortcut}
                </span>
                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-semibold">
                  {item.departmentId ? "Área" : "Global"}
                </span>
              </div>
              <span className="text-xs font-medium mt-0.5 text-foreground line-clamp-1">
                {item.title}
              </span>
              <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5 font-normal">
                {item.body}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
