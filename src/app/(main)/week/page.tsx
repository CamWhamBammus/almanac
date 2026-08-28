import { endOfWeek, startOfWeek } from "date-fns";
import { prisma } from "@/lib/db";
import { WeekView } from "@/components/week/WeekView";

export default async function WeekPage() {
  const now = new Date();
  const start = startOfWeek(now, { weekStartsOn: 0 });
  const end = endOfWeek(now, { weekStartsOn: 0 });

  const [overdueTasks, weekTasks, weekEvents, habits] = await Promise.all([
    prisma.task.findMany({
      where: { done: false, dueDate: { lt: start } },
      orderBy: [{ dueDate: "asc" }],
    }),
    prisma.task.findMany({
      where: { dueDate: { gte: start, lte: end } },
      orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
    }),
    prisma.event.findMany({
      where: { date: { gte: start, lte: end } },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    }),
    prisma.habit.findMany({
      where: { archived: false },
      include: { completions: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  return (
    <main className="paper-grain mx-auto min-h-screen max-w-3xl px-6 py-12">
      <WeekView
        weekStart={start.toISOString()}
        initialOverdueTasks={overdueTasks}
        initialWeekTasks={weekTasks}
        initialWeekEvents={weekEvents}
        habits={habits}
      />
    </main>
  );
}
