import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { dateKeyToDate, toDateKey } from "@/lib/dateKey";

export async function GET() {
  const challenges = await prisma.challenge.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(challenges);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { habitId, targetDays, startDate } = body ?? {};

  if (!habitId || typeof habitId !== "string") {
    return NextResponse.json({ error: "habitId is required" }, { status: 400 });
  }
  const days = Number(targetDays);
  if (!Number.isInteger(days) || days < 2 || days > 365) {
    return NextResponse.json({ error: "targetDays must be between 2 and 365" }, { status: 400 });
  }

  // One live challenge per habit — two at once would just be confusing.
  const existing = await prisma.challenge.findFirst({
    where: { habitId, completedAt: null, abandonedAt: null },
  });
  if (existing) {
    return NextResponse.json({ error: "That habit already has a challenge running." }, { status: 409 });
  }

  const challenge = await prisma.challenge.create({
    data: {
      habitId,
      targetDays: days,
      startDate: typeof startDate === "string" ? dateKeyToDate(startDate) : dateKeyToDate(toDateKey(new Date())),
    },
  });
  return NextResponse.json(challenge, { status: 201 });
}
