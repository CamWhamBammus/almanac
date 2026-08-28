"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { TextInput, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { dateKeyToDate } from "@/lib/dateKey";
import { PRIORITY_LABELS, PRIORITY_ORDER, REPEAT_LABELS, REPEAT_ORDER } from "@/types";
import type { Priority, Repeat } from "@/types";

export function AddTaskForm({
  onAdd,
}: {
  onAdd: (data: { title: string; dueDate?: string | null; priority: Priority; repeat: Repeat }) => Promise<void> | void;
}) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<Priority>("NORMAL");
  const [repeat, setRepeat] = useState<Repeat>("NONE");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await onAdd({
        title: title.trim(),
        dueDate: dueDate ? dateKeyToDate(dueDate).toISOString() : null,
        priority,
        repeat,
      });
      setTitle("");
      setDueDate("");
      setPriority("NORMAL");
      setRepeat("NONE");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2 rounded-lg border border-walnut-500/15 bg-parchment-paper p-3 shadow-soft">
      <TextInput
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a task…"
        className="h-9 min-w-[160px] flex-1"
      />
      <TextInput
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        className="h-9 w-40"
      />
      <Select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="h-9 w-28">
        {PRIORITY_ORDER.map((p) => (
          <option key={p} value={p}>
            {PRIORITY_LABELS[p]}
          </option>
        ))}
      </Select>
      <Select
        value={repeat}
        onChange={(e) => setRepeat(e.target.value as Repeat)}
        className="h-9 w-32"
        title="Only applies if a due date is set"
      >
        {REPEAT_ORDER.map((r) => (
          <option key={r} value={r}>
            {REPEAT_LABELS[r]}
          </option>
        ))}
      </Select>
      <Button type="submit" size="sm" disabled={submitting || !title.trim()}>
        <Plus size={14} />
        Add
      </Button>
    </form>
  );
}
