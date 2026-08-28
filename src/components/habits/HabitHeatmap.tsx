"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toDateKey } from "@/lib/dateKey";
import { useToday } from "@/hooks/useToday";
import { isScheduledDay } from "@/lib/streak";
import { useRestDays } from "@/components/rest/RestDaysProvider";
import { WEEKDAY_SHORT_LABELS } from "@/types";
import type { HabitCompletion } from "@/types";

const WEEKS = 12;
const TOTAL_DAYS = WEEKS * 7;
const ROW = 16;
const GAP = 4;

/** GitHub-style grid: 7 rows (Sun..Sat) x 12 columns, most recent week last. Columns stretch to fill the available width instead of a fixed cell size. */
export function HabitHeatmap({
  completions,
  daysOfWeek,
  targetCount,
}: {
  completions: HabitCompletion[];
  daysOfWeek: string | null;
  targetCount: number;
}) {
  const completedKeys = useMemo(
    () =>
      new Set(
        completions.filter((c) => c.count >= targetCount).map((c) => toDateKey(new Date(c.date)))
      ),
    [completions, targetCount]
  );
  const { today, now } = useToday();
  const restDays = useRestDays();

  const weeks = useMemo(() => {
    const end = new Date(now);
    end.setDate(end.getDate() + (6 - end.getDay())); // Saturday of the current week
    const start = new Date(end);
    start.setDate(start.getDate() - (TOTAL_DAYS - 1));

    const chunks: Date[][] = [];
    const cursor = new Date(start);
    for (let w = 0; w < WEEKS; w++) {
      const week: Date[] = [];
      for (let d = 0; d < 7; d++) {
        week.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
      chunks.push(week);
    }
    return chunks;
  }, [now]);

  const monthLabels = useMemo(() => {
    let lastMonth = -1;
    return weeks.map((week) => {
      const month = week[0].getMonth();
      if (month === lastMonth) return "";
      lastMonth = month;
      return format(week[0], "MMM");
    });
  }, [weeks]);

  const { completedCount, scheduledCount } = useMemo(() => {
    let completed = 0;
    let scheduled = 0;
    for (const week of weeks) {
      for (const day of week) {
        const key = toDateKey(day);
        if (key > today || !isScheduledDay(daysOfWeek, day, restDays)) continue;
        scheduled++;
        if (completedKeys.has(key)) completed++;
      }
    }
    return { completedCount: completed, scheduledCount: scheduled };
  }, [weeks, daysOfWeek, completedKeys, today, restDays]);

  const pct = scheduledCount > 0 ? Math.round((completedCount / scheduledCount) * 100) : null;
  const columns = `repeat(${WEEKS}, minmax(0, 1fr))`;

  return (
    <div className="flex w-full flex-col gap-2">
      <p className="text-xs text-charcoal-600/60">
        {scheduledCount === 0
          ? "No scheduled days yet in this window."
          : `${completedCount} of ${scheduledCount} scheduled days done in the last 12 weeks${pct !== null ? ` (${pct}%)` : ""}.`}
      </p>

      <div className="flex w-full gap-2">
        <div className="grid shrink-0" style={{ gridTemplateRows: `repeat(7, ${ROW}px)`, rowGap: GAP }}>
          {WEEKDAY_SHORT_LABELS.map((label, i) => (
            <span
              key={i}
              className="flex items-center text-[10px] leading-none text-charcoal-600/40"
              style={{ height: ROW }}
            >
              {label}
            </span>
          ))}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="grid" style={{ gridTemplateColumns: columns, columnGap: GAP }}>
            {monthLabels.map((label, i) => (
              <span key={i} className="text-[10px] leading-none text-charcoal-600/40">
                {label}
              </span>
            ))}
          </div>

          <div
            className="grid"
            style={{
              gridTemplateRows: `repeat(7, ${ROW}px)`,
              gridTemplateColumns: columns,
              gridAutoFlow: "column",
              gap: GAP,
            }}
          >
            {weeks.flat().map((day) => {
              const key = toDateKey(day);
              const future = key > today;
              const scheduled = isScheduledDay(daysOfWeek, day, restDays);
              const done = completedKeys.has(key);
              const status = future ? "upcoming" : done ? "done" : scheduled ? "missed" : "not scheduled";

              return (
                <div
                  key={key}
                  title={`${format(day, "MMM d")} — ${status}`}
                  className={cn(
                    "rounded-[3px]",
                    future && "bg-transparent",
                    !future && done && "bg-moss-600",
                    !future && !done && scheduled && "bg-clay-500/20",
                    !future && !done && !scheduled && "bg-charcoal-600/6"
                  )}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 text-[10px] text-charcoal-600/50">
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-[3px] bg-moss-600" />
          Done
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-[3px] bg-clay-500/20" />
          Missed
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-[3px] bg-charcoal-600/6" />
          Not scheduled
        </span>
      </div>
    </div>
  );
}
