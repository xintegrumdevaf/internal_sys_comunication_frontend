import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import type { AgentDto } from "@/modules/identity/domain/agent";
import { normalizeAgent } from "@/modules/identity/infrastructure/normalize-agent";
import { apiPost } from "@/shared/http/http-client";
import { useTheme } from "@/shared/theme/theme-provider";

const EMBED_STORAGE_KEY = "goticket_isp_erp_embed";

interface ErpSyncMessagePayload {
  source?: string;
  type?: string;
  path?: string;
  theme?: "light" | "dark";
  token?: string;
}

function readInitialEmbedFlags(): { isErpEmbed: boolean; initialToken: string } {
  if (typeof window === "undefined") {
    return { isErpEmbed: false, initialToken: "" };
  }
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("erpEmbed") === "1";
  const fromStorage = sessionStorage.getItem(EMBED_STORAGE_KEY) === "1";
  const isErpEmbed = fromQuery || fromStorage;
  if (fromQuery) {
    try {
      sessionStorage.setItem(EMBED_STORAGE_KEY, "1");
    } catch {
      // ignore storage errors
    }
  }
  return {
    isErpEmbed,
    initialToken: params.get("token")?.trim() || "",
  };
}

/**
 * Conecta GoTicket ISP con el Shell Corporativo ERP cuando corre incrustado (`?erpEmbed=1`):
 * intercambia el JWT del ERP por una sesión Redis ISP real, sincroniza rutas y tema visual.
 */
export function useErpEmbedBridge(): { isErpEmbed: boolean; exchanging: boolean } {
  const [{ isErpEmbed, initialToken }] = useState(readInitialEmbedFlags);
  const [erpToken, setErpToken] = useState(initialToken);
  const [exchanging, setExchanging] = useState(() => isErpEmbed && Boolean(initialToken));
  const lastTokenRef = useRef("");
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { setTheme } = useTheme();
  const navigateRef = useRef(navigate);
  const pathnameRef = useRef(pathname);
  const setThemeRef = useRef(setTheme);
  navigateRef.current = navigate;
  pathnameRef.current = pathname;
  setThemeRef.current = setTheme;

  const exchangeToken = useCallback(
    async (tokenToExchange: string) => {
      const clean = tokenToExchange.trim();
      if (!clean || lastTokenRef.current === clean) return;
      lastTokenRef.current = clean;
      setExchanging(true);
      try {
        const rawAgent = await apiPost<AgentDto>("/api/auth/sso-exchange", {
          erpToken: clean,
        });
        const normalized = normalizeAgent(rawAgent);
        queryClient.setQueryData(["session", "me"], normalized);
        await queryClient.invalidateQueries();
      } catch {
        lastTokenRef.current = "";
      } finally {
        setExchanging(false);
      }
    },
    [queryClient],
  );

  useEffect(() => {
    if (!isErpEmbed || typeof window === "undefined") return undefined;
    const params = new URLSearchParams(window.location.search);
    const initialTheme = params.get("theme");
    if (initialTheme === "dark" || initialTheme === "light") {
      setThemeRef.current(initialTheme);
    }

    const handleMessage = (event: MessageEvent<unknown>) => {
      if (!event.data || typeof event.data !== "object") return;
      const msg = event.data as ErpSyncMessagePayload;
      if (msg.source !== "GOTICKET_ERP_SHELL" || msg.type !== "ERP_SYNC") return;

      if (msg.theme === "dark" || msg.theme === "light") {
        setThemeRef.current(msg.theme);
      }
      if (msg.token && msg.token.trim()) {
        setErpToken(msg.token.trim());
      }
      if (msg.path && msg.path !== pathnameRef.current) {
        void navigateRef.current({ to: msg.path });
      }
    };

    window.addEventListener("message", handleMessage);
    window.parent.postMessage({ source: "GOTICKET_ISP_MODULE", type: "ISP_READY" }, "*");
    return () => window.removeEventListener("message", handleMessage);
  }, [isErpEmbed]);

  useEffect(() => {
    if (!isErpEmbed || !erpToken) return;
    void exchangeToken(erpToken);
  }, [isErpEmbed, erpToken, exchangeToken]);

  return { isErpEmbed, exchanging };
}
