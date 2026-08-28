import { cn } from "@/lib/utils";
import type { Season } from "@/lib/season";
import type { AmbienceId } from "@/lib/progression";

// Fixed, not randomized per render — a stable little swarm rather than one
// that jumps around on every refresh.
const SLOTS = [
  { left: "6%", duration: 13, delay: 0 },
  { left: "18%", duration: 16, delay: 3 },
  { left: "33%", duration: 11, delay: 1.5 },
  { left: "49%", duration: 15, delay: 5 },
  { left: "64%", duration: 12, delay: 2 },
  { left: "80%", duration: 17, delay: 6 },
  { left: "92%", duration: 14, delay: 4 },
];

interface MoteStyle {
  size: number;
  color: string;
  shape: "circle" | "leaf" | "streak";
  /** Multiplier on the drift duration — rain falls fast, pollen hangs. */
  speed: number;
  glow?: boolean;
}

const SEASON_MOTE: Record<Season, MoteStyle> = {
  winter: { size: 5, color: "rgba(255,255,255,0.75)", shape: "circle", speed: 1 },
  spring: { size: 6, color: "var(--tan-300)", shape: "leaf", speed: 1 },
  summer: { size: 4, color: "var(--amber-500)", shape: "circle", speed: 1 },
  autumn: { size: 7, color: "var(--clay-500)", shape: "leaf", speed: 1 },
};

const AMBIENCE_MOTE: Record<Exclude<AmbienceId, "seasonal">, MoteStyle> = {
  fireflies: { size: 4, color: "var(--amber-500)", shape: "circle", speed: 1.6, glow: true },
  petals: { size: 6, color: "var(--sage-300)", shape: "leaf", speed: 1.15 },
  rain: { size: 2, color: "var(--sage-400)", shape: "streak", speed: 0.32 },
  pollen: { size: 3, color: "var(--amber-500)", shape: "circle", speed: 1.9 },
  snow: { size: 5, color: "rgba(255,255,255,0.8)", shape: "circle", speed: 1.5 },
  leaves: { size: 7, color: "var(--clay-500)", shape: "leaf", speed: 1.25 },
};

/**
 * The drifting particle field. Defaults to whatever the real season is;
 * once other ambiences are unlocked it becomes a deliberate choice.
 */
export function GardenMotes({ season, ambience = "seasonal" }: { season: Season; ambience?: AmbienceId }) {
  const style = ambience === "seasonal" ? SEASON_MOTE[season] : AMBIENCE_MOTE[ambience];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {SLOTS.map((slot, i) => (
        <span
          key={i}
          className={cn(
            "mote",
            style.shape === "circle" && "rounded-full",
            style.shape === "leaf" && "rounded-[2px]",
            style.shape === "streak" && "rounded-full",
            style.glow && "mote-glow"
          )}
          style={{
            left: slot.left,
            width: style.size,
            height: style.shape === "streak" ? style.size * 5 : style.size,
            background: style.color,
            animationDuration: `${slot.duration * style.speed}s`,
            animationDelay: `${slot.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
