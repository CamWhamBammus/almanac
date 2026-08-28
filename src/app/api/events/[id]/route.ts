import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { Repeat } from "@prisma/client";

const REPEATS: Repeat[] = ["NONE", "DAILY", "WEEKLY", "MONTHLY"];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { title, notes, date, startTime, endTime, repeat, repeatUntil } = body ?? {};

  const data: {
    title?: string;
    notes?: string | null;
    date?: Date;
    startTime?: string | null;
    endTime?: string | null;
    repeat?: Repeat;
    repeatUntil?: Date | null;
  } = {};

  if (title !== undefined) data.title = String(title).trim();
  if (notes !== undefined) data.notes = notes && String(notes).trim() ? String(notes).trim() : null;
  if (date !== undefined) data.date = new Date(date);
  if (startTime !== undefined) data.startTime = startTime && String(startTime) ? String(startTime) : null;
  if (endTime !== undefined) data.endTime = endTime && String(endTime) ? String(endTime) : null;
  if (repeat !== undefined && REPEATS.includes(repeat)) data.repeat = repeat as Repeat;
  if (repeatUntil !== undefined) data.repeatUntil = repeatUntil ? new Date(repeatUntil) : null;

  const event = await prisma.event.update({ where: { id }, data });
  return NextResponse.json(event);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.event.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
