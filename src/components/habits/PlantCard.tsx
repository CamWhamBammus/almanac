"use client";

import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { toDateKey } from "@/lib/dateKey";
import { useToday } from "@/hooks/useToday";
import { currentStreak, isScheduledDay } from "@/lib/streak";
import { computeHabitHealth, disciplineBand, DISCIPLINE_BAND_LABELS } from "@/lib/discipline";
import { PlantArt } from "@/components/habits/PlantArt";
import { useRestDays } from "@/components/rest/RestDaysProvider";
import type { HabitWithCompletions } from "@/types";

/** Stable per-habit "personality" — deterministic so a plant doesn't jitter to a new spot on every refetch. */
export function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function PlantCard({
  habit,
  archived,
  swayDelay,
  watered,
  onOpen,
  onQuickToggle,
  onMove,
  canMoveLeft,
  canMoveRight,
}: {
  habit: HabitWithCompletions;
  archived: boolean;
  swayDelay: number;
  watered: boolean;
  onOpen: () => void;
  onQuickToggle: () => void;
  /** Omitted for dormant plants, which aren't arrangeable. */
  onMove?: (direction: -1 | 1) => void;
  canMoveLeft?: boolean;
  canMoveRight?: boolean;
}) {
  const { today, now } = useToday();
  const restDays = useRestDays();
  const health = computeHabitHealth(habit, now, restDays);
  const band = disciplineBand(health);
  const todaysCount = habit.completions.find((c) => toDateKey(new Date(c.date)) === today)?.count ?? 0;
  const done = todaysCount >= habit.targetCount;
  // A habit that isn't scheduled today isn't "unwatered" — it's resting.
  // Prompting for it would read as failure on a deliberate rest day.
  const scheduledToday = isScheduledDay(habit.daysOfWeek, now, restDays);
  const streak = currentStreak(
    habit.completions.filter((c) => c.count >= habit.targetCount).map((c) => new Date(c.date)),
    habit.daysOfWeek,
    now,
    restDays
  );

  const hash = hashString(habit.id);
  const marginBottom = archived ? 0 : (hash % 5) * 3; // 0–12px stagger, planted rather than ruler-straight
  const scale = archived ? 1 : 0.94 + ((hash >> 4) % 5) * 0.03; // ~0.94–1.06

  return (
    <div
      className="group relative flex flex-col items-center gap-1"
      style={{ marginBottom, transform: `scale(${scale})`, transformOrigin: "50% 100%" }}
    >
      {onMove && (
        <div className="pointer-events-none absolute inset-x-0 top-10 z-20 flex justify-between opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => onMove(-1)}
            disabled={!canMoveLeft}
            aria-label={`Move ${habit.name} left`}
            className="pointer-events-auto flex h-6 w-6 items-center justify-center rounded-full border border-walnut-500/25 bg-parchment-paper/90 text-charcoal-600/60 shadow-soft transition-colors hover:text-moss-600 disabled:pointer-events-none disabled:opacity-0"
          >
            <ChevronLeft size={13} />
          </button>
          <button
            onClick={() => onMove(1)}
            disabled={!canMoveRight}
            aria-label={`Move ${habit.name} right`}
            className="pointer-events-auto flex h-6 w-6 items-center justify-center rounded-full border border-walnut-500/25 bg-parchment-paper/90 text-charcoal-600/60 shadow-soft transition-colors hover:text-moss-600 disabled:pointer-events-none disabled:opacity-0"
          >
            <ChevronRight size={13} />
          </button>
        </div>
      )}

      <button onClick={onOpen} className="relative flex flex-col items-center" aria-label={`Open ${habit.name}`}>
        {streak > 0 && !archived && (
          <span className="absolute -top-1 -right-1 z-10 flex items-center gap-0.5 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] text-amber-500 shadow-soft">
            <Flame size={10} strokeWidth={2} />
            {streak}
          </span>
        )}
        <PlantArt
          type={habit.plantType}
          health={health}
          size={112}
          sway={!archived}
          swayDelay={swayDelay}
          watered={watered}
          className={cn(archived && "grayscale")}
        />
      </button>

      <p className="max-w-[8.5rem] truncate font-serif text-[13px] text-canopy-900">{habit.name}</p>
      <p className="text-[10px] tracking-wide text-charcoal-600/45 uppercase">{DISCIPLINE_BAND_LABELS[band]}</p>

      {!archived &&
        (scheduledToday ? (
          <button
            onClick={onQuickToggle}
            aria-label={`${habit.name}: ${todaysCount} of ${habit.targetCount} today, ${done ? "tap to reset" : "tap to water it"}`}
            className={cn(
              "mt-0.5 flex h-6 min-w-6 items-center justify-center rounded-full border px-2 text-[11px] font-medium tabular-nums opacity-0 transition-opacity group-hover:opacity-100",
              done
                ? "border-moss-600 bg-moss-600 text-parchment-50 opacity-100"
                : "border-walnut-500/30 bg-parchment-paper text-charcoal-600/70 hover:border-moss-500 hover:text-moss-600"
            )}
          >
            {habit.targetCount > 1 ? `${todaysCount}/${habit.targetCount}` : done ? "Watered" : "Water it"}
          </button>
        ) : (
          <span className="mt-0.5 flex h-6 items-center px-2 text-[11px] text-charcoal-600/35">Resting</span>
        ))}
    </div>
  );
}
