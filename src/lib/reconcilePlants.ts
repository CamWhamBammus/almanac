import { prisma } from "./db";
import { computeGrowth, computeUnlocks, plantsNeedingReassignment } from "./progression";
import { restDayKeys } from "./restDays";
import { claimedChallengeDays } from "./challengeGrowth";
import type { HabitWithCompletions } from "@/types";

/**
 * Moves any habit whose species isn't unlocked onto one that is.
 *
 * Runs server-side before the garden renders. It's idempotent — after the
 * first pass nothing is locked, so subsequent loads write nothing — and it
 * only ever reassigns *cosmetics*, never completion history.
 *
 * Returns the habits with the corrected species applied, so the caller can
 * render immediately without a re-query.
 */
export async function reconcilePlants<T extends HabitWithCompletions>(
  allHabits: T[]
): Promise<{ habits: T[]; changed: number }> {
  // Must use the same rest-day-aware Growth as everywhere else, or this
  // could decide a plant is locked when the rest of the app says otherwise
  // and reassign a species out from under you.
  const growth = computeGrowth(allHabits, new Date(), new Set(await restDayKeys()), await claimedChallengeDays());
  const unlocked = computeUnlocks(growth.points).plants;
  const moves = plantsNeedingReassignment(allHabits, unlocked);

  if (moves.length === 0) return { habits: allHabits, changed: 0 };

  await prisma.$transaction(
    moves.map((m) => prisma.habit.update({ where: { id: m.id }, data: { plantType: m.to } }))
  );

  const byId = new Map(moves.map((m) => [m.id, m.to]));
  return {
    habits: allHabits.map((h) => (byId.has(h.id) ? { ...h, plantType: byId.get(h.id)! } : h)),
    changed: moves.length,
  };
}
