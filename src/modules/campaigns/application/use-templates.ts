import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type { WhatsAppTemplate } from "../domain/template";
import {
  fetchTemplates,
  createTemplate as apiCreateTemplate,
  syncTemplateStatus as apiSyncTemplateStatus,
  type CreateTemplatePayload,
} from "../infrastructure/templates.gateway";

export function useTemplates() {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTemplates();
      setTemplates(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al cargar las plantillas de WhatsApp";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  const handleCreateTemplate = async (payload: CreateTemplatePayload) => {
    try {
      const newTpl = await apiCreateTemplate(payload);
      setTemplates((prev) => [newTpl, ...prev]);
      toast.success(
        payload.status === "pending"
          ? "Plantilla enviada a revisión de Meta correctamente (" + newTpl.name + ")"
          : "Borrador de plantilla guardado correctamente",
      );
      return newTpl;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al crear la plantilla";
      toast.error(msg);
      throw e;
    }
  };

  const handleSyncStatus = async (templateId: string) => {
    try {
      const updated = await apiSyncTemplateStatus(templateId);
      setTemplates((prev) => prev.map((t) => (t.id === templateId ? updated : t)));
      toast.success(`Estado sincronizado con Meta: ${updated.status.toUpperCase()}`);
      return updated;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "No se pudo sincronizar el estado";
      toast.error(msg);
      throw e;
    }
  };

  return {
    templates,
    loading,
    error,
    reload: loadTemplates,
    createTemplate: handleCreateTemplate,
    syncStatus: handleSyncStatus,
  };
}
