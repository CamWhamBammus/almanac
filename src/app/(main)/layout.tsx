import type { ReactNode } from "react";
import { prisma } from "@/lib/db";
import { computeGrowth } from "@/lib/progression";
import { claimedChallengeDays } from "@/lib/challengeGrowth";
import { restDayKeys } from "@/lib/restDays";
import { AppShell } from "@/components/layout/AppShell";
import { RestDaysProvider } from "@/components/rest/RestDaysProvider";

export default async function MainLayout({ children }: { children: ReactNode }) {
  // Growth lives in the shell so crossing a milestone is announced wherever
  // you happen to be — the garden, the calendar's day view, anywhere.
  const [habits, rest, claimed] = await Promise.all([
    prisma.habit.findMany({ include: { completions: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
    restDayKeys(),
    claimedChallengeDays(),
  ]);
  const growthPoints = computeGrowth(habits, new Date(), new Set(rest), claimed).points;

  return (
    <RestDaysProvider days={rest}>
      <AppShell growthPoints={growthPoints}>{children}</AppShell>
    </RestDaysProvider>
  );
}
