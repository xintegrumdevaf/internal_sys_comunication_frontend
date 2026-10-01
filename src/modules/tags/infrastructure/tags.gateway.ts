import { apiGet } from "@/shared/http/http-client";
import type { TagItem } from "../domain/tag";
import { loadTagsFromStorage } from "./tags.storage";

export const tagsGateway = {
  list: async (): Promise<TagItem[]> => {
    const storageTags = loadTagsFromStorage();
    try {
      const res = await apiGet<TagItem[]>("/api/tags");
      if (Array.isArray(res) && res.length > 0) {
        // Combinar etiquetas de backend y localStorage para no ignorar etiquetas creadas localmente
        const map = new Map<string, TagItem>();
        res.forEach((t) => map.set(t.name.toUpperCase(), t));
        storageTags.forEach((t) => {
          const key = t.name.toUpperCase();
          if (!map.has(key)) {
            map.set(key, t);
          }
        });
        return Array.from(map.values());
      }
      return storageTags;
    } catch {
      return storageTags;
    }
  },
};
