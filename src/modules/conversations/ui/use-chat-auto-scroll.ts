import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

const BOTTOM_STICK_THRESHOLD_PX = 80;

export type UseChatAutoScrollParams = {
  conversationId: string | null;
  messageCount: number;
  firstMessageId?: string;
  lastMessageId?: string;
  /** Clave adicional cuando elementos debajo de los mensajes cambian la altura del hilo (ej. banner de cierre). */
  extraKey?: unknown;
};

/**
 * Mantiene el scroll del hilo de mensajes anclado al último mensaje al cambiar de conversación,
 * recibir mensajes nuevos o cuando multimedia/banners cambian el alto asíncronamente,
 * sin forzar bajada si el usuario scrolleó hacia arriba manualmente o cargó mensajes antiguos.
 */
export function useChatAutoScroll({
  conversationId,
  messageCount,
  firstMessageId,
  lastMessageId,
  extraKey,
}: UseChatAutoScrollParams) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const stickToBottomRef = useRef(true);
  const programmaticScrollRef = useRef(false);
  const lastScrollTopRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);

  const prevSnapshotRef = useRef<{
    conversationId: string | null;
    messageCount: number;
    firstMessageId?: string;
    lastMessageId?: string;
    extraKey?: unknown;
  }>({
    conversationId,
    messageCount: 0,
    firstMessageId: undefined,
    lastMessageId: undefined,
    extraKey,
  });

  const scrollToBottomInstant = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    programmaticScrollRef.current = true;
    el.scrollTop = el.scrollHeight;
    lastScrollTopRef.current = el.scrollTop;

    if (typeof requestAnimationFrame !== "undefined") {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        const target = scrollRef.current;
        if (target && stickToBottomRef.current) {
          target.scrollTop = target.scrollHeight;
          lastScrollTopRef.current = target.scrollTop;
        }
        programmaticScrollRef.current = false;
      });
    } else {
      programmaticScrollRef.current = false;
    }
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || el.clientHeight === 0) return;

    const currentTop = el.scrollTop;
    const distanceFromBottom = el.scrollHeight - currentTop - el.clientHeight;

    if (programmaticScrollRef.current) {
      lastScrollTopRef.current = currentTop;
      return;
    }

    if (distanceFromBottom <= BOTTOM_STICK_THRESHOLD_PX) {
      stickToBottomRef.current = true;
    } else if (currentTop < lastScrollTopRef.current - 2) {
      // Solo soltar el anclaje cuando el usuario realmente desplaza hacia arriba,
      // evitando falso positivo si creció el contenido o se redujo clientHeight.
      stickToBottomRef.current = false;
    }

    lastScrollTopRef.current = currentTop;
  }, []);

  useLayoutEffect(() => {
    const prev = prevSnapshotRef.current;
    const conversationChanged = prev.conversationId !== conversationId;
    const prependedOlder =
      !conversationChanged &&
      prev.messageCount > 0 &&
      messageCount > prev.messageCount &&
      firstMessageId !== prev.firstMessageId &&
      lastMessageId === prev.lastMessageId;

    prevSnapshotRef.current = {
      conversationId,
      messageCount,
      firstMessageId,
      lastMessageId,
      extraKey,
    };

    if (conversationChanged) {
      stickToBottomRef.current = true;
      lastScrollTopRef.current = 0;
      if (messageCount > 0) {
        scrollToBottomInstant();
      }
      return;
    }

    if (prependedOlder) {
      return;
    }

    const initialMessagesLoaded = prev.messageCount === 0 && messageCount > 0;
    const newTailMessageArrived = Boolean(lastMessageId && lastMessageId !== prev.lastMessageId);
    const extraChanged = prev.extraKey !== extraKey;

    if (
      stickToBottomRef.current &&
      (initialMessagesLoaded || newTailMessageArrived || (messageCount > 0 && extraChanged))
    ) {
      scrollToBottomInstant();
    }
  }, [
    conversationId,
    messageCount,
    firstMessageId,
    lastMessageId,
    extraKey,
    scrollToBottomInstant,
  ]);

  useEffect(() => {
    const scrollEl = scrollRef.current;
    const contentEl = contentRef.current;
    if (!scrollEl || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      if (stickToBottomRef.current) {
        scrollToBottomInstant();
      }
    });

    observer.observe(scrollEl);
    if (contentEl) {
      observer.observe(contentEl);
    }

    return () => {
      observer.disconnect();
    };
  }, [conversationId, scrollToBottomInstant]);

  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null && typeof cancelAnimationFrame !== "undefined") {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  const stickToBottom = useCallback(() => {
    stickToBottomRef.current = true;
    scrollToBottomInstant();
  }, [scrollToBottomInstant]);

  return {
    scrollRef,
    contentRef,
    onScroll: handleScroll,
    scrollToBottomInstant,
    stickToBottom,
  };
}
