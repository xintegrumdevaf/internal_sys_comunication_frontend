import { describe, expect, it } from "vitest";
import {
  classifyPastedClipboardFile,
  classifyPastedImage,
  filesFromClipboard,
  validateOutboundMedia,
} from "./outbound-media";

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
    expect(
      validateOutboundMedia(fileWithSize("sticker.webp", "image/webp", 100_000), "sticker"),
    ).toEqual({ ok: true, kind: "sticker" });
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

    const bigSticker = validateOutboundMedia(
      fileWithSize("animado.webp", "image/webp", 500 * 1024 + 1),
      "sticker",
    );
    expect(bigSticker.ok).toBe(false);
    if (!bigDoc.ok) expect(bigDoc.message).toMatch(/100 MB/);
  });

  it("acepta la imagen por extensión cuando el navegador no informa el mime", () => {
    expect(validateOutboundMedia(fileWithSize("captura.webp", "", 50_000), "image").ok).toBe(true);
  });
});

describe("filesFromClipboard", () => {
  it("toma la imagen y deja pasar el texto plano", () => {
    const png = new File(["img"], "captura.png", { type: "image/png" });
    expect(
      filesFromClipboard({
        files: [],
        items: [
          { kind: "string", type: "text/plain", getAsFile: () => null },
          { kind: "file", type: "image/png", getAsFile: () => png },
        ],
      }),
    ).toEqual([png]);
    expect(
      filesFromClipboard({
        files: [],
        items: [{ kind: "string", type: "text/plain", getAsFile: () => null }],
      }),
    ).toEqual([]);
  });

  it("prefiere el archivo cuando el portapapeles ya trae la imagen", () => {
    const jpg = new File(["img"], "foto.jpg", { type: "image/jpeg" });
    expect(filesFromClipboard({ files: [jpg], items: [] })).toEqual([jpg]);
  });

  it("toma un video o un documento copiados como archivo", () => {
    const mp4 = new File(["v"], "clip.mp4", { type: "video/mp4" });
    const pdf = new File(["p"], "contrato.pdf", { type: "application/pdf" });
    expect(filesFromClipboard({ files: [mp4, pdf], items: [] })).toEqual([mp4, pdf]);
  });
});

describe("classifyPastedImage", () => {
  it("deja lista una captura png", () => {
    const png = new File(["img"], "image.png", { type: "image/png" });
    expect(classifyPastedImage(png)).toEqual({ status: "ready", file: png });
  });

  it("pone nombre a una captura sin archivo", () => {
    const png = new File(["img"], "", { type: "image/png" });
    const result = classifyPastedImage(png, new Date(2026, 10, 2, 10, 9, 8));
    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;
    expect(result.file.name).toBe("imagen-20261102-100908.png");
    expect(result.file.type).toBe("image/png");
  });

  it("pide conversión cuando el formato no lo acepta WhatsApp", () => {
    const bmp = new File(["img"], "captura.bmp", { type: "image/bmp" });
    expect(classifyPastedImage(bmp).status).toBe("needs-conversion");
  });

  it("rechaza una imagen que supera 5 MB", () => {
    const result = classifyPastedImage(fileWithSize("foto.png", "image/png", 5 * MB + 1));
    expect(result.status).toBe("rejected");
    if (result.status === "rejected") expect(result.message).toMatch(/5 MB/);
  });
});

describe("classifyPastedClipboardFile", () => {
  it("deja listos un mp4 y un pdf", () => {
    const mp4 = new File(["v"], "clip.mp4", { type: "video/mp4" });
    const pdf = new File(["p"], "contrato.pdf", { type: "application/pdf" });
    expect(classifyPastedClipboardFile(mp4)).toEqual({ status: "ready", file: mp4, kind: "video" });
    expect(classifyPastedClipboardFile(pdf)).toEqual({
      status: "ready",
      file: pdf,
      kind: "document",
    });
  });

  it("acepta un word aunque el navegador no informe el mime", () => {
    const docx = new File(["d"], "Cambios.docx", { type: "" });
    const result = classifyPastedClipboardFile(docx);
    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;
    expect(result.kind).toBe("document");
    expect(result.file.name).toBe("Cambios.docx");
    expect(result.file.type).toBe(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
  });

  it("rechaza un video que WhatsApp no entrega", () => {
    const result = classifyPastedClipboardFile(
      new File(["v"], "clip.webm", { type: "video/webm" }),
    );
    expect(result.status).toBe("rejected");
    if (result.status === "rejected") expect(result.message).toMatch(/MP4, 3GP o MOV/);
  });

  it("rechaza un video que supera 16 MB", () => {
    const result = classifyPastedClipboardFile(fileWithSize("clip.mp4", "video/mp4", 16 * MB + 1));
    expect(result.status).toBe("rejected");
    if (result.status === "rejected") expect(result.message).toMatch(/16 MB/);
  });

  it("rechaza un archivo que no se puede enviar", () => {
    const result = classifyPastedClipboardFile(
      new File(["x"], "programa.exe", { type: "application/octet-stream" }),
    );
    expect(result.status).toBe("rejected");
    if (result.status === "rejected") expect(result.message).toMatch(/No se pudo pegar/);
  });
});
