import { prisma } from "@/lib/db";
import { toDateKey } from "@/lib/dateKey";
import { CalendarView } from "@/components/calendar/CalendarView";

export default async function CalendarPage() {
  const [tasks, events, habits, journal] = await Promise.all([
    prisma.task.findMany({ orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }] }),
    prisma.event.findMany({ orderBy: [{ date: "asc" }, { startTime: "asc" }] }),
    prisma.habit.findMany({
      where: { archived: false },
      include: { completions: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    prisma.journalEntry.findMany(),
  ]);

  const journalByDay = Object.fromEntries(journal.map((j) => [toDateKey(new Date(j.date)), j.body]));

  return (
    <main className="paper-grain mx-auto min-h-screen max-w-4xl px-6 py-12">
      <CalendarView initialTasks={tasks} initialEvents={events} initialHabits={habits} initialJournal={journalByDay} />
    </main>
  );
}
