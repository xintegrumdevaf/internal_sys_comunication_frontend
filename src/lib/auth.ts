import { useSyncExternalStore } from "react";
import { SEED_DEPARTMENTS, SEED_USERS } from "@/adapters/persistence/memory/seed";
import type { User } from "@/core/modules/identity/domain/user";

/**
 * UI session adapter (driving adapter).
 * Maps Core identity users to the shell session shape.
 * Swap localStorage for real auth later without touching domain.
 */

export type SessionUser = {
  id: string;
  name: string;
  initials: string;
  email: string;
  /** Primary department slug for nav landing */
  departmentSlug: string;
  roleLabel: string;
  area: string;
  landing: string;
};

function toSessionUser(user: User): SessionUser {
  const primary =
    SEED_DEPARTMENTS.find((d) => d.id === user.primaryDepartmentId) ?? SEED_DEPARTMENTS[0];
  const membership = user.memberships.find((m) => m.departmentId === primary.id);
  const roleLabel =
    membership?.role === "admin"
      ? `Admin · ${primary.name}`
      : membership?.role === "lead"
        ? `Líder · ${primary.name}`
        : `Agente · ${primary.name}`;

  return {
    id: user.id,
    name: user.name,
    initials: user.initials,
    email: user.email,
    departmentSlug: primary.slug,
    roleLabel,
    area: primary.name,
    landing: primary.landingPath,
  };
}

/** @deprecated Use SessionUser — kept for gradual UI migration */
export type DemoUser = SessionUser;
/** @deprecated Prefer departmentSlug from session */
export type Role = "admin_ti" | "soporte" | "cartera" | "utga";

export const DEMO_USERS: SessionUser[] = SEED_USERS.map(toSessionUser);

export const DEPARTMENT_NAV = SEED_DEPARTMENTS.filter((d) => d.active).map((d) => ({
  id: d.id,
  slug: d.slug,
  label: d.name,
  to: d.landingPath,
}));

const KEY = "netops.session";
const listeners = new Set<() => void>();

let cachedRaw: string | null = null;
let cachedUser: SessionUser | null = null;

function read(): SessionUser | null {
  if (typeof window === "undefined") return null;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
  if (raw === cachedRaw) return cachedUser;
  cachedRaw = raw;
  try {
    cachedUser = raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    cachedUser = null;
  }
  return cachedUser;
}

function notify() {
  cachedRaw = null;
  listeners.forEach((l) => l());
}

export function signIn(user: SessionUser) {
  window.localStorage.setItem(KEY, JSON.stringify(user));
  notify();
}

export function signOut() {
  window.localStorage.removeItem(KEY);
  notify();
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cachedRaw = null;
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
};

export function useSession(): SessionUser | null {
  return useSyncExternalStore(subscribe, read, () => null);
}
