import { ChevronDown, ChevronUp, Search, X } from "lucide-react";

export interface ChatSearchBarProps {
  open: boolean;
  query: string;
  onQueryChange: (query: string) => void;
  matchIndex: number;
  totalMatches: number;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}

export function ChatSearchBar({
  open,
  query,
  onQueryChange,
  matchIndex,
  totalMatches,
  onPrev,
  onNext,
  onClose,
}: ChatSearchBarProps) {
  if (!open) return null;

  return (
    <div className="px-3.5 py-2 bg-card border-b border-border flex items-center justify-between gap-2 text-xs shadow-xs animate-in slide-in-from-top-2 duration-150 shrink-0">
      <div className="flex items-center gap-2 flex-1 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (e.shiftKey) onPrev();
                else onNext();
              } else if (e.key === "Escape") {
                onClose();
              }
            }}
            placeholder="Buscar término en este chat..."
            className="w-full pl-8 pr-2 py-1.5 text-xs bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex items-center gap-1 shrink-0 text-[11px] text-muted-foreground font-mono">
          {query.trim() ? (
            totalMatches > 0 ? (
              <span>
                {matchIndex + 1} de {totalMatches}
              </span>
            ) : (
              <span className="text-amber-600 dark:text-amber-400">0 resultados</span>
            )
          ) : null}
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={onPrev}
            disabled={totalMatches <= 1}
            title="Coincidencia anterior (Shift+Enter)"
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
          >
            <ChevronUp className="size-4" />
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={totalMatches <= 1}
            title="Siguiente coincidencia (Enter)"
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
          >
            <ChevronDown className="size-4" />
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        title="Cerrar buscador (Esc)"
        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

