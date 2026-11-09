import React from "react";
import { MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface RecipientMessageData {
  name: string;
  phone: string;
  message: string;
  isError?: boolean;
}

interface RecipientMessageModalProps {
  data: RecipientMessageData | null;
  onClose: () => void;
}

export const RecipientMessageModal: React.FC<RecipientMessageModalProps> = ({ data, onClose }) => {
  if (!data) return null;

  return (
    <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-3.5">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-bold text-foreground">
              {data.name} ({data.phone})
            </h4>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div
          className={`p-3.5 rounded-xl border text-xs leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap font-sans ${
            data.isError
              ? "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400 font-mono"
              : "bg-muted/40 border-border text-foreground"
          }`}
        >
          {data.message}
        </div>

        <div className="flex justify-end pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs font-bold uppercase"
          >
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
};
