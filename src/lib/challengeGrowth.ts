import { prisma } from "./db";

/** Target lengths of every claimed challenge — what Growth pays out on. */
export async function claimedChallengeDays(): Promise<number[]> {
  const done = await prisma.challenge.findMany({
    where: { completedAt: { not: null } },
    select: { targetDays: true },
  });
  return done.map((c) => c.targetDays);
}
