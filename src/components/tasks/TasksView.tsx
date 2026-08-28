"use client";

import { useState } from "react";
import { addDays } from "date-fns";
import { ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";
import { toDateKey } from "@/lib/dateKey";
import { useToday } from "@/hooks/useToday";
import { TaskRow } from "@/components/tasks/TaskRow";
import { AddTaskForm } from "@/components/tasks/AddTaskForm";
import { TaskEditModal, type TaskEdits } from "@/components/tasks/TaskEditModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { PRIORITY_ORDER } from "@/types";
import type { Priority, Repeat, Task } from "@/types";

type FilterKey = "open" | "today" | "upcoming" | "no-date" | "done";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "open", label: "Open" },
  { key: "today", label: "Today" },
  { key: "upcoming", label: "Upcoming" },
  { key: "no-date", label: "No date" },
  { key: "done", label: "Done" },
];

function matchesFilter(task: Task, filter: FilterKey, today: string): boolean {
  const key = task.dueDate ? toDateKey(new Date(task.dueDate)) : null;
  switch (filter) {
    case "open":
      return !task.done;
    case "today":
      return !task.done && key === today;
    case "upcoming":
      return !task.done && !!key && key > today;
    case "no-date":
      return !task.done && !key;
    case "done":
      return task.done;
  }
}

type BucketKey = "overdue" | "today" | "tomorrow" | "week" | "later" | "someday";

const BUCKET_ORDER: BucketKey[] = ["overdue", "today", "tomorrow", "week", "later", "someday"];

const BUCKET_LABELS: Record<BucketKey, string> = {
  overdue: "Overdue",
  today: "Today",
  tomorrow: "Tomorrow",
  week: "This week",
  later: "Later",
  someday: "Someday",
};

function bucketOf(task: Task, today: string, tomorrow: string, weekEnd: string): BucketKey {
  if (!task.dueDate) return "someday";
  const key = toDateKey(new Date(task.dueDate));
  if (key < today) return "overdue";
  if (key === today) return "today";
  if (key === tomorrow) return "tomorrow";
  if (key <= weekEnd) return "week";
  return "later";
}

/** Highest priority first, then earliest due date — the order you'd actually work them in. */
function byUrgency(a: Task, b: Task): number {
  const byPriority = PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority);
  if (byPriority !== 0) return byPriority;
  const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
  const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
  return aDue - bDue;
}

export function TasksView({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [filter, setFilter] = useState<FilterKey>("open");
  const [editingId, setEditingId] = useState<string | null>(null);

  const { today, now } = useToday();
  const tomorrow = toDateKey(addDays(now, 1));
  const weekEnd = toDateKey(addDays(now, 7));

  const editingTask = tasks.find((t) => t.id === editingId) ?? null;
  const filtered = tasks.filter((task) => matchesFilter(task, filter, today));

  // Only the catch-all "Open" view benefits from date grouping — the narrow
  // filters are already a single bucket by definition.
  const grouped = filter === "open";
  const buckets = new Map<BucketKey, Task[]>();
  if (grouped) {
    for (const task of filtered) {
      const b = bucketOf(task, today, tomorrow, weekEnd);
      buckets.set(b, [...(buckets.get(b) ?? []), task]);
    }
  }

  async function handleAdd(data: { title: string; dueDate?: string | null; priority: Priority; repeat: Repeat }) {
    const task = await api.createTask(data);
    setTasks((prev) => [...prev, task]);
  }

  async function handleToggle(task: Task) {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t)));
    const updated = await api.updateTask(task.id, { done: !task.done });
    setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
  }

  async function handleDelete(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await api.deleteTask(id);
  }

  async function handleEdit(id: string, edits: TaskEdits) {
    const updated = await api.updateTask(id, edits);
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }

  function renderRow(task: Task) {
    return (
      <TaskRow
        key={task.id}
        task={task}
        onToggle={() => handleToggle(task)}
        onDelete={() => handleDelete(task.id)}
        onEdit={() => setEditingId(task.id)}
      />
    );
  }

  return (
    <div>
      <h1 className="font-serif text-3xl text-canopy-900">Tasks</h1>
      <p className="mt-1 text-sm text-charcoal-600">Everything on your list, in one place.</p>

      <div className="mt-6">
        <AddTaskForm onAdd={handleAdd} />
      </div>

      <div className="mt-6 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => {
          const count = tasks.filter((t) => matchesFilter(t, f.key, today)).length;
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1 text-sm transition-colors",
                active ? "bg-moss-600 text-parchment-50" : "bg-canopy-800/6 text-charcoal-600 hover:bg-canopy-800/12"
              )}
            >
              {f.label}
              <span
                className={cn(
                  "rounded-full px-1.5 text-[11px] tabular-nums",
                  active ? "bg-parchment-50/20" : "bg-canopy-800/8 text-charcoal-600/60"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-4 rounded-lg border border-walnut-500/15 bg-parchment-paper p-2 shadow-soft">
          <EmptyState icon={ListChecks} message="Nothing here." />
        </div>
      ) : grouped ? (
        <div className="mt-4 flex flex-col gap-5">
          {BUCKET_ORDER.filter((b) => buckets.has(b)).map((b) => {
            const bucketTasks = [...(buckets.get(b) ?? [])].sort(byUrgency);
            return (
              <section key={b}>
                <div className="mb-2 flex items-baseline justify-between">
                  <h2
                    className={cn(
                      "text-xs font-medium tracking-wide uppercase",
                      b === "overdue" ? "text-clay-500" : "text-charcoal-600/60"
                    )}
                  >
                    {BUCKET_LABELS[b]}
                  </h2>
                  <span className="text-xs tabular-nums text-charcoal-600/40">{bucketTasks.length}</span>
                </div>
                <div
                  className={cn(
                    "rounded-lg border bg-parchment-paper p-2 shadow-soft",
                    b === "overdue" ? "border-clay-500/20" : "border-walnut-500/15"
                  )}
                >
                  {bucketTasks.map(renderRow)}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-walnut-500/15 bg-parchment-paper p-2 shadow-soft">
          {[...filtered].sort(byUrgency).map(renderRow)}
        </div>
      )}

      {editingTask && (
        <TaskEditModal
          key={editingTask.id}
          task={editingTask}
          open
          onClose={() => setEditingId(null)}
          onSave={(edits) => handleEdit(editingTask.id, edits)}
        />
      )}
    </div>
  );
}
