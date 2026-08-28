"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { Palette } from "lucide-react";
import { toDateKey } from "@/lib/dateKey";
import { useToday } from "@/hooks/useToday";
import { computeDisciplineScore } from "@/lib/discipline";
import { getSeason } from "@/lib/season";
import { computeUnlocks, STARTER_AMBIENCE, STARTER_GROUND, STARTER_SKY } from "@/lib/progression";
import { useGardenCosmetics } from "@/hooks/useGardenCosmetics";
import { CustomizeGardenModal } from "@/components/habits/CustomizeGardenModal";
import { GardenBed } from "@/components/habits/GardenBed";
import { useRestDays } from "@/components/rest/RestDaysProvider";
import { PlantDetailModal } from "@/components/habits/PlantDetailModal";
import { api } from "@/lib/api-client";
import type { Challenge, HabitWithCompletions, PlantType, Task } from "@/types";

export function Garden({
  habits,
  tasks,
  growthPoints,
  archived,
  archivedLoaded,
  showArchived,
  onToggleShowArchived,
  onOpenAdd,
  onToggle,
  onMove,
  onChangeSpecies,
  onEdit,
  onToggleArchive,
  onDelete,
}: {
  habits: HabitWithCompletions[];
  tasks: Task[];
  growthPoints: number;
  archived: HabitWithCompletions[] | null;
  archivedLoaded: boolean;
  showArchived: boolean;
  onToggleShowArchived: () => void;
  onOpenAdd: () => void;
  onToggle: (habit: HabitWithCompletions, dateKey: string) => void;
  onMove: (habit: HabitWithCompletions, direction: -1 | 1) => void;
  onChangeSpecies: (habit: HabitWithCompletions, type: PlantType) => void;
  onEdit: (
    habit: HabitWithCompletions,
    data: { name: string; notes: string | null; daysOfWeek: number[]; targetCount: number }
  ) => void;
  onToggleArchive: (habit: HabitWithCompletions) => void;
  onDelete: (habit: HabitWithCompletions) => void;
}) {
  const { today, now } = useToday();
  const restDays = useRestDays();
  const searchParams = useSearchParams();
  // ?habit=ID opens that plant directly — what search results use.
  const linkedHabitId = searchParams.get("habit");
  const [openHabitId, setOpenHabitId] = useState<string | null>(linkedHabitId);

  // Arriving from search while already on the garden only changes the query
  // string, so the initial state above never re-runs — follow the link here.
  const lastLinked = useRef(linkedHabitId);
  useEffect(() => {
    if (linkedHabitId && linkedHabitId !== lastLinked.current) setOpenHabitId(linkedHabitId);
    lastLinked.current = linkedHabitId;
  }, [linkedHabitId]);
  const [justWateredId, setJustWateredId] = useState<string | null>(null);
  const season = getSeason();
  const vibrancy = computeDisciplineScore(habits, tasks, now, restDays);
  const { ground, sky, ambience, setGround, setSky, setAmbience } = useGardenCosmetics();
  const router = useRouter();
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [challenges, setChallenges] = useState<Challenge[] | null>(null);

  // Only fetched once a plant is opened — the garden itself doesn't show them.
  const loadChallenges = useCallback(() => {
    api.listChallenges().then(setChallenges);
  }, []);
  useEffect(() => {
    if (openHabitId && challenges === null) loadChallenges();
  }, [openHabitId, challenges, loadChallenges]);

  const liveChallenge =
    challenges?.find((c) => c.habitId === openHabitId && !c.completedAt && !c.abandonedAt) ?? null;

  // growthPoints arrives precomputed from the server over every habit
  // (archived included) so this always agrees with the Path page.
  const unlocks = computeUnlocks(growthPoints);
  // A stored choice that isn't unlocked (edited storage, or a reset) falls
  // back to the starter rather than rendering something unearned.
  const activeGround = unlocks.grounds.has(ground) ? ground : STARTER_GROUND;
  const activeSky = unlocks.skies.has(sky) ? sky : STARTER_SKY;
  const activeAmbience = unlocks.ambiences.has(ambience) ? ambience : STARTER_AMBIENCE;

  const all = [...habits, ...(archived ?? [])];
  const openHabit = all.find((h) => h.id === openHabitId) ?? null;
  const openHabitArchived = !!archived?.some((h) => h.id === openHabitId);

  useEffect(() => {
    if (!justWateredId) return;
    const t = setTimeout(() => setJustWateredId(null), 650);
    return () => clearTimeout(t);
  }, [justWateredId]);

  function handleQuickToggle(habit: HabitWithCompletions) {
    const already = (habit.completions.find((c) => toDateKey(new Date(c.date)) === today)?.count ?? 0) >= habit.targetCount;
    if (!already) setJustWateredId(habit.id);
    onToggle(habit, today);
  }

  return (
    <div>
      <GardenBed
        habits={habits}
        archived={false}
        season={season}
        vibrancy={vibrancy}
        ground={activeGround}
        sky={activeSky}
        ambience={activeAmbience}
        ornaments={unlocks.ornaments}
        critters={unlocks.critters}
        showAddTile
        showEmptyMessage={habits.length === 0}
        justWateredId={justWateredId}
        onOpen={setOpenHabitId}
        onQuickToggle={handleQuickToggle}
        onMove={onMove}
        onOpenAdd={onOpenAdd}
      />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => setCustomizeOpen(true)}
          className="flex items-center gap-1.5 text-xs text-charcoal-600/50 transition-colors hover:text-moss-600"
        >
          <Palette size={12} strokeWidth={2} />
          Customise
        </button>

        <button
          onClick={onToggleShowArchived}
          className="text-xs text-charcoal-600/50 underline-offset-2 hover:text-charcoal-800 hover:underline"
        >
          {showArchived ? "Hide dormant plants" : "Dormant plants"}
        </button>
      </div>

      {showArchived && (
        <div className="mt-3">
          {!archivedLoaded ? (
            <p className="text-center text-sm text-charcoal-600/50">Loading…</p>
          ) : archived && archived.length === 0 ? (
            <p className="text-center text-sm text-charcoal-600/50">No dormant plants.</p>
          ) : (
            <GardenBed
              habits={archived ?? []}
              archived
              season={season}
              vibrancy={30}
              ground={activeGround}
              sky={activeSky}
              ambience={activeAmbience}
              ornaments={new Set()}
              critters={new Set()}
              showAddTile={false}
              showEmptyMessage={false}
              justWateredId={null}
              onOpen={setOpenHabitId}
              onQuickToggle={() => {}}
            />
          )}
        </div>
      )}

      <CustomizeGardenModal
        open={customizeOpen}
        onClose={() => setCustomizeOpen(false)}
        unlocks={unlocks}
        ground={activeGround}
        sky={activeSky}
        ambience={activeAmbience}
        onGround={setGround}
        onSky={setSky}
        onAmbience={setAmbience}
      />

      {openHabit && (
        <PlantDetailModal
          habit={openHabit}
          archived={openHabitArchived}
          open={!!openHabit}
          onClose={() => setOpenHabitId(null)}
          unlockedPlants={unlocks.plants}
          challenge={liveChallenge}
          onChallengeChanged={() => {
            loadChallenges();
            router.refresh();
          }}
          onToggle={(dateKey) => onToggle(openHabit, dateKey)}
          onChangeSpecies={(type) => onChangeSpecies(openHabit, type)}
          onEdit={(data) => onEdit(openHabit, data)}
          onToggleArchive={() => onToggleArchive(openHabit)}
          onDelete={() => {
            onDelete(openHabit);
            setOpenHabitId(null);
          }}
        />
      )}
    </div>
  );
}
