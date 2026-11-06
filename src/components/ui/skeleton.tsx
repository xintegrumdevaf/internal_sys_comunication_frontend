import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md",
        "bg-slate-300/70 dark:bg-slate-700/60",
        "border border-slate-300/40 dark:border-slate-600/30",
        "after:absolute after:inset-0 after:-translate-x-full after:animate-shimmer",
        "after:bg-gradient-to-r after:from-transparent after:via-white/70 dark:after:via-white/15 after:to-transparent",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
