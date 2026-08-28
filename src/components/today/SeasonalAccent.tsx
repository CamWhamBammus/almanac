import { Flower2, Leaf, Snowflake, Sun } from "lucide-react";
import { getSeason, type Season } from "@/lib/season";

const SEASON_ICONS: Record<Season, { icon: typeof Snowflake; label: string }> = {
  winter: { icon: Snowflake, label: "Winter" },
  spring: { icon: Flower2, label: "Spring" },
  summer: { icon: Sun, label: "Summer" },
  autumn: { icon: Leaf, label: "Autumn" },
};

/** A small nod to the "almanac" concept — the season, always in view. */
export function SeasonalAccent() {
  const { icon: Icon, label } = SEASON_ICONS[getSeason()];
  return <Icon size={20} className="text-sage-400" strokeWidth={1.75} aria-label={label} />;
}
