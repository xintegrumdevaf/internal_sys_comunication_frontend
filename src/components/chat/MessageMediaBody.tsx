import type { MessageDto } from "@/adapters/http/dto";

type Props = {
  message: MessageDto;
  /** Extra classes for media elements (dark vs light chat themes). */
  mediaClassName?: string;
  captionClassName?: string;
};

/**
 * Renders inbound WhatsApp media via hub proxy (`mediaUrl`), with text fallback.
 */
export function MessageMediaBody({
  message,
  mediaClassName = "max-w-full rounded-md",
  captionClassName = "mt-1 whitespace-pre-wrap",
}: Props) {
  const caption = message.caption?.trim() || undefined;
  const showCaption =
    Boolean(caption) &&
    (message.type === "image" ||
      message.type === "video" ||
      message.type === "document");

  if (message.mediaUrl && message.type === "image") {
    return (
      <div>
        <img
          src={message.mediaUrl}
          alt={caption || "Imagen"}
          className={`${mediaClassName} max-h-72 object-contain`}
          loading="lazy"
        />
        {showCaption && <p className={captionClassName}>{caption}</p>}
      </div>
    );
  }

  if (message.mediaUrl && message.type === "audio") {
    return (
      <audio controls preload="metadata" src={message.mediaUrl} className="w-full max-w-xs">
        Tu navegador no soporta audio.
      </audio>
    );
  }

  if (message.mediaUrl && message.type === "video") {
    return (
      <div>
        <video
          controls
          preload="metadata"
          src={message.mediaUrl}
          className={`${mediaClassName} max-h-72`}
        >
          Tu navegador no soporta video.
        </video>
        {showCaption && <p className={captionClassName}>{caption}</p>}
      </div>
    );
  }

  if (message.mediaUrl && message.type === "document") {
    const label = message.filename || caption || "Documento";
    return (
      <div>
        <a
          href={message.mediaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 break-all"
        >
          {label}
        </a>
        {showCaption && caption !== label && (
          <p className={captionClassName}>{caption}</p>
        )}
      </div>
    );
  }

  return <p className="whitespace-pre-wrap">{message.body}</p>;
}
