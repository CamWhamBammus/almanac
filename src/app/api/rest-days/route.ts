import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { dateKeyToDate } from "@/lib/dateKey";

export async function GET() {
  const days = await prisma.restDay.findMany({ orderBy: { date: "asc" } });
  return NextResponse.json(days);
}

/** Toggling: posting a date that's already a rest day clears it. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { date, note } = body ?? {};

  if (!date || typeof date !== "string") {
    return NextResponse.json({ error: "date is required" }, { status: 400 });
  }

  const day = dateKeyToDate(date);
  if (Number.isNaN(day.getTime())) {
    return NextResponse.json({ error: "date must be YYYY-MM-DD" }, { status: 400 });
  }

  const existing = await prisma.restDay.findUnique({ where: { date: day } });
  if (existing) {
    await prisma.restDay.delete({ where: { id: existing.id } });
    return NextResponse.json({ date, resting: false });
  }

  await prisma.restDay.create({
    data: { date: day, note: typeof note === "string" && note.trim() ? note.trim() : null },
  });
  return NextResponse.json({ date, resting: true }, { status: 201 });
}
