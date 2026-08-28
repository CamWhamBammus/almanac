"use client";

import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { cn } from "@/lib/utils";
import { toDateKey } from "@/lib/dateKey";
import { useToday } from "@/hooks/useToday";
import { useRestDays } from "@/components/rest/RestDaysProvider";
import { Moon, NotebookPen } from "lucide-react";
import type { EventOccurrence } from "@/lib/eventOccurrences";
import type { HabitDayTally } from "@/lib/habitDays";
import type { Task } from "@/types";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarGrid({
  month,
  tasksByDay,
  eventsByDay,
  habitTally,
  journalDays,
  selectedKey,
  onSelectDay,
}: {
  month: Date;
  tasksByDay: Map<string, Task[]>;
  eventsByDay: Map<string, EventOccurrence[]>;
  habitTally: Map<string, HabitDayTally>;
  journalDays: Set<string>;
  selectedKey: string | null;
  onSelectDay: (key: string) => void;
}) {
  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
  const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });

  const days: Date[] = [];
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) {
    days.push(d);
  }

  const { today } = useToday();
  const restDays = useRestDays();

  return (
    <div className="overflow-hidden rounded-lg border border-walnut-500/15 bg-parchment-paper shadow-soft">
      <div className="grid grid-cols-7 border-b border-walnut-500/10">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="px-2 py-2 text-center text-xs font-medium tracking-wide text-charcoal-600/60">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = toDateKey(day);
          const inMonth = isSameMonth(day, month);
          const dayTasks = tasksByDay.get(key) ?? [];
          const dayEvents = eventsByDay.get(key) ?? [];
          const tally = habitTally.get(key);
          const resting = restDays.has(key);
          const hasNote = journalDays.has(key);
          const isFuture = key > today;
          const isToday = key === today;
          const isSelected = key === selectedKey;
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;

          return (
            <button
              key={key}
              onClick={() => onSelectDay(key)}
              className={cn(
                "relative flex min-h-24 flex-col items-start gap-1 border-b border-r border-walnut-500/8 p-2 text-left transition-colors last:border-r-0",
                "hover:bg-canopy-800/5",
                isWeekend && inMonth && "bg-tan-400/[0.06]",
                !inMonth && "bg-charcoal-600/[0.03]",
                isSelected && "bg-moss-600/10",
                resting && "bg-sage-400/[0.14]",
                isToday && "ring-1 ring-inset ring-moss-500/30"
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs",
                  isToday && "bg-moss-600 text-parchment-50 font-semibold",
                  !isToday && inMonth && "text-charcoal-800",
                  !isToday && !inMonth && "text-charcoal-600/35"
                )}
              >
                {format(day, "d")}
              </span>

              {hasNote && (
                <span
                  className={cn("absolute text-walnut-500/60", resting ? "top-2 right-6" : "top-2 right-2")}
                  title="Has a journal note"
                >
                  <NotebookPen size={11} strokeWidth={2} />
                </span>
              )}

              {resting && (
                <span
                  className="absolute top-2 right-2 text-sage-400"
                  title="Rest day — habits don't count against you"
                >
                  <Moon size={11} strokeWidth={2} />
                </span>
              )}

              <div className="flex w-full flex-col gap-1">
                {dayEvents.slice(0, 2).map((event) => (
                  <span
                    key={event.occurrenceKey}
                    className="truncate rounded bg-sage-400/20 px-1.5 py-0.5 text-[11px] text-canopy-900"
                  >
                    {event.title}
                  </span>
                ))}
                {dayTasks.length > 0 && (
                  <span className="truncate rounded bg-tan-400/25 px-1.5 py-0.5 text-[11px] text-walnut-700">
                    {dayTasks.length} task{dayTasks.length > 1 ? "s" : ""}
                  </span>
                )}
                {dayEvents.length > 2 && (
                  <span className="text-[11px] text-charcoal-600/50">+{dayEvents.length - 2} more</span>
                )}
              </div>

              {/* How much of the garden got tended that day — the same signal
                  the plants grow from, read at a glance across the month. */}
              {tally && !isFuture && (
                <div
                  className="mt-auto flex w-full items-center gap-1 pt-1"
                  title={`${tally.done}/${tally.scheduled} habits done`}
                >
                  <span className="h-1 flex-1 overflow-hidden rounded-full bg-canopy-800/8">
                    <span
                      className={cn(
                        "block h-full rounded-full",
                        tally.done === tally.scheduled ? "bg-moss-600" : "bg-moss-600/50"
                      )}
                      style={{ width: `${(tally.done / tally.scheduled) * 100}%` }}
                    />
                  </span>
                  <span className="shrink-0 text-[9px] tabular-nums text-charcoal-600/40">
                    {tally.done}/{tally.scheduled}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
