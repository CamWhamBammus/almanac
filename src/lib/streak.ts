import { addDays } from "date-fns";
import { effectiveNow, toDateKey } from "./dateKey";
import type { HabitWithCompletions } from "@/types";

/**
 * When a habit's history actually begins: normally its creation date, but
 * earlier if it has completions predating that (backfilled days, or a row
 * whose createdAt was refreshed). Counting from createdAt alone silently
 * discards real logged history.
 */
export function habitStart(habit: HabitWithCompletions): Date {
  const created = new Date(habit.createdAt);
  let earliest = created;
  for (const c of habit.completions) {
    const d = new Date(c.date);
    if (d < earliest) earliest = d;
  }
  return earliest;
}

/** null return means "every day" — the daysOfWeek column's stored meaning for empty/null. */
export function parseDaysOfWeek(daysOfWeek: string | null | undefined): Set<number> | null {
  if (!daysOfWeek) return null;
  return new Set(daysOfWeek.split(",").map(Number));
}

/**
 * A rest day counts as unscheduled: nothing was expected of you, so it can
 * neither break a streak nor drag a rate down. Every schedule-aware
 * calculation funnels through here, which is why rest days only had to be
 * taught to one function.
 */
export function isScheduledDay(
  daysOfWeek: string | null | undefined,
  date: Date,
  restDays?: ReadonlySet<string>
): boolean {
  if (restDays?.has(toDateKey(date))) return false;
  const days = parseDaysOfWeek(daysOfWeek);
  if (!days) return true;
  return days.has(date.getDay());
}

/**
 * Consecutive scheduled days completed, counting back from today.
 * Unscheduled days are skipped rather than breaking the streak. If today is
 * scheduled but not completed yet, counting starts from yesterday instead —
 * so a streak doesn't read as broken mid-day just because you haven't
 * checked in yet. `now` defaults to the real (unshifted) instant; callers
 * rendering during SSR should pass a hydration-safe value instead — see
 * useToday.
 */
export function currentStreak(
  completionDates: Date[],
  daysOfWeek: string | null | undefined = null,
  now: Date = effectiveNow(),
  restDays?: ReadonlySet<string>
): number {
  const keys = new Set(completionDates.map(toDateKey));
  const today = toDateKey(now);

  const cursor = new Date(now);
  if (isScheduledDay(daysOfWeek, cursor, restDays) && !keys.has(today)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  // Bounded so a habit with no scheduled days at all can't loop forever.
  for (let i = 0; i < 3650; i++) {
    if (isScheduledDay(daysOfWeek, cursor, restDays)) {
      if (keys.has(toDateKey(cursor))) {
        streak++;
      } else {
        break;
      }
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export type StreakIntensity = "spark" | "warm" | "hot" | "blazing";

export function streakIntensity(streak: number): StreakIntensity {
  if (streak >= 14) return "blazing";
  if (streak >= 7) return "hot";
  if (streak >= 3) return "warm";
  return "spark";
}

/** Day keys where the habit hit its full target. */
export function completedKeys(habit: HabitWithCompletions): Set<string> {
  return new Set(
    habit.completions.filter((c) => c.count >= habit.targetCount).map((c) => toDateKey(new Date(c.date)))
  );
}

/**
 * The longest run of consecutive *scheduled* days ever completed.
 * Unscheduled days are skipped rather than breaking the run — the same rule
 * currentStreak uses, so "longest" and "current" are comparable.
 */
export function longestStreak(
  habit: HabitWithCompletions,
  now: Date,
  restDays?: ReadonlySet<string>
): number {
  const keys = completedKeys(habit);
  const todayKey = toDateKey(now);

  let best = 0;
  let run = 0;

  for (let cursor = habitStart(habit); toDateKey(cursor) <= todayKey; cursor = addDays(cursor, 1)) {
    if (!isScheduledDay(habit.daysOfWeek, cursor, restDays)) continue;
    if (keys.has(toDateKey(cursor))) {
      run++;
      if (run > best) best = run;
    } else {
      // Today not being done yet isn't a miss — the day isn't over.
      if (toDateKey(cursor) === todayKey) break;
      run = 0;
    }
  }

  return best;
}
