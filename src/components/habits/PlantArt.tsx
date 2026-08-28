import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { PlantType } from "@/types";

/**
 * Math.cos/Math.sin aren't guaranteed bit-identical across V8 builds, so
 * trig-derived coordinates can differ in their last decimals between SSR
 * and hydration. Rounding past any visible precision swallows that noise.
 */
function r4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

/**
 * A pointed leaf/frond growing from (0,0) up to (0,-len). Every species
 * builds from this rather than bare ellipses — a lens silhouette reads as
 * foliage even at one or two leaves, which is what the old circle-scatter
 * art got wrong.
 */
function leafPath(len: number, width: number): string {
  const w = r4(width);
  const l = r4(len);
  return `M0 0 C${-w} ${r4(-l * 0.35)} ${r4(-w * 0.6)} ${r4(-l * 0.82)} 0 ${-l} C${r4(w * 0.6)} ${r4(-l * 0.82)} ${w} ${r4(-l * 0.35)} 0 0Z`;
}

interface Part {
  threshold: number;
  /** Where the part attaches — it scales up out of this point as health rises. */
  x: number;
  y: number;
  rotate?: number;
  node: ReactNode;
}

interface Species {
  /** Always drawn, whatever the health — the plant's skeleton. */
  skeleton: (stem: string, leaf: string) => ReactNode;
  parts: (leaf: string) => Part[];
}

const THRESHOLDS = [4, 13, 22, 32, 42, 52, 62, 72, 84];

/** Spreads n parts across the growth thresholds so every species fills in at a comparable pace. */
function spread(n: number): number[] {
  if (n === 1) return [THRESHOLDS[0]];
  return Array.from({ length: n }, (_, i) => THRESHOLDS[Math.round((i / (n - 1)) * (THRESHOLDS.length - 1))]);
}

function leaf(fill: string, len: number, width: number, opacity = 0.9) {
  return <path d={leafPath(len, width)} fill={fill} opacity={opacity} />;
}

const SPECIES: Record<PlantType, Species> = {
  TREE: {
    skeleton: (stem) => (
      <>
        <path d="M45 100 C45 84 46 66 47 52 L53 52 C54 66 55 84 55 100Z" fill={stem} />
        <path d="M49 62 L38 50M51 58 L62 46" stroke={stem} strokeWidth="2.6" strokeLinecap="round" fill="none" />
      </>
    ),
    parts: (f) => {
      const spots = [
        { x: 50, y: 36, r: 15 },
        { x: 34, y: 44, r: 11 },
        { x: 66, y: 42, r: 11 },
        { x: 50, y: 20, r: 12 },
        { x: 26, y: 33, r: 8 },
        { x: 74, y: 32, r: 8 },
        { x: 38, y: 24, r: 9 },
        { x: 62, y: 22, r: 9 },
        { x: 50, y: 9, r: 7 },
      ];
      const t = spread(spots.length);
      return spots.map((s, i) => ({
        threshold: t[i],
        x: s.x,
        y: s.y,
        node: <circle r={s.r} fill={f} opacity="0.92" />,
      }));
    },
  },

  PINE: {
    skeleton: (stem) => <path d="M46 100 L46 74 L54 74 L54 100Z" fill={stem} />,
    parts: (f) => {
      // Stacked triangular tiers, widest at the bottom.
      const tiers = [
        { y: 76, w: 30, h: 20 },
        { y: 58, w: 26, h: 19 },
        { y: 42, w: 21, h: 17 },
        { y: 28, w: 16, h: 15 },
        { y: 16, w: 11, h: 13 },
      ];
      const t = spread(tiers.length);
      return tiers.map((tier, i) => ({
        threshold: t[i],
        x: 50,
        y: tier.y,
        node: (
          <path
            d={`M${-tier.w} 0 L0 ${-tier.h} L${tier.w} 0 C${tier.w * 0.4} ${tier.h * 0.28} ${-tier.w * 0.4} ${tier.h * 0.28} ${-tier.w} 0Z`}
            fill={f}
            opacity="0.92"
          />
        ),
      }));
    },
  },

  WILLOW: {
    skeleton: (stem) => (
      <>
        <path d="M46 100 C46 82 44 66 46 48 L54 48 C56 66 54 82 54 100Z" fill={stem} />
        <path
          d="M50 50 C38 46 31 40 27 34M50 50 C62 46 69 40 73 34"
          stroke={stem}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      </>
    ),
    parts: (f) => {
      // Canopy mass first, then trailing strands outward — so a struggling
      // willow still reads as a crown with a couple of tendrils rather than
      // a bare tuning fork.
      const canopy = [
        { x: 50, y: 30, r: 13 },
        { x: 34, y: 34, r: 10 },
        { x: 66, y: 34, r: 10 },
        { x: 50, y: 19, r: 9 },
      ];
      const strands = [
        { x: 50, y: 36, len: 30, rot: 180 },
        { x: 38, y: 40, len: 26, rot: 176 },
        { x: 62, y: 40, len: 26, rot: 184 },
        { x: 27, y: 38, len: 22, rot: 171 },
        { x: 73, y: 38, len: 22, rot: 189 },
      ];
      const t = spread(canopy.length + strands.length);
      const out: Part[] = canopy.map((c, i) => ({
        threshold: t[i],
        x: c.x,
        y: c.y,
        node: <circle r={c.r} fill={f} opacity="0.9" />,
      }));
      strands.forEach((s, i) => {
        out.push({
          threshold: t[canopy.length + i],
          x: s.x,
          y: s.y,
          rotate: s.rot,
          node: leaf(f, s.len, 4.5, 0.8),
        });
      });
      return out;
    },
  },

  BUSH: {
    skeleton: (stem) => <path d="M47 100 L47 84 L53 84 L53 100Z" fill={stem} />,
    parts: (f) => {
      const spots = [
        { x: 50, y: 70, r: 16 },
        { x: 33, y: 76, r: 12 },
        { x: 67, y: 76, r: 12 },
        { x: 50, y: 54, r: 12 },
        { x: 24, y: 82, r: 9 },
        { x: 76, y: 82, r: 9 },
        { x: 37, y: 56, r: 9 },
        { x: 63, y: 56, r: 9 },
        { x: 50, y: 44, r: 8 },
      ];
      const t = spread(spots.length);
      return spots.map((s, i) => ({
        threshold: t[i],
        x: s.x,
        y: s.y,
        node: <circle r={s.r} fill={f} opacity="0.92" />,
      }));
    },
  },

  FLOWER: {
    skeleton: (stem, leafColor) => (
      <>
        <path d="M50 100 C50 82 49 60 50 34" stroke={stem} strokeWidth="3" fill="none" strokeLinecap="round" />
        <g transform="translate(50 68) rotate(-58)">
          <path d={leafPath(17, 6)} fill={leafColor} opacity="0.75" />
        </g>
        <g transform="translate(50 78) rotate(58)">
          <path d={leafPath(15, 5.5)} fill={leafColor} opacity="0.75" />
        </g>
      </>
    ),
    parts: (f) => {
      const petals = 8;
      const t = spread(petals + 1);
      const out: Part[] = [
        { threshold: t[0], x: 50, y: 26, node: <circle r="5" fill="var(--amber-500)" opacity="0.95" /> },
      ];
      for (let i = 0; i < petals; i++) {
        const angle = r4((i / petals) * 360);
        out.push({
          threshold: t[i + 1],
          x: 50,
          y: 26,
          rotate: angle,
          node: leaf(f, 15, 5.5),
        });
      }
      return out;
    },
  },

  SUNFLOWER: {
    skeleton: (stem, leafColor) => (
      <>
        <path d="M50 100 C50 80 48 54 50 30" stroke={stem} strokeWidth="4" fill="none" strokeLinecap="round" />
        <g transform="translate(49 66) rotate(-62)">
          <path d={leafPath(22, 9)} fill={leafColor} opacity="0.8" />
        </g>
        <g transform="translate(50 80) rotate(64)">
          <path d={leafPath(20, 8)} fill={leafColor} opacity="0.8" />
        </g>
      </>
    ),
    parts: (f) => {
      const petals = 10;
      const t = spread(petals + 1);
      const out: Part[] = [
        { threshold: t[0], x: 50, y: 24, node: <circle r="7.5" fill="var(--walnut-700)" opacity="0.9" /> },
      ];
      for (let i = 0; i < petals; i++) {
        const angle = r4((i / petals) * 360);
        out.push({
          threshold: t[i + 1],
          x: 50,
          y: 24,
          rotate: angle,
          node: leaf("var(--amber-500)", 16, 5),
        });
      }
      // f is used for the leaves on the skeleton; petals stay golden.
      void f;
      return out;
    },
  },

  LAVENDER: {
    skeleton: (stem) => (
      <>
        <path
          d="M50 100 C50 84 50 70 50 56M50 100 C46 84 40 72 36 60M50 100 C54 84 60 72 64 60"
          stroke={stem}
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
        />
      </>
    ),
    parts: (f) => {
      // Three spikes, each a stack of small buds filling bottom-up.
      const spikes = [
        { x: 36, y: 60, rot: -14 },
        { x: 50, y: 56, rot: 0 },
        { x: 64, y: 60, rot: 14 },
      ];
      const perSpike = 3;
      const t = spread(spikes.length * perSpike);
      const out: Part[] = [];
      spikes.forEach((s, si) => {
        for (let b = 0; b < perSpike; b++) {
          out.push({
            threshold: t[si + b * spikes.length],
            x: s.x,
            y: s.y - b * 9,
            rotate: s.rot,
            node: <ellipse rx="4.5" ry="7" cy="-5" fill={f} opacity="0.9" />,
          });
        }
      });
      return out;
    },
  },

  SUCCULENT: {
    skeleton: (stem) => (
      <>
        {/* A real pot, so a struggling succulent still reads as a plant in a pot. */}
        <path d="M32 74 L36 96 C36 98 38 99 40 99 L60 99 C62 99 64 98 64 96 L68 74Z" fill={stem} opacity="0.85" />
        <rect x="30" y="70" width="40" height="6" rx="2" fill={stem} />
      </>
    ),
    parts: (f) => {
      // Rosette: an outer ring of fat pointed leaves, then an inner ring, then the core.
      const outer = 6;
      const inner = 4;
      const t = spread(outer + inner + 1);
      const out: Part[] = [];
      for (let i = 0; i < outer; i++) {
        const angle = r4((i / outer) * 360);
        out.push({ threshold: t[i], x: 50, y: 62, rotate: angle, node: leaf(f, 20, 9, 0.85) });
      }
      for (let i = 0; i < inner; i++) {
        const angle = r4((i / inner) * 360 + 45);
        out.push({ threshold: t[outer + i], x: 50, y: 62, rotate: angle, node: leaf(f, 13, 6.5) });
      }
      out.push({ threshold: t[outer + inner], x: 50, y: 62, node: <circle r="3.5" fill={f} /> });
      return out;
    },
  },

  CACTUS: {
    skeleton: (stem, leafColor) => (
      <>
        <ellipse cx="50" cy="97" rx="17" ry="3.5" fill={stem} opacity="0.5" />
        {/* The barrel is the plant — always present, so it never reads as debris. */}
        <path d="M42 96 C40 78 40 58 43 46 C45 39 55 39 57 46 C60 58 60 78 58 96Z" fill={leafColor} opacity="0.55" />
      </>
    ),
    parts: (f) => {
      const t = spread(5);
      return [
        // Left arm
        { threshold: t[0], x: 42, y: 70, node: <path d="M0 0 C-10 0 -14 -4 -14 -12 C-14 -18 -8 -18 -8 -12 L-8 -2Z" fill={f} opacity="0.9" /> },
        // Right arm
        { threshold: t[1], x: 58, y: 62, node: <path d="M0 0 C10 0 14 -4 14 -14 C14 -20 8 -20 8 -14 L8 -2Z" fill={f} opacity="0.9" /> },
        // Body fill deepens
        { threshold: t[2], x: 50, y: 96, node: <path d="M-8 0 C-10 -18 -10 -38 -7 -50 C-5 -57 5 -57 7 -50 C10 -38 10 -18 8 0Z" fill={f} opacity="0.85" /> },
        // Blooms
        { threshold: t[3], x: 44, y: 40, node: <circle r="3.5" fill="var(--clay-500)" opacity="0.95" /> },
        { threshold: t[4], x: 57, y: 37, node: <circle r="3" fill="var(--clay-500)" opacity="0.95" /> },
      ];
    },
  },

  FERN: {
    skeleton: (stem) => (
      <>
        <ellipse cx="50" cy="97" rx="13" ry="3" fill={stem} opacity="0.45" />
        {/* A visible crown the fronds arch out of. */}
        <path d="M46 97 C47 88 49 84 50 80 C51 84 53 88 54 97Z" fill={stem} />
      </>
    ),
    parts: (f) => {
      // Fronds as tapering arcs with visible pinnae, fanning symmetrically.
      const fronds = [
        { rot: -74, len: 40 },
        { rot: 74, len: 40 },
        { rot: -50, len: 46 },
        { rot: 50, len: 46 },
        { rot: -26, len: 50 },
        { rot: 26, len: 50 },
        { rot: 0, len: 54 },
      ];
      const t = spread(fronds.length);
      return fronds.map((fr, i) => ({
        threshold: t[i],
        x: 50,
        y: 82,
        rotate: fr.rot,
        node: (
          <g>
            <path
              d={`M0 0 Q${r4(fr.len * 0.14)} ${r4(-fr.len * 0.55)} 0 ${-fr.len}`}
              stroke={f}
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
            {Array.from({ length: 5 }, (_, k) => {
              const at = r4(-fr.len * (0.24 + k * 0.16));
              const size = r4(9 - k * 1.3);
              return (
                <g key={k} transform={`translate(0 ${at})`}>
                  <ellipse cx={r4(-size * 0.5)} rx={size} ry="2.4" fill={f} opacity="0.88" transform="rotate(-24)" />
                  <ellipse cx={r4(size * 0.5)} rx={size} ry="2.4" fill={f} opacity="0.88" transform="rotate(24)" />
                </g>
              );
            })}
          </g>
        ),
      }));
    },
  },

  VINE: {
    skeleton: (stem) => (
      <>
        {/* A trellis, so the climber has something to hold even when bare. */}
        <path d="M38 98 L38 14M62 98 L62 14" stroke={stem} strokeWidth="2" opacity="0.5" strokeLinecap="round" />
        <path d="M38 76 L62 76M38 52 L62 52M38 28 L62 28" stroke={stem} strokeWidth="1.6" opacity="0.4" strokeLinecap="round" />
        <path
          d="M50 100 C42 88 58 76 50 64 C42 52 58 40 50 28 C46 22 48 18 50 12"
          stroke={stem}
          strokeWidth="2.6"
          fill="none"
          strokeLinecap="round"
        />
      </>
    ),
    parts: (f) => {
      const spots = [
        { x: 44, y: 88, rot: -60 },
        { x: 56, y: 78, rot: 60 },
        { x: 43, y: 68, rot: -60 },
        { x: 57, y: 56, rot: 60 },
        { x: 43, y: 46, rot: -60 },
        { x: 57, y: 34, rot: 60 },
        { x: 48, y: 22, rot: -40 },
        { x: 53, y: 14, rot: 40 },
      ];
      const t = spread(spots.length);
      return spots.map((s, i) => ({
        threshold: t[i],
        x: s.x,
        y: s.y,
        rotate: s.rot,
        node: leaf(f, 13, 6),
      }));
    },
  },

  MUSHROOM: {
    skeleton: (stem) => (
      <>
        <ellipse cx="50" cy="97" rx="15" ry="3" fill={stem} opacity="0.45" />
        <path d="M45 96 C44 82 44 70 46 62 L54 62 C56 70 56 82 55 96Z" fill={stem} />
      </>
    ),
    parts: (f) => {
      const t = spread(5);
      return [
        // Main cap
        { threshold: t[0], x: 50, y: 62, node: <path d="M-22 0 C-22 -20 22 -20 22 0 C10 4 -10 4 -22 0Z" fill={f} opacity="0.92" /> },
        // Spots
        { threshold: t[1], x: 42, y: 54, node: <circle r="3" fill="var(--parchment-paper)" opacity="0.5" /> },
        { threshold: t[2], x: 57, y: 51, node: <circle r="2.4" fill="var(--parchment-paper)" opacity="0.5" /> },
        // A smaller companion mushroom
        { threshold: t[3], x: 71, y: 88, node: <path d="M-3 10 L-2 0 L2 0 L3 10Z" fill={f} opacity="0.7" /> },
        { threshold: t[4], x: 71, y: 88, node: <path d="M-11 0 C-11 -10 11 -10 11 0 C5 2 -5 2 -11 0Z" fill={f} opacity="0.9" /> },
      ];
    },
  },
};

const FALLEN = [
  { cx: 32, cy: 97, rx: 4, ry: 2, rotate: -20 },
  { cx: 47, cy: 99, rx: 3.5, ry: 1.8, rotate: 10 },
  { cx: 63, cy: 96, rx: 4, ry: 2, rotate: -8 },
];

export function PlantArt({
  type,
  health,
  size = 96,
  sway = false,
  swayDelay = 0,
  watered = false,
  className,
}: {
  type: PlantType;
  health: number;
  size?: number;
  /** Idle canopy sway — off by default so preview/picker instances stay still. */
  sway?: boolean;
  swayDelay?: number;
  /** Transient "just watered" flourish: a quick bounce plus a few sparkles. */
  watered?: boolean;
  className?: string;
}) {
  const species = SPECIES[type] ?? SPECIES.TREE;
  const dying = health < 15;
  const thriving = health >= 88;

  // Continuous brown→green blend rather than a hard flip at the midpoint.
  const leafColor = `color-mix(in srgb, var(--clay-500) ${100 - health}%, var(--moss-600) ${health}%)`;
  const stemColor = dying ? "var(--charcoal-600)" : "var(--walnut-700)";

  const parts = species.parts(leafColor);

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-hidden="true"
      className={cn("overflow-visible", watered && "completion-pop", className)}
      style={{ transformOrigin: "50% 100%" }}
    >
      <ellipse cx="50" cy="99" rx="24" ry="2.2" fill="var(--walnut-500)" opacity="0.1" />

      {dying &&
        FALLEN.map((l, i) => (
          <ellipse
            key={i}
            cx={l.cx}
            cy={l.cy}
            rx={l.rx}
            ry={l.ry}
            fill="var(--clay-500)"
            opacity="0.55"
            transform={`rotate(${l.rotate} ${l.cx} ${l.cy})`}
          />
        ))}

      {species.skeleton(stemColor, leafColor)}

      <g className={sway ? "plant-sway" : undefined} style={sway ? { animationDelay: `${swayDelay}s` } : undefined}>
        {parts.map((p, i) => {
          const grown = health >= p.threshold;
          return (
            <g
              key={i}
              className="transition-transform duration-700 ease-out"
              style={{
                transform: `translate(${p.x}px, ${p.y}px) rotate(${p.rotate ?? 0}deg) scale(${grown ? 1 : 0})`,
                transformOrigin: "0 0",
              }}
            >
              {p.node}
            </g>
          );
        })}
      </g>

      {/* Thriving accents sit on the plant's own highest growth rather than
          at a fixed height — a floating dot above a short plant read as a
          rendering artifact, not a bloom. */}
      {thriving &&
        [...parts]
          .sort((a, b) => a.y - b.y)
          .slice(0, 3)
          .map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="2.1" fill="var(--amber-500)" opacity="0.9" />
          ))}
    </svg>
  );
}
