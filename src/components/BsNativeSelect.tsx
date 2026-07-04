import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type BsNativeSelectOption = {
  value: number;
  label: string;
};

interface Props {
  value: number;
  options: BsNativeSelectOption[];
  onChange: (value: number) => void;
  ariaLabel: string;
  className?: string;
}

/** Native `<select>` overlay — opens iOS wheel picker on tap. */
export function BsNativeSelect({
  value,
  options,
  onChange,
  ariaLabel,
  className,
}: Props) {
  const selected = options.find((option) => option.value === value);

  return (
    <label className={cn("relative inline-flex shrink-0", className)}>
      <select
        value={value}
        aria-label={ariaLabel}
        onChange={(event) => onChange(Number(event.target.value))}
        className="patro-native-select absolute inset-0 z-[1] h-full w-full cursor-pointer opacity-0"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <span
        className="pointer-events-none flex h-7 w-full min-w-0 items-center justify-between gap-1 rounded-md border border-border bg-card px-1.5 text-[11px] font-medium text-foreground sm:text-xs"
        aria-hidden
      >
        <span className="truncate">{selected?.label ?? "—"}</span>
        <ChevronDown className="size-3 shrink-0 opacity-45" strokeWidth={2.25} />
      </span>
    </label>
  );
}
