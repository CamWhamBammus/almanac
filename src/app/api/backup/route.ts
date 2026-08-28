import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

/**
 * Exports everything Almanac knows as a single JSON file. There's no cloud
 * sync in this app by design, so this is the safety net for months of habit
 * history living in one local SQLite file. JSON rather than a zip of the
 * database (the pattern Reading Cabin uses) because Almanac has no binary
 * assets — this way the backup stays inspectable and portable.
 */
export async function GET() {
  const [habits, tasks, events] = await Promise.all([
    prisma.habit.findMany({ include: { completions: true }, orderBy: { createdAt: "asc" } }),
    prisma.task.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.event.findMany({ orderBy: { date: "asc" } }),
  ]);

  const payload = {
    app: "almanac",
    version: 1,
    exportedAt: new Date().toISOString(),
    counts: {
      habits: habits.length,
      completions: habits.reduce((sum, h) => sum + h.completions.length, 0),
      tasks: tasks.length,
      events: events.length,
    },
    habits,
    tasks,
    events,
  };

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="almanac-backup-${date}.json"`,
    },
  });
}
