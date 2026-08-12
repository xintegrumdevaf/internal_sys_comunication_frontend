import {
  cordialityBand,
  cordialityBandClass,
  cordialityBandLabel,
  type CordialityBand,
} from "@/modules/quality/domain/quality-review";

/** Semáforo de cordialidad ≥70 / 40–69 / &lt;40 (07_QUALITY_SUPERVISION.md §4). */
export function CordialityBadge({
  score,
  showScore = true,
  className = "",
}: {
  score: number | null | undefined;
  showScore?: boolean;
  className?: string;
}) {
  const band: CordialityBand = cordialityBand(score);
  const label = cordialityBandLabel(band);
  const scoreText =
    score === null || score === undefined || Number.isNaN(score) ? "—" : String(Math.round(score));

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-bold text-[10px] ring-1 ${cordialityBandClass(band)} ${className}`}
      title={label}
    >
      <span
        className={`size-1.5 rounded-full ${
          band === "ok"
            ? "bg-primary"
            : band === "attention"
              ? "bg-warning"
              : band === "critical"
                ? "bg-danger"
                : "bg-muted-foreground/40"
        }`}
        aria-hidden
      />
      {showScore ? (
        <>
          <span className="font-mono tabular-nums">{scoreText}</span>
          <span className="font-semibold opacity-80">{label}</span>
        </>
      ) : (
        <span>{label}</span>
      )}
    </span>
  );
}
