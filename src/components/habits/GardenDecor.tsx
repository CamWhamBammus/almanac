import type { ReactNode } from "react";
import type { CritterId, OrnamentId } from "@/lib/progression";

/**
 * Ornaments and critters, each positioned individually rather than drawn
 * into one stretched SVG.
 *
 * The ground layer deliberately uses preserveAspectRatio="none" — a soil
 * gradient and a wavy grass line *should* stretch to whatever shape the bed
 * is. Discrete objects must not: in a 400x100 viewBox stretched across a bed
 * of a different aspect ratio, a ladybug becomes an oval and the distortion
 * shifts with the window size. So each piece here gets its own correctly
 * proportioned SVG, absolutely positioned as a percentage of the bed.
 */
interface Decor {
  /** Horizontal placement, % from the left edge of the bed. */
  left: number;
  /** Vertical placement, % from the bottom. Soil starts ~85% below the top. */
  bottom: number;
  /** Rendered width in px; height follows from the art's own aspect ratio. */
  width: number;
  viewBox: string;
  art: ReactNode;
}

export const ORNAMENT_DECOR: Record<OrnamentId, Decor> = {
  fence: {
    left: 50,
    bottom: 62,
    width: 999, // spans the bed; clamped by max-width in the renderer
    viewBox: "0 0 400 26",
    art: (
      <g opacity="0.45">
        <path d="M0 10 H400M0 18 H400" stroke="var(--walnut-700)" strokeWidth="1.6" />
        {Array.from({ length: 21 }, (_, i) => (
          <path
            key={i}
            d={`M${i * 20 + 6} 3 v20`}
            stroke="var(--walnut-700)"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        ))}
      </g>
    ),
  },

  beehive: {
    left: 7,
    bottom: 8,
    width: 34,
    viewBox: "0 0 30 30",
    art: (
      <g opacity="0.8">
        <ellipse cx="15" cy="28" rx="13" ry="2" fill="var(--walnut-900)" opacity="0.3" />
        <path d="M4 27 h22 v-5 h-22Z" fill="var(--tan-400)" />
        <path d="M5 22 h20 v-6 h-20Z" fill="var(--tan-400)" />
        <path d="M7 16 h16 v-6 h-16Z" fill="var(--tan-400)" />
        <path d="M10 10 C10 4 20 4 20 10Z" fill="var(--tan-400)" />
        <circle cx="15" cy="20" r="1.8" fill="var(--walnut-900)" opacity="0.6" />
      </g>
    ),
  },

  pond: {
    left: 22,
    bottom: 5,
    width: 78,
    viewBox: "0 0 60 20",
    art: (
      <g opacity="0.8">
        <ellipse cx="30" cy="11" rx="29" ry="8" fill="var(--sage-400)" opacity="0.35" />
        <ellipse cx="30" cy="11" rx="25" ry="6" fill="var(--sage-300)" opacity="0.5" />
        <ellipse cx="22" cy="9" rx="6" ry="1.6" fill="var(--parchment-paper)" opacity="0.4" />
        <ellipse cx="40" cy="13" rx="4" ry="1.2" fill="var(--moss-600)" opacity="0.5" />
      </g>
    ),
  },

  stones: {
    left: 44,
    bottom: 4,
    width: 128,
    viewBox: "0 0 120 16",
    art: (
      <g opacity="0.5">
        {[
          { x: 10, y: 11, r: 8 },
          { x: 34, y: 6, r: 7 },
          { x: 60, y: 11, r: 8.5 },
          { x: 86, y: 6, r: 7 },
          { x: 110, y: 10, r: 8 },
        ].map((s, i) => (
          <ellipse key={i} cx={s.x} cy={s.y} rx={s.r} ry={s.r * 0.45} fill="var(--charcoal-600)" opacity="0.6" />
        ))}
      </g>
    ),
  },

  sundial: {
    left: 62,
    bottom: 9,
    width: 40,
    viewBox: "0 0 32 30",
    art: (
      <g opacity="0.72">
        <ellipse cx="16" cy="28" rx="10" ry="2" fill="var(--walnut-900)" opacity="0.3" />
        <path d="M13 27 L14 12 h4 L19 27Z" fill="var(--charcoal-600)" />
        <ellipse cx="16" cy="11" rx="12" ry="3.6" fill="var(--charcoal-600)" />
        <ellipse cx="16" cy="10" rx="9.5" ry="2.6" fill="var(--tan-300)" opacity="0.8" />
        <path d="M16 10 l4.5 -7.5" stroke="var(--charcoal-600)" strokeWidth="1.8" strokeLinecap="round" />
      </g>
    ),
  },

  birdbath: {
    left: 78,
    bottom: 8,
    width: 42,
    viewBox: "0 0 34 32",
    art: (
      <g opacity="0.78">
        <ellipse cx="17" cy="30" rx="10" ry="2" fill="var(--walnut-900)" opacity="0.3" />
        <path d="M14 29 L15 12 h4 L20 29Z" fill="var(--charcoal-600)" />
        <ellipse cx="17" cy="11" rx="13" ry="4.2" fill="var(--charcoal-600)" />
        <ellipse cx="17" cy="10" rx="10" ry="2.8" fill="var(--sage-300)" opacity="0.75" />
      </g>
    ),
  },

  lantern: {
    left: 92,
    bottom: 8,
    width: 34,
    viewBox: "0 0 28 40",
    art: (
      <g opacity="0.78">
        <ellipse cx="14" cy="38" rx="10" ry="2" fill="var(--walnut-900)" opacity="0.3" />
        <path d="M7 37 h14 l-2 -6 h-10Z" fill="var(--charcoal-600)" />
        <path d="M10 31 h8 v-7 h-8Z" fill="var(--charcoal-600)" />
        <rect x="8" y="14" width="12" height="10" rx="1.5" fill="var(--charcoal-600)" />
        <rect x="10.5" y="16.5" width="7" height="5" rx="1" fill="var(--amber-500)" opacity="0.9" />
        <path d="M6 14 h16 l-3 -4 h-10Z" fill="var(--charcoal-600)" />
      </g>
    ),
  },

  scarecrow: {
    left: 86,
    bottom: 14,
    width: 46,
    viewBox: "0 0 36 60",
    art: (
      <g opacity="0.72">
        <path d="M18 58 V12" stroke="var(--walnut-700)" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M6 24 H30" stroke="var(--walnut-700)" strokeWidth="2" strokeLinecap="round" />
        <path d="M7 22 l-2 7M29 22 l2 7" stroke="var(--tan-400)" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M9 24 h18 l-3 16 h-12Z" fill="var(--clay-500)" opacity="0.78" />
        <circle cx="18" cy="10" r="6" fill="var(--tan-400)" />
        <path d="M10 7 h16 l-2 -3 h-12Z" fill="var(--tan-400)" />
        <circle cx="16" cy="9.4" r="0.8" fill="var(--walnut-900)" />
        <circle cx="20.4" cy="9.4" r="0.8" fill="var(--walnut-900)" />
      </g>
    ),
  },

  birdfeeder: {
    left: 33,
    bottom: 14,
    width: 34,
    viewBox: "0 0 28 56",
    art: (
      <g opacity="0.72">
        <path d="M14 54 V16" stroke="var(--walnut-700)" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M5 18 h18 l-2 5 h-14Z" fill="var(--walnut-500)" />
        <path d="M4 16 L14 8 L24 16Z" fill="var(--clay-500)" opacity="0.85" />
        <circle cx="14" cy="20" r="1.4" fill="var(--walnut-900)" opacity="0.5" />
      </g>
    ),
  },

  well: {
    left: 15,
    bottom: 9,
    width: 52,
    viewBox: "0 0 40 44",
    art: (
      <g opacity="0.72">
        <ellipse cx="20" cy="42" rx="14" ry="2" fill="var(--walnut-900)" opacity="0.28" />
        <path d="M8 41 v-16 h24 v16Z" fill="var(--charcoal-600)" opacity="0.85" />
        <path d="M8 29 h24M8 34 h24" stroke="var(--walnut-900)" strokeWidth="0.8" opacity="0.4" />
        <ellipse cx="20" cy="25" rx="12" ry="3.4" fill="var(--charcoal-600)" />
        <ellipse cx="20" cy="24.6" rx="9" ry="2.4" fill="var(--canopy-900)" opacity="0.55" />
        <path d="M10 23 V10M30 23 V10" stroke="var(--walnut-700)" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M6 10 L20 2 L34 10Z" fill="var(--walnut-500)" opacity="0.9" />
      </g>
    ),
  },
};

export const CRITTER_DECOR: Record<CritterId, Decor> = {
  ladybug: {
    left: 53,
    bottom: 11,
    width: 14,
    viewBox: "0 0 14 14",
    art: (
      <g>
        <ellipse cx="7" cy="8" rx="4.4" ry="3.5" fill="var(--clay-500)" />
        <path d="M7 4.5 V11.5" stroke="var(--walnut-900)" strokeWidth="0.7" />
        <circle cx="5" cy="7.4" r="0.85" fill="var(--walnut-900)" />
        <circle cx="9" cy="8.8" r="0.85" fill="var(--walnut-900)" />
        <circle cx="5.6" cy="9.6" r="0.7" fill="var(--walnut-900)" />
        <circle cx="7" cy="3.6" r="1.8" fill="var(--walnut-900)" />
      </g>
    ),
  },

  butterfly: {
    left: 30,
    bottom: 58,
    width: 22,
    viewBox: "0 0 22 20",
    art: (
      <g>
        <ellipse cx="11" cy="10" rx="0.9" ry="3.6" fill="var(--walnut-900)" opacity="0.8" />
        <path d="M10.4 8.4 C4 3 1 9 5 11.6 C7.4 13 9.6 11.6 10.4 10Z" fill="var(--amber-500)" opacity="0.92" />
        <path d="M11.6 8.4 C18 3 21 9 17 11.6 C14.6 13 12.4 11.6 11.6 10Z" fill="var(--amber-500)" opacity="0.92" />
        <path d="M10.4 10 C6 12 5 16 8 16.6 C9.6 16.8 10.3 14 10.4 11.6Z" fill="var(--clay-500)" opacity="0.88" />
        <path d="M11.6 10 C16 12 17 16 14 16.6 C12.4 16.8 11.7 14 11.6 11.6Z" fill="var(--clay-500)" opacity="0.88" />
      </g>
    ),
  },

  bee: {
    left: 12,
    bottom: 66,
    width: 16,
    viewBox: "0 0 16 14",
    art: (
      <g>
        <ellipse cx="8" cy="9" rx="4.2" ry="3" fill="var(--amber-500)" />
        <path d="M6.4 6.2 V11.8M9 6.3 V11.7" stroke="var(--walnut-900)" strokeWidth="1.1" />
        <ellipse cx="6.6" cy="5.4" rx="3.2" ry="1.9" fill="var(--parchment-paper)" opacity="0.6" />
        <ellipse cx="10.2" cy="5.6" rx="2.8" ry="1.7" fill="var(--parchment-paper)" opacity="0.6" />
      </g>
    ),
  },

  snail: {
    left: 41,
    bottom: 5,
    width: 24,
    viewBox: "0 0 22 14",
    art: (
      <g>
        <path d="M3 11 C0 11 0 7.5 3.5 7.5 L11 7.5" stroke="var(--tan-400)" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <path d="M3 7.5 v-3.2M4.8 7.5 v-2.6" stroke="var(--tan-400)" strokeWidth="0.8" strokeLinecap="round" />
        <circle cx="13" cy="7" r="4.6" fill="var(--walnut-500)" opacity="0.92" />
        <path d="M13 7 m0 -2.8 a2.8 2.8 0 1 1 -2 0.9" stroke="var(--parchment-paper)" strokeWidth="0.85" fill="none" opacity="0.55" />
      </g>
    ),
  },

  bird: {
    left: 71,
    bottom: 9,
    width: 26,
    viewBox: "0 0 24 18",
    art: (
      <g>
        <ellipse cx="12" cy="11" rx="5.6" ry="4.3" fill="var(--charcoal-600)" opacity="0.88" />
        <ellipse cx="12" cy="12.4" rx="3.6" ry="2.6" fill="var(--clay-500)" opacity="0.95" />
        <circle cx="7.6" cy="7.4" r="3.1" fill="var(--charcoal-600)" opacity="0.88" />
        <circle cx="6.8" cy="7" r="0.7" fill="var(--parchment-paper)" opacity="0.85" />
        <path d="M4.6 7.6 l-2.8 1 l2.8 1Z" fill="var(--amber-500)" />
        <path d="M16 10 l6 2.4 l-6 0.8Z" fill="var(--charcoal-600)" opacity="0.7" />
      </g>
    ),
  },

  rabbit: {
    left: 4,
    bottom: 6,
    width: 32,
    viewBox: "0 0 28 26",
    art: (
      <g>
        <ellipse cx="11" cy="19" rx="7.2" ry="5.2" fill="var(--tan-400)" opacity="0.92" />
        <circle cx="18" cy="15.4" r="3.7" fill="var(--tan-400)" opacity="0.92" />
        <path d="M17 12.4 C16.4 6 18 5 18.6 11.6Z" fill="var(--tan-400)" opacity="0.92" />
        <path d="M19.4 12.2 C19.8 6 21.4 5.6 20.8 12Z" fill="var(--tan-400)" opacity="0.92" />
        <circle cx="19.4" cy="15" r="0.7" fill="var(--walnut-900)" />
        <circle cx="4" cy="20" r="2.4" fill="var(--parchment-paper)" opacity="0.65" />
      </g>
    ),
  },
};

function DecorLayer({ items }: { items: Decor[] }) {
  if (items.length === 0) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {items.map((d, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${d.left}%`,
            bottom: `${d.bottom}%`,
            width: d.width >= 999 ? "100%" : d.width,
            transform: d.width >= 999 ? "translateX(-50%)" : "translate(-50%, 0)",
          }}
        >
          {/* No preserveAspectRatio override — each piece keeps its true shape. */}
          <svg viewBox={d.viewBox} className="h-auto w-full">
            {d.art}
          </svg>
        </div>
      ))}
    </div>
  );
}

const ORNAMENT_ORDER: OrnamentId[] = [
  "fence",
  "scarecrow",
  "birdfeeder",
  "well",
  "beehive",
  "pond",
  "sundial",
  "stones",
  "birdbath",
  "lantern",
];

const CRITTER_ORDER: CritterId[] = ["butterfly", "bee", "ladybug", "snail", "bird", "rabbit"];

export function GardenOrnaments({ unlocked }: { unlocked: Set<OrnamentId> }) {
  return <DecorLayer items={ORNAMENT_ORDER.filter((id) => unlocked.has(id)).map((id) => ORNAMENT_DECOR[id])} />;
}

export function GardenCritters({ unlocked }: { unlocked: Set<CritterId> }) {
  return <DecorLayer items={CRITTER_ORDER.filter((id) => unlocked.has(id)).map((id) => CRITTER_DECOR[id])} />;
}
