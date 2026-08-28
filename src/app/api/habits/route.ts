import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { PlantType } from "@prisma/client";
import { PLANT_TYPE_ORDER } from "@/types";

function normalizePlantType(plantType: unknown): PlantType {
  return typeof plantType === "string" && PLANT_TYPE_ORDER.includes(plantType as PlantType)
    ? (plantType as PlantType)
    : "TREE";
}

export async function GET(req: Request) {
  const archived = new URL(req.url).searchParams.get("archived") === "true";
  const habits = await prisma.habit.findMany({
    where: { archived },
    include: { completions: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(habits);
}

function normalizeDaysOfWeek(daysOfWeek: unknown): string | null {
  if (!Array.isArray(daysOfWeek) || daysOfWeek.length === 0 || daysOfWeek.length === 7) return null;
  const days = [...new Set(daysOfWeek.map(Number))].filter((d) => d >= 0 && d <= 6).sort();
  return days.length ? days.join(",") : null;
}

function normalizeTargetCount(targetCount: unknown): number {
  const n = Number(targetCount);
  return Number.isInteger(n) && n >= 1 && n <= 100 ? n : 1;
}

export async function POST(req: Request) {
  const body = await req.json();
  const { name, notes, daysOfWeek, targetCount, plantType } = body ?? {};

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const habit = await prisma.habit.create({
    data: {
      name: name.trim(),
      notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
      daysOfWeek: normalizeDaysOfWeek(daysOfWeek),
      targetCount: normalizeTargetCount(targetCount),
      plantType: normalizePlantType(plantType),
    },
    include: { completions: true },
  });
  return NextResponse.json(habit, { status: 201 });
}
