import { prisma } from "@/lib/db";
import { RecordsView } from "@/components/records/RecordsView";

export default async function RecordsPage() {
  const [habits, tasks] = await Promise.all([
    // Archived habits included: a record you set is still a record, and
    // excluding them made Records disagree with the Path's Growth figure.
    prisma.habit.findMany({ include: { completions: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
    prisma.task.findMany(),
  ]);

  return (
    <main className="paper-grain mx-auto min-h-screen max-w-3xl px-6 py-12">
      <RecordsView habits={habits} tasks={tasks} />
    </main>
  );
}
