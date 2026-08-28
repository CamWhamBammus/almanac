"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Select, TextInput, Textarea } from "@/components/ui/Field";
import { dateKeyToDate, toDateKey } from "@/lib/dateKey";
import { PRIORITY_LABELS, PRIORITY_ORDER, REPEAT_LABELS, REPEAT_ORDER } from "@/types";
import type { Priority, Repeat, Task } from "@/types";

export interface TaskEdits {
  title: string;
  notes: string | null;
  dueDate: string | null;
  priority: Priority;
  repeat: Repeat;
}

export function TaskEditModal({
  task,
  open,
  onClose,
  onSave,
}: {
  task: Task;
  open: boolean;
  onClose: () => void;
  onSave: (edits: TaskEdits) => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes ?? "");
  const [dueKey, setDueKey] = useState(task.dueDate ? toDateKey(new Date(task.dueDate)) : "");
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [repeat, setRepeat] = useState<Repeat>(task.repeat);

  function handleSave() {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      notes: notes.trim() || null,
      dueDate: dueKey ? dateKeyToDate(dueKey).toISOString() : null,
      priority,
      repeat,
    });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit task" width="lg">
      <div className="flex flex-col gap-4">
        <Field label="Title" required>
          <TextInput autoFocus value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>

        <Field label="Notes" hint="Optional">
          <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Due" hint="Blank = someday">
            <TextInput type="date" value={dueKey} onChange={(e) => setDueKey(e.target.value)} />
          </Field>
          <Field label="Priority">
            <Select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
              {PRIORITY_ORDER.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Repeats" hint={dueKey ? undefined : "Needs a due date"}>
            <Select
              value={repeat}
              onChange={(e) => setRepeat(e.target.value as Repeat)}
              disabled={!dueKey}
            >
              {REPEAT_ORDER.map((r) => (
                <option key={r} value={r}>
                  {REPEAT_LABELS[r]}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="mt-1 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!title.trim()}>
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}
