"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { Garden } from "@/components/habits/Garden";
import { GardenStats } from "@/components/habits/GardenStats";
import { AddHabitForm } from "@/components/habits/AddHabitForm";
import { computeUnlocks } from "@/lib/progression";
import type { HabitWithCompletions, PlantType, Task } from "@/types";

export function GardenSection({
  initialHabits,
  tasks,
  growthPoints,
}: {
  initialHabits: HabitWithCompletions[];
  tasks: Task[];
  /** Computed server-side over every habit so it matches the Path exactly. */
  growthPoints: number;
}) {
  const [habits, setHabits] = useState(initialHabits);
  const [archived, setArchived] = useState<HabitWithCompletions[] | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const router = useRouter();

  const unlocks = computeUnlocks(growthPoints);
  const unlockedPlants = unlocks.plants;


  async function handleAdd(data: {
    name: string;
    daysOfWeek?: number[];
    targetCount?: number;
    plantType?: PlantType;
  }) {
    const habit = await api.createHabit(data);
    setHabits((prev) => [...prev, habit]);
    router.refresh();
  }

  async function handleToggle(habit: HabitWithCompletions, dateKey: string) {
    const completions = await api.toggleHabitCompletion(habit.id, dateKey);
    setHabits((prev) => prev.map((h) => (h.id === habit.id ? { ...h, completions } : h)));
    setArchived((prev) => (prev ? prev.map((h) => (h.id === habit.id ? { ...h, completions } : h)) : prev));
    // Pull fresh Growth so new unlocks (and their ornaments/critters) land
    // immediately rather than on the next navigation.
    router.refresh();
  }

  /**
   * Swap a plant with its neighbour and persist both positions. Writing the
   * whole visible order (rather than just the two) repairs the legacy state
   * where every habit shares sortOrder 0.
   */
  async function handleMove(habit: HabitWithCompletions, direction: -1 | 1) {
    const i = habits.findIndex((h) => h.id === habit.id);
    const j = i + direction;
    if (i < 0 || j < 0 || j >= habits.length) return;

    const next = [...habits];
    [next[i], next[j]] = [next[j], next[i]];
    setHabits(next);

    await Promise.all(next.map((h, idx) => api.updateHabit(h.id, { sortOrder: idx })));
    router.refresh();
  }

  async function handleChangeSpecies(habit: HabitWithCompletions, plantType: PlantType) {
    const updated = await api.updateHabit(habit.id, { plantType });
    setHabits((prev) => prev.map((h) => (h.id === habit.id ? updated : h)));
    setArchived((prev) => (prev ? prev.map((h) => (h.id === habit.id ? updated : h)) : prev));
  }

  async function handleEdit(
    habit: HabitWithCompletions,
    data: { name: string; notes: string | null; daysOfWeek: number[]; targetCount: number }
  ) {
    const updated = await api.updateHabit(habit.id, data);
    setHabits((prev) => prev.map((h) => (h.id === habit.id ? updated : h)));
    setArchived((prev) => (prev ? prev.map((h) => (h.id === habit.id ? updated : h)) : prev));
  }

  async function handleToggleArchive(habit: HabitWithCompletions) {
    const nowArchived = !habit.archived;
    if (nowArchived) {
      setHabits((prev) => prev.filter((h) => h.id !== habit.id));
      await api.updateHabit(habit.id, { archived: true });
      setArchived(null); // stale — refetch next time the section is opened
    } else {
      setArchived((prev) => (prev ? prev.filter((h) => h.id !== habit.id) : prev));
      const updated = await api.updateHabit(habit.id, { archived: false });
      setHabits((prev) => [...prev, updated]);
    }
  }

  async function handleDelete(habit: HabitWithCompletions) {
    setHabits((prev) => prev.filter((h) => h.id !== habit.id));
    setArchived((prev) => (prev ? prev.filter((h) => h.id !== habit.id) : prev));
    await api.deleteHabit(habit.id);
  }

  async function toggleShowArchived() {
    const next = !showArchived;
    setShowArchived(next);
    if (next && archived === null) {
      setArchived(await api.listArchivedHabits());
    }
  }

  return (
    <div>
      <GardenStats habits={habits} />

      <Garden
        habits={habits}
        tasks={tasks}
        growthPoints={growthPoints}
        archived={archived}
        archivedLoaded={archived !== null}
        showArchived={showArchived}
        onToggleShowArchived={toggleShowArchived}
        onOpenAdd={() => setAddOpen(true)}
        onToggle={handleToggle}
        onMove={handleMove}
        onChangeSpecies={handleChangeSpecies}
        onEdit={handleEdit}
        onToggleArchive={handleToggleArchive}
        onDelete={handleDelete}
      />

      <AddHabitForm
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={handleAdd}
        unlockedPlants={unlockedPlants}
      />
    </div>
  );
}
