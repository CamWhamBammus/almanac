"use client";

import { Pencil, Repeat as RepeatIcon, Trash2 } from "lucide-react";
import type { Event } from "@/types";

export function EventRow({
  event,
  onDelete,
  onEdit,
}: {
  event: Event;
  onDelete: () => void;
  /** Optional — views that don't own event-editing state simply omit it. */
  onEdit?: () => void;
}) {
  const time = event.startTime ? `${event.startTime}${event.endTime ? `–${event.endTime}` : ""}` : null;

  return (
    <div className="group flex items-start gap-3 rounded-md px-2 py-2 transition-colors hover:bg-canopy-800/5">
      <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sage-400" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <p className="truncate text-sm text-charcoal-800">{event.title}</p>
          {time && <span className="shrink-0 text-xs text-charcoal-600/60">{time}</span>}
          {event.repeat !== "NONE" && (
            <RepeatIcon
              size={11}
              className="shrink-0 self-center text-charcoal-600/40"
              strokeWidth={2}
              aria-label={`Repeats ${event.repeat.toLowerCase()}`}
            />
          )}
        </div>
        {event.notes && <p className="truncate text-xs text-charcoal-600/60">{event.notes}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        {onEdit && (
          <button
            onClick={onEdit}
            aria-label={`Edit ${event.title}`}
            className="rounded p-1 text-charcoal-600/40 hover:bg-canopy-800/10 hover:text-canopy-900"
          >
            <Pencil size={14} />
          </button>
        )}
        <button
          onClick={onDelete}
          aria-label={`Delete ${event.title}`}
          className="rounded p-1 text-charcoal-600/40 hover:bg-clay-500/10 hover:text-clay-500"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
