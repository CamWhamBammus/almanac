"use client";

import { useEffect } from "react";
import { Sparkles, X } from "lucide-react";
import { PlantArt } from "@/components/habits/PlantArt";
import { rewardLabel, type Milestone } from "@/lib/progression";

/**
 * The payoff moment. Crossing a milestone used to be completely silent —
 * you'd only find out by visiting the Path — which wasted the whole point
 * of a progression system.
 */
export function UnlockToast({ milestones, onDismiss }: { milestones: Milestone[]; onDismiss: () => void }) {
  useEffect(() => {
    if (milestones.length === 0) return;
    const t = setTimeout(onDismiss, 9000);
    return () => clearTimeout(t);
  }, [milestones, onDismiss]);

  if (milestones.length === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 left-1/2 z-50 w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2"
    >
      <div className="unlock-toast overflow-hidden rounded-xl border border-moss-600/30 bg-parchment-paper shadow-lifted">
        <div className="flex items-center justify-between border-b border-moss-600/15 bg-moss-600/8 px-4 py-2">
          <p className="flex items-center gap-1.5 text-sm font-medium text-moss-600">
            <Sparkles size={14} strokeWidth={2} />
            {milestones.length === 1 ? "Unlocked" : `${milestones.length} unlocked`}
          </p>
          <button
            onClick={onDismiss}
            aria-label="Dismiss"
            className="rounded p-1 text-charcoal-600/40 hover:bg-canopy-800/8 hover:text-charcoal-800"
          >
            <X size={14} />
          </button>
        </div>

        <div className="divide-y divide-walnut-500/8">
          {milestones.map((m) => (
            <div key={`${m.reward.kind}:${m.reward.id}`} className="flex items-center gap-3 px-4 py-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-moss-600/25 bg-moss-600/8">
                {m.reward.kind === "plant" ? (
                  <PlantArt type={m.reward.id} health={82} size={34} />
                ) : (
                  <Sparkles size={17} className="text-moss-600" strokeWidth={1.75} />
                )}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-canopy-900">{rewardLabel(m.reward)}</p>
                <p className="truncate text-xs text-charcoal-600/60">{m.blurb}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
