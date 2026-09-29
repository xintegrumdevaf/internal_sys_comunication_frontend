import { apiGet } from "@/shared/http/http-client";
import type { TagItem } from "../domain/tag";
import { loadTagsFromStorage } from "./tags.storage";

export const tagsGateway = {
  list: async (): Promise<TagItem[]> => {
    try {
      const res = await apiGet<TagItem[]>("/api/tags");
      if (Array.isArray(res) && res.length > 0) return res;
      return loadTagsFromStorage();
    } catch {
      return loadTagsFromStorage();
    }
  },
};
