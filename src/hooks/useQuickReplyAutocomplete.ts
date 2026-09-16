import { useState, useEffect, useMemo, useCallback } from "react";
import { quickRepliesApi } from "@/services/quick-replies.api";
import type { QuickReply } from "@/types/quick-reply";

export interface UseQuickReplyAutocompleteProps {
  inputText: string;
  departmentId?: string | null;
  onSelect: (interpolatedText: string) => void;
  conversationId?: string;
}

export function useQuickReplyAutocomplete({
  inputText,
  departmentId,
  onSelect,
  conversationId,
}: UseQuickReplyAutocompleteProps) {
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(false);

  const fetchReplies = useCallback(async () => {
    try {
      setLoading(true);
      const data = await quickRepliesApi.list({ activeOnly: true });
      setQuickReplies(data);
    } catch (err) {
      console.error("Error al cargar respuestas rápidas:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchReplies();
  }, [fetchReplies]);

  // Restablecer el estado de cierre al modificar el texto
  useEffect(() => {
    setDismissed(false);
  }, [inputText]);

  // Detecta si el cursor o el texto actual empieza con / o contiene un comando
  const match = useMemo(() => {
    const slashMatch = inputText.match(/(?:^|\s)\/([a-zA-Z0-9_-]*)$/);
    if (!slashMatch) return null;
    return {
      query: slashMatch[1].toLowerCase(),
      fullMatch: slashMatch[0],
    };
  }, [inputText]);

  const filtered = useMemo(() => {
    if (!match) return [];
    const q = match.query;
    return quickReplies.filter(
      (r) => r.shortcut.toLowerCase().includes(q) || r.title.toLowerCase().includes(q),
    );
  }, [match, quickReplies]);

  const isOpen = Boolean(match) && !dismissed && filtered.length > 0;

  useEffect(() => {
    setSelectedIndex(0);
  }, [filtered.length]);

  const selectReply = useCallback(
    async (reply: QuickReply) => {
      try {
        const res = await quickRepliesApi.resolve({
          shortcut: reply.shortcut,
          departmentId: reply.departmentId ?? departmentId,
          conversationId,
        });
        onSelect(res.interpolatedBody);
      } catch {
        onSelect(reply.body);
      }
    },
    [departmentId, conversationId, onSelect],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): boolean => {
      if (!isOpen || filtered.length === 0) return false;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filtered.length);
        return true;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
        return true;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        const chosen = filtered[selectedIndex];
        if (chosen) {
          void selectReply(chosen);
        }
        return true;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setDismissed(true);
        return true;
      }
      return false;
    },
    [isOpen, filtered, selectedIndex, selectReply],
  );

  return {
    isOpen,
    filtered,
    selectedIndex,
    setSelectedIndex,
    selectReply,
    handleKeyDown,
    loading,
    refresh: fetchReplies,
    close: () => setDismissed(true),
  };
}
