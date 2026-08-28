"use client";

import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlantArt } from "@/components/habits/PlantArt";
import { RewardGlyph } from "@/components/path/RewardGlyph";
import {
  AMBIENCE_LABELS,
  CRITTER_LABELS,
  GROUND_LABELS,
  MILESTONES,
  ORNAMENT_LABELS,
  SKY_LABELS,
  TITLE_LABELS,
  type Reward,
  type Unlocks,
} from "@/lib/progression";
import { PLANT_TYPE_LABELS, PLANT_TYPE_ORDER } from "@/types";
import type { PlantType } from "@/types";

/** Cost of every non-starter reward, keyed by "kind:id". */
const COST = new Map<string, number>(MILESTONES.map((m) => [`${m.reward.kind}:${m.reward.id}`, m.points]));

interface Group {
  title: string;
  items: { reward: Reward; label: string; owned: boolean }[];
}

function buildGroups(unlocks: Unlocks): Group[] {
  const g = <K extends Reward["kind"]>(
    kind: K,
    labels: Record<string, string>,
    owned: Set<string>
  ): Group["items"] =>
    Object.keys(labels).map((id) => ({
      reward: { kind, id } as Reward,
      label: labels[id],
      owned: owned.has(id),
    }));

  return [
    {
      title: "Plants",
      items: PLANT_TYPE_ORDER.map((p) => ({
        reward: { kind: "plant", id: p } as Reward,
        label: PLANT_TYPE_LABELS[p],
        owned: unlocks.plants.has(p),
      })),
    },
    { title: "Ground", items: g("ground", GROUND_LABELS, unlocks.grounds as Set<string>) },
    { title: "Sky", items: g("sky", SKY_LABELS, unlocks.skies as Set<string>) },
    { title: "Ambience", items: g("ambience", AMBIENCE_LABELS, unlocks.ambiences as Set<string>) },
    { title: "Ornaments", items: g("ornament", ORNAMENT_LABELS, unlocks.ornaments as Set<string>) },
    { title: "Critters", items: g("critter", CRITTER_LABELS, unlocks.critters as Set<string>) },
    { title: "Titles", items: g("title", TITLE_LABELS, unlocks.titles as Set<string>) },
  ];
}

/**
 * Everything earnable, in one place. The trail shows what's *next*; this
 * shows what you actually own — otherwise unlocks only ever appear scattered
 * down thousands of pixels of scroll.
 */
export function Collection({ unlocks }: { unlocks: Unlocks }) {
  const groups = buildGroups(unlocks);
  const owned = groups.reduce((n, gr) => n + gr.items.filter((i) => i.owned).length, 0);
  const total = groups.reduce((n, gr) => n + gr.items.length, 0);

  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-xs font-medium tracking-wide text-charcoal-600/60 uppercase">Collection</h2>
        <span className="text-xs tabular-nums text-charcoal-600/50">
          {owned} of {total}
        </span>
      </div>

      <div className="flex flex-col gap-5">
        {groups.map((group) => {
          const have = group.items.filter((i) => i.owned).length;
          return (
            <section key={group.title}>
              <h3 className="mb-2 flex items-baseline gap-2 text-[11px] font-medium tracking-wide text-charcoal-600/45 uppercase">
                {group.title}
                <span className="tabular-nums text-charcoal-600/35">
                  {have}/{group.items.length}
                </span>
              </h3>

              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                {group.items.map((item) => {
                  const key = `${item.reward.kind}:${item.reward.id}`;
                  const cost = COST.get(key);
                  return (
                    <div
                      key={key}
                      title={
                        item.owned
                          ? item.label
                          : cost
                            ? `${item.label} — reach ${cost} growth`
                            : item.label
                      }
                      className={cn(
                        "relative flex flex-col items-center gap-1 rounded-md border px-1.5 py-2 text-center",
                        item.owned
                          ? "border-walnut-500/15 bg-parchment-paper shadow-soft"
                          : "border-walnut-500/10 bg-charcoal-600/[0.03]"
                      )}
                    >
                      <div className={cn("flex h-10 items-center", !item.owned && "opacity-25 grayscale")}>
                        {item.reward.kind === "plant" ? (
                          <PlantArt type={item.reward.id as PlantType} health={80} size={38} />
                        ) : (
                          <RewardGlyph reward={item.reward} muted={!item.owned} />
                        )}
                      </div>

                      {!item.owned && (
                        <span className="absolute inset-x-0 top-3 flex justify-center">
                          <Lock size={12} className="text-charcoal-600/40" strokeWidth={2} />
                        </span>
                      )}

                      <span
                        className={cn(
                          "line-clamp-2 text-[10px] leading-tight",
                          item.owned ? "text-charcoal-600/75" : "text-charcoal-600/35"
                        )}
                      >
                        {item.owned ? item.label : cost ? `${cost}` : item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
