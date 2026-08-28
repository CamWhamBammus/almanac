import { Award, Bug, CloudSun, Mountain, Sparkles, Wind } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Reward } from "@/lib/progression";

const ICONS = {
  ground: Mountain,
  ornament: Sparkles,
  critter: Bug,
  title: Award,
  sky: CloudSun,
  ambience: Wind,
} as const;

/** Icon for any non-plant reward — plants draw their own art instead. */
export function RewardGlyph({ reward, muted }: { reward: Reward; muted: boolean }) {
  if (reward.kind === "plant") return null;
  const Icon = ICONS[reward.kind];
  return <Icon size={21} className={cn(muted ? "text-charcoal-600/30" : "text-moss-600")} strokeWidth={1.75} />;
}
