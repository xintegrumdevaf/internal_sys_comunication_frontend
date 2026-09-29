import { useState, useEffect } from "react";
import {
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Tag as TagIcon,
  FileText,
  RefreshCw,
  Sparkles,
  Check,
  Plus,
  X,
  Server,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { CustomerDto } from "../domain/customer";
import { customerGateway } from "../infrastructure/customer.gateway";
import { tagsGateway } from "@/modules/tags/infrastructure/tags.gateway";
import { getTagColorPreset, type TagItem } from "@/modules/tags/domain/tag";

interface ContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: CustomerDto | null;
  initialPhone?: string;
  initialName?: string;
  onSuccess?: (saved: CustomerDto) => void;
}

export function ContactDialog({
  open,
  onOpenChange,
  customer,
  initialPhone,
  initialName,
  onSuccess,
}: ContactDialogProps) {
  const [fullName, setFullName] = useState("");
  const [waPhone, setWaPhone] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const [availableTags, setAvailableTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncingIsp, setSyncingIsp] = useState(false);

  // Cargar catálogo de etiquetas al abrir
  useEffect(() => {
    if (!open) return;
    void tagsGateway.list().then((tags) => setAvailableTags(tags));
  }, [open]);

  // Inicializar estado del formulario
  useEffect(() => {
    if (customer) {
      setFullName(customer.fullName || "");
      setWaPhone(customer.waPhone || "");
      setNationalId(customer.nationalId || "");
      setEmail(customer.email || "");
      setAddress(customer.address || "");
      setNotes(customer.notes || "");
      setSelectedTagIds(customer.tags?.map((t) => t.id) || []);
    } else {
      setFullName(initialName || "");
      setWaPhone(initialPhone || "");
      setNationalId("");
      setEmail("");
      setAddress("");
      setNotes("");
      setSelectedTagIds([]);
    }
  }, [customer, initialPhone, initialName, open]);

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleSyncIsp = async () => {
    const cleanId = nationalId.trim();
    if (!cleanId) {
      toast.error("Ingresa la cédula del titular para consultar en el ISP");
      return;
    }

    setSyncingIsp(true);
    try {
      if (customer?.id) {
        const syncRes = await customerGateway.syncIsp(customer.id, cleanId);
        setFullName(syncRes.customer.fullName || fullName);
        setAddress(syncRes.customer.address || address);
        if (syncRes.customer.email) {
          setEmail(syncRes.customer.email);
        }
        setSelectedTagIds(syncRes.customer.tags?.map((t) => t.id) || selectedTagIds);
        toast.success(
          `Sincronizado con éxito: ${syncRes.contractsCount} contrato(s) y sectores: ${syncRes.syncedSectors.join(", ")}`
        );
        onSuccess?.(syncRes.customer);
      } else {
        // Si aún no está creado, guardar primero y sincronizar
        if (!waPhone.trim()) {
          toast.error("El número de WhatsApp es requerido para crear el contacto");
          return;
        }
        const created = await customerGateway.create({
          fullName: fullName.trim() || `Contacto ${cleanId}`,
          waPhone: waPhone.trim(),
          nationalId: cleanId,
          email: email.trim() || null,
          address: address.trim() || null,
          notes: notes.trim() || null,
          tagIds: selectedTagIds,
        });
        const syncRes = await customerGateway.syncIsp(created.id, cleanId);
        toast.success(
          `Contacto creado y sincronizado con ISP: ${syncRes.contractsCount} contrato(s)`
        );
        onSuccess?.(syncRes.customer);
        onOpenChange(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al sincronizar con ISP";
      toast.error(msg);
    } finally {
      setSyncingIsp(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("El nombre del contacto es requerido");
      return;
    }
    if (!waPhone.trim()) {
      toast.error("El número de WhatsApp es requerido");
      return;
    }

    setLoading(true);
    try {
      let saved: CustomerDto;
      if (customer?.id) {
        saved = await customerGateway.update(customer.id, {
          fullName: fullName.trim(),
          waPhone: waPhone.trim(),
          nationalId: nationalId.trim() || null,
          email: email.trim() || null,
          address: address.trim() || null,
          notes: notes.trim() || null,
          tagIds: selectedTagIds,
        });
        toast.success("Contacto actualizado con éxito");
      } else {
        saved = await customerGateway.create({
          fullName: fullName.trim(),
          waPhone: waPhone.trim(),
          nationalId: nationalId.trim() || null,
          email: email.trim() || null,
          address: address.trim() || null,
          notes: notes.trim() || null,
          tagIds: selectedTagIds,
        });
        toast.success("Contacto registrado con éxito");
      }
      onSuccess?.(saved);
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al guardar contacto";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <User className="size-5 text-primary" />
            {customer ? "Editar Contacto" : "Nuevo Contacto"}
          </DialogTitle>
          <DialogDescription>
            {customer
              ? "Modifica los datos del contacto, gestiona sus etiquetas o sincroniza con el ISP."
              : "Registra un contacto con sus etiquetas e información técnica."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 py-2">
          {/* Fila 1: Nombre y WhatsApp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1">
                <User className="size-3.5 text-muted-foreground" />
                Nombre completo *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej. Janine Velez / 0000427 - GARCIA"
                className="w-full text-xs px-3 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1">
                <Phone className="size-3.5 text-muted-foreground" />
                WhatsApp / Teléfono *
              </label>
              <input
                type="text"
                required
                value={waPhone}
                onChange={(e) => setWaPhone(e.target.value)}
                placeholder="Ej. 593995200769"
                className="w-full text-xs px-3 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
              />
            </div>
          </div>

          {/* Fila 2: Cédula del titular y botón de sincronizar ISP */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <CreditCard className="size-3.5 text-primary" />
                Cédula del Titular ISP
              </label>
              <span className="text-[10px] text-muted-foreground">
                Requerido para consultar contratos
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                placeholder="Ej. 0942783440 / 1712345678"
                className="flex-1 text-xs px-3 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
              />
              <button
                type="button"
                onClick={handleSyncIsp}
                disabled={syncingIsp || !nationalId.trim()}
                className="px-3 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1.5 shrink-0 transition-colors shadow-xs"
              >
                {syncingIsp ? (
                  <RefreshCw className="size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="size-3.5" />
                )}
                <span>Sincronizar ISP</span>
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Si quien escribe es un tercero (familiar), la cédula permite vincular y enriquecer con los contratos del titular sin alterar el número de WhatsApp.
            </p>
          </div>

          {/* Fila 3: Correo y Dirección */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1">
                <Mail className="size-3.5 text-muted-foreground" />
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                className="w-full text-xs px-3 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1">
                <MapPin className="size-3.5 text-muted-foreground" />
                Dirección / Sector
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ej. Bellavista, Calle 3 y Av. Principal"
                className="w-full text-xs px-3 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
              />
            </div>
          </div>

          {/* Fila 4: Etiquetas del Catálogo con soporte Claro/Oscuro y alto contraste */}
          <div>
            <label className="text-xs font-semibold text-foreground flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1.5">
                <TagIcon className="size-3.5 text-muted-foreground" />
                Etiquetas asociadas
              </span>
              <span className="text-[10px] font-medium text-muted-foreground">
                {selectedTagIds.length} seleccionada(s)
              </span>
            </label>
            <div className="flex flex-wrap gap-2 p-3 rounded-xl border border-border bg-muted/20 dark:bg-muted/10 min-h-[48px] max-h-36 overflow-y-auto">
              {availableTags.length === 0 ? (
                <span className="text-xs text-muted-foreground">No hay etiquetas creadas en el catálogo.</span>
              ) : (
                availableTags.map((tag) => {
                  const isSelected = selectedTagIds.includes(tag.id);
                  const hex = tag.color && tag.color !== "#ffffff4d" && tag.color !== "#ffffff" ? tag.color : "#64748b";

                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? "bg-primary/15 dark:bg-primary/25 border-primary text-foreground dark:text-primary-foreground shadow-xs ring-2 ring-primary/30 scale-[1.02]"
                          : "bg-background hover:bg-muted/70 text-foreground/80 hover:text-foreground border-border/80 shadow-2xs hover:scale-[1.01]"
                      }`}
                    >
                      <span
                        className="size-2.5 rounded-full shrink-0 shadow-2xs"
                        style={{ backgroundColor: hex }}
                      />
                      {isSelected && <Check className="size-3.5 text-primary shrink-0 stroke-[2.5]" />}
                      <span className="truncate max-w-[160px]">{tag.name}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Contratos Vinculados (si existen) */}
          {customer?.contracts && customer.contracts.length > 0 && (
            <div className="border border-border/80 rounded-xl p-3 bg-card/60">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-2">
                <Server className="size-3.5 text-primary" />
                Contratos Técnicos ISP ({customer.contracts.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {customer.contracts.map((c) => (
                  <div
                    key={c.id}
                    className="p-2.5 rounded-lg border border-border bg-background text-xs space-y-0.5"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-primary">#{c.contractNumber}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          c.status === "active"
                            ? "bg-emerald-500/15 text-emerald-500"
                            : "bg-danger/15 text-danger"
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>
                    {c.sector && (
                      <p className="text-muted-foreground text-[11px]">
                        Sector: <span className="font-semibold text-foreground">{c.sector}</span>
                      </p>
                    )}
                    {c.oltName && (
                      <p className="text-muted-foreground text-[11px]">
                        OLT: {c.oltName} {c.pon ? ` (PON ${c.pon})` : ""}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fila 5: Notas internas */}
          <div>
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1">
              <FileText className="size-3.5 text-muted-foreground" />
              Notas internas / Observaciones
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Preferencias del cliente, indicaciones para llamadas, etc."
              className="w-full text-xs p-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden resize-none"
            />
          </div>

          <DialogFooter className="pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-border hover:bg-foreground/5 text-foreground transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-xs"
            >
              {loading ? "Guardando..." : customer ? "Actualizar Contacto" : "Crear Contacto"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
