"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Select, TextInput, Textarea } from "@/components/ui/Field";
import { dateKeyToDate, toDateKey } from "@/lib/dateKey";
import { REPEAT_LABELS, REPEAT_ORDER } from "@/types";
import type { Event, Repeat } from "@/types";

export interface EventEdits {
  title: string;
  notes: string | null;
  date: string;
  startTime: string | null;
  endTime: string | null;
  repeat: Repeat;
  repeatUntil: string | null;
}

export function EventEditModal({
  event,
  open,
  onClose,
  onSave,
}: {
  event: Event;
  open: boolean;
  onClose: () => void;
  onSave: (edits: EventEdits) => void;
}) {
  const [title, setTitle] = useState(event.title);
  const [notes, setNotes] = useState(event.notes ?? "");
  const [dateKey, setDateKey] = useState(toDateKey(new Date(event.date)));
  const [startTime, setStartTime] = useState(event.startTime ?? "");
  const [endTime, setEndTime] = useState(event.endTime ?? "");
  const [repeat, setRepeat] = useState<Repeat>(event.repeat);
  const [untilKey, setUntilKey] = useState(event.repeatUntil ? toDateKey(new Date(event.repeatUntil)) : "");

  function handleSave() {
    if (!title.trim() || !dateKey) return;
    onSave({
      title: title.trim(),
      notes: notes.trim() || null,
      date: dateKeyToDate(dateKey).toISOString(),
      startTime: startTime || null,
      endTime: endTime || null,
      repeat,
      repeatUntil: repeat !== "NONE" && untilKey ? dateKeyToDate(untilKey).toISOString() : null,
    });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit event" width="lg">
      <div className="flex flex-col gap-4">
        <Field label="Title" required>
          <TextInput autoFocus value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>

        <Field label="Notes" hint="Optional">
          <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Date" required>
            <TextInput type="date" value={dateKey} onChange={(e) => setDateKey(e.target.value)} />
          </Field>
          <Field label="Starts" hint="Optional">
            <TextInput type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </Field>
          <Field label="Ends" hint="Optional">
            <TextInput type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Repeats">
            <Select value={repeat} onChange={(e) => setRepeat(e.target.value as Repeat)}>
              {REPEAT_ORDER.map((r) => (
                <option key={r} value={r}>
                  {REPEAT_LABELS[r]}
                </option>
              ))}
            </Select>
          </Field>
          {repeat !== "NONE" && (
            <Field label="Until" hint="Optional — leave blank to repeat indefinitely">
              <TextInput type="date" value={untilKey} onChange={(e) => setUntilKey(e.target.value)} />
            </Field>
          )}
        </div>

        <div className="mt-1 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!title.trim() || !dateKey}>
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}
