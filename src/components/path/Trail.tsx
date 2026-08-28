"use client";

import { useEffect, useRef } from "react";
import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlantArt } from "@/components/habits/PlantArt";
import { rewardLabel, type Milestone, type PathProgress } from "@/lib/progression";
import { RewardGlyph } from "@/components/path/RewardGlyph";

const ROW = 116;
const NODE = 56;
/** How far the trail is allowed to wander side to side. */
const BAND = 64;

/**
 * A smooth, repeating meander — not random, so the trail looks the same
 * every visit. Rounded because Math.sin isn't guaranteed bit-identical
 * across V8 builds, and raw floats here serialise differently between SSR
 * and hydration (React flags that as a mismatch).
 */
function offsetFor(i: number): number {
  return Math.round((Math.sin(i * 0.85) * 0.5 + 0.5) * BAND * 100) / 100;
}

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

function nodePoint(i: number) {
  return { x: offsetFor(i) + NODE / 2, y: i * ROW + ROW / 2 };
}

/** Cubic segments through each point, flattening vertically at the ends of each hop. */
function trailPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const dy = (b.y - a.y) / 2;
    d += ` C ${a.x} ${r2(a.y + dy)}, ${b.x} ${r2(b.y - dy)}, ${b.x} ${b.y}`;
  }
  return d;
}

export function Trail({
  milestones,
  progress,
  scrollToken,
}: {
  milestones: Milestone[];
  progress: PathProgress;
  /** Bumping this re-centres the view on your position. */
  scrollToken?: number;
}) {
  const pinRef = useRef<HTMLDivElement>(null);
  const n = milestones.length;
  const height = n * ROW;

  // A virtual start point at the very top, so "no milestones yet" still shows
  // forward motion along the trail rather than sitting at zero.
  const points = [{ x: offsetFor(0) + NODE / 2, y: 0 }, ...milestones.map((_, i) => nodePoint(i))];
  const d = trailPath(points);

  const reachedCount = progress.reached.length;
  const walked = r2(Math.min(1, (reachedCount + progress.fractionToNext) / n));

  // Where the "you are here" pin sits, interpolated along the current hop.
  const from = points[Math.min(reachedCount, points.length - 1)];
  const to = points[Math.min(reachedCount + 1, points.length - 1)];
  const f = progress.next ? progress.fractionToNext : 1;
  const pin = { x: r2(from.x + (to.x - from.x) * f), y: r2(from.y + (to.y - from.y) * f) };

  // A 50-stop trail is thousands of pixels tall; landing at the very top
  // every visit means hunting for where you actually are.
  useEffect(() => {
    pinRef.current?.scrollIntoView({ block: "center", behavior: scrollToken ? "smooth" : "auto" });
  }, [scrollToken]);

  return (
    <div className="relative" style={{ height }}>
      {/* Scroll anchor tracking the pin, so "where am I" is one jump away. */}
      <div ref={pinRef} className="absolute" style={{ top: pin.y, left: 0, width: 1, height: 1 }} aria-hidden="true" />
      <svg
        width={BAND + NODE}
        height={height}
        viewBox={`0 0 ${BAND + NODE} ${height}`}
        className="absolute top-0 left-0"
        aria-hidden="true"
      >
        {/* The trail ahead */}
        <path
          d={d}
          fill="none"
          stroke="var(--walnut-500)"
          strokeOpacity="0.22"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray="1 9"
        />
        {/* The part you've walked. pathLength normalises the dash maths to 0–100. */}
        <path
          d={d}
          fill="none"
          stroke="var(--moss-600)"
          strokeWidth="5"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${r2(walked * 100)} 100`}
          className="transition-[stroke-dasharray] duration-700"
        />

        <g>
          <circle cx={pin.x} cy={pin.y} r="8" fill="var(--moss-600)" opacity="0.18" />
          <circle cx={pin.x} cy={pin.y} r="4.5" fill="var(--moss-600)" />
          <circle cx={pin.x} cy={pin.y} r="1.8" fill="var(--parchment-paper)" />
        </g>
      </svg>

      <ol className="relative">
        {milestones.map((m, i) => {
          const reached = progress.points >= m.points;
          const isNext = progress.next?.points === m.points;
          const left = offsetFor(i);

          return (
            <li
              key={`${m.reward.kind}:${m.reward.id}`}
              className="absolute flex items-center gap-4"
              style={{ top: i * ROW + (ROW - NODE) / 2, left: 0, right: 0 }}
            >
              <span
                className={cn(
                  "relative z-10 flex shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  reached
                    ? "border-moss-600 bg-moss-600/10"
                    : isNext
                      ? "border-dashed border-moss-500/60 bg-parchment-paper"
                      : "border-walnut-500/15 bg-parchment-paper"
                )}
                style={{ width: NODE, height: NODE, marginLeft: left }}
              >
                {m.reward.kind === "plant" ? (
                  <div className={cn(!reached && "opacity-30 grayscale")}>
                    <PlantArt type={m.reward.id} health={82} size={40} />
                  </div>
                ) : (
                  <RewardGlyph reward={m.reward} muted={!reached} />
                )}

                <span
                  className={cn(
                    "absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full",
                    reached
                      ? "bg-moss-600 text-parchment-50"
                      : "border border-walnut-500/20 bg-parchment-paper text-charcoal-600/40"
                  )}
                >
                  {reached ? <Check size={11} strokeWidth={3} /> : <Lock size={10} strokeWidth={2.5} />}
                </span>
              </span>

              <div className="min-w-0 flex-1 pr-2">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className={cn("text-sm font-medium", reached ? "text-canopy-900" : "text-charcoal-600/60")}>
                    {rewardLabel(m.reward)}
                  </span>
                  <span className="text-[11px] tracking-wide text-charcoal-600/40 uppercase">{m.reward.kind}</span>
                  {isNext && (
                    <span className="rounded-full bg-moss-600/12 px-2 py-0.5 text-[11px] text-moss-600">
                      {progress.pointsToNext} to go
                    </span>
                  )}
                </div>
                <p className={cn("mt-0.5 text-sm", reached ? "text-charcoal-600/70" : "text-charcoal-600/40")}>
                  {m.blurb}
                </p>
                <p className="mt-1 text-[11px] tabular-nums text-charcoal-600/40">{m.points} growth</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
