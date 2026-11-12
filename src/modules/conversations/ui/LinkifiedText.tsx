import { ExternalLink, MapPin } from "lucide-react";

// eslint-disable-next-line react-refresh/only-export-components
export const URL_REGEX = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s]|(?:www\.)[^\s<]+[^<.,:;"')\]\s])/gi;

// eslint-disable-next-line react-refresh/only-export-components
export function isGoogleMapsUrl(url: string): boolean {
  return /maps\.google|maps\.app\.goo\.gl|goo\.gl\/maps|google\.[a-z.]+\/maps|waze\.com/i.test(url);
}

export interface LinkifiedTextProps {
  text: string;
  isOutgoing?: boolean;
  className?: string;
  showMapButton?: boolean;
}

export function LinkifiedText({
  text,
  isOutgoing = false,
  className = "whitespace-pre-wrap break-words",
  showMapButton = true,
}: LinkifiedTextProps) {
  if (!text) return null;

  const parts = text.split(URL_REGEX);
  const mapsUrls: string[] = [];

  const linkClass = isOutgoing
    ? "text-emerald-200 hover:text-white dark:text-emerald-300 dark:hover:text-emerald-100 underline underline-offset-2 break-all font-semibold inline-flex items-center gap-0.5 cursor-pointer transition-colors"
    : "text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 underline underline-offset-2 break-all font-semibold inline-flex items-center gap-0.5 cursor-pointer transition-colors";

  const renderedContent = parts.map((part, index) => {
    if (part.match(/^https?:\/\//i) || part.match(/^www\./i)) {
      const href =
        part.startsWith("http://") || part.startsWith("https://") ? part : `https://${part}`;
      const isMaps = isGoogleMapsUrl(part);
      if (isMaps && !mapsUrls.includes(href)) {
        mapsUrls.push(href);
      }

      return (
        <a
          key={index}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={linkClass}
          title={isMaps ? "Abrir mapa en Google Maps" : "Abrir enlace en pestaña nueva"}
        >
          {isMaps && <MapPin className="size-3.5 inline-block shrink-0 text-red-500 mr-0.5" />}
          <span>{part}</span>
          <ExternalLink className="size-3 inline-block shrink-0 opacity-75 ml-0.5" />
        </a>
      );
    }
    return <span key={index}>{part}</span>;
  });

  return (
    <div className="space-y-1.5 min-w-0 max-w-full">
      <p className={className}>{renderedContent}</p>
      {showMapButton && mapsUrls.length > 0 && (
        <div className="flex flex-col gap-1.5 pt-1">
          {mapsUrls.map((url, i) => (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 transition-all font-semibold text-xs shadow-xs group w-fit cursor-pointer"
            >
              <MapPin className="size-4 text-red-500 shrink-0 group-hover:scale-110 transition-transform animate-pulse" />
              <span className="truncate">Abrir ubicación en Google Maps</span>
              <ExternalLink className="size-3.5 opacity-70 group-hover:opacity-100 shrink-0" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
