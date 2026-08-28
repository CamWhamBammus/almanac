import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { nextDueDate } from "@/lib/recurrence";
import type { Priority, Repeat } from "@prisma/client";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { title, notes, dueDate, priority, repeat, done } = body ?? {};

  const data: {
    title?: string;
    notes?: string | null;
    dueDate?: Date | null;
    priority?: Priority;
    repeat?: Repeat;
    done?: boolean;
    completedAt?: Date | null;
  } = {};

  if (title !== undefined) data.title = String(title).trim();
  if (notes !== undefined) data.notes = notes && String(notes).trim() ? String(notes).trim() : null;
  if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
  if (priority !== undefined) data.priority = priority as Priority;
  if (repeat !== undefined) data.repeat = repeat as Repeat;
  if (done !== undefined) {
    data.done = Boolean(done);
    data.completedAt = data.done ? new Date() : null;
  }

  const task = await prisma.task.update({ where: { id }, data });

  // Completing a repeating task with a due date leaves this instance done
  // (preserving history) and spawns the next open occurrence, rather than
  // mutating this row back to open.
  if (data.done && task.repeat !== "NONE" && task.dueDate) {
    await prisma.task.create({
      data: {
        title: task.title,
        notes: task.notes,
        dueDate: nextDueDate(task.dueDate, task.repeat),
        priority: task.priority,
        repeat: task.repeat,
      },
    });
  }

  return NextResponse.json(task);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
