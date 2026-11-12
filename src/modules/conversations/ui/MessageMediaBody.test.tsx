import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MessageMediaBody, isMediaPlaceholder } from "./MessageMediaBody";
import type { MessageDto } from "../domain/conversation";

function createMockMessage(partial: Partial<MessageDto> = {}): MessageDto {
  return {
    id: "msg-123",
    conversationId: "conv-123",
    caseId: null,
    direction: "inbound",
    author: "customer",
    agentId: null,
    body: "",
    type: "text",
    createdAt: new Date().toISOString(),
    ...partial,
  };
}

describe("isMediaPlaceholder", () => {
  it("detecta placeholders sinteticos de media", () => {
    expect(isMediaPlaceholder("[video]")).toBe(true);
    expect(isMediaPlaceholder("[image]")).toBe(true);
    expect(isMediaPlaceholder("[audio]")).toBe(true);
    expect(isMediaPlaceholder("[document]")).toBe(true);
    expect(isMediaPlaceholder("video")).toBe(true);
    expect(isMediaPlaceholder("imagen")).toBe(true);
    expect(isMediaPlaceholder("[video/mp4]")).toBe(true);
  });

  it("no filtra comentarios o texto real del cliente", () => {
    expect(isMediaPlaceholder("Aquí está el video del router")).toBe(false);
    expect(isMediaPlaceholder("Mire este video")).toBe(false);
    expect(isMediaPlaceholder("No tengo internet")).toBe(false);
  });
});

describe("MessageMediaBody - PDF", () => {
  it("muestra descarga cuando Zernio guardó el PDF como type file", () => {
    const msg = createMockMessage({
      type: "file",
      mediaId: "https://zernio.com/api/v1/whatsapp/media/voucher-id",
      filename: "voucher.pdf",
      mimeType: "application/pdf",
      body: "Compartir PDF",
    });

    render(<MessageMediaBody message={msg} />);
    expect(screen.getByText("voucher.pdf")).toBeInTheDocument();
    expect(screen.getByText("Compartir PDF")).toBeInTheDocument();
    const link = screen.getByTitle("Descargar");
    expect(link.getAttribute("href")).toContain("/api/media");
    expect(link.getAttribute("download")).toBe("voucher.pdf");
  });
});

describe("MessageMediaBody - Video", () => {
  it("renderiza reproductor de video HTML5 nativo cuando type === 'video'", () => {
    const msg = createMockMessage({
      type: "video",
      mediaId: "vid_12345",
      mimeType: "video/mp4",
      body: "[video]",
    });

    const { container } = render(<MessageMediaBody message={msg} />);
    const video = container.querySelector("video");
    expect(video).toBeInTheDocument();
    expect(video?.getAttribute("controls")).toBeDefined();
    expect(video?.getAttribute("src")).toContain("/api/media/vid_12345");

    // No debe renderizar el placeholder '[video]' como texto debajo del reproductor
    expect(screen.queryByText("[video]")).not.toBeInTheDocument();
  });

  it("renderiza el subtítulo o caption real debajo del video", () => {
    const msg = createMockMessage({
      type: "video",
      mediaId: "vid_999",
      mimeType: "video/mp4",
      body: "Video desde el router hasta el cuarto",
      caption: "Video desde el router hasta el cuarto",
    });

    render(<MessageMediaBody message={msg} />);
    expect(screen.getByText("Video desde el router hasta el cuarto")).toBeInTheDocument();
  });

  it("detecta video por mimeType video/* aunque type sea otro", () => {
    const msg = createMockMessage({
      type: "document",
      mediaId: "/api/v1/whatsapp/media/123",
      mimeType: "video/mp4",
      filename: "prueba_camara.mp4",
      body: "",
    });

    const { container } = render(<MessageMediaBody message={msg} />);
    const video = container.querySelector("video");
    expect(video).toBeInTheDocument();
    expect(screen.getByText("prueba_camara.mp4")).toBeInTheDocument();
  });

  it("muestra fallback amigable si no hay URL de video disponible", () => {
    const msg = createMockMessage({
      type: "video",
      mediaId: undefined,
      mediaUrl: undefined,
      filename: "video_perdido.mp4",
      body: "",
    });

    render(<MessageMediaBody message={msg} />);
    expect(screen.getByText("video_perdido.mp4")).toBeInTheDocument();
    expect(screen.getByText("VIDEO")).toBeInTheDocument();
  });
});

describe("MessageMediaBody - Sticker", () => {
  it("renderiza imagen de sticker cuando type === 'sticker' y tiene mediaId", () => {
    const msg = createMockMessage({
      type: "sticker",
      mediaId: "sticker_abc_123",
      mimeType: "image/webp",
      body: "[sticker]",
    });

    const { container } = render(<MessageMediaBody message={msg} />);
    const img = container.querySelector("img");
    expect(img).toBeInTheDocument();
    expect(img?.getAttribute("src")).toContain("/api/media/sticker_abc_123");
    expect(img?.getAttribute("alt")).toBe("Sticker");
    expect(screen.queryByText("[sticker]")).not.toBeInTheDocument();
  });

  it("renderiza fallback amigable con texto 'Sticker recibido' cuando no hay mediaId", () => {
    const msg = createMockMessage({
      type: "sticker",
      mediaId: undefined,
      mediaUrl: undefined,
      body: "[sticker]",
    });

    render(<MessageMediaBody message={msg} />);
    expect(screen.getByText("Sticker recibido")).toBeInTheDocument();
  });

  it("detecta sticker cuando body === '[sticker]' y mediaId está presente", () => {
    const msg = createMockMessage({
      type: "text",
      mediaId: "stk_999",
      mimeType: "image/webp",
      body: "[sticker]",
    });

    const { container } = render(<MessageMediaBody message={msg} />);
    const img = container.querySelector("img");
    expect(img).toBeInTheDocument();
    expect(img?.getAttribute("src")).toContain("/api/media/stk_999");
  });
});
