import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { dateKeyToDate } from "@/lib/dateKey";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: habitId } = await params;
  const body = await req.json();
  const { date } = body ?? {};

  if (!date || typeof date !== "string") {
    return NextResponse.json({ error: "date is required" }, { status: 400 });
  }

  const habit = await prisma.habit.findUnique({ where: { id: habitId } });
  if (!habit) {
    return NextResponse.json({ error: "habit not found" }, { status: 404 });
  }

  const day = dateKeyToDate(date);

  const existing = await prisma.habitCompletion.findUnique({
    where: { habitId_date: { habitId, date: day } },
  });

  // Each call adds one rep. Once a rep would exceed the day's target it
  // wraps back to zero instead, so repeated taps cycle 0 -> 1 -> ... ->
  // targetCount -> 0 — the same alternation a plain toggle used to do,
  // generalized to habits with more than one rep a day.
  const nextCount = (existing?.count ?? 0) + 1;
  if (nextCount > habit.targetCount) {
    if (existing) await prisma.habitCompletion.delete({ where: { id: existing.id } });
  } else if (existing) {
    await prisma.habitCompletion.update({ where: { id: existing.id }, data: { count: nextCount } });
  } else {
    await prisma.habitCompletion.create({ data: { habitId, date: day, count: nextCount } });
  }

  const completions = await prisma.habitCompletion.findMany({ where: { habitId } });
  return NextResponse.json(completions);
}
