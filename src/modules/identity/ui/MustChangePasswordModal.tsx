import { useState } from "react";
import { KeyRound, Lock, Eye, EyeOff, ShieldAlert, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useChangePassword } from "@/modules/identity/application/use-session";

export type MustChangePasswordModalProps = {
  isOpen?: boolean;
  onSuccess?: () => void;
};

/**
 * Modal bloqueante de cambio obligatorio de contraseña para primer inicio de sesión.
 * No se puede cerrar con Escape ni haciendo clic en el backdrop.
 */
export function MustChangePasswordModal({
  isOpen = true,
  onSuccess,
}: MustChangePasswordModalProps) {
  const { changePassword, changing } = useChangePassword();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const isMinLength = newPassword.length >= 8;
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isDifferentFromCurrent =
    Boolean(currentPassword.trim()) &&
    Boolean(newPassword.trim()) &&
    newPassword !== currentPassword;
  const isSameAsCurrent = Boolean(currentPassword.trim()) && newPassword === currentPassword;

  // Habilitar el botón cuando los campos tengan valor para dar feedback explícito si algo falla
  const canSubmit = Boolean(
    currentPassword.trim() && newPassword.length >= 1 && confirmPassword.length >= 1,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (newPassword.length < 8) {
      setErrorMessage("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Las contraseñas no coinciden.");
      return;
    }

    if (currentPassword === newPassword) {
      setErrorMessage("La nueva contraseña debe ser diferente a la temporal actual.");
      return;
    }

    try {
      await changePassword(currentPassword, newPassword);
      toast.success("Contraseña actualizada con éxito.");
      onSuccess?.();
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Error al cambiar la contraseña. Verifica tu clave actual.",
      );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="must-change-password-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-fade-in"
    >
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-7 space-y-5 animate-scale-up">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 ring-1 ring-amber-500/20">
            <ShieldAlert className="size-6" />
          </div>
          <div>
            <h2
              id="must-change-password-title"
              className="text-base sm:text-lg font-extrabold tracking-tight text-foreground"
            >
              Cambio de contraseña requerido
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Por seguridad, debes cambiar tu contraseña temporal antes de continuar.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs font-medium flex items-start gap-2 animate-fade-in">
            <ShieldAlert className="size-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Contraseña temporal actual
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                <Lock className="size-4" />
              </div>
              <input
                type={showCurrent ? "text" : "password"}
                autoFocus
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Ingresa la contraseña temporal"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-border bg-background text-xs sm:text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                aria-label={showCurrent ? "Ocultar contraseña" : "Ver contraseña"}
              >
                {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Nueva contraseña personal
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                <KeyRound className="size-4" />
              </div>
              <input
                type={showNew ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-border bg-background text-xs sm:text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                aria-label={showNew ? "Ocultar contraseña" : "Ver contraseña"}
              >
                {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Confirmar nueva contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                <KeyRound className="size-4" />
              </div>
              <input
                type={showConfirm ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite tu nueva contraseña"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-border bg-background text-xs sm:text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                aria-label={showConfirm ? "Ocultar contraseña" : "Ver contraseña"}
              >
                {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="p-3.5 bg-background border border-border rounded-xl space-y-2 text-[11px]">
            <div
              className={`flex items-center gap-2 ${isMinLength ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-muted-foreground"}`}
            >
              <CheckCircle2 className="size-3.5" />
              <span>Mínimo 8 caracteres</span>
            </div>
            <div
              className={`flex items-center gap-2 ${isMatch ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-muted-foreground"}`}
            >
              <CheckCircle2 className="size-3.5" />
              <span>Ambas contraseñas coinciden</span>
            </div>
            <div
              className={`flex items-center gap-2 ${
                isSameAsCurrent
                  ? "text-amber-600 dark:text-amber-400 font-semibold"
                  : isDifferentFromCurrent
                    ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                    : "text-muted-foreground"
              }`}
            >
              <CheckCircle2 className="size-3.5" />
              <span>
                {isSameAsCurrent
                  ? "La nueva clave debe ser diferente a la temporal"
                  : "Diferente a la contraseña temporal"}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={changing || !canSubmit}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-extrabold uppercase tracking-wide hover:bg-primary/90 active:scale-[0.99] transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2 cursor-pointer"
          >
            {changing ? (
              <>
                <div className="size-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                <span>Actualizando contraseña…</span>
              </>
            ) : (
              <span>Establecer nueva contraseña</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
