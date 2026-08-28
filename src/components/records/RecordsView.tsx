"use client";

import { Award, Flame, Leaf, ListChecks, Sprout } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToday } from "@/hooks/useToday";
import { gardenTotals, habitRecord, weekdayRates } from "@/lib/records";
import { PlantArt } from "@/components/habits/PlantArt";
import { EmptyState } from "@/components/ui/EmptyState";
import { computeHabitHealth } from "@/lib/discipline";
import { useRestDays } from "@/components/rest/RestDaysProvider";
import { WEEKDAY_SHORT_LABELS } from "@/types";
import type { HabitWithCompletions, Task } from "@/types";

const WEEKDAY_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function StatTile({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Award;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-walnut-500/15 bg-parchment-paper p-4 shadow-soft">
      <p className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-charcoal-600/50 uppercase">
        <Icon size={12} strokeWidth={2} />
        {label}
      </p>
      <p className="mt-1 font-serif text-2xl text-canopy-950">{value}</p>
      {sub && <p className="mt-0.5 truncate text-xs text-charcoal-600/50">{sub}</p>}
    </div>
  );
}

export function RecordsView({ habits, tasks }: { habits: HabitWithCompletions[]; tasks: Task[] }) {
  const { now } = useToday();
  const restDays = useRestDays();

  if (habits.length === 0) {
    return (
      <div>
        <h1 className="font-serif text-3xl text-canopy-900">Records</h1>
        <p className="mt-1 text-sm text-charcoal-600">What your garden has managed so far.</p>
        <div className="mt-8 rounded-lg border border-walnut-500/15 bg-parchment-paper shadow-soft">
          <EmptyState icon={Sprout} message="Plant something and its records will grow here." />
        </div>
      </div>
    );
  }

  const totals = gardenTotals(habits, tasks, now, restDays);
  const records = habits.map((h) => habitRecord(h, now, restDays)).sort((a, b) => b.longest - a.longest || b.rate - a.rate);
  const weekdays = weekdayRates(habits, now, restDays);
  const bestWeekday = weekdays.reduce((a, b) => (b.scheduled > 0 && b.rate > a.rate ? b : a), weekdays[0]);
  const peakRate = Math.max(...weekdays.map((w) => w.rate), 1);

  return (
    <div>
      <h1 className="font-serif text-3xl text-canopy-900">Records</h1>
      <p className="mt-1 text-sm text-charcoal-600">What your garden has managed so far.</p>

      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          icon={Flame}
          label="Longest streak"
          value={`${totals.bestEverStreak}d`}
          sub={totals.bestEverHabit ?? undefined}
        />
        <StatTile icon={Leaf} label="Days tended" value={String(totals.daysTended)} />
        <StatTile icon={Sprout} label="Total waterings" value={String(totals.totalCompletions)} />
        <StatTile icon={ListChecks} label="Tasks finished" value={String(totals.tasksCompleted)} />
      </div>

      <section className="mt-10">
        <h2 className="mb-1 text-xs font-medium tracking-wide text-charcoal-600/60 uppercase">Your week</h2>
        <p className="mb-3 text-sm text-charcoal-600/70">
          {bestWeekday.scheduled > 0 ? (
            <>
              You show up most on <span className="text-canopy-900">{WEEKDAY_FULL[bestWeekday.weekday]}s</span> —{" "}
              {bestWeekday.rate}% of the time.
            </>
          ) : (
            "Not enough history yet to call a best day."
          )}
        </p>
        <div className="rounded-lg border border-walnut-500/15 bg-parchment-paper p-4 shadow-soft">
          <div className="flex items-end justify-between gap-2" style={{ height: 110 }}>
            {weekdays.map((w) => (
              <div key={w.weekday} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="text-[10px] tabular-nums text-charcoal-600/45">
                  {w.scheduled > 0 ? `${w.rate}%` : "–"}
                </span>
                <div
                  className="flex w-full items-end rounded-t-sm bg-canopy-800/6"
                  style={{ height: 70 }}
                  title={`${WEEKDAY_FULL[w.weekday]}: ${w.completed}/${w.scheduled} days`}
                >
                  <div
                    className={cn(
                      "w-full rounded-t-sm transition-all",
                      w.weekday === bestWeekday.weekday && w.scheduled > 0 ? "bg-moss-600" : "bg-moss-600/45"
                    )}
                    style={{ height: `${(w.rate / peakRate) * 100}%` }}
                  />
                </div>
                <span className="text-[11px] text-charcoal-600/60">{WEEKDAY_SHORT_LABELS[w.weekday]}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-xs font-medium tracking-wide text-charcoal-600/60 uppercase">Plant by plant</h2>
        <div className="overflow-hidden rounded-lg border border-walnut-500/15 bg-parchment-paper shadow-soft">
          <div className="flex items-center gap-3 border-b border-walnut-500/10 px-4 py-2 text-[11px] font-medium tracking-wide text-charcoal-600/45 uppercase">
            <span className="flex-1">Plant</span>
            <span className="w-20 text-right">Longest</span>
            <span className="w-20 text-right">Waterings</span>
            <span className="w-28 text-right">Consistency</span>
          </div>
          <div className="divide-y divide-walnut-500/8">
            {records.map((r) => (
              <div key={r.habit.id} className="flex items-center gap-3 px-4 py-2.5">
                <PlantArt
                  type={r.habit.plantType}
                  health={computeHabitHealth(r.habit, now, restDays)}
                  size={26}
                  className="shrink-0"
                />
                <span className="min-w-0 flex-1 truncate text-sm text-charcoal-800">
                  {r.habit.name}
                  {r.habit.archived && (
                    <span className="ml-2 rounded-full bg-charcoal-600/8 px-1.5 py-0.5 text-[10px] text-charcoal-600/50">
                      dormant
                    </span>
                  )}
                </span>
                <span className="w-20 text-right text-sm tabular-nums text-canopy-900">
                  {r.longest}
                  <span className="text-charcoal-600/40">d</span>
                </span>
                <span className="w-20 text-right text-sm tabular-nums text-charcoal-600/70">
                  {r.totalCompletions}
                </span>
                <span className="flex w-28 items-center justify-end gap-2">
                  <span className="h-1 w-14 overflow-hidden rounded-full bg-canopy-800/8">
                    <span className="block h-full rounded-full bg-moss-600" style={{ width: `${r.rate}%` }} />
                  </span>
                  <span className="w-8 text-right text-xs tabular-nums text-charcoal-600/60">{r.rate}%</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
