import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { PlantType } from "@prisma/client";
import { PLANT_TYPE_ORDER as PLANT_TYPES } from "@/types";

function normalizeDaysOfWeek(daysOfWeek: unknown): string | null {
  if (!Array.isArray(daysOfWeek) || daysOfWeek.length === 0 || daysOfWeek.length === 7) return null;
  const days = [...new Set(daysOfWeek.map(Number))].filter((d) => d >= 0 && d <= 6).sort();
  return days.length ? days.join(",") : null;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { name, notes, archived, daysOfWeek, targetCount, plantType, sortOrder } = body ?? {};

  const data: {
    name?: string;
    notes?: string | null;
    archived?: boolean;
    archivedAt?: Date | null;
    daysOfWeek?: string | null;
    targetCount?: number;
    plantType?: PlantType;
    sortOrder?: number;
  } = {};

  if (name !== undefined) data.name = String(name).trim();
  if (notes !== undefined) data.notes = notes && String(notes).trim() ? String(notes).trim() : null;
  if (archived !== undefined) {
    data.archived = Boolean(archived);
    data.archivedAt = data.archived ? new Date() : null;
  }
  if (daysOfWeek !== undefined) data.daysOfWeek = normalizeDaysOfWeek(daysOfWeek);
  if (targetCount !== undefined) {
    const n = Number(targetCount);
    data.targetCount = Number.isInteger(n) && n >= 1 && n <= 100 ? n : 1;
  }
  if (plantType !== undefined && PLANT_TYPES.includes(plantType)) data.plantType = plantType as PlantType;
  if (sortOrder !== undefined && Number.isInteger(Number(sortOrder))) data.sortOrder = Number(sortOrder);

  const habit = await prisma.habit.update({ where: { id }, data, include: { completions: true } });
  return NextResponse.json(habit);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.habit.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
