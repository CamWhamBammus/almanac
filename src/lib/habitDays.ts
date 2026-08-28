import { addDays } from "date-fns";
import { toDateKey } from "./dateKey";
import { isScheduledDay } from "./streak";
import type { HabitWithCompletions } from "@/types";

export interface HabitDayTally {
  scheduled: number;
  done: number;
}

/**
 * Per-day "how much of the garden got tended" tally across [start, end].
 * Only days that actually asked something of you get an entry — a day with
 * no scheduled habits isn't a zero, it's simply absent, same reasoning the
 * discipline score uses for skipping unscheduled days.
 */
export function habitTallyByDay(
  habits: HabitWithCompletions[],
  start: Date,
  end: Date,
  restDays?: ReadonlySet<string>
): Map<string, HabitDayTally> {
  const completionMaps = habits.map(
    (h) => [h, new Map(h.completions.map((c) => [toDateKey(new Date(c.date)), c.count]))] as const
  );

  const out = new Map<string, HabitDayTally>();

  for (let cursor = start; cursor <= end; cursor = addDays(cursor, 1)) {
    const key = toDateKey(cursor);
    let scheduled = 0;
    let done = 0;

    for (const [habit, counts] of completionMaps) {
      if (new Date(habit.createdAt) > cursor) continue;
      if (!isScheduledDay(habit.daysOfWeek, cursor, restDays)) continue;
      scheduled++;
      if ((counts.get(key) ?? 0) >= habit.targetCount) done++;
    }

    if (scheduled > 0) out.set(key, { scheduled, done });
  }

  return out;
}
