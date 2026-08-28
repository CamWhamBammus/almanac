"use client";

import { useMemo, useState } from "react";
import { addDays, format } from "date-fns";
import { toDateKey } from "@/lib/dateKey";
import { isScheduledDay } from "@/lib/streak";
import { computeHabitHealth } from "@/lib/discipline";
import { expandEvents, occurrencesByDay } from "@/lib/eventOccurrences";
import { useToday } from "@/hooks/useToday";
import { api } from "@/lib/api-client";
import { TaskRow } from "@/components/tasks/TaskRow";
import { EventRow } from "@/components/calendar/EventRow";
import { PlantArt } from "@/components/habits/PlantArt";
import { useRestDays } from "@/components/rest/RestDaysProvider";
import type { Event, HabitWithCompletions, Task } from "@/types";

export function WeekView({
  weekStart,
  initialOverdueTasks,
  initialWeekTasks,
  initialWeekEvents,
  habits,
}: {
  weekStart: string;
  initialOverdueTasks: Task[];
  initialWeekTasks: Task[];
  initialWeekEvents: Event[];
  habits: HabitWithCompletions[];
}) {
  const [tasks, setTasks] = useState(() => [...initialOverdueTasks, ...initialWeekTasks]);
  const [events, setEvents] = useState(initialWeekEvents);
  const { now } = useToday();
  const restDays = useRestDays();

  const start = useMemo(() => new Date(weekStart), [weekStart]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(start, i)), [start]);
  const overdueIds = useMemo(() => new Set(initialOverdueTasks.map((t) => t.id)), [initialOverdueTasks]);

  const overdueTasks = tasks.filter((t) => overdueIds.has(t.id) && !t.done);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      if (overdueIds.has(task.id) || !task.dueDate) continue;
      const key = toDateKey(new Date(task.dueDate));
      map.set(key, [...(map.get(key) ?? []), task]);
    }
    return map;
  }, [tasks, overdueIds]);

  // Repeating events are seed rows projected across the week — see
  // lib/eventOccurrences.ts.
  const eventsByDay = useMemo(
    () => occurrencesByDay(expandEvents(events, weekDays[0], addDays(weekDays[6], 1))),
    [events, weekDays]
  );

  async function handleToggleTask(task: Task) {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t)));
    const updated = await api.updateTask(task.id, { done: !task.done });
    setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
  }

  async function handleDeleteTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await api.deleteTask(id);
  }

  async function handleDeleteEvent(id: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    await api.deleteEvent(id);
  }

  return (
    <div>
      <h1 className="font-serif text-3xl text-canopy-900">Week of {format(start, "MMMM d")}</h1>
      <p className="mt-1 text-sm text-charcoal-600">A look back and ahead, all at once.</p>

      {overdueTasks.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 text-xs font-medium tracking-wide text-clay-500 uppercase">Overdue</h2>
          <div className="rounded-lg border border-clay-500/20 bg-parchment-paper p-2 shadow-soft">
            {overdueTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={() => handleToggleTask(task)}
                onDelete={() => handleDeleteTask(task.id)}
              />
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="mb-2 text-xs font-medium tracking-wide text-charcoal-600/70 uppercase">This week</h2>
        <div className="flex flex-col gap-3">
          {weekDays.map((day) => {
            const key = toDateKey(day);
            const dayTasks = tasksByDay.get(key) ?? [];
            const dayEvents = eventsByDay.get(key) ?? [];

            if (dayTasks.length === 0 && dayEvents.length === 0) {
              return (
                <div
                  key={key}
                  className="flex items-center gap-3 rounded-lg border border-walnut-500/10 bg-parchment-paper/60 px-3 py-2"
                >
                  <span className="w-24 shrink-0 text-xs font-medium text-charcoal-600/50">
                    {format(day, "EEE, MMM d")}
                  </span>
                  <span className="text-sm text-charcoal-600/35">Nothing planned.</span>
                </div>
              );
            }

            return (
              <div key={key} className="rounded-lg border border-walnut-500/15 bg-parchment-paper p-2 shadow-soft">
                <div className="px-2 py-1 text-xs font-medium tracking-wide text-charcoal-600/70 uppercase">
                  {format(day, "EEEE, MMM d")}
                </div>
                {dayEvents.map((occ) => (
                  <EventRow key={occ.occurrenceKey} event={occ} onDelete={() => handleDeleteEvent(occ.id)} />
                ))}
                {dayTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    showDueDate={false}
                    onToggle={() => handleToggleTask(task)}
                    onDelete={() => handleDeleteTask(task.id)}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </section>

      {habits.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 text-xs font-medium tracking-wide text-charcoal-600/70 uppercase">Habit consistency</h2>
          <div className="flex flex-col gap-2 rounded-lg border border-walnut-500/15 bg-parchment-paper p-3 shadow-soft">
            {habits.map((habit) => {
              const scheduledDays = weekDays.filter((d) => isScheduledDay(habit.daysOfWeek, d, restDays));
              const scheduledKeys = new Set(scheduledDays.map(toDateKey));
              const completedInWeek = habit.completions.filter(
                (c) => c.count >= habit.targetCount && scheduledKeys.has(toDateKey(new Date(c.date)))
              ).length;
              const total = scheduledDays.length;
              const pct = total > 0 ? Math.min(100, Math.round((completedInWeek / total) * 100)) : 0;

              return (
                <div key={habit.id} className="flex items-center gap-3">
                  <PlantArt type={habit.plantType} health={computeHabitHealth(habit, now, restDays)} size={28} className="shrink-0" />
                  <span className="w-28 shrink-0 truncate text-sm text-charcoal-800">{habit.name}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-canopy-800/8">
                    <div className="h-full rounded-full bg-moss-600" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-12 shrink-0 text-right text-xs text-charcoal-600/60">
                    {completedInWeek}/{total}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
