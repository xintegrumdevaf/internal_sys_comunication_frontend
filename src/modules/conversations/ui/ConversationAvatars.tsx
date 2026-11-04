import { Bot, User, UserCheck } from "lucide-react";
import type { ConversationDto, MessageAuthor } from "@/modules/conversations/domain/conversation";
import { avatarColorFromSeed } from "@/shared/avatar-color";

export function initialsFromProfileName(name: string): string {
  const clean = name.replace(/[^\p{L}\p{N}\s]/gu, "").trim();
  const target = clean || name;
  const parts = target.trim().split(/\s+/).filter(Boolean);
  return (
    parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

/**
 * WhatsApp no permite obtener la foto de perfil vía la API oficial de Meta
 * (restricción de privacidad). Mostramos iniciales del nombre real cuando ya lo
 * conocemos; si no, un ícono genérico — nunca una foto inventada.
 */
export function ConversationAvatar({
  conversation,
  size = "size-11",
}: {
  conversation: Pick<ConversationDto, "waPhone" | "waProfileName"> & {
    customerName?: string | null;
  };
  size?: string;
}) {
  const color = avatarColorFromSeed(conversation.waPhone);
  const name = conversation.customerName?.trim() || conversation.waProfileName?.trim();
  return (
    <div
      className={`${size} rounded-full grid place-items-center shrink-0 font-bold text-sm ${color.bg} ${color.text}`}
    >
      {name ? initialsFromProfileName(name) : <User className="size-1/2" />}
    </div>
  );
}

/**
 * Avatar redondo por mensaje, como en los grupos de WhatsApp: quién habla se
 * identifica por un círculo con su inicial (o un ícono para el asistente),
 * nunca con un ícono suelto metido dentro de la burbuja.
 */
export function MessageAvatar({
  author,
  conversation,
  agentName,
}: {
  author: MessageAuthor;
  conversation: Pick<ConversationDto, "waPhone" | "waProfileName">;
  agentName?: string | null;
}) {
  if (author === "customer") {
    return <ConversationAvatar conversation={conversation} size="size-7" />;
  }
  if (author === "agent") {
    return (
      <div className="size-7 rounded-full grid place-items-center shrink-0 bg-primary/15 text-primary font-bold text-[10px]">
        {agentName ? initialsFromProfileName(agentName) : <UserCheck className="size-3.5" />}
      </div>
    );
  }
  return (
    <div className="size-7 rounded-full grid place-items-center shrink-0 bg-emerald-100 text-emerald-700">
      <Bot className="size-3.5" />
    </div>
  );
}
