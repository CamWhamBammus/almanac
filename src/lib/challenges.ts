import { addDays } from "date-fns";
import { toDateKey } from "./dateKey";
import { completedKeys, isScheduledDay } from "./streak";
import type { Challenge, HabitWithCompletions } from "@/types";

/** Growth awarded for finishing a challenge — scales with how long it was. */
export function challengeReward(targetDays: number): number {
  return targetDays * 2;
}

export interface ChallengeProgress {
  challenge: Challenge;
  /** Scheduled days completed since the challenge began. */
  done: number;
  targetDays: number;
  fraction: number;
  complete: boolean;
  /** Days elapsed that were scheduled but missed. */
  missed: number;
}

/**
 * Progress counted from the habit's own completion history rather than
 * stored, so a challenge can never disagree with the habit it tracks —
 * including when you backfill a day you forgot to log.
 *
 * Rest days don't count toward the target and don't count as misses.
 */
export function challengeProgress(
  challenge: Challenge,
  habit: HabitWithCompletions,
  now: Date,
  restDays?: ReadonlySet<string>
): ChallengeProgress {
  const keys = completedKeys(habit);
  const todayKey = toDateKey(now);

  let done = 0;
  let missed = 0;

  for (let cursor = new Date(challenge.startDate); toDateKey(cursor) <= todayKey; cursor = addDays(cursor, 1)) {
    if (!isScheduledDay(habit.daysOfWeek, cursor, restDays)) continue;
    const key = toDateKey(cursor);
    if (keys.has(key)) done++;
    else if (key !== todayKey) missed++;
    if (done >= challenge.targetDays) break;
  }

  return {
    challenge,
    done,
    targetDays: challenge.targetDays,
    fraction: Math.min(1, done / challenge.targetDays),
    complete: done >= challenge.targetDays,
    missed,
  };
}
