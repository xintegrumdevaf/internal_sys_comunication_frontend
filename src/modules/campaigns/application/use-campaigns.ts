import { useState, useEffect, useCallback } from 'react';
import { Campaign, CreateCampaignPayload } from '../domain/campaign';
import { campaignsGateway } from '../infrastructure/campaigns.gateway';

export function useCampaignsList() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCampaigns = useCallback(async () => {
    try {
      const data = await campaignsGateway.listCampaigns();
      setCampaigns(data);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
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

export function useCampaignDetails(campaignId: string | null) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!campaignId) {
      setCampaign(null);
      return;
    }

    let isMounted = true;
    setLoading(true);

    campaignsGateway
      .getCampaign(campaignId)
      .then((data) => {
        if (isMounted) setCampaign(data);
      })
      .catch((err) => {
        console.error('Error fetching campaign details:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [campaignId]);

  return { campaign, loading };
}

export function useCreateCampaign() {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const createCampaign = async (payload: CreateCampaignPayload, file?: File | null) => {
    try {
      setIsSubmitting(true);
      const campaign = await campaignsGateway.createCampaign(payload);
      if (file && campaign.id) {
        await campaignsGateway.importCampaignRecipients(campaign.id, file);
      }
      return campaign;
    } catch (err) {
      console.error('Error creating campaign:', err);
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
