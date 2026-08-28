"use client";

import { Flame, Sprout } from "lucide-react";
import { cn } from "@/lib/utils";
import { toDateKey } from "@/lib/dateKey";
import { useToday } from "@/hooks/useToday";
import { currentStreak, isScheduledDay } from "@/lib/streak";
import { computeHabitHealth } from "@/lib/discipline";
import { useRestDays } from "@/components/rest/RestDaysProvider";
import type { HabitWithCompletions } from "@/types";

/** A quiet one-line overview above the garden — how many plants, how many watered today, the best streak going. */
export function GardenStats({ habits }: { habits: HabitWithCompletions[] }) {
  const { today, now } = useToday();
  const restDays = useRestDays();

  if (habits.length === 0) return null;

  // Only habits actually scheduled today belong in the daily ratio —
  // counting rest days would make a fully-tended day read as a partial one.
  const dueToday = habits.filter((h) => isScheduledDay(h.daysOfWeek, now, restDays));
  const wateredToday = dueToday.filter(
    (h) => (h.completions.find((c) => toDateKey(new Date(c.date)) === today)?.count ?? 0) >= h.targetCount
  ).length;

  const thriving = habits.filter((h) => computeHabitHealth(h, now, restDays) >= 80).length;

  const bestStreak = habits.reduce((max, h) => {
    const streak = currentStreak(
      h.completions.filter((c) => c.count >= h.targetCount).map((c) => new Date(c.date)),
      h.daysOfWeek,
      now,
      restDays
    );
    return Math.max(max, streak);
  }, 0);

  return (
    <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-charcoal-600/70">
      <span className="flex items-center gap-1.5">
        <Sprout size={14} className="text-moss-600" strokeWidth={2} />
        {habits.length} plant{habits.length === 1 ? "" : "s"}
      </span>
      <span className="text-charcoal-600/30">·</span>
      <span className={cn(dueToday.length > 0 && wateredToday === dueToday.length && "text-moss-600")}>
        {dueToday.length === 0 ? "all resting today" : `${wateredToday}/${dueToday.length} watered today`}
      </span>
      {thriving > 0 && (
        <>
          <span className="text-charcoal-600/30">·</span>
          <span>
            {thriving} thriving
          </span>
        </>
      )}
      {bestStreak > 0 && (
        <>
          <span className="text-charcoal-600/30">·</span>
          <span className="flex items-center gap-1">
            <Flame size={13} className="text-amber-500" strokeWidth={2} />
            {bestStreak}-day best streak
          </span>
        </>
      )}
    </div>
  );
}
