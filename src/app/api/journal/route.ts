import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { dateKeyToDate } from "@/lib/dateKey";

export async function GET() {
  const entries = await prisma.journalEntry.findMany({ orderBy: { date: "desc" } });
  return NextResponse.json(entries);
}

/** Upsert by day — an empty body clears the entry rather than storing blank. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { date, body: text } = body ?? {};

  if (!date || typeof date !== "string") {
    return NextResponse.json({ error: "date is required" }, { status: 400 });
  }

  const day = dateKeyToDate(date);
  if (Number.isNaN(day.getTime())) {
    return NextResponse.json({ error: "date must be YYYY-MM-DD" }, { status: 400 });
  }

  const trimmed = typeof text === "string" ? text.trim() : "";

  if (!trimmed) {
    await prisma.journalEntry.deleteMany({ where: { date: day } });
    return NextResponse.json({ date, body: null });
  }

  const entry = await prisma.journalEntry.upsert({
    where: { date: day },
    create: { date: day, body: trimmed },
    update: { body: trimmed },
  });
  return NextResponse.json(entry);
}
