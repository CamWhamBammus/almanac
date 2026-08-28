"use client";

import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import {
  AMBIENCE_LABELS,
  GROUND_LABELS,
  MILESTONES,
  SKY_LABELS,
  type AmbienceId,
  type GroundId,
  type SkyId,
  type Unlocks,
} from "@/lib/progression";

/** Where each cosmetic sits on the path, for the locked hint. */
const COST = new Map<string, number>(MILESTONES.map((m) => [`${m.reward.kind}:${m.reward.id}`, m.points]));

function Row<T extends string>({
  title,
  hint,
  options,
  labels,
  unlocked,
  value,
  kind,
  onChange,
}: {
  title: string;
  hint: string;
  options: T[];
  labels: Record<T, string>;
  unlocked: Set<T>;
  value: T;
  kind: string;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <h3 className="text-xs font-medium tracking-wide text-charcoal-600/60 uppercase">{title}</h3>
      <p className="mt-0.5 mb-2 text-xs text-charcoal-600/45">{hint}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const isLocked = !unlocked.has(opt);
          const at = COST.get(`${kind}:${opt}`);
          return (
            <button
              key={opt}
              onClick={() => !isLocked && onChange(opt)}
              disabled={isLocked}
              title={isLocked && at ? `Locked — reach ${at} growth` : labels[opt]}
              className={cn(
                "flex items-center gap-1 rounded-full px-3 py-1 text-xs transition-colors",
                opt === value && !isLocked && "bg-moss-600 text-parchment-50",
                opt !== value && !isLocked && "bg-canopy-800/6 text-charcoal-600/75 hover:bg-canopy-800/12",
                isLocked && "cursor-not-allowed bg-charcoal-600/[0.04] text-charcoal-600/30"
              )}
            >
              {isLocked && <Lock size={9} strokeWidth={2.5} />}
              {isLocked && at ? at : labels[opt]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CustomizeGardenModal({
  open,
  onClose,
  unlocks,
  ground,
  sky,
  ambience,
  onGround,
  onSky,
  onAmbience,
}: {
  open: boolean;
  onClose: () => void;
  unlocks: Unlocks;
  ground: GroundId;
  sky: SkyId;
  ambience: AmbienceId;
  onGround: (g: GroundId) => void;
  onSky: (s: SkyId) => void;
  onAmbience: (a: AmbienceId) => void;
}) {
  const lockedCount =
    Object.keys(GROUND_LABELS).length -
    unlocks.grounds.size +
    (Object.keys(SKY_LABELS).length - unlocks.skies.size) +
    (Object.keys(AMBIENCE_LABELS).length - unlocks.ambiences.size);

  return (
    <Modal open={open} onClose={onClose} title="Customise the garden" width="lg">
      <div className="flex flex-col gap-6">
        <Row
          title="Ground"
          hint="What the bed is planted in."
          options={Object.keys(GROUND_LABELS) as GroundId[]}
          labels={GROUND_LABELS}
          unlocked={unlocks.grounds}
          value={ground}
          kind="ground"
          onChange={onGround}
        />
        <Row
          title="Sky"
          hint="The light above it."
          options={Object.keys(SKY_LABELS) as SkyId[]}
          labels={SKY_LABELS}
          unlocked={unlocks.skies}
          value={sky}
          kind="sky"
          onChange={onSky}
        />
        <Row
          title="Ambience"
          hint="What drifts through. Seasonal follows the real calendar."
          options={Object.keys(AMBIENCE_LABELS) as AmbienceId[]}
          labels={AMBIENCE_LABELS}
          unlocked={unlocks.ambiences}
          value={ambience}
          kind="ambience"
          onChange={onAmbience}
        />

        {lockedCount > 0 && (
          <p className="border-t border-walnut-500/10 pt-4 text-xs text-charcoal-600/50">
            {lockedCount} more to unlock along the Path — the number on a locked option is the growth it takes.
          </p>
        )}
      </div>
    </Modal>
  );
}
