"use client";

import { Sprout } from "lucide-react";
import { PlantCard, hashString } from "@/components/habits/PlantCard";
import { GardenGround } from "@/components/habits/GardenGround";
import { GardenMotes } from "@/components/habits/GardenMotes";
import { GardenCritters, GardenOrnaments } from "@/components/habits/GardenDecor";
import { GardenSky } from "@/components/habits/GardenSky";
import type { Season } from "@/lib/season";
import type { AmbienceId, CritterId, GroundId, OrnamentId, SkyId } from "@/lib/progression";
import type { HabitWithCompletions } from "@/types";

/**
 * The garden's planter box — a soil field (via GardenGround) that fills
 * the whole bed, not just a thin strip along the bottom. That's what lets
 * habits wrap into as many rows as needed without any of them floating:
 * the ground isn't a single horizon line under the last row, it's the
 * background behind every row.
 */
export function GardenBed({
  habits,
  archived,
  season,
  vibrancy,
  ground,
  sky,
  ambience,
  ornaments,
  critters,
  showAddTile,
  showEmptyMessage,
  justWateredId,
  onOpen,
  onQuickToggle,
  onMove,
  onOpenAdd,
}: {
  habits: HabitWithCompletions[];
  archived: boolean;
  season: Season;
  vibrancy: number;
  ground: GroundId;
  sky: SkyId;
  ambience: AmbienceId;
  ornaments: Set<OrnamentId>;
  critters: Set<CritterId>;
  showAddTile: boolean;
  showEmptyMessage: boolean;
  justWateredId: string | null;
  onOpen: (id: string) => void;
  onQuickToggle: (habit: HabitWithCompletions) => void;
  onMove?: (habit: HabitWithCompletions, direction: -1 | 1) => void;
  onOpenAdd?: () => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-walnut-500/12 shadow-soft">
      <GardenGround season={season} vibrancy={vibrancy} ground={ground} />
      <GardenSky sky={sky} season={season} />
      <GardenOrnaments unlocked={ornaments} />
      <GardenCritters unlocked={critters} />
      <GardenMotes season={season} ambience={ambience} />

      <div className="relative flex flex-wrap items-end justify-center gap-x-7 gap-y-6 px-6 pt-8 pb-10">
        {habits.map((habit, i) => (
          <PlantCard
            key={habit.id}
            habit={habit}
            archived={archived}
            swayDelay={(hashString(habit.id) % 10) * 0.4}
            watered={justWateredId === habit.id}
            onOpen={() => onOpen(habit.id)}
            onQuickToggle={() => onQuickToggle(habit)}
            onMove={onMove ? (d) => onMove(habit, d) : undefined}
            canMoveLeft={i > 0}
            canMoveRight={i < habits.length - 1}
          />
        ))}

        {showAddTile && onOpenAdd && (
          <button
            onClick={onOpenAdd}
            className="mb-3 flex h-[7.5rem] w-[7.5rem] flex-col items-center justify-center gap-1.5 rounded-full border border-dashed border-walnut-500/30 bg-parchment-paper/70 text-charcoal-600/50 backdrop-blur-[1px] transition-colors hover:border-moss-500 hover:text-moss-600"
          >
            <Sprout size={26} strokeWidth={1.5} />
            <span className="text-[11px] font-medium">Plant something new</span>
          </button>
        )}
      </div>

      {showEmptyMessage && (
        <p className="relative pb-6 text-center text-sm text-charcoal-600/60">
          Nothing planted yet — start with something you want to do every day.
        </p>
      )}
    </div>
  );
}
