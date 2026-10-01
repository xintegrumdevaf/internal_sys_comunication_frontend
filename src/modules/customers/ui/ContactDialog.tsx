import { useState, useEffect, useMemo } from "react";
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
  Search,
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
  initialNationalId?: string;
  onSuccess?: (saved: CustomerDto) => void;
}

export function ContactDialog({
  open,
  onOpenChange,
  customer,
  initialPhone,
  initialName,
  initialNationalId,
  onSuccess,
}: ContactDialogProps) {
  const [fullName, setFullName] = useState("");
  const [waPhone, setWaPhone] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [tagSearch, setTagSearch] = useState("");

  const [availableTags, setAvailableTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncingIsp, setSyncingIsp] = useState(false);

  // Cargar catálogo de etiquetas al abrir y escuchar actualizaciones en vivo
  useEffect(() => {
    if (!open) return;
    const load = () => {
      void tagsGateway.list().then((tags) => setAvailableTags(tags));
    };
    load();
    window.addEventListener("tags-updated", load);
    return () => window.removeEventListener("tags-updated", load);
  }, [open]);

  // Inicializar estado del formulario
  useEffect(() => {
    setTagSearch("");
    if (customer) {
      setFullName(customer.fullName || initialName || "");
      setWaPhone(customer.waPhone || initialPhone || "");
      setNationalId(customer.nationalId || initialNationalId || "");
      setEmail(customer.email || "");
      setAddress(customer.address || "");
      setNotes(customer.notes || "");
      setSelectedTagIds(customer.tags?.map((t) => t.id) || []);
    } else {
      setFullName(initialName || "");
      setWaPhone(initialPhone || "");
      setNationalId(initialNationalId || "");
      setEmail("");
      setAddress("");
      setNotes("");
      setSelectedTagIds([]);
    }
  }, [customer, initialPhone, initialName, initialNationalId, open]);

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    );
  };

  const unassignedTags = useMemo(() => {
    return availableTags.filter((t) => !selectedTagIds.includes(t.id));
  }, [availableTags, selectedTagIds]);

  const filteredUnassignedTags = useMemo(() => {
    const q = tagSearch.trim().toLowerCase();
    let list = unassignedTags;
    if (q) {
      list = list.filter((t) => t.name.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [unassignedTags, tagSearch]);

  const findExistingCustomer = async (
    targetNationalId?: string,
    targetPhone?: string,
  ): Promise<CustomerDto | null> => {
    const cleanId = targetNationalId?.trim();
    const cleanPhone = targetPhone?.replace(/\D/g, "");

    // 1. Probar buscar por cédula
    if (cleanId) {
      const res = await customerGateway.list({ search: cleanId, limit: 5 }).catch(() => null);
      const match = res?.data?.find((c) => c.nationalId?.trim() === cleanId);
      if (match) return match;
    }

    // 2. Probar buscar por teléfono de WhatsApp
    if (cleanPhone) {
      const res = await customerGateway.list({ search: cleanPhone, limit: 5 }).catch(() => null);
      const match = res?.data?.find((c) => c.waPhone?.replace(/\D/g, "") === cleanPhone);
      if (match) return match;
    }

    return null;
  };

  const handleSyncIsp = async () => {
    const cleanId = nationalId.trim();
    if (!cleanId) {
      toast.error("Ingresa la cédula del titular para consultar en el ISP");
      return;
    }

    const phoneToUse = waPhone.trim() || initialPhone?.trim() || "";

    setSyncingIsp(true);
    try {
      let targetCustomer = customer;
      if (!targetCustomer?.id) {
        targetCustomer = await findExistingCustomer(cleanId, phoneToUse);
      }

      if (targetCustomer?.id) {
        if (phoneToUse && targetCustomer.waPhone !== phoneToUse) {
          targetCustomer = await customerGateway.update(targetCustomer.id, {
            fullName: fullName.trim() || targetCustomer.fullName || undefined,
            waPhone: phoneToUse,
            nationalId: cleanId,
            email: email.trim() || targetCustomer.email || undefined,
            address: address.trim() || targetCustomer.address || undefined,
            notes: notes.trim() || targetCustomer.notes || undefined,
            tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
          });
          setWaPhone(phoneToUse);
        }
        const syncRes = await customerGateway.syncIsp(targetCustomer.id, cleanId);
        setFullName(syncRes.customer.fullName || fullName);
        setAddress(syncRes.customer.address || address);
        if (syncRes.customer.waPhone) {
          setWaPhone(syncRes.customer.waPhone);
        } else if (phoneToUse) {
          setWaPhone(phoneToUse);
        }
        if (syncRes.customer.email) {
          setEmail(syncRes.customer.email);
        }
        setSelectedTagIds(syncRes.customer.tags?.map((t) => t.id) || selectedTagIds);
        toast.success(
          `Sincronizado con éxito: ${syncRes.contractsCount} contrato(s) y sectores: ${syncRes.syncedSectors.join(", ")}`,
        );
        onSuccess?.(syncRes.customer);
      } else {
        // Si aún no está creado, guardar primero y sincronizar
        if (!phoneToUse) {
          toast.error("El número de WhatsApp es requerido para crear el contacto");
          return;
        }
        const created = await customerGateway.create({
          fullName: fullName.trim() || `Contacto ${cleanId}`,
          waPhone: phoneToUse,
          nationalId: cleanId,
          email: email.trim() || null,
          address: address.trim() || null,
          notes: notes.trim() || null,
          tagIds: selectedTagIds,
        });
        const syncRes = await customerGateway.syncIsp(created.id, cleanId);
        toast.success(
          `Contacto creado y sincronizado con ISP: ${syncRes.contractsCount} contrato(s)`,
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

    const phoneToUse = waPhone.trim() || initialPhone?.trim() || "";
    if (!phoneToUse) {
      toast.error("El número de WhatsApp es requerido");
      return;
    }

    setLoading(true);
    try {
      let saved: CustomerDto;
      let targetCustomer = customer;
      if (!targetCustomer?.id) {
        targetCustomer = await findExistingCustomer(nationalId, phoneToUse);
      }

      if (targetCustomer?.id) {
        saved = await customerGateway.update(targetCustomer.id, {
          fullName: fullName.trim(),
          waPhone: phoneToUse,
          nationalId: nationalId.trim() || null,
          email: email.trim() || null,
          address: address.trim() || null,
          notes: notes.trim() || null,
          tagIds: selectedTagIds,
        });
        toast.success("Contacto actualizado y vinculado con éxito");
      } else {
        saved = await customerGateway.create({
          fullName: fullName.trim(),
          waPhone: phoneToUse,
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
              Si quien escribe es un tercero (familiar), la cédula permite vincular y enriquecer con
              los contratos del titular sin alterar el número de WhatsApp.
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
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ej. Bellavista, Calle 3 y Av. Principal"
                className="w-full text-xs px-3 py-1.5 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden resize-none"
              />
            </div>
          </div>

          {/* Fila 4: Gestión de Etiquetas */}
          <div className="space-y-3">
            {/* 1. Área de Etiquetas ASOCIADAS (Solo las asignadas al contacto) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <TagIcon className="size-3.5 text-primary" />
                  Etiquetas asociadas
                </label>
                <span className="text-[10px] font-medium text-muted-foreground">
                  {selectedTagIds.length} seleccionada(s)
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 p-2.5 rounded-xl border border-border bg-muted/20 dark:bg-muted/10 min-h-[44px] items-center">
                {selectedTagIds.length === 0 ? (
                  <span className="text-xs text-muted-foreground italic px-1">
                    Sin etiquetas asociadas. Selecciona etiquetas del catálogo abajo para
                    agregarlas.
                  </span>
                ) : (
                  availableTags
                    .filter((t) => selectedTagIds.includes(t.id))
                    .map((tag) => {
                      const hex =
                        tag.color && tag.color !== "#ffffff4d" && tag.color !== "#ffffff"
                          ? tag.color
                          : "#64748b";

                      return (
                        <span
                          key={tag.id}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary/15 dark:bg-primary/25 border border-primary text-foreground flex items-center gap-1.5 shadow-2xs animate-in fade-in zoom-in-95 duration-150"
                        >
                          <span
                            className="size-2 rounded-full shrink-0 shadow-2xs"
                            style={{ backgroundColor: hex }}
                          />
                          <span className="truncate max-w-[160px]">{tag.name}</span>
                          <button
                            type="button"
                            onClick={() => toggleTag(tag.id)}
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/15 rounded p-0.5 transition-colors cursor-pointer ml-0.5"
                            title={`Remover etiqueta ${tag.name}`}
                          >
                            <X className="size-3" />
                          </button>
                        </span>
                      );
                    })
                )}
              </div>
            </div>

            {/* 2. Área para AGREGAR del Catálogo de Etiquetas disponibles */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                  <Plus className="size-3 text-muted-foreground" />
                  Agregar etiqueta del catálogo
                </label>
              </div>

              {/* Buscador de etiquetas no asignadas si hay más de 4 disponibles */}
              {unassignedTags.length > 4 && (
                <div className="relative mb-1.5">
                  <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={tagSearch}
                    onChange={(e) => setTagSearch(e.target.value)}
                    placeholder="Buscar etiqueta para agregar..."
                    className="w-full text-xs pl-8 pr-7 py-1 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
                  />
                  {tagSearch && (
                    <button
                      type="button"
                      onClick={() => setTagSearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
                      title="Limpiar búsqueda"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-1.5 p-2 rounded-xl border border-dashed border-border bg-background/50 max-h-32 overflow-y-auto">
                {unassignedTags.length === 0 ? (
                  <span className="text-[11px] text-muted-foreground italic px-1 py-0.5">
                    {availableTags.length === 0
                      ? "No hay etiquetas creadas en el catálogo."
                      : "Todas las etiquetas del catálogo están asociadas a este contacto."}
                  </span>
                ) : filteredUnassignedTags.length === 0 ? (
                  <span className="text-[11px] text-muted-foreground italic px-1 py-0.5">
                    No se encontraron etiquetas disponibles que coincidan con "{tagSearch}".
                  </span>
                ) : (
                  filteredUnassignedTags.map((tag) => {
                    const hex =
                      tag.color && tag.color !== "#ffffff4d" && tag.color !== "#ffffff"
                        ? tag.color
                        : "#64748b";

                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium border border-border/80 bg-background hover:bg-primary/10 hover:border-primary/50 text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs hover:scale-[1.02]"
                        title={`Asignar etiqueta ${tag.name}`}
                      >
                        <Plus className="size-3 text-muted-foreground shrink-0" />
                        <span
                          className="size-2 rounded-full shrink-0 opacity-70"
                          style={{ backgroundColor: hex }}
                        />
                        <span className="truncate max-w-[150px]">{tag.name}</span>
                      </button>
                    );
                  })
                )}
              </div>
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
                    className="p-3 rounded-xl border border-border/80 bg-background text-xs space-y-1.5 shadow-2xs"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-primary text-sm">#{c.contractNumber}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          c.status === "active"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : "bg-destructive/15 text-destructive"
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[11px]">
                      <p className="text-muted-foreground">
                        Sector:{" "}
                        <span className="font-semibold text-foreground">{c.sector || "N/A"}</span>
                      </p>
                      <p className="text-muted-foreground truncate">
                        OLT:{" "}
                        <span className="font-semibold text-foreground">
                          {c.oltName || "Sin OLT"}
                        </span>
                        {c.pon ? (
                          <span className="text-[10px] text-muted-foreground ml-1">
                            (PON {c.pon})
                          </span>
                        ) : null}
                      </p>
                    </div>
                    {c.serial && (
                      <p className="text-muted-foreground text-[11px] truncate">
                        Serial / MAC:{" "}
                        <span className="font-mono font-medium text-foreground">{c.serial}</span>
                      </p>
                    )}
                    {c.address && (
                      <p className="text-muted-foreground text-[11px] pt-1 border-t border-border/40 mt-1 leading-snug break-words">
                        <span className="font-semibold text-foreground">📍 Dirección:</span>{" "}
                        {c.address}
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
