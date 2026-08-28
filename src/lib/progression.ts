import { addDays } from "date-fns";
import { toDateKey } from "./dateKey";
import { habitStart, isScheduledDay, longestStreak } from "./streak";
import { PLANT_TYPE_LABELS, PLANT_TYPE_ORDER } from "@/types";
import type { HabitWithCompletions, PlantType } from "@/types";

/* ————————————————————————————————————————————————————————————
   Growth — the garden's progression currency.

   Deliberately NOT the rolling discipline score: that one rises and falls,
   and a currency that can fall would revoke things you'd already unlocked.
   Growth only counts days you actually finished, so it only ever climbs.

   It's derived from completion history rather than stored in its own
   table, so it can never drift out of sync with the underlying data.
   ———————————————————————————————————————————————————————————— */

const POINTS_PER_HABIT_DAY = 1;
const PERFECT_DAY_BONUS = 3;

/**
 * Milestone bonuses for sticking with a *single* habit. Perfect days need
 * everything done at once, which gets rare as you add habits — this makes
 * deep consistency on one thing pay off on its own.
 *
 * Awarded off each habit's longest-ever streak, so like everything else in
 * Growth it can only climb.
 */
const STREAK_BONUSES: { days: number; points: number }[] = [
  { days: 7, points: 10 },
  { days: 30, points: 40 },
  { days: 100, points: 150 },
  { days: 365, points: 600 },
];

export function streakBonusFor(longest: number): number {
  return STREAK_BONUSES.reduce((sum, b) => (longest >= b.days ? sum + b.points : sum), 0);
}

export { STREAK_BONUSES };

export interface GrowthSummary {
  points: number;
  /** Individual habit-days finished (a habit hitting its full target that day). */
  habitDays: number;
  /** Days where every scheduled habit was finished. */
  perfectDays: number;
  /** Points earned from streak milestones across all habits. */
  streakPoints: number;
  /** The streak milestones actually reached, for display. */
  streakAwards: { habit: string; days: number; points: number }[];
  /** Points from challenges you finished and claimed. */
  challengePoints: number;
}

export function computeGrowth(
  habits: HabitWithCompletions[],
  now: Date = new Date(),
  restDays?: ReadonlySet<string>,
  /** Target lengths of challenges already claimed — each pays 2x its length. */
  completedChallengeDays: number[] = []
): GrowthSummary {
  if (habits.length === 0)
    return { points: 0, habitDays: 0, perfectDays: 0, streakPoints: 0, streakAwards: [], challengePoints: 0 };

  const prepared = habits.map((h) => ({
    habit: h,
    start: habitStart(h),
    done: new Map(h.completions.map((c) => [toDateKey(new Date(c.date)), c.count])),
  }));

  const earliest = prepared.reduce((min, p) => (p.start < min ? p.start : min), prepared[0].start);
  const todayKey = toDateKey(now);

  let habitDays = 0;
  let perfectDays = 0;

  for (let cursor = earliest; toDateKey(cursor) <= todayKey; cursor = addDays(cursor, 1)) {
    const key = toDateKey(cursor);
    let scheduled = 0;
    let scheduledFinished = 0;
    let earned = 0;

    for (const p of prepared) {
      if (toDateKey(p.start) > key) continue;
      const metTarget = (p.done.get(key) ?? 0) >= p.habit.targetCount;

      // Work counts whenever you did it. Tending the garden on a rest day
      // is still tending it — excusing a day must never delete credit you
      // had already earned on it.
      if (metTarget) earned++;

      if (!isScheduledDay(p.habit.daysOfWeek, cursor, restDays)) continue;
      scheduled++;
      if (metTarget) scheduledFinished++;
    }

    habitDays += earned;
    if (scheduled > 0 && scheduledFinished === scheduled) perfectDays++;
  }

  const streakAwards: GrowthSummary["streakAwards"] = [];
  let streakPoints = 0;
  for (const p of prepared) {
    const longest = longestStreak(p.habit, now, restDays);
    for (const b of STREAK_BONUSES) {
      if (longest >= b.days) {
        streakAwards.push({ habit: p.habit.name, days: b.days, points: b.points });
        streakPoints += b.points;
      }
    }
  }

  const challengePoints = completedChallengeDays.reduce((sum, d) => sum + d * 2, 0);

  return {
    points:
      habitDays * POINTS_PER_HABIT_DAY + perfectDays * PERFECT_DAY_BONUS + streakPoints + challengePoints,
    habitDays,
    perfectDays,
    streakPoints,
    streakAwards,
    challengePoints,
  };
}

/* ————————————————————————————————————————————————————————————
   The path — what Growth buys you.
   ———————————————————————————————————————————————————————————— */

export type GroundId = "meadow" | "forest" | "riverbank" | "desert" | "alpine" | "orchard" | "wildflower" | "tundra";

export type OrnamentId =
  | "stones"
  | "fence"
  | "beehive"
  | "birdbath"
  | "lantern"
  | "pond"
  | "scarecrow"
  | "sundial"
  | "birdfeeder"
  | "well";

export type CritterId = "butterfly" | "bee" | "ladybug" | "snail" | "bird" | "rabbit";

export type TitleId = "seedling" | "gardener" | "cultivator" | "groundskeeper" | "steward" | "master";

export type SkyId = "clear" | "dawn" | "overcast" | "dusk" | "starry" | "misty" | "aurora";

export type AmbienceId = "seasonal" | "fireflies" | "petals" | "rain" | "pollen" | "snow" | "leaves";

export type Reward =
  | { kind: "plant"; id: PlantType }
  | { kind: "ground"; id: GroundId }
  | { kind: "ornament"; id: OrnamentId }
  | { kind: "critter"; id: CritterId }
  | { kind: "title"; id: TitleId }
  | { kind: "sky"; id: SkyId }
  | { kind: "ambience"; id: AmbienceId };

export interface Milestone {
  points: number;
  reward: Reward;
  name: string;
  blurb: string;
}

/** Available from the very first day — enough to make a real garden immediately. */
export const STARTER_PLANTS: PlantType[] = ["TREE", "BUSH", "FLOWER"];
export const STARTER_GROUND: GroundId = "meadow";
export const STARTER_SKY: SkyId = "clear";
export const STARTER_AMBIENCE: AmbienceId = "seasonal";
export const STARTER_TITLE = "Sprout";

export const GROUND_LABELS: Record<GroundId, string> = {
  meadow: "Meadow",
  forest: "Forest floor",
  riverbank: "Riverbank",
  desert: "High desert",
  alpine: "Alpine",
  orchard: "Orchard",
  wildflower: "Wildflower",
  tundra: "Tundra",
};

export const ORNAMENT_LABELS: Record<OrnamentId, string> = {
  stones: "Stepping stones",
  fence: "Garden fence",
  beehive: "Beehive",
  birdbath: "Birdbath",
  lantern: "Stone lantern",
  pond: "Little pond",
  scarecrow: "Scarecrow",
  sundial: "Sundial",
  birdfeeder: "Bird feeder",
  well: "Stone well",
};

export const CRITTER_LABELS: Record<CritterId, string> = {
  butterfly: "Butterfly",
  bee: "Bee",
  ladybug: "Ladybug",
  snail: "Snail",
  bird: "Robin",
  rabbit: "Rabbit",
};

export const SKY_LABELS: Record<SkyId, string> = {
  clear: "Clear",
  dawn: "Dawn",
  overcast: "Overcast",
  dusk: "Dusk",
  starry: "Starry",
  misty: "Misty",
  aurora: "Aurora",
};

export const AMBIENCE_LABELS: Record<AmbienceId, string> = {
  seasonal: "Seasonal",
  fireflies: "Fireflies",
  petals: "Petals",
  rain: "Rain",
  pollen: "Pollen",
  snow: "Snow",
  leaves: "Falling leaves",
};

export const TITLE_LABELS: Record<TitleId, string> = {
  seedling: "Seedling",
  gardener: "Gardener",
  cultivator: "Cultivator",
  groundskeeper: "Groundskeeper",
  steward: "Steward of the Grove",
  master: "Master Gardener",
};

export const MILESTONES: Milestone[] = [
  { points: 5, reward: { kind: "critter", id: "ladybug" }, name: "Ladybug", blurb: "Something small takes an interest." },
  { points: 12, reward: { kind: "plant", id: "PINE" }, name: "Pine", blurb: "A conifer that keeps its colour all winter." },
  { points: 22, reward: { kind: "ornament", id: "stones" }, name: "Stepping stones", blurb: "A path worn into the bed." },
  { points: 35, reward: { kind: "sky", id: "dawn" }, name: "Dawn", blurb: "First light over the bed." },
  { points: 50, reward: { kind: "plant", id: "FERN" }, name: "Fern", blurb: "Unfurls in the shade of steadier days." },
  { points: 68, reward: { kind: "critter", id: "butterfly" }, name: "Butterfly", blurb: "Drawn to a garden worth visiting." },
  { points: 88, reward: { kind: "ground", id: "forest" }, name: "Forest floor", blurb: "Darker soil, deeper green." },
  { points: 112, reward: { kind: "ambience", id: "fireflies" }, name: "Fireflies", blurb: "Little lights, after dark." },
  { points: 140, reward: { kind: "title", id: "seedling" }, name: "Seedling", blurb: "You've stuck with it long enough to be called something." },
  { points: 172, reward: { kind: "ornament", id: "fence" }, name: "Garden fence", blurb: "The bed earns a border." },
  { points: 208, reward: { kind: "plant", id: "LAVENDER" }, name: "Lavender", blurb: "Rewards patience with scent." },
  { points: 248, reward: { kind: "critter", id: "bee" }, name: "Bee", blurb: "Word gets around." },
  { points: 292, reward: { kind: "sky", id: "overcast" }, name: "Overcast", blurb: "Soft, even light." },
  { points: 340, reward: { kind: "ornament", id: "beehive" }, name: "Beehive", blurb: "Somewhere for them to live." },
  { points: 392, reward: { kind: "plant", id: "SUCCULENT" }, name: "Succulent", blurb: "Stores what it's given." },
  { points: 448, reward: { kind: "ground", id: "wildflower" }, name: "Wildflower", blurb: "Left a little unruly on purpose." },
  { points: 508, reward: { kind: "ambience", id: "petals" }, name: "Petals", blurb: "Blossom on the breeze." },
  { points: 572, reward: { kind: "ornament", id: "birdbath" }, name: "Birdbath", blurb: "Still water to drink from." },
  { points: 640, reward: { kind: "critter", id: "bird" }, name: "Robin", blurb: "The birdbath gets used." },
  { points: 712, reward: { kind: "title", id: "gardener" }, name: "Gardener", blurb: "No longer a beginner." },
  { points: 788, reward: { kind: "plant", id: "SUNFLOWER" }, name: "Sunflower", blurb: "Turns to follow the light." },
  { points: 868, reward: { kind: "sky", id: "dusk" }, name: "Dusk", blurb: "The long gold hour." },
  { points: 952, reward: { kind: "ornament", id: "sundial" }, name: "Sundial", blurb: "The garden starts keeping time." },
  { points: 1040, reward: { kind: "ground", id: "riverbank" }, name: "Riverbank", blurb: "Damp earth and reeds." },
  { points: 1132, reward: { kind: "ambience", id: "rain" }, name: "Rain", blurb: "A steady, welcome soaking." },
  { points: 1228, reward: { kind: "plant", id: "WILLOW" }, name: "Willow", blurb: "Bends without breaking." },
  { points: 1328, reward: { kind: "ornament", id: "lantern" }, name: "Stone lantern", blurb: "The garden stays lit after dark." },
  { points: 1432, reward: { kind: "critter", id: "snail" }, name: "Snail", blurb: "In no particular hurry." },
  { points: 1540, reward: { kind: "sky", id: "starry" }, name: "Starry", blurb: "Clear enough to see everything." },
  { points: 1652, reward: { kind: "ground", id: "orchard" }, name: "Orchard", blurb: "Rows of something that bears fruit." },
  { points: 1768, reward: { kind: "title", id: "cultivator" }, name: "Cultivator", blurb: "Months of showing up." },
  { points: 1888, reward: { kind: "ornament", id: "scarecrow" }, name: "Scarecrow", blurb: "Keeps an eye on things while you're away." },
  { points: 2012, reward: { kind: "ambience", id: "pollen" }, name: "Pollen", blurb: "Heavy, golden air." },
  { points: 2140, reward: { kind: "ornament", id: "pond" }, name: "Little pond", blurb: "Still water at the bed's edge." },
  { points: 2272, reward: { kind: "plant", id: "CACTUS" }, name: "Cactus", blurb: "Thrives on very little." },
  { points: 2408, reward: { kind: "ground", id: "desert" }, name: "High desert", blurb: "Pale sand, wide sky." },
  { points: 2548, reward: { kind: "sky", id: "misty" }, name: "Misty", blurb: "The bed keeps its own weather." },
  { points: 2692, reward: { kind: "ornament", id: "birdfeeder" }, name: "Bird feeder", blurb: "Regular visitors now." },
  { points: 2840, reward: { kind: "critter", id: "rabbit" }, name: "Rabbit", blurb: "Bold enough to stay a while." },
  { points: 2992, reward: { kind: "title", id: "groundskeeper" }, name: "Groundskeeper", blurb: "The garden is unmistakably tended." },
  { points: 3148, reward: { kind: "ambience", id: "snow" }, name: "Snow", blurb: "Quiet settles over everything." },
  { points: 3308, reward: { kind: "plant", id: "VINE" }, name: "Vine", blurb: "Climbs whatever you give it." },
  { points: 3472, reward: { kind: "ornament", id: "well" }, name: "Stone well", blurb: "Water of your own." },
  { points: 3640, reward: { kind: "ground", id: "tundra" }, name: "Tundra", blurb: "Hardy growth in a hard place." },
  { points: 3812, reward: { kind: "sky", id: "aurora" }, name: "Aurora", blurb: "Rare light, earned." },
  { points: 3988, reward: { kind: "ambience", id: "leaves" }, name: "Falling leaves", blurb: "The turn of the year, whenever you like." },
  { points: 4168, reward: { kind: "ground", id: "alpine" }, name: "Alpine", blurb: "Thin air, stubborn life." },
  { points: 4352, reward: { kind: "title", id: "steward" }, name: "Steward of the Grove", blurb: "Years, not months." },
  { points: 4540, reward: { kind: "plant", id: "MUSHROOM" }, name: "Mushroom", blurb: "Appears only for the truly consistent." },
  { points: 4732, reward: { kind: "title", id: "master" }, name: "Master Gardener", blurb: "The whole path, walked." },
];

export interface Unlocks {
  plants: Set<PlantType>;
  grounds: Set<GroundId>;
  ornaments: Set<OrnamentId>;
  critters: Set<CritterId>;
  titles: Set<TitleId>;
  skies: Set<SkyId>;
  ambiences: Set<AmbienceId>;
}

export function computeUnlocks(points: number): Unlocks {
  const plants = new Set<PlantType>(STARTER_PLANTS);
  const grounds = new Set<GroundId>([STARTER_GROUND]);
  const ornaments = new Set<OrnamentId>();
  const critters = new Set<CritterId>();
  const titles = new Set<TitleId>();
  const skies = new Set<SkyId>([STARTER_SKY]);
  const ambiences = new Set<AmbienceId>([STARTER_AMBIENCE]);

  for (const m of MILESTONES) {
    if (points < m.points) continue;
    switch (m.reward.kind) {
      case "plant":
        plants.add(m.reward.id);
        break;
      case "ground":
        grounds.add(m.reward.id);
        break;
      case "ornament":
        ornaments.add(m.reward.id);
        break;
      case "critter":
        critters.add(m.reward.id);
        break;
      case "title":
        titles.add(m.reward.id);
        break;
      case "sky":
        skies.add(m.reward.id);
        break;
      case "ambience":
        ambiences.add(m.reward.id);
        break;
    }
  }

  return { plants, grounds, ornaments, critters, titles, skies, ambiences };
}

/** The highest title earned so far — everyone starts as a Sprout. */
export function currentTitle(points: number): string {
  let title = STARTER_TITLE;
  for (const m of MILESTONES) {
    if (points >= m.points && m.reward.kind === "title") title = TITLE_LABELS[m.reward.id];
  }
  return title;
}

/** Where a given plant sits on the path, for "locked" messaging. */
export function plantUnlockPoints(type: PlantType): number | null {
  const m = MILESTONES.find((x) => x.reward.kind === "plant" && x.reward.id === type);
  return m ? m.points : null;
}

export function rewardLabel(reward: Reward): string {
  switch (reward.kind) {
    case "plant":
      return PLANT_TYPE_LABELS[reward.id];
    case "ground":
      return GROUND_LABELS[reward.id];
    case "ornament":
      return ORNAMENT_LABELS[reward.id];
    case "critter":
      return CRITTER_LABELS[reward.id];
    case "title":
      return TITLE_LABELS[reward.id];
    case "sky":
      return SKY_LABELS[reward.id];
    case "ambience":
      return AMBIENCE_LABELS[reward.id];
  }
}

export interface PathProgress {
  points: number;
  reached: Milestone[];
  next: Milestone | null;
  /** 0–1 through the current gap; 1 when everything is unlocked. */
  fractionToNext: number;
  pointsToNext: number;
}

export function pathProgress(points: number): PathProgress {
  const reached = MILESTONES.filter((m) => points >= m.points);
  const next = MILESTONES.find((m) => points < m.points) ?? null;
  const prevPoints = reached.length > 0 ? reached[reached.length - 1].points : 0;

  if (!next) {
    return { points, reached, next: null, fractionToNext: 1, pointsToNext: 0 };
  }

  const span = next.points - prevPoints;
  return {
    points,
    reached,
    next,
    fractionToNext: span > 0 ? Math.min(1, Math.max(0, (points - prevPoints) / span)) : 0,
    pointsToNext: next.points - points,
  };
}

/** Stable pseudo-random index from a habit id — same choice on every render. */
function hashId(habitId: string): number {
  let h = 0;
  for (let i = 0; i < habitId.length; i++) h = (h * 31 + habitId.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Which starter a habit falls back to when nothing else is free. */
export function fallbackPlant(habitId: string): PlantType {
  return STARTER_PLANTS[hashId(habitId) % STARTER_PLANTS.length];
}

/**
 * Habits whose species is no longer available, paired with what to move
 * them to.
 *
 * Prefers species nothing else is wearing, so a garden of four habits
 * doesn't collapse into three identical flowers — only once every unlocked
 * species is spoken for does it start doubling up. Sorted by id so the
 * result is deterministic rather than dependent on query order.
 */
export function plantsNeedingReassignment(
  habits: { id: string; plantType: PlantType }[],
  unlockedPlants: Set<PlantType>
): { id: string; from: PlantType; to: PlantType }[] {
  const available = PLANT_TYPE_ORDER.filter((p) => unlockedPlants.has(p));
  if (available.length === 0) return [];

  const taken = new Set<PlantType>(
    habits.filter((h) => unlockedPlants.has(h.plantType)).map((h) => h.plantType)
  );

  const needing = habits
    .filter((h) => !unlockedPlants.has(h.plantType))
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  return needing.map((h) => {
    const free = available.filter((p) => !taken.has(p));
    const pool = free.length > 0 ? free : available;
    const to = pool[hashId(h.id) % pool.length];
    taken.add(to);
    return { id: h.id, from: h.plantType, to };
  });
}
