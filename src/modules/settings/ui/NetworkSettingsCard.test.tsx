import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NetworkSettingsCard } from "./NetworkSettingsCard";
import { settingsApi } from "../infrastructure/settings.api";

describe("NetworkSettingsCard", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renderiza la cabecera y el estado de carga", async () => {
    vi.spyOn(settingsApi, "listNetworkRouters").mockResolvedValueOnce([
      {
        id: "router-1",
        name: "bellavista",
        displayName: "Router Bellavista",
        host: "181.78.197.184",
        port: 8222,
        username: "ANGEL",
        password: "••••••••",
        hasPassword: true,
        isActive: true,
        olts: [
          {
            id: "olt-1",
            routerId: "router-1",
            name: "bellavista",
            displayName: "OLT Bellavista (HUAWEI)",
            ip: "172.40.0.4",
            brand: "huawei",
            username: "sistema",
            password: "••••••••",
            hasPassword: true,
            slot: null,
            isActive: true,
          },
        ],
      },
    ]);

    render(<NetworkSettingsCard />);

    expect(screen.getByText("Infraestructura de Red: Routers y OLTs")).toBeDefined();
    expect(await screen.findByText("Router Bellavista")).toBeDefined();
    expect(screen.getByText("OLT Bellavista (HUAWEI)")).toBeDefined();
    expect(screen.getByText("HUAWEI")).toBeDefined();
  });
});
