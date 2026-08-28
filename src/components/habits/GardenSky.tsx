"use client";

import { useId } from "react";
import type { ReactNode } from "react";
import type { SkyId } from "@/lib/progression";
import type { Season } from "@/lib/season";

interface SkyPalette {
  /** Top-of-bed colour and how strongly it washes down over the scene. */
  top: string;
  bottom: string;
  opacity: number;
  extras?: (uid: string) => ReactNode;
}

// Fixed positions rather than random, so the sky doesn't reshuffle on every render.
const STARS = [
  { x: 24, y: 8, r: 0.9 },
  { x: 58, y: 15, r: 0.7 },
  { x: 96, y: 6, r: 1 },
  { x: 141, y: 13, r: 0.8 },
  { x: 178, y: 5, r: 0.7 },
  { x: 214, y: 12, r: 1 },
  { x: 252, y: 7, r: 0.8 },
  { x: 288, y: 14, r: 0.7 },
  { x: 322, y: 6, r: 0.9 },
  { x: 360, y: 12, r: 0.8 },
  { x: 386, y: 4, r: 0.7 },
];

const SKIES: Record<SkyId, SkyPalette> = {
  // The original look: a barely-there seasonal wash, tinted by the caller.
  clear: { top: "var(--parchment-paper)", bottom: "var(--sage-300)", opacity: 0.14 },

  dawn: {
    top: "var(--clay-500)",
    bottom: "var(--amber-500)",
    opacity: 0.34,
    extras: () => <circle cx="322" cy="18" r="8" fill="var(--amber-500)" opacity="0.55" />,
  },

  overcast: {
    top: "var(--charcoal-600)",
    bottom: "var(--charcoal-600)",
    opacity: 0.3,
    extras: () => (
      <g opacity="0.3" fill="var(--parchment-paper)">
        <ellipse cx="88" cy="13" rx="46" ry="8" />
        <ellipse cx="250" cy="9" rx="58" ry="7" />
        <ellipse cx="356" cy="17" rx="40" ry="6" />
      </g>
    ),
  },

  dusk: {
    top: "var(--walnut-700)",
    bottom: "var(--clay-500)",
    opacity: 0.4,
    extras: () => <circle cx="76" cy="20" r="7" fill="var(--amber-500)" opacity="0.55" />,
  },

  starry: {
    top: "var(--canopy-950)",
    bottom: "var(--canopy-800)",
    opacity: 0.48,
    extras: () => (
      <g>
        {STARS.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="var(--parchment-paper)" opacity="0.75" />
        ))}
        <circle cx="352" cy="16" r="5.5" fill="var(--parchment-100)" opacity="0.5" />
      </g>
    ),
  },

  misty: {
    top: "var(--parchment-100)",
    bottom: "var(--sage-300)",
    opacity: 0.38,
    extras: () => (
      <g opacity="0.5">
        <ellipse cx="110" cy="17" rx="70" ry="4" fill="var(--parchment-paper)" />
        <ellipse cx="290" cy="11" rx="86" ry="3.4" fill="var(--parchment-paper)" />
      </g>
    ),
  },

  aurora: {
    top: "var(--canopy-950)",
    bottom: "var(--moss-600)",
    opacity: 0.45,
    extras: (uid) => (
      <g opacity="0.5">
        <defs>
          <linearGradient id={`${uid}-aur`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--sage-400)" stopOpacity="0" />
            <stop offset="45%" stopColor="var(--sage-300)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="var(--moss-500)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0 14 C90 2 150 20 220 8 C290 -3 350 13 400 5" stroke={`url(#${uid}-aur)`} strokeWidth="6" fill="none" />
        <path d="M0 22 C80 12 160 26 240 16 C310 8 360 20 400 14" stroke={`url(#${uid}-aur)`} strokeWidth="3.5" fill="none" />
        {STARS.slice(0, 6).map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r * 0.8} fill="var(--parchment-paper)" opacity="0.6" />
        ))}
      </g>
    ),
  },
};

/** Seasonal tint, only used when the sky is left on "Clear". */
const SEASON_TINT: Record<Season, string> = {
  spring: "var(--sage-300)",
  summer: "var(--tan-300)",
  autumn: "var(--amber-500)",
  winter: "var(--parchment-100)",
};

/**
 * The band above the grass line. Ground covers the soil; this covers
 * everything above it, so the two together make the whole scene
 * customisable rather than just its bottom half.
 */
export function GardenSky({ sky, season }: { sky: SkyId; season: Season }) {
  const uid = useId();
  const pal = SKIES[sky] ?? SKIES.clear;
  const bottom = sky === "clear" ? SEASON_TINT[season] : pal.bottom;

  return (
    <svg
      viewBox="0 0 400 100"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={pal.top} stopOpacity={pal.opacity} />
          <stop offset="55%" stopColor={bottom} stopOpacity={pal.opacity * 0.5} />
          <stop offset="100%" stopColor={bottom} stopOpacity={0} />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="400" height="46" fill={`url(#${uid}-sky)`} />
      {pal.extras?.(uid)}
    </svg>
  );
}
