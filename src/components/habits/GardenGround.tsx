"use client";

import { useId } from "react";
import type { Season } from "@/lib/season";
import type { GroundId } from "@/lib/progression";

interface GroundPalette {
  grass: string;
  soilTop: string;
  soilBottom: string;
  sky: string;
  /** How lush the tufts along the edge look. */
  tuftOpacity: number;
}

const GROUNDS: Record<GroundId, GroundPalette> = {
  meadow: {
    grass: "var(--sage-400)",
    soilTop: "var(--walnut-700)",
    soilBottom: "var(--walnut-900)",
    sky: "var(--sage-300)",
    tuftOpacity: 0.6,
  },
  forest: {
    grass: "var(--moss-600)",
    soilTop: "var(--canopy-800)",
    soilBottom: "var(--canopy-950)",
    sky: "var(--moss-500)",
    tuftOpacity: 0.75,
  },
  riverbank: {
    grass: "var(--moss-500)",
    soilTop: "var(--tan-400)",
    soilBottom: "var(--walnut-700)",
    sky: "var(--sage-300)",
    tuftOpacity: 0.8,
  },
  desert: {
    grass: "var(--olive-500)",
    soilTop: "var(--tan-300)",
    soilBottom: "var(--tan-400)",
    sky: "var(--amber-500)",
    tuftOpacity: 0.35,
  },
  alpine: {
    grass: "var(--sage-300)",
    soilTop: "var(--charcoal-600)",
    soilBottom: "var(--canopy-950)",
    sky: "var(--parchment-100)",
    tuftOpacity: 0.45,
  },
  orchard: {
    grass: "var(--moss-500)",
    soilTop: "var(--walnut-500)",
    soilBottom: "var(--walnut-800)",
    sky: "var(--tan-300)",
    tuftOpacity: 0.55,
  },
  wildflower: {
    grass: "var(--sage-400)",
    soilTop: "var(--olive-500)",
    soilBottom: "var(--walnut-800)",
    sky: "var(--clay-500)",
    tuftOpacity: 0.95,
  },
  tundra: {
    grass: "var(--parchment-100)",
    soilTop: "var(--canopy-700)",
    soilBottom: "var(--canopy-950)",
    sky: "var(--sage-300)",
    tuftOpacity: 0.3,
  },
};

// Seasonal tint layered over whichever ground you've chosen.
const SEASON_SKY: Record<Season, string> = {
  spring: "var(--sage-300)",
  summer: "var(--tan-300)",
  autumn: "var(--amber-500)",
  winter: "var(--parchment-100)",
};

const EDGE = "M0,14 C60,8 120,22 200,12 C280,4 340,18 400,10";

const TUFTS = [
  { x: 22, y: 16 },
  { x: 54, y: 9 },
  { x: 96, y: 19 },
  { x: 138, y: 8 },
  { x: 176, y: 15 },
  { x: 214, y: 6 },
  { x: 252, y: 16 },
  { x: 290, y: 7 },
  { x: 328, y: 18 },
  { x: 366, y: 9 },
];

/**
 * The garden bed's ground plane. Soil fills the whole bed rather than a
 * thin strip, so however many rows of plants wrap inside it, every one
 * sits on real ground.
 *
 * `vibrancy` (0–100, the blended habits+tasks discipline score) deepens
 * the soil's richness — ambient atmosphere on top of the plants themselves.
 */
export function GardenGround({
  season,
  vibrancy = 60,
  ground = "meadow",
}: {
  season: Season;
  vibrancy?: number;
  ground?: GroundId;
}) {
  const uid = useId();
  const pal = GROUNDS[ground] ?? GROUNDS.meadow;
  const v = Math.max(0, Math.min(100, vibrancy)) / 100;
  const topOpacity = 0.2 + v * 0.16;
  const bottomOpacity = 0.5 + v * 0.24;

  return (
    <svg
      viewBox="0 0 400 100"
      preserveAspectRatio="none"
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--parchment-paper)" stopOpacity="0" />
          <stop offset="100%" stopColor={SEASON_SKY[season]} stopOpacity="0.12" />
        </linearGradient>
        <linearGradient id={`${uid}-soil`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={pal.soilTop} stopOpacity={topOpacity} />
          <stop offset="100%" stopColor={pal.soilBottom} stopOpacity={bottomOpacity} />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="400" height="18" fill={`url(#${uid}-sky)`} />

      <path d={`${EDGE} L400,100 L0,100 Z`} fill={`url(#${uid}-soil)`} />
      <path d={EDGE} stroke={pal.grass} strokeWidth="2.2" fill="none" opacity="0.55" />

      {TUFTS.map((t, i) => (
        <path
          key={i}
          d={`M${t.x - 3} ${t.y + 4} Q${t.x - 2} ${t.y - 3} ${t.x} ${t.y + 3} Q${t.x + 1} ${t.y - 4} ${t.x + 4} ${t.y + 4}`}
          stroke={pal.grass}
          strokeWidth="1.1"
          fill="none"
          opacity={pal.tuftOpacity}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}
