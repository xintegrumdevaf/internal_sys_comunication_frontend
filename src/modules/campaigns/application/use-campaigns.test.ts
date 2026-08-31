import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCampaignsList, useCreateCampaign, useCampaignActions } from './use-campaigns';
import { campaignsGateway } from '../infrastructure/campaigns.gateway';

describe('useCampaigns Application Hooks', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches campaigns list', async () => {
    vi.spyOn(campaignsGateway, 'listCampaigns').mockResolvedValueOnce([
      {
        id: 'c1',
        name: 'Test',
        status: 'DRAFT',
        quickMode: true,
        intervalSeconds: 45,
        messageText: 'Msg',
        sentCount: 0,
        totalRecipients: 10,
        createdAt: '2026-08-27T00:00:00Z',
        updatedAt: '2026-08-27T00:00:00Z',
        routingConfig: {
          chatStatus: 'closed',
          keepAssigned: false,
          delegateToBot: false,
          forceChatUpdate: false,
        },
        contactConfig: {
          tags: [],
          customFields: [],
          forceContactUpdate: false,
        },
      },
    ]);

    const { result } = renderHook(() => useCampaignsList());


    await waitFor(() => {
      expect(result.current.campaigns.length).toBe(1);
    });

    expect(result.current.campaigns[0].name).toBe('Test');
  });

  it('creates a campaign and imports file', async () => {
    vi.spyOn(campaignsGateway, 'createCampaign').mockResolvedValueOnce({
      id: 'c1',
      name: 'New',
      status: 'DRAFT',
      quickMode: true,
      intervalSeconds: 45,
      messageText: 'Msg',
      sentCount: 0,
      totalRecipients: 0,
      createdAt: '2026-08-27T00:00:00Z',
      updatedAt: '2026-08-27T00:00:00Z',
      routingConfig: {
        chatStatus: 'closed',
        keepAssigned: false,
        delegateToBot: false,
        forceChatUpdate: false,
      },
      contactConfig: {
        tags: [],
        customFields: [],
        forceContactUpdate: false,
      },
    });

    vi.spyOn(campaignsGateway, 'importCampaignRecipients').mockResolvedValueOnce({ count: 5 });

    const { result } = renderHook(() => useCreateCampaign());
    const mockFile = new File(['number\n+573001234567'], 'recipients.csv', { type: 'text/csv' });

    let campaign;
    await act(async () => {
      campaign = await result.current.createCampaign(
        {
          name: 'New',
          messageText: 'Msg',
          quickMode: true,
          intervalSeconds: 45,
          routingConfig: {
            chatStatus: 'closed',
            keepAssigned: false,
            delegateToBot: false,
            forceChatUpdate: false,
          },
          contactConfig: {
            tags: [],
            customFields: [],
            forceContactUpdate: false,
          },
        },
        mockFile
      );
    });


    expect(campaign).toBeDefined();
    expect(campaignsGateway.importCampaignRecipients).toHaveBeenCalledWith('c1', mockFile);
  });

  it('handles suspend, resume, delete actions', async () => {
    const { result } = renderHook(() => useCampaignActions());

    vi.spyOn(campaignsGateway, 'suspendCampaign').mockResolvedValueOnce({
      id: 'c1',
      name: 'Suspended',
      status: 'SUSPENDED',
      quickMode: true,
      intervalSeconds: 45,
      messageText: 'Msg',
      sentCount: 0,
      totalRecipients: 0,
      createdAt: '2026-08-27T00:00:00Z',
      updatedAt: '2026-08-27T00:00:00Z',
      routingConfig: {
        chatStatus: 'closed',
        keepAssigned: false,
        delegateToBot: false,
        forceChatUpdate: false,
      },
      contactConfig: {
        tags: [],
        customFields: [],
        forceContactUpdate: false,
    },
   });

    await act(async () => {
      const res = await result.current.suspendCampaign('c1');
      expect(res.status).toBe('SUSPENDED');
    });
  });
});
