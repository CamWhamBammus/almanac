"use client";

import { format } from "date-fns";
import { useToday } from "@/hooks/useToday";
import { SeasonalAccent } from "@/components/today/SeasonalAccent";
import { GardenSection } from "@/components/habits/GardenSection";
import { TodayPanel } from "@/components/home/TodayPanel";
import type { Event, HabitWithCompletions, Task } from "@/types";

export function HomeView({
  initialHabits,
  initialTasks,
  initialEvents,
  growthPoints,
}: {
  initialHabits: HabitWithCompletions[];
  initialTasks: Task[];
  initialEvents: Event[];
  growthPoints: number;
}) {
  const { now } = useToday();

  return (
    <div>
      <div className="flex items-center gap-2.5">
        <h1 className="font-serif text-3xl text-canopy-900">{format(now, "EEEE, MMMM d")}</h1>
        <SeasonalAccent />
      </div>
      <p className="mt-1 text-sm text-charcoal-600">Tend your garden, then see what else today holds.</p>

      <div className="mt-8">
        {/* Garden's vibrancy signal wants the full task history (done + open); TodayPanel only wants what's still open. */}
        <GardenSection
          initialHabits={initialHabits}
          tasks={initialTasks}
          growthPoints={growthPoints}
        />
      </div>

      <div className="mt-10">
        <TodayPanel initialTasks={initialTasks.filter((t) => !t.done)} initialEvents={initialEvents} />
      </div>
    </div>
  );
}
