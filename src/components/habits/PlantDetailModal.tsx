"use client";

import { useState } from "react";
import { Archive, ArchiveRestore, Check, Flame, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { dateKeyToDate, toDateKey } from "@/lib/dateKey";
import { useToday } from "@/hooks/useToday";
import { currentStreak, isScheduledDay, streakIntensity, type StreakIntensity } from "@/lib/streak";
import { computeHabitHealth, disciplineBand, DISCIPLINE_BAND_LABELS } from "@/lib/discipline";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { TextInput, Textarea } from "@/components/ui/Field";
import { PlantArt } from "@/components/habits/PlantArt";
import { PlantPicker } from "@/components/habits/PlantPicker";
import { HabitHeatmap } from "@/components/habits/HabitHeatmap";
import { ChallengePanel } from "@/components/habits/ChallengePanel";
import { useRestDays } from "@/components/rest/RestDaysProvider";
import { WEEKDAY_SHORT_LABELS } from "@/types";
import type { Challenge, HabitWithCompletions, PlantType } from "@/types";

function lastNDays(n: number, now: Date): string[] {
  const days: string[] = [];
  const cursor = new Date(now);
  cursor.setDate(cursor.getDate() - (n - 1));
  for (let i = 0; i < n; i++) {
    days.push(toDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const WEEKDAY_FULL_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function scheduleSummary(daysOfWeek: string | null, targetCount: number): string {
  const freq = targetCount > 1 ? `${targetCount}×/day` : "Once a day";
  if (!daysOfWeek) return `${freq} · every day`;
  const days = new Set(daysOfWeek.split(",").map(Number));
  const labels = ALL_DAYS.filter((d) => days.has(d)).map((d) => WEEKDAY_SHORT_LABELS[d]);
  return `${freq} · ${labels.join(" ")}`;
}

const INTENSITY_STYLES: Record<StreakIntensity, string> = {
  spark: "bg-amber-500/10 text-amber-500",
  warm: "bg-amber-500/18 text-amber-500",
  hot: "bg-clay-500/18 text-clay-500",
  blazing: "bg-clay-500/24 text-clay-500 shadow-[0_0_8px_var(--clay-500)]",
};

export function PlantDetailModal({
  habit,
  archived = false,
  open,
  unlockedPlants,
  challenge,
  onChallengeChanged,
  onClose,
  onToggle,
  onChangeSpecies,
  onEdit,
  onToggleArchive,
  onDelete,
}: {
  habit: HabitWithCompletions;
  archived?: boolean;
  open: boolean;
  unlockedPlants: Set<PlantType>;
  challenge: Challenge | null;
  onChallengeChanged: () => void;
  onClose: () => void;
  onToggle: (dateKey: string) => void;
  onChangeSpecies: (type: PlantType) => void;
  onEdit: (data: { name: string; notes: string | null; daysOfWeek: number[]; targetCount: number }) => void;
  onToggleArchive: () => void;
  onDelete: () => void;
}) {
  const { today, now } = useToday();
  const restDays = useRestDays();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(habit.name);
  const [editNotes, setEditNotes] = useState(habit.notes ?? "");
  const [editDays, setEditDays] = useState<Set<number>>(
    new Set(habit.daysOfWeek ? habit.daysOfWeek.split(",").map(Number) : ALL_DAYS)
  );
  const [editTargetCount, setEditTargetCount] = useState(habit.targetCount);

  const week = lastNDays(7, now);
  const completedCounts = new Map(habit.completions.map((c) => [toDateKey(new Date(c.date)), c.count]));
  const health = computeHabitHealth(habit, now, restDays);
  const band = disciplineBand(health);
  const streak = currentStreak(
    habit.completions.filter((c) => c.count >= habit.targetCount).map((c) => new Date(c.date)),
    habit.daysOfWeek,
    now,
    restDays
  );
  const intensity = streakIntensity(streak);

  function startEditing() {
    setEditName(habit.name);
    setEditNotes(habit.notes ?? "");
    setEditDays(new Set(habit.daysOfWeek ? habit.daysOfWeek.split(",").map(Number) : ALL_DAYS));
    setEditTargetCount(habit.targetCount);
    setEditing(true);
  }

  function toggleEditDay(day: number) {
    setEditDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }

  function saveEdits() {
    if (!editName.trim() || editDays.size === 0) return;
    onEdit({
      name: editName.trim(),
      notes: editNotes.trim() || null,
      daysOfWeek: [...editDays].sort(),
      targetCount: editTargetCount,
    });
    setEditing(false);
  }

  return (
    <Modal open={open} onClose={onClose} title={habit.name} width="lg">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <PlantArt type={habit.plantType} health={health} size={88} />
          <div className="flex-1">
            <p className="text-sm font-medium text-canopy-900">
              {DISCIPLINE_BAND_LABELS[band]} <span className="font-normal text-charcoal-600/50">· {health}/100</span>
            </p>
            {habit.notes && <p className="mt-0.5 text-sm text-charcoal-600/70">{habit.notes}</p>}
            {streak > 0 && (
              <span
                className={cn(
                  "mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs",
                  INTENSITY_STYLES[intensity]
                )}
              >
                <Flame size={12} strokeWidth={2} />
                {streak} day streak
              </span>
            )}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-medium tracking-wide text-charcoal-600/60 uppercase">Details</h3>
            {!editing && !archived && (
              <button
                onClick={startEditing}
                className="flex items-center gap-1 text-xs text-charcoal-600/50 hover:text-moss-600"
              >
                <Pencil size={11} />
                Edit
              </button>
            )}
          </div>

          {!editing ? (
            <p className="text-sm text-charcoal-800">{scheduleSummary(habit.daysOfWeek, habit.targetCount)}</p>
          ) : (
            <div className="flex flex-col gap-3 rounded-md border border-walnut-500/15 bg-parchment-paper/60 p-3">
              <TextInput value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Habit name" />

              <Textarea
                rows={2}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Why this matters, or how you'll do it… (optional)"
              />

              <div className="flex items-center gap-1.5 text-xs text-charcoal-600/70">
                <span>Do it</span>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={editTargetCount}
                  onChange={(e) =>
                    setEditTargetCount(Math.max(1, Math.min(20, Math.round(Number(e.target.value)) || 1)))
                  }
                  className="h-6 w-12 rounded border border-walnut-500/25 bg-parchment-paper px-1.5 text-center text-xs text-charcoal-800 focus:border-moss-500 focus:outline-none"
                />
                <span>time{editTargetCount === 1 ? "" : "s"} a day</span>
              </div>

              <div className="flex items-center gap-1">
                {WEEKDAY_SHORT_LABELS.map((label, day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleEditDay(day)}
                    aria-pressed={editDays.has(day)}
                    aria-label={WEEKDAY_FULL_LABELS[day]}
                    title={WEEKDAY_FULL_LABELS[day]}
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-medium transition-colors",
                      editDays.has(day)
                        ? "bg-moss-600 text-parchment-50"
                        : "bg-canopy-800/6 text-charcoal-600/50 hover:bg-canopy-800/12"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={saveEdits} disabled={!editName.trim() || editDays.size === 0}>
                  Save
                </Button>
              </div>
            </div>
          )}
        </div>

        {!archived && (
          <div>
            <h3 className="mb-2 text-xs font-medium tracking-wide text-charcoal-600/60 uppercase">This week</h3>
            <div className="flex items-center gap-2">
              {week.map((key) => {
                const isToday = key === today;
                const scheduled = isScheduledDay(habit.daysOfWeek, dateKeyToDate(key), restDays);
                const count = completedCounts.get(key) ?? 0;
                const done = count >= habit.targetCount;

                if (!scheduled) {
                  return (
                    <div
                      key={key}
                      title={`${key} — not scheduled`}
                      className="h-7 w-7 shrink-0 rounded-full border border-dashed border-walnut-500/15"
                    />
                  );
                }

                return (
                  <button
                    key={key}
                    onClick={() => onToggle(key)}
                    title={habit.targetCount > 1 ? `${key} — ${count}/${habit.targetCount}` : key}
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[10px] font-medium tabular-nums transition-colors",
                      done ? "border-moss-600 bg-moss-600 text-parchment-50" : "border-walnut-500/30 text-charcoal-600/60 hover:border-moss-500",
                      isToday && "ring-1 ring-offset-1 ring-offset-parchment-paper ring-moss-500/50"
                    )}
                  >
                    {habit.targetCount > 1 ? `${count}` : done ? <Check size={13} /> : ""}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {!archived && (
          <ChallengePanel habit={habit} challenge={challenge} onChanged={onChallengeChanged} />
        )}

        <div>
          <h3 className="mb-2 text-xs font-medium tracking-wide text-charcoal-600/60 uppercase">History</h3>
          <HabitHeatmap completions={habit.completions} daysOfWeek={habit.daysOfWeek} targetCount={habit.targetCount} />
        </div>

        <div>
          <h3 className="mb-2 text-xs font-medium tracking-wide text-charcoal-600/60 uppercase">Species</h3>
          <PlantPicker value={habit.plantType} onChange={onChangeSpecies} unlocked={unlockedPlants} />
        </div>

        <div className="flex items-center justify-between border-t border-walnut-500/10 pt-4">
          <Button variant="ghost" size="sm" onClick={onToggleArchive}>
            {archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
            {archived ? "Unarchive" : "Archive"}
          </Button>
          <Button variant="danger" size="sm" onClick={() => setConfirmingDelete(true)}>
            <Trash2 size={14} />
            Delete
          </Button>
        </div>
      </div>

      <Modal open={confirmingDelete} onClose={() => setConfirmingDelete(false)} title="Delete this habit?">
        <div className="flex flex-col gap-3">
          <p className="text-sm text-charcoal-600">
            This permanently deletes &ldquo;{habit.name}&rdquo; and all its history. This can&apos;t be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmingDelete(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={onDelete}>
              Delete permanently
            </Button>
          </div>
        </div>
      </Modal>
    </Modal>
  );
}
