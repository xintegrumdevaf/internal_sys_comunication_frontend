import { apiDelete, apiGet, apiPatch, apiPost } from "@/shared/http/http-client";
import { resolveTagHex, type TagItem } from "../domain/tag";
import {
  createTagInStorage,
  deleteTagFromStorage,
  loadTagsFromStorage,
  saveTagsToStorage,
  updateTagInStorage,
} from "./tags.storage";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(value: string): boolean {
  return UUID_REGEX.test(value.trim());
}

function normalizeTag(tag: TagItem): TagItem {
  return {
    ...tag,
    name: tag.name.trim().toUpperCase(),
    color: resolveTagHex(tag.color),
  };
}

export const tagsGateway = {
  list: async (): Promise<TagItem[]> => {
    const storageTags = loadTagsFromStorage().map(normalizeTag);
    try {
      const res = await apiGet<TagItem[]>("/api/tags");
      const backendTags = Array.isArray(res) ? res.map(normalizeTag) : [];

      const map = new Map<string, TagItem>();
      for (const t of backendTags) {
        map.set(t.name.toUpperCase(), t);
      }

      // Migrar automáticamente al backend cualquier etiqueta que sólo exista en localStorage
      // (ej. INITIAL_SYSTEM_TAGS o etiquetas creadas localmente con id "tag-...")
      let migratedAny = false;
      for (const localTag of storageTags) {
        const key = localTag.name.toUpperCase();
        if (!map.has(key)) {
          try {
            const created = await apiPost<TagItem>("/api/tags", {
              name: key,
              color: resolveTagHex(localTag.color),
              description: localTag.description ?? null,
            });
            if (created && created.id) {
              map.set(key, normalizeTag(created));
              migratedAny = true;
              continue;
            }
          } catch {
            // Si falla la creación (ej. permisos o red), mantener en memoria sólo para visualización
          }
          map.set(key, localTag);
        }
      }

      const combined = Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
      // Actualizar localStorage con los UUIDs reales del backend
      if (backendTags.length > 0 || migratedAny) {
        saveTagsToStorage(combined, false);
      }
      return combined;
    } catch {
      return storageTags;
    }
  },

  create: async (payload: {
    name: string;
    color?: string;
    description?: string;
  }): Promise<TagItem[]> => {
    const cleanName = payload.name.trim().toUpperCase();
    const cleanColor = resolveTagHex(payload.color);
    const cleanDescription = payload.description?.trim() || undefined;

    try {
      const created = await apiPost<TagItem>("/api/tags", {
        name: cleanName,
        color: cleanColor,
        description: cleanDescription ?? null,
      });
      const current = loadTagsFromStorage().filter((t) => t.name.toUpperCase() !== cleanName);
      const updated = [normalizeTag(created), ...current];
      saveTagsToStorage(updated, true);
      return updated;
    } catch {
      return createTagInStorage(cleanName, cleanColor, cleanDescription);
    }
  },

  update: async (
    id: string,
    payload: { name: string; color?: string; description?: string },
  ): Promise<TagItem[]> => {
    const cleanName = payload.name.trim().toUpperCase();
    const cleanColor = resolveTagHex(payload.color);
    const cleanDescription = payload.description?.trim() || undefined;

    try {
      if (isValidUuid(id)) {
        const updatedTag = await apiPatch<TagItem>(`/api/tags/${id}`, {
          name: cleanName,
          color: cleanColor,
          description: cleanDescription ?? null,
        });
        const current = loadTagsFromStorage().map((t) =>
          t.id === id ? normalizeTag(updatedTag) : t,
        );
        saveTagsToStorage(current, true);
        return current;
      } else {
        // Si tenía ID local ("tag-..."), crearla en el backend para obtener su UUID real
        const created = await apiPost<TagItem>("/api/tags", {
          name: cleanName,
          color: cleanColor,
          description: cleanDescription ?? null,
        });
        const current = loadTagsFromStorage().map((t) => (t.id === id ? normalizeTag(created) : t));
        saveTagsToStorage(current, true);
        return current;
      }
    } catch {
      return updateTagInStorage(id, {
        name: cleanName,
        color: cleanColor,
        description: cleanDescription,
      });
    }
  },

  delete: async (id: string): Promise<TagItem[]> => {
    if (isValidUuid(id)) {
      try {
        await apiDelete(`/api/tags/${id}`);
      } catch {
        // continuar limpiando storage local si ya no existe
      }
    }
    return deleteTagFromStorage(id);
  },

  /**
   * Garantiza que todos los tagIds enviados al backend sean UUIDs reales en PostgreSQL.
   * Si alguna etiqueta seleccionada proviene de localStorage (id "tag-..."),
   * busca su homóloga por nombre en `/api/tags` o la crea en el backend antes de guardar el contacto.
   */
  ensureBackendTagIds: async (
    selectedIds: string[],
    knownTags: TagItem[] = [],
  ): Promise<string[]> => {
    if (selectedIds.length === 0) return [];
    if (selectedIds.every(isValidUuid)) return selectedIds;

    const storageTags = loadTagsFromStorage();
    const allKnown = [...knownTags, ...storageTags];
    let backendTags: TagItem[] = [];
    try {
      const res = await apiGet<TagItem[]>("/api/tags");
      if (Array.isArray(res)) backendTags = res;
    } catch {
      // ignore
    }

    const byName = new Map<string, TagItem>();
    for (const t of backendTags) {
      byName.set(t.name.trim().toUpperCase(), t);
    }

    const resolvedIds: string[] = [];
    for (const rawId of selectedIds) {
      if (isValidUuid(rawId)) {
        resolvedIds.push(rawId);
        continue;
      }

      const localTag = allKnown.find((t) => t.id === rawId);
      if (!localTag) continue;

      const key = localTag.name.trim().toUpperCase();
      const existingBackend = byName.get(key);
      if (existingBackend && isValidUuid(existingBackend.id)) {
        resolvedIds.push(existingBackend.id);
        continue;
      }

      try {
        const created = await apiPost<TagItem>("/api/tags", {
          name: key,
          color: resolveTagHex(localTag.color),
          description: localTag.description ?? null,
        });
        if (created && isValidUuid(created.id)) {
          byName.set(key, created);
          resolvedIds.push(created.id);
        }
      } catch {
        // Si ya existía por condición de carrera, recargar lista
        try {
          const fresh = await apiGet<TagItem[]>("/api/tags");
          const match = fresh?.find((t) => t.name.trim().toUpperCase() === key);
          if (match && isValidUuid(match.id)) {
            resolvedIds.push(match.id);
          }
        } catch {
          // Omitir ID no-UUID para no romper el guardado del contacto con "Invalid UUID"
        }
      }
    }

    return Array.from(new Set(resolvedIds));
  },
};
