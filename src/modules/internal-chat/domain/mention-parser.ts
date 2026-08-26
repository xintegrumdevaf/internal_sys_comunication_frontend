import type { Mention, MentionTarget, MentionType } from "./internal-chat";

/** Marker: @[Label](conversation:id) or @[Label](customer:contractId) */
const MENTION_RE = /@\[([^\]]+)\]\((conversation|customer):([^)]+)\)/g;

export function mentionMarker(mention: Mention): string {
  return `@[${mention.label}](${mention.type}:${mention.targetId})`;
}

export function parseMentionMarkers(
  body: string,
): Array<{ kind: "text"; text: string } | { kind: "mention"; mention: Mention }> {
  const parts: Array<{ kind: "text"; text: string } | { kind: "mention"; mention: Mention }> = [];
  let last = 0;
  const re = new RegExp(MENTION_RE.source, "g");
  let match: RegExpExecArray | null;
  while ((match = re.exec(body)) !== null) {
    if (match.index > last) {
      parts.push({ kind: "text", text: body.slice(last, match.index) });
    }
    parts.push({
      kind: "mention",
      mention: {
        label: match[1]!,
        type: match[2] as MentionType,
        targetId: match[3]!,
      },
    });
    last = match.index + match[0].length;
  }
  if (last < body.length) {
    parts.push({ kind: "text", text: body.slice(last) });
  }
  if (parts.length === 0) {
    parts.push({ kind: "text", text: body });
  }
  return parts;
}

export function detectAtQuery(
  text: string,
  caret: number,
): { start: number; query: string } | null {
  const before = text.slice(0, caret);
  const at = before.lastIndexOf("@");
  if (at < 0) return null;
  if (at > 0 && !/\s/.test(before[at - 1] ?? " ")) return null;
  const fragment = before.slice(at + 1);
  if (fragment.includes(" ") || fragment.includes("\n")) return null;
  return { start: at, query: fragment };
}

export function insertMentionAt(
  text: string,
  caret: number,
  mention: Mention,
): { text: string; caret: number; mention: Mention } {
  const detected = detectAtQuery(text, caret);
  const marker = mentionMarker(mention) + " ";
  if (!detected) {
    const next = `${text.slice(0, caret)}${marker}${text.slice(caret)}`;
    return { text: next, caret: caret + marker.length, mention };
  }
  const next = `${text.slice(0, detected.start)}${marker}${text.slice(caret)}`;
  return { text: next, caret: detected.start + marker.length, mention };
}

export function resolveConversationId(mention: Mention, targets: MentionTarget[]): string | null {
  if (mention.type === "conversation") return mention.targetId;
  const hit =
    targets.find(
      (t) => t.type === "customer" && t.targetId === mention.targetId && t.conversationId,
    ) ?? targets.find((t) => t.contractId === mention.targetId && t.conversationId);
  return hit?.conversationId ?? null;
}

export function findTarget(mention: Mention, targets: MentionTarget[]): MentionTarget | undefined {
  return (
    targets.find((t) => t.type === mention.type && t.targetId === mention.targetId) ??
    targets.find((t) => t.targetId === mention.targetId)
  );
}
