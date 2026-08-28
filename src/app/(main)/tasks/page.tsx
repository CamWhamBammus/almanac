import { prisma } from "@/lib/db";
import { TasksView } from "@/components/tasks/TasksView";

export default async function TasksPage() {
  const tasks = await prisma.task.findMany({
    orderBy: [{ done: "asc" }, { dueDate: "asc" }, { createdAt: "asc" }],
  });

  return (
    <main className="paper-grain mx-auto min-h-screen max-w-2xl px-6 py-12">
      <TasksView initialTasks={tasks} />
    </main>
  );
}
