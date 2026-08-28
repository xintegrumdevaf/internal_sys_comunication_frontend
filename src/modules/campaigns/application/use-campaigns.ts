import { useState, useEffect, useCallback, useMemo } from "react";
import { Campaign, CreateCampaignPayload } from "../domain/campaign";
import { campaignsGateway } from "../infrastructure/campaigns.gateway";

export function useCampaignsList() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCampaigns = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await campaignsGateway.listCampaigns();
      setCampaigns(data);
    } catch (err) {
      console.error("Error fetching campaigns:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
    const interval = setInterval(fetchCampaigns, 5000);
    return () => clearInterval(interval);
  }, [fetchCampaigns]);

  return { campaigns, isLoading, refetch: fetchCampaigns };
}

export function useCreateCampaign() {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const createCampaign = async (payload: CreateCampaignPayload, file?: File | null) => {
    try {
      setIsSubmitting(true);
      const campaign = await campaignsGateway.createCampaign(payload);
      if (file) {
        await campaignsGateway.importCampaignRecipients(campaign.id, file);
      }
      return campaign;
    } catch (err) {
      console.error("Error creating campaign:", err);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { createCampaign, isSubmitting };
}

export function useCampaignActions() {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const startCampaign = async (id: string) => {
    setIsProcessing(true);
    try {
      return await campaignsGateway.startCampaign(id);
    } finally {
      setIsProcessing(false);
    }
  };

  const suspendCampaign = async (id: string) => {
    setIsProcessing(true);
    try {
      return await campaignsGateway.suspendCampaign(id);
    } finally {
      setIsProcessing(false);
    }
  };

  const resumeCampaign = async (id: string) => {
    setIsProcessing(true);
    try {
      return await campaignsGateway.resumeCampaign(id);
    } finally {
      setIsProcessing(false);
    }
  };

  const deleteCampaign = async (id: string) => {
    setIsProcessing(true);
    try {
      return await campaignsGateway.deleteCampaign(id);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    startCampaign,
    suspendCampaign,
    resumeCampaign,
    deleteCampaign,
    isProcessing,
  };
}

export function useCampaignDetails(campaignId?: string | null) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!campaignId) {
      setCampaign(null);
      return;
    }
    setLoading(true);
    void campaignsGateway.getCampaignById(campaignId).then((data) => {
      setCampaign(data);
      setLoading(false);
    });
  }, [campaignId]);

  return { campaign, loading };
}

export function useCampaigns() {
  const { campaigns, isLoading: loading, refetch } = useCampaignsList();
  const { createCampaign } = useCreateCampaign();

  const stats = useMemo(() => {
    const totalCampanas = campaigns.length;
    const enviadosHoy = campaigns.reduce((acc, c) => acc + (c.sentCount || 0), 0);
    const fallidos = campaigns.reduce((acc, c) => acc + (c.failedCount || 0), 0);
    const entregados = campaigns.reduce((acc, c) => acc + (c.deliveredCount || 0), 0);
    const totalEnviadosYEntregados = enviadosHoy + fallidos;
    const entregabilidad =
      totalEnviadosYEntregados > 0 ? Math.round((entregados / totalEnviadosYEntregados) * 100) : 98;
    const optOut = 0.8;

    return {
      totalCampanas,
      enviadosHoy,
      entregabilidad,
      fallidos,
      optOut,
    };
  }, [campaigns]);

  const sendCampaign = async (payload: CreateCampaignPayload) => {
    const created = await createCampaign(payload);
    await refetch();
    return created;
  };

  return {
    campaigns,
    loading,
    stats,
    sendCampaign,
    refetch,
  };
}
