import React from "react";

interface Props {
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}

export const StateDiffViewer: React.FC<Props> = ({ before, after }) => {
  if (!before && !after) {
    return (
      <span className="text-muted-foreground text-xs italic">
        Sin cambios de estado registrados
      </span>
    );
  }

  const allKeys = Array.from(new Set([...Object.keys(before || {}), ...Object.keys(after || {})]));

  return (
    <div className="bg-slate-950/90 dark:bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs font-mono overflow-hidden shadow-xs">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-2 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
        <div>Estado Anterior (Before)</div>
        <div>Estado Nuevo (After)</div>
      </div>
      <div className="divide-y divide-slate-800/60 mt-2">
        {allKeys.map((key) => {
          const prevVal =
            before && before[key] !== undefined ? JSON.stringify(before[key], null, 1) : undefined;
          const nextVal =
            after && after[key] !== undefined ? JSON.stringify(after[key], null, 1) : undefined;
          const isChanged = prevVal !== nextVal;

          return (
            <div
              key={key}
              className={`grid grid-cols-1 sm:grid-cols-2 gap-3 py-2 px-1 rounded-md transition-colors ${
                isChanged ? "bg-amber-500/10 dark:bg-amber-500/5" : ""
              }`}
            >
              <div
                className={
                  prevVal !== undefined ? "text-red-400 break-all" : "text-slate-500 italic"
                }
              >
                <span className="text-slate-400 font-semibold">{key}: </span>
                {prevVal ?? "undefined"}
              </div>
              <div
                className={
                  nextVal !== undefined
                    ? "text-emerald-400 font-medium break-all"
                    : "text-slate-500 italic"
                }
              >
                <span className="text-slate-400 font-semibold">{key}: </span>
                {nextVal ?? "undefined"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
