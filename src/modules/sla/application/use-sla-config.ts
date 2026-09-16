import { useEffect, useState, useCallback } from "react";
import { DEFAULT_SLA_CONFIG, type SlaConfigDto } from "@/modules/sla/domain/sla-config";
import { slaService } from "@/services/sla.service";

const SLA_EVENT = "sla-config-updated";

export function useSlaConfig() {
  const [config, setConfig] = useState<SlaConfigDto>(DEFAULT_SLA_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    try {
      const data = await slaService.getSlaConfig();
      setConfig(data);
    } catch {
      setConfig(DEFAULT_SLA_CONFIG);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<SlaConfigDto>;
      if (customEvent.detail) {
        setConfig(customEvent.detail);
      } else {
        void reload();
      }
    };

    window.addEventListener(SLA_EVENT, handleUpdate);
    return () => window.removeEventListener(SLA_EVENT, handleUpdate);
  }, [reload]);

  const saveConfig = async (newConfig: SlaConfigDto) => {
    setSaving(true);
    try {
      const updated = await slaService.updateSlaConfig(newConfig);
      setConfig(updated);
      window.dispatchEvent(new CustomEvent(SLA_EVENT, { detail: updated }));
      return true;
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    config,
    loading,
    saving,
    saveConfig,
    reload,
  };
}
