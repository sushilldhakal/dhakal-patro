import { useTranslation } from "react-i18next";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { fetchSaitMonthAll, saitMonthAllKey } from "@/lib/api";
import { SAIT_CATEGORIES } from "@/lib/sait-data";
import { BS_MONTH_NAMES, BS_MONTHS_NE } from "@/lib/bs-calendar";
import { useLocale } from "@/i18n/locale";
import { patroEmpty } from "@/lib/patro-classes";
import { cn } from "@/lib/utils";

type Props = {
  /** BS year of the month the calendar is currently showing. */
  year: number;
  /** BS month (1–12) the calendar is currently showing. */
  month: number;
  /** Day to highlight (the selected calendar day), if it is auspicious. */
  highlightDay?: number;
};

/**
 * Home-aside saait: one row per ceremony type, each showing that ceremony's
 * auspicious days for the month the calendar is on (not the whole year). The
 * server computes just that month for all ceremonies in one call. Each row links
 * to the ceremony's /sait/$category page for the full yearly list.
 */
export function SaitAsidePanel({ year, month, highlightDay }: Props) {
  const { t } = useTranslation();
  const { pick, digits } = useLocale();

  const saitQ = useQuery({
    queryKey: saitMonthAllKey(year, month),
    queryFn: () => fetchSaitMonthAll(year, month),
    staleTime: 1000 * 60 * 60,
    placeholderData: keepPreviousData,
    retry: 1,
  });

  const cats = saitQ.data?.categories;
  const monthName = pick(BS_MONTHS_NE[month - 1], BS_MONTH_NAMES[month - 1]);
  const anyDates = cats ? Object.values(cats).some((d) => d.length > 0) : false;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold text-muted-foreground">{monthName}</p>

      {saitQ.isLoading && !saitQ.data ? (
        <div className="h-48 animate-pulse rounded-md bg-muted" />
      ) : saitQ.isError ? (
        <p className={patroEmpty}>{t("sait.no_data")}</p>
      ) : (
        <>
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {SAIT_CATEGORIES.map((cat) => {
              const days = cats?.[cat.id] ?? [];
              return (
                <li key={cat.id}>
                  <Link
                    to="/sait/$category"
                    params={{ category: cat.id }}
                    className="flex items-center gap-2 rounded-md bg-surface-inset px-2.5 py-2 text-sm leading-snug transition-colors hover:bg-surface-hover"
                  >
                    <span className="shrink-0 font-bold text-foreground">
                      {t(`sait.categories.${cat.id}`)}
                    </span>
                    <span className="font-num min-w-0 flex-1 text-right text-sm font-semibold text-foreground">
                      {days.length ? (
                        days.map((day, i) => {
                          const hl = highlightDay === day;
                          return (
                            <span key={day}>
                              {i > 0 ? ", " : ""}
                              <span
                                className={cn(
                                  hl && "font-extrabold text-accent underline underline-offset-2",
                                )}
                              >
                                {digits(day)}
                              </span>
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </span>
                    <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>

          {!anyDates ? (
            <p className={patroEmpty}>{t("sait.no_month_dates")}</p>
          ) : null}
        </>
      )}
    </div>
  );
}
