import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { Repeat } from "@prisma/client";

const REPEATS: Repeat[] = ["NONE", "DAILY", "WEEKLY", "MONTHLY"];

function normalizeRepeat(repeat: unknown): Repeat {
  return typeof repeat === "string" && REPEATS.includes(repeat as Repeat) ? (repeat as Repeat) : "NONE";
}

export async function GET() {
  const events = await prisma.event.findMany({
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
  return NextResponse.json(events);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { title, notes, date, startTime, endTime, repeat, repeatUntil } = body ?? {};

  if (!title || typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  if (!date || typeof date !== "string") {
    return NextResponse.json({ error: "date is required" }, { status: 400 });
  }

  const event = await prisma.event.create({
    data: {
      title: title.trim(),
      notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
      date: new Date(date),
      startTime: typeof startTime === "string" && startTime ? startTime : null,
      endTime: typeof endTime === "string" && endTime ? endTime : null,
      repeat: normalizeRepeat(repeat),
      repeatUntil: repeatUntil ? new Date(repeatUntil) : null,
    },
  });
  return NextResponse.json(event, { status: 201 });
}
