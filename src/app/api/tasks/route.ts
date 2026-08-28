import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { Priority, Repeat } from "@prisma/client";

export async function GET() {
  const tasks = await prisma.task.findMany({
    orderBy: [{ done: "asc" }, { dueDate: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(tasks);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { title, notes, dueDate, priority, repeat } = body ?? {};

  if (!title || typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const task = await prisma.task.create({
    data: {
      title: title.trim(),
      notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
      dueDate: dueDate ? new Date(dueDate) : null,
      priority: (priority as Priority) ?? "NORMAL",
      repeat: (repeat as Repeat) ?? "NONE",
    },
  });
  return NextResponse.json(task, { status: 201 });
}
