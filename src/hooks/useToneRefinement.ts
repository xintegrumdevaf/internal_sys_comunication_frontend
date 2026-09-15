import { useState, useCallback } from "react";
import { quickRepliesApi } from "@/services/quick-replies.api";

export interface UseToneRefinementOptions {
  onApply?: (refinedText: string) => void;
}

export function useToneRefinement({ onApply }: UseToneRefinementOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refineTone = useCallback(async (currentText: string) => {
    const trimmed = currentText.trim();
    if (trimmed.length < 5) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await quickRepliesApi.refineTone(trimmed);
      setSuggestion(result);
    } catch (err: unknown) {
      const message =
        (err as { message?: string })?.message ||
        "No se pudo conectar con el asistente de IA. Inténtalo de nuevo.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const applySuggestion = useCallback(() => {
    if (!suggestion) return;
    onApply?.(suggestion);
    setSuggestion(null);
    setError(null);
  }, [suggestion, onApply]);

  const discardSuggestion = useCallback(() => {
    setSuggestion(null);
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setSuggestion(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    isLoading,
    suggestion,
    error,
    refineTone,
    applySuggestion,
    discardSuggestion,
    reset,
  };
}
