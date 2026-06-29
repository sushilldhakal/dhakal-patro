import { cn } from "@/lib/utils";

/** Reference app-icon size from vedicpatro brand sheet */
export const PAGE_LOADER_SIZE = 120;

export function VedicPatroLoader({
  label = "लोड हुँदैछ…",
  size = PAGE_LOADER_SIZE,
  className,
}: {
  label?: string | null;
  size?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <img
        src="/loader.svg"
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-[22%] shadow-md"
        aria-hidden
      />
      {label ? <p className="text-sm text-muted-foreground">{label}</p> : null}
    </div>
  );
}
