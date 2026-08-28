"use client";

import { useState } from "react";
import { CalendarDays, ListChecks, Plus } from "lucide-react";
import { api } from "@/lib/api-client";
import { dateKeyToDate, toDateKey } from "@/lib/dateKey";
import { expandEvents } from "@/lib/eventOccurrences";
import { useToday } from "@/hooks/useToday";
import { TaskRow } from "@/components/tasks/TaskRow";
import { EventRow } from "@/components/calendar/EventRow";
import { TextInput } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Event, Task } from "@/types";

/** The old Today page's task/event glance, minus habits (the garden above covers those now) and minus the aggregate tree (its signal now lives as the garden's ambient vibrancy instead). */
export function TodayPanel({ initialTasks, initialEvents }: { initialTasks: Task[]; initialEvents: Event[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [events] = useState(initialEvents);
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);

  const { today, now } = useToday();

  // Projects repeating events onto today rather than only matching seed rows.
  // Built from the day key, not by mutating `now` — that object is shared
  // state from useToday.
  const todayStart = dateKeyToDate(today);
  const todayEnd = new Date(todayStart);
  todayEnd.setHours(23, 59, 59, 999);
  const todaysEvents = expandEvents(events, todayStart, todayEnd);
  const overdueTasks = tasks.filter((t) => t.dueDate && toDateKey(new Date(t.dueDate)) < today);
  const dueTodayTasks = tasks.filter((t) => t.dueDate && toDateKey(new Date(t.dueDate)) === today);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      const task = await api.createTask({ title: newTitle.trim(), dueDate: now.toISOString() });
      setTasks((prev) => [...prev, task]);
      setNewTitle("");
    } finally {
      setAdding(false);
    }
  }

  async function handleToggle(task: Task) {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t)));
    const updated = await api.updateTask(task.id, { done: !task.done });
    setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)).filter((t) => !t.done));
  }

  async function handleDelete(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await api.deleteTask(id);
  }

  return (
    <div>
      {/* Overdue spans the full width — it's the one thing that should
          interrupt you rather than sit politely in a column. */}
      {overdueTasks.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 flex items-center gap-2 text-xs font-medium tracking-wide text-clay-500 uppercase">
            Overdue
            <span className="rounded-full bg-clay-500/12 px-1.5 text-[11px] tabular-nums">{overdueTasks.length}</span>
          </h2>
          <div className="rounded-lg border border-clay-500/20 bg-parchment-paper p-2 shadow-soft">
            {overdueTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={() => handleToggle(task)}
                onDelete={() => handleDelete(task.id)}
              />
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="flex flex-col">
          <h2 className="mb-2 text-xs font-medium tracking-wide text-charcoal-600/70 uppercase">On the calendar</h2>
          <div className="flex flex-1 flex-col rounded-lg border border-walnut-500/15 bg-parchment-paper p-2 shadow-soft">
            {todaysEvents.length === 0 ? (
              <div className="flex flex-1 items-center justify-center">
                <EmptyState icon={CalendarDays} message="Nothing on the calendar today." />
              </div>
            ) : (
              todaysEvents.map((occ) => (
                <EventRow key={occ.occurrenceKey} event={occ} onDelete={() => api.deleteEvent(occ.id)} />
              ))
            )}
          </div>
        </section>

        <section className="flex flex-col">
          <h2 className="mb-2 flex items-center gap-2 text-xs font-medium tracking-wide text-charcoal-600/70 uppercase">
            Due today
            {dueTodayTasks.length > 0 && (
              <span className="rounded-full bg-canopy-800/8 px-1.5 text-[11px] tabular-nums text-charcoal-600/60">
                {dueTodayTasks.length}
              </span>
            )}
          </h2>
          <div className="flex flex-1 flex-col rounded-lg border border-walnut-500/15 bg-parchment-paper p-2 shadow-soft">
            {dueTodayTasks.length === 0 ? (
              <div className="flex flex-1 items-center justify-center">
                <EmptyState icon={ListChecks} message="No tasks due today." />
              </div>
            ) : (
              <div className="flex-1">
                {dueTodayTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    showDueDate={false}
                    onToggle={() => handleToggle(task)}
                    onDelete={() => handleDelete(task.id)}
                  />
                ))}
              </div>
            )}
            <form onSubmit={handleAdd} className="flex items-center gap-2 border-t border-walnut-500/10 p-2 pt-3">
              <TextInput
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Add a task for today…"
                className="h-9"
              />
              <Button type="submit" size="sm" disabled={adding || !newTitle.trim()}>
                <Plus size={14} />
                Add
              </Button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
