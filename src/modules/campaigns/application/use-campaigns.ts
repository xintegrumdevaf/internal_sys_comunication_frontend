import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import type { WhatsAppCampaign } from "../domain/campaign";
import {
  fetchCampaigns,
  fetchCampaignById,
  sendCampaign as apiSendCampaign,
  type CreateCampaignPayload,
} from "../infrastructure/campaigns.gateway";

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<WhatsAppCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCampaigns = useCallback(async () => {
    try {
      const data = await fetchCampaigns();
      setCampaigns(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al cargar las campañas masivas";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCampaigns();
  }, [loadCampaigns]);

  // Polling automático cuando hay campañas en curso (cada 4 segundos)
  const hasActiveCampaigns = useMemo(() => {
    return campaigns.some((c) => c.status === "in_progress");
  }, [campaigns]);

  useEffect(() => {
    if (!hasActiveCampaigns) return;

    const interval = setInterval(() => {
      void fetchCampaigns().then((updatedList) => {
        setCampaigns(updatedList);
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [hasActiveCampaigns]);

  const handleSendCampaign = async (payload: CreateCampaignPayload) => {
    try {
      const newCamp = await apiSendCampaign(payload);
      setCampaigns((prev) => [newCamp, ...prev]);
      toast.success(
        `Campaña "${newCamp.name}" iniciada correctamente para ${payload.recipients.length} destinatarios`,
      );
      return newCamp;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al enviar la campaña";
      toast.error(msg);
      throw e;
    }
  };

  // KPIs globales calculados a partir del historial real
  const stats = useMemo(() => {
    const totalSent = campaigns.reduce((acc, c) => acc + c.sentCount, 0);
    const totalDelivered = campaigns.reduce((acc, c) => acc + c.deliveredCount, 0);
    const totalFailed = campaigns.reduce((acc, c) => acc + c.failedCount, 0);

    const deliveryRate = totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(1) : "0.0";
    const optOutRate = totalSent > 0 ? "0.4" : "0.0"; // Estimación Opt-out según spec

    return {
      enviadosHoy: totalSent.toLocaleString("es-CO"),
      totalCampanas: campaigns.length,
      entregabilidad: deliveryRate,
      fallidos: totalFailed,
      optOut: optOutRate,
    };
  }, [campaigns]);

  return {
    campaigns,
    loading,
    error,
    stats,
    reload: loadCampaigns,
    sendCampaign: handleSendCampaign,
  };
}

export function useCampaignDetails(campaignId: string | null) {
  const [campaign, setCampaign] = useState<WhatsAppCampaign | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!campaignId) {
      setCampaign(null);
      return;
    }
    setLoading(true);
    void fetchCampaignById(campaignId).then((data) => {
      setCampaign(data);
      setLoading(false);
    });
  }, [campaignId]);

  return { campaign, loading };
}
