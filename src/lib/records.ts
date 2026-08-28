import { addDays } from "date-fns";
import { toDateKey } from "./dateKey";
import { completedKeys, habitStart, isScheduledDay, longestStreak } from "./streak";
import type { HabitWithCompletions, Task } from "@/types";

export interface HabitRecord {
  habit: HabitWithCompletions;
  longest: number;
  totalCompletions: number;
  scheduledDays: number;
  completedDays: number;
  rate: number;
}

export function habitRecord(
  habit: HabitWithCompletions,
  now: Date,
  restDays?: ReadonlySet<string>
): HabitRecord {
  const keys = completedKeys(habit);
  const start = habitStart(habit);
  const todayKey = toDateKey(now);

  let scheduledDays = 0;
  let completedDays = 0;

  // Excludes today — a day still in progress shouldn't drag the rate down.
  for (let cursor = start; toDateKey(cursor) < todayKey; cursor = addDays(cursor, 1)) {
    if (!isScheduledDay(habit.daysOfWeek, cursor, restDays)) continue;
    scheduledDays++;
    if (keys.has(toDateKey(cursor))) completedDays++;
  }

  return {
    habit,
    longest: longestStreak(habit, now, restDays),
    totalCompletions: habit.completions.reduce((sum, c) => sum + c.count, 0),
    scheduledDays,
    completedDays,
    rate: scheduledDays > 0 ? Math.round((completedDays / scheduledDays) * 100) : 0,
  };
}

export interface WeekdayRate {
  weekday: number;
  scheduled: number;
  completed: number;
  rate: number;
}

/**
 * Completion rate bucketed by day of week, pooled across every habit —
 * answers "which days do I actually show up?"
 */
export function weekdayRates(
  habits: HabitWithCompletions[],
  now: Date,
  restDays?: ReadonlySet<string>
): WeekdayRate[] {
  const scheduled = Array(7).fill(0) as number[];
  const completed = Array(7).fill(0) as number[];
  const todayKey = toDateKey(now);

  for (const habit of habits) {
    const keys = completedKeys(habit);
    for (let cursor = habitStart(habit); toDateKey(cursor) < todayKey; cursor = addDays(cursor, 1)) {
      if (!isScheduledDay(habit.daysOfWeek, cursor, restDays)) continue;
      const wd = cursor.getDay();
      scheduled[wd]++;
      if (keys.has(toDateKey(cursor))) completed[wd]++;
    }
  }

  return scheduled.map((s, weekday) => ({
    weekday,
    scheduled: s,
    completed: completed[weekday],
    rate: s > 0 ? Math.round((completed[weekday] / s) * 100) : 0,
  }));
}

export interface GardenTotals {
  plants: number;
  totalCompletions: number;
  daysTended: number;
  bestEverStreak: number;
  bestEverHabit: string | null;
  tasksCompleted: number;
}

export function gardenTotals(
  habits: HabitWithCompletions[],
  tasks: Task[],
  now: Date,
  restDays?: ReadonlySet<string>
): GardenTotals {
  const records = habits.map((h) => habitRecord(h, now, restDays));
  const best = records.reduce<HabitRecord | null>(
    (acc, r) => (acc === null || r.longest > acc.longest ? r : acc),
    null
  );

  // A day counts as "tended" if anything at all was logged on it.
  const tendedDays = new Set<string>();
  for (const habit of habits) {
    for (const c of habit.completions) tendedDays.add(toDateKey(new Date(c.date)));
  }

  return {
    plants: habits.length,
    totalCompletions: records.reduce((sum, r) => sum + r.totalCompletions, 0),
    daysTended: tendedDays.size,
    bestEverStreak: best?.longest ?? 0,
    bestEverHabit: best && best.longest > 0 ? best.habit.name : null,
    tasksCompleted: tasks.filter((t) => t.done).length,
  };
}
