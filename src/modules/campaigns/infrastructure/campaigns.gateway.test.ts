import { describe, it, expect, beforeEach } from "vitest";
import { campaignsGateway } from "./campaigns.gateway";

describe("Campaigns Gateway", () => {
  beforeEach(() => {});

  it("should list initial mock campaigns", async () => {
    const list = await campaignsGateway.listCampaigns();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
  });

  it("should create a new campaign in memory", async () => {
    const newCamp = await campaignsGateway.createCampaign({
      name: "Test Campaign",
      messageText: "Hello test",
      quickMode: true,
      intervalSeconds: 45,
      routingConfig: {
        chatStatus: "closed",
        keepAssigned: false,
        delegateToBot: false,
        forceChatUpdate: false,
      },
      contactConfig: {
        tags: ["VIP"],
        customFields: [],
        forceContactUpdate: false,
      },
    });

    expect(newCamp.id).toBeDefined();
    expect(newCamp.name).toBe("Test Campaign");
    expect(newCamp.status).toBe("DRAFT");

    const updatedList = await campaignsGateway.listCampaigns();
    expect(updatedList.some((c) => c.id === newCamp.id)).toBe(true);
  });

  it("should start a draft campaign", async () => {
    const newCamp = await campaignsGateway.createCampaign({
      name: "Draft to Start",
      messageText: "Test start",
      quickMode: false,
      intervalSeconds: 60,
      routingConfig: {
        chatStatus: "open",
        keepAssigned: true,
        delegateToBot: true,
        forceChatUpdate: true,
      },
      contactConfig: {
        tags: [],
        customFields: [],
        forceContactUpdate: false,
      },
    });

    const started = await campaignsGateway.startCampaign(newCamp.id);
    expect(started.status).toBe("RUNNING");
  });

  it("should suspend and resume a running campaign", async () => {
    const list = await campaignsGateway.listCampaigns();
    const running = list.find((c) => c.status === "RUNNING") || list[0];

    const suspended = await campaignsGateway.suspendCampaign(running.id);
    expect(suspended.status).toBe("SUSPENDED");

    const resumed = await campaignsGateway.resumeCampaign(running.id);
    expect(resumed.status).toBe("RUNNING");
  });

  it("should delete a draft campaign", async () => {
    const newCamp = await campaignsGateway.createCampaign({
      name: "Draft to Delete",
      messageText: "Delete me",
      quickMode: true,
      intervalSeconds: 45,
      routingConfig: {
        chatStatus: "closed",
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

    await campaignsGateway.deleteCampaign(newCamp.id);
    const list = await campaignsGateway.listCampaigns();
    expect(list.some((c) => c.id === newCamp.id)).toBe(false);
  });
});
