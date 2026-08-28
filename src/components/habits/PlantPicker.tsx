import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLANT_TYPE_LABELS, PLANT_TYPE_ORDER } from "@/types";
import type { PlantType } from "@/types";
import { plantUnlockPoints } from "@/lib/progression";
import { PlantArt } from "./PlantArt";

const PREVIEW_HEALTH = 78;

export function PlantPicker({
  value,
  onChange,
  unlocked,
}: {
  value: PlantType;
  onChange: (type: PlantType) => void;
  /** Omit to allow everything (used where gating doesn't apply). */
  unlocked?: Set<PlantType>;
}) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
      {PLANT_TYPE_ORDER.map((type) => {
        const active = type === value;
        const isLocked = !!unlocked && !unlocked.has(type);
        const at = plantUnlockPoints(type);

        return (
          <button
            key={type}
            type="button"
            onClick={() => !isLocked && onChange(type)}
            disabled={isLocked}
            aria-pressed={active}
            title={isLocked ? `Locked — reach ${at} growth on the path to plant this` : PLANT_TYPE_LABELS[type]}
            className={cn(
              "relative flex flex-col items-center gap-1 rounded-md border px-1.5 py-2 transition-colors",
              active && "border-moss-600 bg-moss-600/10",
              !active && !isLocked && "border-walnut-500/15 hover:bg-canopy-800/5",
              isLocked && "cursor-not-allowed border-walnut-500/10 bg-charcoal-600/[0.03]"
            )}
          >
            <div className={cn(isLocked && "opacity-25 grayscale")}>
              <PlantArt type={type} health={PREVIEW_HEALTH} size={40} />
            </div>

            {isLocked && (
              <span className="absolute inset-0 flex items-center justify-center">
                <Lock size={13} className="text-charcoal-600/50" strokeWidth={2} />
              </span>
            )}

            <span
              className={cn(
                "text-[11px]",
                active ? "text-moss-600" : isLocked ? "text-charcoal-600/35" : "text-charcoal-600/70"
              )}
            >
              {isLocked && at ? at : PLANT_TYPE_LABELS[type]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
