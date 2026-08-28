"use client";

import { useState } from "react";
import { Check, Pencil, Repeat as RepeatIcon, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import type { Task } from "@/types";

export function TaskRow({
  task,
  onToggle,
  onDelete,
  onEdit,
  showDueDate = true,
}: {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
  /** Optional — views that don't own task-editing state simply omit it. */
  onEdit?: () => void;
  showDueDate?: boolean;
}) {
  const [justCompleted, setJustCompleted] = useState(false);
  const overdue = !task.done && task.dueDate && new Date(task.dueDate) < new Date(new Date().toDateString());

  function handleToggle() {
    if (!task.done) {
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 320);
    }
    onToggle();
  }

  return (
    <div className="group flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-canopy-800/5">
      <button
        onClick={handleToggle}
        aria-label={task.done ? "Mark incomplete" : "Mark complete"}
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
          task.done ? "border-moss-600 bg-moss-600 text-parchment-50" : "border-walnut-500/40 hover:border-moss-500",
          justCompleted && "completion-pop"
        )}
      >
        {task.done && <Check size={12} strokeWidth={3} />}
      </button>

      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm", task.done ? "text-charcoal-600/50 line-through" : "text-charcoal-800")}>
          {task.title}
        </p>
        {task.notes && <p className="truncate text-xs text-charcoal-600/60">{task.notes}</p>}
      </div>

      {task.repeat !== "NONE" && (
        <RepeatIcon
          size={12}
          className="shrink-0 text-charcoal-600/40"
          strokeWidth={2}
          aria-label={`Repeats ${task.repeat.toLowerCase()}`}
        />
      )}

      {showDueDate && task.dueDate && (
        <span className={cn("shrink-0 text-xs", overdue ? "text-clay-500" : "text-charcoal-600/60")}>
          {format(new Date(task.dueDate), "MMM d")}
        </span>
      )}

      <PriorityBadge priority={task.priority} className="shrink-0" />

      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        {onEdit && (
          <button
            onClick={onEdit}
            aria-label={`Edit ${task.title}`}
            className="rounded p-1 text-charcoal-600/40 hover:bg-canopy-800/10 hover:text-canopy-900"
          >
            <Pencil size={14} />
          </button>
        )}
        <button
          onClick={onDelete}
          aria-label={`Delete ${task.title}`}
          className="rounded p-1 text-charcoal-600/40 hover:bg-clay-500/10 hover:text-clay-500"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
