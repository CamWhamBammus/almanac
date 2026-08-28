import { addDays } from "date-fns";
import { toDateKey } from "./dateKey";
import { isScheduledDay } from "./streak";
import type { HabitWithCompletions, Task } from "@/types";

export type DisciplineBand = "withering" | "struggling" | "budding" | "flourishing" | "thriving";

export const DISCIPLINE_BAND_LABELS: Record<DisciplineBand, string> = {
  withering: "Withering",
  struggling: "Struggling",
  budding: "Budding",
  flourishing: "Flourishing",
  thriving: "Thriving",
};

export function disciplineBand(score: number): DisciplineBand {
  if (score < 20) return "withering";
  if (score < 40) return "struggling";
  if (score < 60) return "budding";
  if (score < 80) return "flourishing";
  return "thriving";
}

const LOOKBACK_DAYS = 60;
// Smoothing factor for the rolling average — big enough that a good week
// visibly moves the needle, small enough that one bad day doesn't wipe out
// a month of consistency.
const ALPHA = 0.12;
const SEED_SCORE = 50;

/**
 * A rolling sense of "how consistently are you actually showing up,"
 * blended day by day from habit completion and task completion. Only days
 * that asked something of you (a scheduled habit, a task due) move the
 * score — a quiet weekend with nothing due neither grows nor shrinks it.
 * Stops at yesterday, not today, for the same reason currentStreak does:
 * so the score doesn't read as "worse" every morning before you've had a
 * chance to do anything.
 */
export function computeDisciplineScore(
  habits: HabitWithCompletions[],
  tasks: Task[],
  now: Date = new Date(),
  restDays?: ReadonlySet<string>
): number {
  const activeHabits = habits.filter((h) => !h.archived);

  const completionMaps = new Map(
    activeHabits.map((h) => [h.id, new Map(h.completions.map((c) => [toDateKey(new Date(c.date)), c.count]))])
  );

  const tasksByDay = new Map<string, Task[]>();
  for (const t of tasks) {
    if (!t.dueDate) continue;
    const key = toDateKey(new Date(t.dueDate));
    tasksByDay.set(key, [...(tasksByDay.get(key) ?? []), t]);
  }

  let score = SEED_SCORE;
  const todayKey = toDateKey(now);
  let cursor = addDays(now, -LOOKBACK_DAYS);

  while (toDateKey(cursor) < todayKey) {
    const key = toDateKey(cursor);
    const ratios: number[] = [];

    let scheduled = 0;
    let completed = 0;
    for (const h of activeHabits) {
      if (new Date(h.createdAt) > cursor) continue;
      if (!isScheduledDay(h.daysOfWeek, cursor, restDays)) continue;
      scheduled++;
      if ((completionMaps.get(h.id)?.get(key) ?? 0) >= h.targetCount) completed++;
    }
    if (scheduled > 0) ratios.push(completed / scheduled);

    const dueTasks = tasksByDay.get(key) ?? [];
    if (dueTasks.length > 0) {
      ratios.push(dueTasks.filter((t) => t.done).length / dueTasks.length);
    }

    if (ratios.length > 0) {
      const dayRatio = ratios.reduce((a, b) => a + b, 0) / ratios.length;
      score = score * (1 - ALPHA) + dayRatio * 100 * ALPHA;
    }

    cursor = addDays(cursor, 1);
  }

  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * Same rolling-average shape as computeDisciplineScore, but scoped to one
 * habit's own completion history — this is what each plant in the garden
 * grows or wilts against. Unscheduled days don't move it either way, same
 * reasoning as isScheduledDay elsewhere: a rest day isn't a missed day.
 */
export function computeHabitHealth(
  habit: HabitWithCompletions,
  now: Date = new Date(),
  restDays?: ReadonlySet<string>
): number {
  const completions = new Map(habit.completions.map((c) => [toDateKey(new Date(c.date)), c.count]));

  let score = SEED_SCORE;
  const todayKey = toDateKey(now);
  let cursor = addDays(now, -LOOKBACK_DAYS);
  const createdAt = new Date(habit.createdAt);

  while (toDateKey(cursor) < todayKey) {
    if (createdAt <= cursor && isScheduledDay(habit.daysOfWeek, cursor, restDays)) {
      const key = toDateKey(cursor);
      const ratio = Math.min(1, (completions.get(key) ?? 0) / habit.targetCount);
      score = score * (1 - ALPHA) + ratio * 100 * ALPHA;
    }
    cursor = addDays(cursor, 1);
  }

  return Math.round(Math.max(0, Math.min(100, score)));
}
