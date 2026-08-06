import { useSyncExternalStore } from "react";

export type WaLinkStatus = "unlinked" | "waiting_scan" | "linked";

export type WaLinkedSession = {
  status: WaLinkStatus;
  /** Código de emparejamiento del QR (simula multi-dispositivo) */
  pairingCode: string;
  phoneNumber?: string;
  displayName?: string;
  linkedAt?: string;
  deviceName?: string;
};

const KEY = "netops.wa.link";
const listeners = new Set<() => void>();

let cacheEpoch = 0;
let cachedEpoch = -1;
let cached: WaLinkedSession | null = null;

function createPairingCode(): string {
  const part = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${part()}-${part()}`;
}

export function defaultUnlinkedSession(): WaLinkedSession {
  return {
    status: "unlinked",
    pairingCode: createPairingCode(),
  };
}

function read(): WaLinkedSession {
  if (typeof window === "undefined") return defaultUnlinkedSession();
  if (cachedEpoch === cacheEpoch && cached) return cached;
  cachedEpoch = cacheEpoch;
  try {
    const raw = window.localStorage.getItem(KEY);
    cached = raw ? (JSON.parse(raw) as WaLinkedSession) : defaultUnlinkedSession();
  } catch {
    cached = defaultUnlinkedSession();
  }
  return cached;
}

function write(next: WaLinkedSession) {
  window.localStorage.setItem(KEY, JSON.stringify(next));
  cacheEpoch += 1;
  listeners.forEach((l) => l());
}

function notify() {
  cacheEpoch += 1;
  listeners.forEach((l) => l());
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

export function useWhatsAppLink(): WaLinkedSession {
  return useSyncExternalStore(subscribe, read, defaultUnlinkedSession);
}

/** Genera un nuevo QR / código de emparejamiento. */
export function startWhatsAppPairing(): WaLinkedSession {
  const next: WaLinkedSession = {
    status: "waiting_scan",
    pairingCode: createPairingCode(),
  };
  write(next);
  return next;
}

/** Simula que el teléfono escaneó el QR y vinculó el número. */
export function completeWhatsAppPairing(input?: {
  phoneNumber?: string;
  displayName?: string;
}): WaLinkedSession {
  const current = read();
  const next: WaLinkedSession = {
    status: "linked",
    pairingCode: current.pairingCode,
    phoneNumber: input?.phoneNumber ?? "+57 300 555 0100",
    displayName: input?.displayName ?? "NetOps Línea Principal",
    linkedAt: new Date().toISOString(),
    deviceName: "Chrome · Windows",
  };
  write(next);
  return next;
}

export function unlinkWhatsApp(): WaLinkedSession {
  const next = defaultUnlinkedSession();
  write(next);
  return next;
}

export function refreshPairingCode(): WaLinkedSession {
  const next: WaLinkedSession = {
    status: "waiting_scan",
    pairingCode: createPairingCode(),
  };
  write(next);
  return next;
}

export function getWhatsAppPairPayload(session: WaLinkedSession): string {
  // Payload estilo multi-dispositivo (simulado). En producción real sería el challenge de Meta/WA.
  return JSON.stringify({
    v: 1,
    type: "netops-wa-pair",
    code: session.pairingCode,
    ts: Date.now(),
  });
}

export function forceWhatsAppLinkReread() {
  notify();
}
