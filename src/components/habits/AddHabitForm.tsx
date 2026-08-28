"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, TextInput, Textarea } from "@/components/ui/Field";
import { PlantPicker } from "@/components/habits/PlantPicker";
import { cn } from "@/lib/utils";
import { WEEKDAY_SHORT_LABELS } from "@/types";
import type { PlantType } from "@/types";

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const WEEKDAY_FULL_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function AddHabitForm({
  open,
  onClose,
  onAdd,
  unlockedPlants,
}: {
  open: boolean;
  onClose: () => void;
  unlockedPlants: Set<PlantType>;
  onAdd: (data: {
    name: string;
    notes?: string;
    daysOfWeek?: number[];
    targetCount?: number;
    plantType?: PlantType;
  }) => Promise<void> | void;
}) {
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [days, setDays] = useState<Set<number>>(new Set(ALL_DAYS));
  const [targetCount, setTargetCount] = useState(1);
  const [plantType, setPlantType] = useState<PlantType>("TREE");
  const [submitting, setSubmitting] = useState(false);

  function toggleDay(day: number) {
    setDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }

  function reset() {
    setName("");
    setNotes("");
    setDays(new Set(ALL_DAYS));
    setTargetCount(1);
    setPlantType("TREE");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || days.size === 0) return;
    setSubmitting(true);
    try {
      await onAdd({
        name: name.trim(),
        notes: notes.trim() || undefined,
        daysOfWeek: [...days].sort(),
        targetCount,
        plantType,
      });
      reset();
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Plant a new habit" width="lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="What are you growing?" required>
          <TextInput autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Leetcode" />
        </Field>

        <Field label="Notes" hint="Optional — why it matters, or how you'll do it">
          <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>

        <Field label="Species">
          <PlantPicker value={plantType} onChange={setPlantType} unlocked={unlockedPlants} />
        </Field>

        <div className="flex items-center gap-1.5 text-xs text-charcoal-600/70">
          <span>Do it</span>
          <input
            type="number"
            min={1}
            max={20}
            value={targetCount}
            onChange={(e) => setTargetCount(Math.max(1, Math.min(20, Math.round(Number(e.target.value)) || 1)))}
            className="h-6 w-12 rounded border border-walnut-500/25 bg-parchment-paper px-1.5 text-center text-xs text-charcoal-800 focus:border-moss-500 focus:outline-none"
          />
          <span>time{targetCount === 1 ? "" : "s"} a day</span>
        </div>

        <div className="flex items-center gap-1">
          {WEEKDAY_SHORT_LABELS.map((label, day) => (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              aria-pressed={days.has(day)}
              aria-label={WEEKDAY_FULL_LABELS[day]}
              title={WEEKDAY_FULL_LABELS[day]}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-medium transition-colors",
                days.has(day)
                  ? "bg-moss-600 text-parchment-50"
                  : "bg-canopy-800/6 text-charcoal-600/50 hover:bg-canopy-800/12"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-1 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting || !name.trim() || days.size === 0}>
            {submitting ? "Planting…" : "Plant it"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
