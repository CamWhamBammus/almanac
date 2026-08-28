import { prisma } from "./db";
import { toDateKey } from "./dateKey";

/** Rest days as day-keys — the shape every schedule calculation wants. */
export async function restDayKeys(): Promise<string[]> {
  const days = await prisma.restDay.findMany({ select: { date: true } });
  return days.map((d) => toDateKey(new Date(d.date)));
}
