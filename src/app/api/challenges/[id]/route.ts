import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { challengeProgress } from "@/lib/challenges";
import { restDayKeys } from "@/lib/restDays";

/** Marks a challenge finished or given up on. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { action } = body ?? {};

  if (action === "complete") {
    // Claiming pays out Growth, which unlocks things — so the server counts
    // the days itself rather than taking the client's word for it.
    const challenge = await prisma.challenge.findUnique({
      where: { id },
      include: { habit: { include: { completions: true } } },
    });
    if (!challenge) return NextResponse.json({ error: "No such challenge" }, { status: 404 });
    if (challenge.completedAt || challenge.abandonedAt) {
      return NextResponse.json({ error: "Challenge is already finished" }, { status: 409 });
    }

    const rest = new Set(await restDayKeys());
    const progress = challengeProgress(challenge, challenge.habit, new Date(), rest);
    if (!progress.complete) {
      return NextResponse.json(
        { error: `Not finished yet — ${progress.done} of ${progress.targetDays} days.` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      await prisma.challenge.update({ where: { id }, data: { completedAt: new Date() } })
    );
  }
  if (action === "abandon") {
    return NextResponse.json(
      await prisma.challenge.update({ where: { id }, data: { abandonedAt: new Date() } })
    );
  }
  return NextResponse.json({ error: "action must be complete or abandon" }, { status: 400 });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.challenge.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
