"use client";

import { useState } from "react";
import { Flag, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";
import { useToday } from "@/hooks/useToday";
import { useRestDays } from "@/components/rest/RestDaysProvider";
import { challengeProgress, challengeReward } from "@/lib/challenges";
import { Button } from "@/components/ui/Button";
import type { Challenge, HabitWithCompletions } from "@/types";

const PRESETS = [7, 14, 30, 60, 100];

/** A focused "every day for N days" push on one habit. */
export function ChallengePanel({
  habit,
  challenge,
  onChanged,
}: {
  habit: HabitWithCompletions;
  challenge: Challenge | null;
  onChanged: () => void;
}) {
  const { now } = useToday();
  const restDays = useRestDays();
  const [busy, setBusy] = useState(false);
  const [target, setTarget] = useState(30);

  async function start() {
    setBusy(true);
    try {
      await api.createChallenge(habit.id, target);
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function finish(action: "complete" | "abandon") {
    if (!challenge) return;
    setBusy(true);
    try {
      await api.finishChallenge(challenge.id, action);
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  if (!challenge) {
    return (
      <div>
        <h3 className="mb-2 flex items-center gap-1.5 text-xs font-medium tracking-wide text-charcoal-600/60 uppercase">
          <Flag size={12} strokeWidth={2} />
          Challenge
        </h3>
        <p className="mb-2 text-sm text-charcoal-600/70">
          Commit to a run of days. Finishing earns bonus growth.
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          {PRESETS.map((d) => (
            <button
              key={d}
              onClick={() => setTarget(d)}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs transition-colors",
                target === d
                  ? "bg-moss-600 text-parchment-50"
                  : "bg-canopy-800/6 text-charcoal-600/70 hover:bg-canopy-800/12"
              )}
            >
              {d} days
            </button>
          ))}
          <Button size="sm" variant="secondary" onClick={start} disabled={busy} className="ml-auto">
            {busy ? "Starting…" : `Start · +${challengeReward(target)}`}
          </Button>
        </div>
      </div>
    );
  }

  const p = challengeProgress(challenge, habit, now, restDays);

  return (
    <div>
      <h3 className="mb-2 flex items-center gap-1.5 text-xs font-medium tracking-wide text-charcoal-600/60 uppercase">
        <Flag size={12} strokeWidth={2} />
        Challenge
      </h3>

      <div className="rounded-md border border-walnut-500/15 bg-parchment-paper/60 p-3">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-sm text-charcoal-800">
            {p.done} of {p.targetDays} days
          </span>
          <span className="text-xs text-charcoal-600/50">
            {p.complete ? `+${challengeReward(p.targetDays)} growth earned` : `${p.targetDays - p.done} to go`}
          </span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-canopy-800/8">
          <div
            className={cn("h-full rounded-full transition-all duration-500", p.complete ? "bg-amber-500" : "bg-moss-600")}
            style={{ width: `${Math.round(p.fraction * 100)}%` }}
          />
        </div>

        {p.missed > 0 && !p.complete && (
          <p className="mt-2 text-xs text-charcoal-600/50">
            {p.missed} missed day{p.missed === 1 ? "" : "s"} so far — they don&apos;t reset it, they just slow it down.
          </p>
        )}

        <div className="mt-3 flex items-center justify-end gap-2">
          {p.complete ? (
            <Button size="sm" onClick={() => finish("complete")} disabled={busy}>
              <Trophy size={14} />
              Claim it
            </Button>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => finish("abandon")} disabled={busy}>
              Give up
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
