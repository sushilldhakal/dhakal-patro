import { ChevronLeft, ChevronRight, HeartHandshake } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { LocationSelector } from "@/components/panchanga/LocationSelector";
import type { PanchangaLocation } from "@/components/panchanga/use-panchanga-location";
import { SaitDayCard } from "@/components/sait/SaitDayCard";
import { SaitRulesSection, type SaitRule } from "@/components/sait/SaitRulesSection";
import { PageHeader, PageShell } from "@/components/PageShell";
import { useLocale } from "@/i18n/locale";
import { BS_MONTH_NAMES } from "@/lib/bs-calendar";
import type { BratabandhaNakshatraMode, SaitDetailDay } from "@/lib/api";
import { cn } from "@/lib/utils";
import { patroMonthNavBtn } from "@/lib/patro-classes";

interface Props {
  title: string;
  subtitle: string;
  year: number;
  onYearChange: (year: number) => void;
  location: PanchangaLocation;
  onLocationChange: (loc: PanchangaLocation) => void;
  method?: { ne?: string; en?: string } | null;
  rules?: SaitRule[] | null;
  engineVersion?: string;
  /** Applied (ON) toggleable rule ids; enables per-rule switches when set. */
  enabledRuleIds?: Set<string> | null;
  onToggleRule?: (id: string, enabled: boolean) => void;
  rulesBusy?: boolean;
  /** Bratabandha nakṣatra tradition selector. */
  nakshatraMode?: BratabandhaNakshatraMode | null;
  onNakshatraModeChange?: (mode: BratabandhaNakshatraMode) => void;
  days?: SaitDetailDay[];
  loading: boolean;
  notice?: React.ReactNode;
  children?: React.ReactNode;
  emptyLabel?: { ne: string; en: string };
  countLabel?: (count: number, year: number) => { ne: string; en: string };
}

const NAKSHATRA_MODES: {
  id: BratabandhaNakshatraMode;
  ne: string;
  en: string;
}[] = [
  { id: "classical", ne: "शास्त्रीय", en: "Classical" },
  { id: "nepali", ne: "नेपाली पञ्चाङ्ग", en: "Nepali" },
  { id: "liberal", ne: "उदार", en: "Liberal" },
];

/**
 * Shared ceremonial sāit layout — page header, rules, year/location bar,
 * then month-grouped day cards. Uses the app's default 1400px shell width.
 */
export function SaitCeremonyLayout({
  title,
  subtitle,
  year,
  onYearChange,
  location,
  onLocationChange,
  method,
  rules,
  engineVersion,
  enabledRuleIds,
  onToggleRule,
  rulesBusy = false,
  nakshatraMode = null,
  onNakshatraModeChange,
  days = [],
  loading,
  notice,
  children,
  emptyLabel = {
    ne: "यस वर्ष कुनै शुभ मुहूर्त छैन।",
    en: "No auspicious muhūrta this year.",
  },
  countLabel,
}: Props) {
  const { pick, digits } = useLocale();

  const byMonth = useMemo(() => {
    const map = new Map<number, SaitDetailDay[]>();
    for (const d of days) {
      const list = map.get(d.bs_month) ?? [];
      list.push(d);
      map.set(d.bs_month, list);
    }
    return [...map.entries()].sort(([a], [b]) => a - b);
  }, [days]);

  const defaultCount = (count: number, y: number) => ({
    ne: `वि.सं. ${digits(y)} मा ${digits(count)} शुभ दिन`,
    en: `${digits(count)} auspicious days in BS ${digits(y)}`,
  });
  const countText = (countLabel ?? defaultCount)(days.length, year);

  let cardIndex = 0;

  return (
    <PageShell>
      <PageHeader
        icon={<HeartHandshake className="h-6 w-6 text-secondary" />}
        title={title}
        subtitle={subtitle}
      />

      <SaitRulesSection
        method={method}
        rules={rules}
        engineVersion={engineVersion}
        enabledRuleIds={enabledRuleIds}
        onToggleRule={onToggleRule}
        busy={rulesBusy}
      />

      {nakshatraMode && onNakshatraModeChange ? (
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
          <span className="text-sm font-medium text-foreground">
            {pick("नक्षत्र परम्परा", "Nakṣatra tradition")}
          </span>
          <div
            className="inline-flex flex-wrap gap-1 rounded-lg border border-border bg-card p-0.5"
            role="radiogroup"
            aria-label={pick("नक्षत्र परम्परा", "Nakṣatra tradition")}
          >
            {NAKSHATRA_MODES.map((m) => {
              const active = nakshatraMode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onNakshatraModeChange(m.id)}
                  className={cn(
                    "rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-surface-muted hover:text-foreground",
                  )}
                >
                  {pick(m.ne, m.en)}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2.5">
        <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-card p-0.5">
          <button
            type="button"
            onClick={() => onYearChange(year - 1)}
            className={patroMonthNavBtn}
            aria-label={pick("अघिल्लो वर्ष", "Previous year")}
          >
            <ChevronLeft size={16} />
          </button>
          <span className="min-w-[6.5rem] px-1 text-center text-sm font-bold tabular-nums text-foreground">
            {pick(`वि.सं. ${digits(year)}`, `BS ${digits(year)}`)}
          </span>
          <button
            type="button"
            onClick={() => onYearChange(year + 1)}
            className={patroMonthNavBtn}
            aria-label={pick("अर्को वर्ष", "Next year")}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {!loading && !children && days.length > 0 ? (
          <span className="text-sm text-muted-foreground">
            {pick(countText.ne, countText.en)}
          </span>
        ) : null}

        <div className="ml-auto flex min-w-0 items-center gap-1.5">
          <LocationSelector
            compact
            location={location}
            onLocationChange={onLocationChange}
            className="h-9 min-w-0 w-auto max-w-[13rem]"
          />
        </div>
      </div>

      {notice}

      <section aria-busy={loading} className="space-y-6">
        {children ? (
          children
        ) : loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-xl border border-border bg-surface-muted"
              />
            ))}
          </div>
        ) : days.length > 0 ? (
          byMonth.map(([month, monthDays]) => {
            const monthNe = monthDays[0]?.bs_month_name_ne;
            const monthEn = BS_MONTH_NAMES[month - 1] ?? monthNe;
            return (
              <div key={month} className="space-y-3">
                <div className="flex items-end justify-between gap-3">
                  <h2 className="m-0 text-lg font-bold text-foreground">
                    {pick(monthNe ?? "", monthEn ?? "")}
                  </h2>
                  <span className="text-sm text-muted-foreground">
                    {pick(
                      `${digits(monthDays.length)} दिन`,
                      `${digits(monthDays.length)} days`,
                    )}
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {monthDays.map((d) => {
                    const i = cardIndex++;
                    return (
                      <SaitDayCard
                        key={`${d.bs_month}-${d.bs_day}-${d.window_start}`}
                        d={d}
                        index={i}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })
        ) : (
          <p className="m-0 py-8 text-center text-sm text-muted-foreground">
            {pick(emptyLabel.ne, emptyLabel.en)}
          </p>
        )}
      </section>

      <p className="text-sm">
        <Link to="/panchanga/details" className="text-primary underline">
          {pick("← सबै शुभ मुहूर्त", "← All ceremonies")}
        </Link>
      </p>
    </PageShell>
  );
}

export default SaitCeremonyLayout;
