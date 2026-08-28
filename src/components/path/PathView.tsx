"use client";

import { useState } from "react";

import { Award, Crosshair, Flame, Sprout, Target } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Collection } from "@/components/path/Collection";
import {
  computeUnlocks,
  currentTitle,
  MILESTONES,
  pathProgress,
  type GrowthSummary,
} from "@/lib/progression";
import { Trail } from "@/components/path/Trail";

export function PathView({
  growth,
}: {
  growth: GrowthSummary;
}) {
  const [scrollToken, setScrollToken] = useState(0);
  const progress = pathProgress(growth.points);
  const unlocks = computeUnlocks(growth.points);

  return (
    <div>
      <h1 className="font-serif text-3xl text-canopy-900">The Path</h1>
      <p className="mt-1 text-sm text-charcoal-600">
        Every finished day grows the garden a little further along.
      </p>

      {/* Current standing */}
      <div className="mt-8 rounded-xl border border-walnut-500/15 bg-parchment-paper p-5 shadow-soft">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-charcoal-600/50 uppercase">
              <Sprout size={12} strokeWidth={2} />
              Growth
            </p>
            <p className="mt-1 font-serif text-4xl text-canopy-950">{growth.points}</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-moss-600">
              <Award size={13} strokeWidth={2} />
              {currentTitle(growth.points)}
            </p>
          </div>
          <div className="text-right text-xs text-charcoal-600/60">
            <p>
              <span className="text-canopy-900">{growth.habitDays}</span> habit-days finished
            </p>
            <p className="mt-0.5">
              <span className="text-canopy-900">{growth.perfectDays}</span> perfect day
              {growth.perfectDays === 1 ? "" : "s"} <span className="text-charcoal-600/40">(+3 each)</span>
            </p>
            {growth.streakPoints > 0 && (
              <p className="mt-0.5 flex items-center justify-end gap-1">
                <Flame size={11} className="text-amber-500" strokeWidth={2} />
                <span className="text-canopy-900">+{growth.streakPoints}</span> from streak milestones
              </p>
            )}
            {growth.challengePoints > 0 && (
              <p className="mt-0.5 flex items-center justify-end gap-1">
                <Target size={11} className="text-walnut-500" strokeWidth={2} />
                <span className="text-canopy-900">+{growth.challengePoints}</span> from challenges
              </p>
            )}
          </div>
        </div>

        <div className="mt-4">
          {progress.next ? (
            <>
              <div className="mb-1.5 flex items-baseline justify-between text-xs">
                <span className="text-charcoal-600/70">
                  Next: <span className="text-canopy-900">{progress.next.name}</span>
                </span>
                <span className="tabular-nums text-charcoal-600/50">
                  {progress.pointsToNext} to go
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-canopy-800/8">
                <div
                  className="h-full rounded-full bg-moss-600 transition-all duration-700"
                  style={{ width: `${Math.round(progress.fractionToNext * 100)}%` }}
                />
              </div>
            </>
          ) : (
            <p className="text-sm text-moss-600">
              The whole path is walked. Every plant, ground and ornament is yours.
            </p>
          )}
        </div>
      </div>

      {/* Everything earnable, owned and not */}
      <section className="mt-10">
        <Collection unlocks={unlocks} />
      </section>

      {/* The trail itself */}
      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xs font-medium tracking-wide text-charcoal-600/60 uppercase">The trail</h2>
          <Button size="sm" variant="secondary" onClick={() => setScrollToken((t) => t + 1)}>
            <Crosshair size={14} />
            Where am I
          </Button>
        </div>
        <Trail milestones={MILESTONES} progress={progress} scrollToken={scrollToken} />
      </section>

    </div>
  );
}
