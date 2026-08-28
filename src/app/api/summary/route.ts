import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { restDayKeys } from "@/lib/restDays";
import { claimedChallengeDays } from "@/lib/challengeGrowth";
import { toDateKey } from "@/lib/dateKey";
import { computeGrowth, currentTitle, pathProgress } from "@/lib/progression";
import { isScheduledDay, longestStreak } from "@/lib/streak";
import { expandEvents } from "@/lib/eventOccurrences";

/**
 * One computed status ping for The Lodge's Watchtower.
 *
 * The Lodge previously re-derived all of this from Almanac's raw endpoints,
 * which meant duplicating day-key and schedule logic on the other side of
 * the wire — and quietly getting recurring events wrong, since projecting
 * them lives in this app. Serving a finished summary keeps that knowledge
 * here, where it's tested.
 */
export async function GET() {
  const now = new Date();
  const today = toDateKey(now);

  const [tasks, events, habits, restList, claimed] = await Promise.all([
    prisma.task.findMany(),
    prisma.event.findMany(),
    prisma.habit.findMany({ include: { completions: true } }),
    restDayKeys(),
    claimedChallengeDays(),
  ]);
  const rest = new Set(restList);

  let overdueCount = 0;
  let dueTodayCount = 0;
  for (const task of tasks) {
    if (task.done || !task.dueDate) continue;
    const key = toDateKey(new Date(task.dueDate));
    if (key < today) overdueCount++;
    else if (key === today) dueTodayCount++;
  }

  // Projected, so a repeating event still shows up on the Lodge.
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  const todaysEvents = expandEvents(events, startOfDay, endOfDay);
  const nextEvent = todaysEvents[0]
    ? { title: todaysEvents[0].title, startTime: todaysEvents[0].startTime }
    : null;

  const active = habits.filter((h) => !h.archived);
  const dueToday = active.filter((h) => isScheduledDay(h.daysOfWeek, now, rest));
  const habitsOpenCount = dueToday.filter(
    (h) => (h.completions.find((c) => toDateKey(new Date(c.date)) === today)?.count ?? 0) < h.targetCount
  ).length;

  const growth = computeGrowth(habits, now, rest, claimed);
  const progress = pathProgress(growth.points);
  const bestStreak = active.reduce((max, h) => Math.max(max, longestStreak(h, now, rest)), 0);

  return NextResponse.json({
    overdueCount,
    dueTodayCount,
    nextEvent,
    habitsOpenCount,
    habitsDueCount: dueToday.length,
    growth: growth.points,
    title: currentTitle(growth.points),
    nextUnlock: progress.next ? { name: progress.next.name, pointsToGo: progress.pointsToNext } : null,
    bestStreak,
  });
}
