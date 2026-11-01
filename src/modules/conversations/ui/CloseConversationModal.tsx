import { Loader2, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  busy?: boolean;
};

export function CloseConversationModal({ open, onOpenChange, onConfirm, busy }: Props) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!busy) onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-extrabold text-foreground">
            <XCircle className="size-5 text-primary" />
            Cerrar conversación
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Pasará a la bandeja de cerradas. El historial del chat se conserva.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <button
            type="button"
            disabled={busy}
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-lg border border-border text-xs font-semibold hover:bg-foreground/5 transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void onConfirm()}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:brightness-95 transition disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            {busy && <Loader2 className="size-3.5 animate-spin" />}
            Cerrar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
