import { prisma } from "@/lib/db";
import { restDayKeys } from "@/lib/restDays";
import { PathView } from "@/components/path/PathView";
import { computeGrowth } from "@/lib/progression";
import { claimedChallengeDays } from "@/lib/challengeGrowth";

export default async function PathPage() {
  // Archived habits still count — days you finished before setting a habit
  // aside were still finished, and Growth must never go backwards.
  const habits = await prisma.habit.findMany({
    include: { completions: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  // Computed server-side, exactly as the home page does, so the same number
  // appears on both.
  const growth = computeGrowth(habits, new Date(), new Set(await restDayKeys()), await claimedChallengeDays());

  return (
    <main className="paper-grain mx-auto min-h-screen max-w-3xl px-6 py-12">
      <PathView growth={growth} />
    </main>
  );
}
