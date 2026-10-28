import React from "react";

export interface GoTicketLogoProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showSubtitle?: boolean;
  variant?: "full" | "mark" | "image";
}

/**
 * GoTicket Official Brand Logo Component
 * - Emerald/Teal Primary: #009778
 * - Dark Mode Gradient: #009778 -> #63C7B2 -> #FFFFFF (high contrast on dark navy)
 * - Light Mode Gradient: #009778 -> #028065 -> #030E20 (high contrast on light surfaces, avoiding washed out letters)
 * - Anti-clipping: inline-block + pr-2 on italic spans prevents glyph truncation
 */
export const GoTicketLogo: React.FC<GoTicketLogoProps> = ({
  className = "",
  size = "md",
  showSubtitle = false,
  variant = "full",
}) => {
  if (variant === "image") {
    const sizeClasses = {
      xs: "h-5",
      sm: "h-7",
      md: "h-10",
      lg: "h-14",
      xl: "h-20",
    };
    return (
      <img
        src="/goticket-logo.jpg"
        alt="GoTicket - Sistema de Comunicación Interna"
        className={`object-contain rounded-md ${sizeClasses[size]} ${className}`}
      />
    );
  }

  if (variant === "mark") {
    const markSizes = {
      xs: "size-6 text-[10px]",
      sm: "size-7 text-xs",
      md: "size-8 text-sm",
      lg: "size-10 text-base",
      xl: "size-14 text-xl",
    };

    return (
      <div
        className={`relative inline-flex items-center justify-center font-black tracking-tight rounded-xl bg-gradient-to-br from-[#009778] to-[#017A61] text-white shadow-xs select-none shrink-0 ${markSizes[size]} ${className}`}
        title="GoTicket"
      >
        <span className="font-extrabold italic tracking-tighter flex items-center">
          G
          <svg
            className="size-3.5 -ml-0.5 inline-block"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" fill="currentColor" stroke="none" />
            <path
              d="M10 8l4 4-4 4"
              stroke="#030E20"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </span>
      </div>
    );
  }

  const textSizes = {
    xs: "text-base",
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl",
    xl: "text-4xl",
  };

  const subtitleSizes = {
    xs: "text-[7px] tracking-[0.18em]",
    sm: "text-[8px] tracking-[0.2em]",
    md: "text-[10px] tracking-[0.24em]",
    lg: "text-[11px] tracking-[0.28em]",
    xl: "text-xs tracking-[0.3em]",
  };

  return (
    <div className={`inline-flex flex-col select-none leading-none shrink-0 ${className}`}>
      <div className={`font-black tracking-tight flex items-baseline ${textSizes[size]}`}>
        {/* "G" + arrow circle */}
        <span className="text-[#009778] font-black italic tracking-tighter flex items-center shrink-0">
          G
          <span className="inline-flex items-center justify-center size-[0.82em] bg-[#009778] rounded-full mx-[0.04em] relative top-[0.02em] shrink-0">
            <svg
              className="size-[0.55em] text-[#030E20]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="M12 5l7 7-7 7" />
            </svg>
          </span>
        </span>

        {/* "Ticket" with responsive high-contrast gradient and anti-clipping padding */}
        <span
          className="italic font-black tracking-tighter inline-block pr-2 ml-[0.04em] overflow-visible bg-gradient-to-r from-[#009778] via-[#028065] to-[#030E20] dark:from-[#009778] dark:via-[#63C7B2] dark:to-white bg-clip-text text-transparent"
          style={{
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Ticket
        </span>
      </div>

      {showSubtitle && (
        <span
          className={`font-semibold uppercase text-muted-foreground mt-1 text-center whitespace-nowrap ${subtitleSizes[size]}`}
        >
          Sistema de Comunicación Interna
        </span>
      )}
    </div>
  );
};
