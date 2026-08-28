import { prisma } from "@/lib/db";
import { restDayKeys } from "@/lib/restDays";
import { HomeView } from "@/components/home/HomeView";
import { computeGrowth } from "@/lib/progression";
import { claimedChallengeDays } from "@/lib/challengeGrowth";
import { reconcilePlants } from "@/lib/reconcilePlants";

export default async function HomePage() {
  const [allHabits, tasks, events] = await Promise.all([
    // Growth must be identical wherever it's shown, so it's computed over
    // *every* habit — archived ones included, since days you finished
    // before setting a habit aside were still finished.
    prisma.habit.findMany({ include: { completions: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
    // Unfiltered — the garden's vibrancy signal needs completed tasks too.
    prisma.task.findMany({ orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }] }),
    prisma.event.findMany({ orderBy: [{ date: "asc" }, { startTime: "asc" }] }),
  ]);
  const rest = new Set(await restDayKeys());
  const claimed = await claimedChallengeDays();

  // Any habit wearing a species that isn't unlocked gets moved onto one
  // that is, before anything renders.
  const { habits: reconciled } = await reconcilePlants(allHabits);

  const growth = computeGrowth(reconciled, new Date(), rest, claimed);
  const activeHabits = reconciled.filter((h) => !h.archived);

  return (
    <main className="paper-grain mx-auto min-h-screen max-w-4xl px-6 py-12">
      <HomeView
        initialHabits={activeHabits}
        initialTasks={tasks}
        initialEvents={events}
        growthPoints={growth.points}
      />
    </main>
  );
}
