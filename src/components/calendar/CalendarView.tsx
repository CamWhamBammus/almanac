"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { addMonths, endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/lib/api-client";
import { dateKeyToDate, toDateKey } from "@/lib/dateKey";
import { expandEvents, occurrencesByDay } from "@/lib/eventOccurrences";
import { habitTallyByDay } from "@/lib/habitDays";
import { useRestDays } from "@/components/rest/RestDaysProvider";
import { Button } from "@/components/ui/Button";
import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import { DayAgendaModal } from "@/components/calendar/DayAgendaModal";
import { EventEditModal, type EventEdits } from "@/components/calendar/EventEditModal";
import type { Event, HabitWithCompletions, Repeat, Task } from "@/types";

export function CalendarView({
  initialTasks,
  initialEvents,
  initialHabits,
  initialJournal,
}: {
  initialTasks: Task[];
  initialEvents: Event[];
  initialHabits: HabitWithCompletions[];
  initialJournal: Record<string, string>;
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [events, setEvents] = useState(initialEvents);
  const [habits, setHabits] = useState(initialHabits);
  const [journal, setJournal] = useState(initialJournal);
  // ?day=YYYY-MM-DD deep-links straight to a day — what search results use.
  const deepLinkDay = useSearchParams().get("day");
  const [month, setMonth] = useState(() => (deepLinkDay ? dateKeyToDate(deepLinkDay) : new Date()));
  const [selectedKey, setSelectedKey] = useState<string | null>(deepLinkDay);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const router = useRouter();
  const restDays = useRestDays();

  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      if (!task.dueDate || task.done) continue;
      const key = toDateKey(new Date(task.dueDate));
      map.set(key, [...(map.get(key) ?? []), task]);
    }
    return map;
  }, [tasks]);

  // Repeating events live as a single seed row and are projected across the
  // visible month at read time — see lib/eventOccurrences.ts. Padded a week
  // either side so the grid's leading/trailing days are covered too.
  const eventsByDay = useMemo(() => {
    const from = new Date(startOfMonth(month));
    from.setDate(from.getDate() - 7);
    const to = new Date(endOfMonth(month));
    to.setDate(to.getDate() + 7);
    return occurrencesByDay(expandEvents(events, from, to));
  }, [events, month]);

  const habitTally = useMemo(
    () => habitTallyByDay(habits, startOfMonth(month), endOfMonth(month), restDays),
    [habits, month, restDays]
  );

  const editingEvent = events.find((e) => e.id === editingEventId) ?? null;
  const selectedDate = selectedKey ? dateKeyToDate(selectedKey) : null;
  const selectedEvents = selectedKey ? (eventsByDay.get(selectedKey) ?? []) : [];
  const selectedTasks = selectedKey ? (tasksByDay.get(selectedKey) ?? []) : [];

  async function handleAddEvent(title: string, startTime: string, repeat: Repeat) {
    if (!selectedKey) return;
    const event = await api.createEvent({
      title,
      date: dateKeyToDate(selectedKey).toISOString(),
      startTime: startTime || undefined,
      repeat,
    });
    setEvents((prev) => [...prev, event]);
  }

  async function handleAddTask(title: string) {
    if (!selectedKey) return;
    const task = await api.createTask({ title, dueDate: dateKeyToDate(selectedKey).toISOString() });
    setTasks((prev) => [...prev, task]);
  }

  async function handleToggleTask(task: Task) {
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

  async function handleEditEvent(id: string, edits: EventEdits) {
    const updated = await api.updateEvent(id, edits);
    setEvents((prev) => prev.map((e) => (e.id === id ? updated : e)));
  }

  function handleJournalSaved(dateKey: string, body: string) {
    setJournal((prev) => {
      const next = { ...prev };
      if (body) next[dateKey] = body;
      else delete next[dateKey];
      return next;
    });
  }

  async function handleToggleRestDay(dateKey: string) {
    await api.toggleRestDay(dateKey);
    // Rest days change streaks, health and Growth everywhere, so pull the
    // whole tree fresh rather than patching local state.
    router.refresh();
  }

  /** Backfilling a day you forgot to log — the calendar's day view is the natural place for it. */
  async function handleToggleHabit(habit: HabitWithCompletions, dateKey: string) {
    const completions = await api.toggleHabitCompletion(habit.id, dateKey);
    setHabits((prev) => prev.map((h) => (h.id === habit.id ? { ...h, completions } : h)));
    // Backfilling here can cross a milestone too — refresh so the app-wide
    // unlock toast sees it.
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl text-canopy-900">{format(month, "MMMM yyyy")}</h1>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setMonth(new Date())}>
            Today
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setMonth((m) => subMonths(m, 1))} aria-label="Previous month">
            <ChevronLeft size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setMonth((m) => addMonths(m, 1))} aria-label="Next month">
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      <div className="mt-6">
        <CalendarGrid
          month={month}
          tasksByDay={tasksByDay}
          eventsByDay={eventsByDay}
          habitTally={habitTally}
          journalDays={new Set(Object.keys(journal))}
          selectedKey={selectedKey}
          onSelectDay={setSelectedKey}
        />
      </div>

      {selectedDate && (
        <DayAgendaModal
          open={!!selectedKey}
          onClose={() => setSelectedKey(null)}
          date={selectedDate}
          events={selectedEvents}
          tasks={selectedTasks}
          onAddEvent={handleAddEvent}
          onAddTask={handleAddTask}
          onToggleTask={handleToggleTask}
          onDeleteTask={handleDeleteTask}
          onDeleteEvent={handleDeleteEvent}
          onEditEvent={setEditingEventId}
          onToggleRestDay={handleToggleRestDay}
          journal={(selectedKey && journal[selectedKey]) || ""}
          onJournalSaved={handleJournalSaved}
          habits={habits}
          onToggleHabit={handleToggleHabit}
        />
      )}

      {editingEvent && (
        <EventEditModal
          key={editingEvent.id}
          event={editingEvent}
          open
          onClose={() => setEditingEventId(null)}
          onSave={(edits) => handleEditEvent(editingEvent.id, edits)}
        />
      )}
    </div>
  );
}
