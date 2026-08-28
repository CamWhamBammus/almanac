"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarDays, Check, ListChecks, Moon, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { toDateKey } from "@/lib/dateKey";
import { isScheduledDay } from "@/lib/streak";
import { Modal } from "@/components/ui/Modal";
import { Select, TextInput } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { TaskRow } from "@/components/tasks/TaskRow";
import { EventRow } from "@/components/calendar/EventRow";
import { PlantArt } from "@/components/habits/PlantArt";
import { JournalField } from "@/components/journal/JournalField";
import { useRestDays } from "@/components/rest/RestDaysProvider";
import { REPEAT_LABELS, REPEAT_ORDER } from "@/types";
import type { Event, HabitWithCompletions, Repeat, Task } from "@/types";

export function DayAgendaModal({
  open,
  onClose,
  date,
  events,
  tasks,
  onAddEvent,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onDeleteEvent,
  onEditEvent,
  onToggleRestDay,
  journal,
  onJournalSaved,
  habits,
  onToggleHabit,
}: {
  open: boolean;
  onClose: () => void;
  date: Date;
  events: Event[];
  tasks: Task[];
  habits: HabitWithCompletions[];
  onToggleHabit: (habit: HabitWithCompletions, dateKey: string) => void;
  onAddEvent: (title: string, startTime: string, repeat: Repeat) => void;
  onAddTask: (title: string) => void;
  onToggleTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onDeleteEvent: (id: string) => void;
  onEditEvent?: (id: string) => void;
  onToggleRestDay: (dateKey: string) => void;
  journal: string;
  onJournalSaved: (dateKey: string, body: string) => void;
}) {
  const [eventTitle, setEventTitle] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventRepeat, setEventRepeat] = useState<Repeat>("NONE");
  const [taskTitle, setTaskTitle] = useState("");

  function submitEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!eventTitle.trim()) return;
    onAddEvent(eventTitle.trim(), eventTime, eventRepeat);
    setEventTitle("");
    setEventTime("");
    setEventRepeat("NONE");
  }

  function submitTask(e: React.FormEvent) {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    onAddTask(taskTitle.trim());
    setTaskTitle("");
  }

  const restDays = useRestDays();
  const dayKey = toDateKey(date);
  const resting = restDays.has(dayKey);
  const scheduledHabits = habits.filter((h) => isScheduledDay(h.daysOfWeek, date, restDays) && new Date(h.createdAt) <= date);

  return (
    <Modal open={open} onClose={onClose} title={format(date, "EEEE, MMMM d")} width="lg">
      <div className="flex flex-col gap-6">
        <button
          onClick={() => onToggleRestDay(dayKey)}
          className={cn(
            "flex items-center gap-2.5 rounded-md border px-3 py-2 text-left text-sm transition-colors",
            resting
              ? "border-sage-400/40 bg-sage-400/10 text-canopy-900"
              : "border-walnut-500/15 text-charcoal-600/70 hover:bg-canopy-800/5"
          )}
        >
          <Moon size={15} className={resting ? "text-sage-400" : "text-charcoal-600/40"} strokeWidth={1.75} />
          <span className="flex-1">
            {resting ? "Resting — this day doesn't count against you" : "Mark as a rest day"}
          </span>
          <span className="text-xs text-charcoal-600/45">{resting ? "Undo" : "Away or ill?"}</span>
        </button>
        <div>
          <h3 className="mb-2 text-xs font-medium tracking-wide text-charcoal-600/70 uppercase">Events</h3>
          <div className="rounded-md border border-walnut-500/12">
            {events.length === 0 ? (
              <EmptyState icon={CalendarDays} message="No events yet." />
            ) : (
              events.map((event) => (
                <EventRow
                  key={event.id}
                  event={event}
                  onDelete={() => onDeleteEvent(event.id)}
                  onEdit={onEditEvent ? () => onEditEvent(event.id) : undefined}
                />
              ))
            )}
          </div>
          <form onSubmit={submitEvent} className="mt-2 flex items-center gap-2">
            <TextInput
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              placeholder="Add an event…"
              className="h-9"
            />
            <TextInput
              type="time"
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
              className="h-9 w-28"
            />
            <Select
              value={eventRepeat}
              onChange={(e) => setEventRepeat(e.target.value as Repeat)}
              className="h-9 w-36"
              aria-label="Repeats"
            >
              {REPEAT_ORDER.map((r) => (
                <option key={r} value={r}>
                  {REPEAT_LABELS[r]}
                </option>
              ))}
            </Select>
            <Button type="submit" size="sm" variant="secondary" disabled={!eventTitle.trim()}>
              <Plus size={14} />
            </Button>
          </form>
        </div>

        {scheduledHabits.length > 0 && (
          <div>
            <h3 className="mb-2 text-xs font-medium tracking-wide text-charcoal-600/70 uppercase">
              Garden
              <span className="ml-2 font-normal normal-case tracking-normal text-charcoal-600/40">
                tap to log a day you missed
              </span>
            </h3>
            <div className="rounded-md border border-walnut-500/12 p-1">
              {scheduledHabits.map((habit) => {
                const count = habit.completions.find((c) => toDateKey(new Date(c.date)) === dayKey)?.count ?? 0;
                const done = count >= habit.targetCount;
                return (
                  <button
                    key={habit.id}
                    onClick={() => onToggleHabit(habit, dayKey)}
                    aria-label={`${habit.name}: ${count} of ${habit.targetCount} on ${dayKey}`}
                    className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-canopy-800/5"
                  >
                    <PlantArt type={habit.plantType} health={done ? 85 : 25} size={26} className="shrink-0" />
                    <span
                      className={cn(
                        "min-w-0 flex-1 truncate text-sm",
                        done ? "text-charcoal-600/50" : "text-charcoal-800"
                      )}
                    >
                      {habit.name}
                    </span>
                    <span
                      className={cn(
                        "flex h-5 shrink-0 items-center justify-center rounded-full border px-2 text-[10px] font-medium tabular-nums",
                        done
                          ? "border-moss-600 bg-moss-600 text-parchment-50"
                          : "border-walnut-500/30 text-charcoal-600/60"
                      )}
                    >
                      {habit.targetCount > 1 ? `${count}/${habit.targetCount}` : done ? <Check size={11} /> : "—"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <JournalField
          key={dayKey}
          dateKey={dayKey}
          initial={journal}
          onSaved={(text) => onJournalSaved(dayKey, text)}
        />

        <div>
          <h3 className="mb-2 text-xs font-medium tracking-wide text-charcoal-600/70 uppercase">Tasks due</h3>
          <div className="rounded-md border border-walnut-500/12">
            {tasks.length === 0 ? (
              <EmptyState icon={ListChecks} message="No tasks due this day." />
            ) : (
              tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  showDueDate={false}
                  onToggle={() => onToggleTask(task)}
                  onDelete={() => onDeleteTask(task.id)}
                />
              ))
            )}
          </div>
          <form onSubmit={submitTask} className="mt-2 flex items-center gap-2">
            <TextInput
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="Add a task due this day…"
              className="h-9"
            />
            <Button type="submit" size="sm" variant="secondary" disabled={!taskTitle.trim()}>
              <Plus size={14} />
            </Button>
          </form>
        </div>
      </div>
    </Modal>
  );
}
