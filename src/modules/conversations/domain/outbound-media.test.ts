import { describe, expect, it } from "vitest";
import { validateOutboundMedia } from "./outbound-media";

function fileWithSize(name: string, type: string, size: number): File {
  const file = new File(["x"], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

const MB = 1024 * 1024;

describe("validateOutboundMedia", () => {
  it("acepta jpg, mp4, mp3 y pdf dentro del límite", () => {
    expect(validateOutboundMedia(fileWithSize("foto.jpg", "image/jpeg", 200_000), "image")).toEqual(
      {
        ok: true,
        kind: "image",
      },
    );
    expect(validateOutboundMedia(fileWithSize("clip.mp4", "video/mp4", 8 * MB), "video")).toEqual({
      ok: true,
      kind: "video",
    });
    expect(validateOutboundMedia(fileWithSize("nota.mp3", "audio/mpeg", MB), "audio")).toEqual({
      ok: true,
      kind: "audio",
    });
    expect(
      validateOutboundMedia(fileWithSize("contrato.pdf", "application/pdf", 2 * MB), "document"),
    ).toEqual({ ok: true, kind: "document" });
  });

  it("rechaza un tipo que no corresponde al selector", () => {
    const pdf = fileWithSize("contrato.pdf", "application/pdf", 20_000);
    const result = validateOutboundMedia(pdf, "image");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/JPG, PNG o WEBP/);
  });

  it("rechaza webm y wav, que WhatsApp no entrega como video o audio", () => {
    expect(validateOutboundMedia(fileWithSize("clip.webm", "video/webm", MB), "video").ok).toBe(
      false,
    );
    expect(validateOutboundMedia(fileWithSize("voz.wav", "audio/wav", MB), "audio").ok).toBe(false);
  });

  it("rechaza archivos vacíos y los que superan el límite del tipo", () => {
    expect(validateOutboundMedia(fileWithSize("foto.jpg", "image/jpeg", 0), "image")).toEqual({
      ok: false,
      message: "El archivo está vacío.",
    });
    const bigImage = validateOutboundMedia(
      fileWithSize("foto.png", "image/png", 5 * MB + 1),
      "image",
    );
    expect(bigImage.ok).toBe(false);
    if (!bigImage.ok) expect(bigImage.message).toMatch(/5 MB/);

    const bigDoc = validateOutboundMedia(
      fileWithSize("manual.pdf", "application/pdf", 100 * MB + 1),
      "document",
    );
    expect(bigDoc.ok).toBe(false);
    if (!bigDoc.ok) expect(bigDoc.message).toMatch(/100 MB/);
  });

  it("acepta la imagen por extensión cuando el navegador no informa el mime", () => {
    expect(validateOutboundMedia(fileWithSize("captura.webp", "", 50_000), "image").ok).toBe(true);
  });
});
