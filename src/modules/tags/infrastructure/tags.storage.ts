import { INITIAL_SYSTEM_TAGS, type TagItem } from "../domain/tag";

const STORAGE_KEY = "system_custom_tags_v2";

export function loadTagsFromStorage(): TagItem[] {
  if (typeof window === "undefined") return INITIAL_SYSTEM_TAGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SYSTEM_TAGS));
      return INITIAL_SYSTEM_TAGS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_SYSTEM_TAGS;
  } catch {
    return INITIAL_SYSTEM_TAGS;
  }
}

export function saveTagsToStorage(tags: TagItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tags));
    // Disparar evento para sincronizar vistas en vivo
    window.dispatchEvent(new CustomEvent("tags-updated", { detail: tags }));
  } catch {
    // fallback
  }
}

export function createTagInStorage(name: string, color?: string, description?: string): TagItem[] {
  const current = loadTagsFromStorage();
  const normalizedName = name.trim().toUpperCase();
  if (!normalizedName) return current;

  // Evitar duplicados por nombre
  const existing = current.find((t) => t.name.toUpperCase() === normalizedName);
  if (existing) {
    return current;
  }

  const newTag: TagItem = {
    id: `tag-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: normalizedName,
    color: color || "#ffffff4d",
    description: description?.trim() || undefined,
    createdAt: new Date().toISOString(),
    isSystem: false,
  };

  const updated = [newTag, ...current];
  saveTagsToStorage(updated);
  return updated;
}

export function updateTagInStorage(
  id: string,
  data: { name: string; color?: string; description?: string },
): TagItem[] {
  const current = loadTagsFromStorage();
  const normalizedName = data.name.trim().toUpperCase();
  const updated = current.map((t) => {
    if (t.id === id) {
      return {
        ...t,
        name: normalizedName || t.name,
        color: data.color ?? t.color,
        description: data.description?.trim(),
      };
    }
    return t;
  });
  saveTagsToStorage(updated);
  return updated;
}

export function deleteTagFromStorage(id: string): TagItem[] {
  const current = loadTagsFromStorage();
  const updated = current.filter((t) => t.id !== id);
  saveTagsToStorage(updated);
  return updated;
}
