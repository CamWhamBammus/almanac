"use client";

import { useState } from "react";
import { Calendar, CheckSquare, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";
import { parseNaturalDate } from "@/lib/naturalDate";
import { effectiveNow, toDateKey } from "@/lib/dateKey";
import { Modal } from "@/components/ui/Modal";
import { TextInput } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

type CaptureType = "task" | "event" | "habit";

const TYPES: { key: CaptureType; label: string; icon: typeof CheckSquare }[] = [
  { key: "task", label: "Task", icon: CheckSquare },
  { key: "event", label: "Event", icon: Calendar },
  { key: "habit", label: "Habit", icon: Flame },
];

export function QuickCapture({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [type, setType] = useState<CaptureType>("task");
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  function handleClose() {
    setText("");
    setConfirmation(null);
    setType("task");
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    setConfirmation(null);
    try {
      if (type === "habit") {
        const habit = await api.createHabit({ name: text.trim() });
        setConfirmation(`Added "${habit.name}" to Habits.`);
      } else if (type === "task") {
        const { title, date } = parseNaturalDate(text.trim(), effectiveNow());
        const task = await api.createTask({ title, dueDate: date ? date.toISOString() : null });
        setConfirmation(`Added "${task.title}" to Tasks${date ? ` for ${toDateKey(date)}` : ""}.`);
      } else {
        const { title, date, time } = parseNaturalDate(text.trim(), effectiveNow());
        const eventDate = date ?? effectiveNow();
        const event = await api.createEvent({
          title,
          date: eventDate.toISOString(),
          startTime: time ?? undefined,
        });
        setConfirmation(`Added "${event.title}" to Calendar.`);
      }
      setText("");
      setTimeout(handleClose, 900);
    } catch (err) {
      setConfirmation(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Quick capture" width="md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex gap-1.5">
          {TYPES.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setType(key)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors",
                type === key
                  ? "border-moss-600 bg-moss-600/10 text-moss-600"
                  : "border-walnut-500/20 text-charcoal-600 hover:bg-canopy-800/5"
              )}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        <TextInput
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            type === "habit"
              ? "Habit name…"
              : type === "task"
                ? "Call dentist tomorrow 3pm…"
                : "Team sync friday 3pm…"
          }
        />

        {type !== "habit" && (
          <p className="text-xs text-charcoal-600/60">
            Type a date or time and it&rsquo;ll be pulled out automatically — e.g. &ldquo;tomorrow&rdquo; or
            &ldquo;next friday 3pm&rdquo;.
          </p>
        )}

        {confirmation && <p className="text-sm text-moss-600">{confirmation}</p>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting || !text.trim()}>
            Add
          </Button>
        </div>
      </form>
    </Modal>
  );
}
