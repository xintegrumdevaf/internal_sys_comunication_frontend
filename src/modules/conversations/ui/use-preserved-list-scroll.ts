import { useCallback, useLayoutEffect, useRef } from "react";

/** Por debajo de esto la lista se considera arriba del todo: un chat nuevo debe verse. */
export const LIST_TOP_THRESHOLD_PX = 8;

export type ListScrollAnchor = {
  /** Vacío si el agente estaba en el tope de la lista. */
  id: string;
  /** Distancia de la fila ancla al borde superior visible, en px. */
  offset: number;
  scrollTop: number;
};

/**
 * Nuevo scrollTop para que la fila que se estaba viendo siga en el mismo sitio
 * después de que la lista se reordene o reciba un chat arriba.
 * `null` = no tocar el scroll (el agente ya estaba arriba, o la fila no se movió).
 */
export function resolvePreservedScrollTop(
  anchor: ListScrollAnchor | null,
  currentScrollTop: number,
  anchoredRowOffset: number | null,
): number | null {
  if (!anchor || anchor.scrollTop <= LIST_TOP_THRESHOLD_PX) return null;
  if (!anchor.id || anchoredRowOffset == null) return null;
  const next = currentScrollTop + (anchoredRowOffset - anchor.offset);
  if (Math.abs(next - currentScrollTop) <= 1) return null;
  return next;
}

function isListVisible(root: HTMLElement): boolean {
  return root.clientHeight > 0 && root.getClientRects().length > 0;
}

function rowSelector(id: string): string {
  const escaped =
    typeof CSS !== "undefined" && typeof CSS.escape === "function"
      ? CSS.escape(id)
      : id.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `[data-conversation-id="${escaped}"]`;
}

/**
 * Mantiene la bandeja donde el agente la dejó cuando entra un chat nuevo.
 * Si está arriba del todo, se queda arriba para ver el chat que acaba de llegar.
 */
export function usePreservedListScroll(listVersion: unknown) {
  const ref = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<ListScrollAnchor | null>(null);
  const restoringRef = useRef(false);

  const capture = useCallback(() => {
    const root = ref.current;
    if (!root || restoringRef.current || !isListVisible(root)) return;
    const scrollTop = root.scrollTop;
    if (scrollTop <= LIST_TOP_THRESHOLD_PX) {
      anchorRef.current = { id: "", offset: 0, scrollTop: 0 };
      return;
    }
    const rootTop = root.getBoundingClientRect().top;
    const items = root.querySelectorAll<HTMLElement>("[data-conversation-id]");
    for (const item of items) {
      const rect = item.getBoundingClientRect();
      if (rect.bottom > rootTop + 1) {
        anchorRef.current = {
          id: item.dataset.conversationId ?? "",
          offset: rect.top - rootTop,
          scrollTop,
        };
        return;
      }
    }
    anchorRef.current = { id: "", offset: 0, scrollTop };
  }, []);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || !isListVisible(root)) return;
    const anchor = anchorRef.current;
    let anchoredRowOffset: number | null = null;
    if (anchor?.id) {
      const row = root.querySelector<HTMLElement>(rowSelector(anchor.id));
      if (row) {
        anchoredRowOffset = row.getBoundingClientRect().top - root.getBoundingClientRect().top;
      }
    }
    const next = resolvePreservedScrollTop(anchor, root.scrollTop, anchoredRowOffset);
    if (next != null) {
      restoringRef.current = true;
      root.scrollTop = next;
      restoringRef.current = false;
    }
    capture();
  }, [listVersion, capture]);

  return { ref, onScroll: capture };
}
