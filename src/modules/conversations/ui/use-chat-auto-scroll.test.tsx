import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useChatAutoScroll } from "./use-chat-auto-scroll";

afterEach(cleanup);

type TestMessage = { id: string; text: string };

function Harness({
  conversationId,
  messages,
}: {
  conversationId: string | null;
  messages: TestMessage[];
}) {
  const { scrollRef, contentRef, onScroll } = useChatAutoScroll({
    conversationId,
    messageCount: messages.length,
    firstMessageId: messages[0]?.id,
    lastMessageId: messages[messages.length - 1]?.id,
  });

  return (
    <div ref={scrollRef} onScroll={onScroll} data-testid="scroll-container">
      <div ref={contentRef} data-testid="scroll-content">
        {messages.map((m) => (
          <div key={m.id}>{m.text}</div>
        ))}
      </div>
    </div>
  );
}

function mockScrollMetrics(
  el: HTMLElement,
  {
    scrollHeight,
    clientHeight,
    initialTop = 0,
  }: { scrollHeight: number; clientHeight: number; initialTop?: number },
) {
  let top = initialTop;
  Object.defineProperty(el, "scrollHeight", { configurable: true, get: () => scrollHeight });
  Object.defineProperty(el, "clientHeight", { configurable: true, get: () => clientHeight });
  Object.defineProperty(el, "scrollTop", {
    configurable: true,
    get: () => top,
    set: (v: number) => {
      top = v;
    },
  });
}

describe("useChatAutoScroll", () => {
  it("baja el scroll al fondo al cambiar de conversación y recibir sus mensajes", () => {
    const { rerender } = render(
      <Harness
        conversationId="conv-1"
        messages={[
          { id: "m1", text: "hola" },
          { id: "m2", text: "chau" },
        ]}
      />,
    );

    const container = screen.getByTestId("scroll-container");
    mockScrollMetrics(container, { scrollHeight: 1600, clientHeight: 500, initialTop: 1100 });
    fireEvent.scroll(container);

    // Simula que el usuario había subido manualmente en conv-1
    container.scrollTop = 200;
    fireEvent.scroll(container);

    // Cambia a conv-2: primero estado vacío, luego llegan mensajes
    rerender(<Harness conversationId="conv-2" messages={[]} />);
    mockScrollMetrics(container, { scrollHeight: 500, clientHeight: 500, initialTop: 0 });

    const conv2Msgs = [
      { id: "m10", text: "primer mensaje" },
      { id: "m11", text: "ultimo mensaje" },
    ];
    mockScrollMetrics(container, { scrollHeight: 2400, clientHeight: 500, initialTop: 0 });
    rerender(<Harness conversationId="conv-2" messages={conv2Msgs} />);

    expect(container.scrollTop).toBe(2400);
  });

  it("no fuerza el scroll abajo cuando el usuario carga mensajes anteriores arriba", () => {
    const { rerender } = render(
      <Harness
        conversationId="conv-1"
        messages={[
          { id: "m2", text: "segundo" },
          { id: "m3", text: "ultimo" },
        ]}
      />,
    );

    const container = screen.getByTestId("scroll-container");
    mockScrollMetrics(container, { scrollHeight: 1500, clientHeight: 500, initialTop: 1500 });
    fireEvent.scroll(container);

    // Usuario scrollea manualmente hacia arriba
    container.scrollTop = 100;
    fireEvent.scroll(container);

    // Llegan mensajes anteriores (cambia firstMessageId, lastMessageId sigue igual)
    mockScrollMetrics(container, { scrollHeight: 2200, clientHeight: 500, initialTop: 100 });
    rerender(
      <Harness
        conversationId="conv-1"
        messages={[
          { id: "m1", text: "viejo" },
          { id: "m2", text: "segundo" },
          { id: "m3", text: "ultimo" },
        ]}
      />,
    );

    expect(container.scrollTop).toBe(100);
  });

  it("baja al último mensaje si llega uno nuevo y el usuario estaba abajo", () => {
    const initial = [
      { id: "m1", text: "uno" },
      { id: "m2", text: "dos" },
    ];
    const { rerender } = render(<Harness conversationId="conv-1" messages={initial} />);

    const container = screen.getByTestId("scroll-container");
    mockScrollMetrics(container, { scrollHeight: 1000, clientHeight: 500, initialTop: 500 });
    fireEvent.scroll(container);

    mockScrollMetrics(container, { scrollHeight: 1350, clientHeight: 500, initialTop: 500 });
    rerender(
      <Harness conversationId="conv-1" messages={[...initial, { id: "m3", text: "tres nuevo" }]} />,
    );

    expect(container.scrollTop).toBe(1350);
  });
});
