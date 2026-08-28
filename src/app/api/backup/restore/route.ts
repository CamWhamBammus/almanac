import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PLANT_TYPE_ORDER } from "@/types";

export const runtime = "nodejs";

/**
 * Restores records from an exported backup — strictly additive.
 *
 * Anything whose id already exists is left completely untouched, and
 * nothing is ever deleted or overwritten. That makes this safe to run
 * against a live garden: the worst case is "nothing happened." A
 * destructive replace-everything mode would need a much louder
 * confirmation flow than a file picker, so it deliberately isn't offered.
 */

type Json = Record<string, unknown>;

function asArray(value: unknown): Json[] {
  return Array.isArray(value) ? (value.filter((v) => v && typeof v === "object") as Json[]) : [];
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v : null;
}

function date(v: unknown): Date | null {
  if (typeof v !== "string" && typeof v !== "number") return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function oneOf<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
}

const PLANT_TYPES = PLANT_TYPE_ORDER;
const PRIORITIES = ["LOW", "NORMAL", "HIGH"] as const;
const REPEATS = ["NONE", "DAILY", "WEEKLY", "MONTHLY"] as const;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Couldn't read that file as JSON." }, { status: 400 });
  }

  const payload = body as Json;
  if (payload.app !== "almanac") {
    return NextResponse.json({ error: "That doesn't look like an Almanac backup." }, { status: 400 });
  }

  const habits = asArray(payload.habits);
  const tasks = asArray(payload.tasks);
  const events = asArray(payload.events);

  const [existingHabits, existingTasks, existingEvents, existingCompletions] = await Promise.all([
    prisma.habit.findMany({ select: { id: true } }),
    prisma.task.findMany({ select: { id: true } }),
    prisma.event.findMany({ select: { id: true } }),
    prisma.habitCompletion.findMany({ select: { id: true } }),
  ]);

  const haveHabit = new Set(existingHabits.map((h) => h.id));
  const haveTask = new Set(existingTasks.map((t) => t.id));
  const haveEvent = new Set(existingEvents.map((e) => e.id));
  const haveCompletion = new Set(existingCompletions.map((c) => c.id));

  const added = { habits: 0, completions: 0, tasks: 0, events: 0 };
  const skipped = { habits: 0, completions: 0, tasks: 0, events: 0 };

  for (const h of habits) {
    const id = str(h.id);
    const name = str(h.name);
    if (!id || !name) continue;

    if (haveHabit.has(id)) {
      skipped.habits++;
    } else {
      await prisma.habit.create({
        data: {
          id,
          name,
          notes: str(h.notes),
          daysOfWeek: str(h.daysOfWeek),
          targetCount: Number.isInteger(h.targetCount) ? (h.targetCount as number) : 1,
          plantType: oneOf(h.plantType, PLANT_TYPES, "TREE"),
          archived: h.archived === true,
          archivedAt: date(h.archivedAt),
          createdAt: date(h.createdAt) ?? new Date(),
        },
      });
      haveHabit.add(id);
      added.habits++;
    }

    // Completions ride along with their habit; a habit that already exists
    // can still be missing individual days, so these are checked separately.
    for (const c of asArray(h.completions)) {
      const cid = str(c.id);
      const cdate = date(c.date);
      if (!cid || !cdate) continue;
      if (haveCompletion.has(cid)) {
        skipped.completions++;
        continue;
      }
      try {
        await prisma.habitCompletion.create({
          data: {
            id: cid,
            habitId: id,
            date: cdate,
            count: Number.isInteger(c.count) ? (c.count as number) : 1,
            createdAt: date(c.createdAt) ?? new Date(),
          },
        });
        haveCompletion.add(cid);
        added.completions++;
      } catch {
        // Unique (habitId, date) collision — that day is already logged
        // under a different completion id, so there's nothing to restore.
        skipped.completions++;
      }
    }
  }

  for (const t of tasks) {
    const id = str(t.id);
    const title = str(t.title);
    if (!id || !title) continue;
    if (haveTask.has(id)) {
      skipped.tasks++;
      continue;
    }
    await prisma.task.create({
      data: {
        id,
        title,
        notes: str(t.notes),
        dueDate: date(t.dueDate),
        done: t.done === true,
        completedAt: date(t.completedAt),
        priority: oneOf(t.priority, PRIORITIES, "NORMAL"),
        repeat: oneOf(t.repeat, REPEATS, "NONE"),
        createdAt: date(t.createdAt) ?? new Date(),
      },
    });
    added.tasks++;
  }

  for (const e of events) {
    const id = str(e.id);
    const title = str(e.title);
    const when = date(e.date);
    if (!id || !title || !when) continue;
    if (haveEvent.has(id)) {
      skipped.events++;
      continue;
    }
    await prisma.event.create({
      data: {
        id,
        title,
        notes: str(e.notes),
        date: when,
        startTime: str(e.startTime),
        endTime: str(e.endTime),
        repeat: oneOf(e.repeat, REPEATS, "NONE"),
        repeatUntil: date(e.repeatUntil),
        createdAt: date(e.createdAt) ?? new Date(),
      },
    });
    added.events++;
  }

  return NextResponse.json({ added, skipped });
}
