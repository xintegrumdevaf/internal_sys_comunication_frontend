import { describe, expect, it } from "vitest";
import {
  detectAtQuery,
  findTarget,
  insertMentionAt,
  mentionMarker,
  parseMentionMarkers,
  resolveConversationId,
} from "./mention-parser";
import type { Mention, MentionTarget } from "./internal-chat";

const conversationMention: Mention = {
  type: "conversation",
  targetId: "conv_1",
  label: "593998576466",
};

describe("mentionMarker / parseMentionMarkers", () => {
  it("el marker generado se puede volver a parsear a la misma mención", () => {
    const marker = mentionMarker(conversationMention);
    const parts = parseMentionMarkers(marker);
    expect(parts).toEqual([{ kind: "mention", mention: conversationMention }]);
  });

  it("separa texto plano de menciones en un mensaje mixto", () => {
    const body = `Hola @[593998576466](conversation:conv_1) revisa esto`;
    const parts = parseMentionMarkers(body);
    expect(parts).toEqual([
      { kind: "text", text: "Hola " },
      { kind: "mention", mention: conversationMention },
      { kind: "text", text: " revisa esto" },
    ]);
  });

  it("texto sin menciones devuelve un único bloque de texto", () => {
    expect(parseMentionMarkers("sin menciones aquí")).toEqual([
      { kind: "text", text: "sin menciones aquí" },
    ]);
  });
});

describe("detectAtQuery", () => {
  it("detecta un @ al final del texto sin espacio previo", () => {
    const result = detectAtQuery("hola @con", 9);
    expect(result).toEqual({ start: 5, query: "con" });
  });

  it("no detecta nada si el @ está pegado a otra palabra", () => {
    expect(detectAtQuery("correo@dominio", 14)).toBeNull();
  });

  it("no detecta nada si ya hay un espacio después del @", () => {
    expect(detectAtQuery("hola @ mundo", 12)).toBeNull();
  });

  it("no detecta nada si no hay @ antes del cursor", () => {
    expect(detectAtQuery("sin arroba", 5)).toBeNull();
  });
});

describe("insertMentionAt", () => {
  it("inserta el marker en la posición del @ detectado, reemplazando la query parcial", () => {
    const result = insertMentionAt("hola @con", 9, conversationMention);
    expect(result.text).toBe(`hola ${mentionMarker(conversationMention)} `);
  });

  it("inserta al cursor si no había un @ activo", () => {
    const result = insertMentionAt("hola ", 5, conversationMention);
    expect(result.text).toBe(`hola ${mentionMarker(conversationMention)} `);
  });
});

describe("resolveConversationId / findTarget", () => {
  const targets: MentionTarget[] = [
    {
      type: "conversation",
      targetId: "conv_1",
      label: "593998576466",
      customerName: "593998576466",
      conversationId: "conv_1",
    },
  ];

  it("una mención de tipo conversation resuelve directo a su targetId", () => {
    expect(resolveConversationId(conversationMention, targets)).toBe("conv_1");
  });

  it("una mención sin target conocido no resuelve conversationId", () => {
    const unknown: Mention = { type: "customer", targetId: "999", label: "?" };
    expect(resolveConversationId(unknown, targets)).toBeNull();
  });

  it("findTarget encuentra el target por type+targetId", () => {
    expect(findTarget(conversationMention, targets)).toEqual(targets[0]);
  });
});
