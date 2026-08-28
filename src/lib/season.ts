export type Season = "winter" | "spring" | "summer" | "autumn";

const SEASON_MONTHS: Record<Season, number[]> = {
  winter: [11, 0, 1],
  spring: [2, 3, 4],
  summer: [5, 6, 7],
  autumn: [8, 9, 10],
};

export function getSeason(date: Date = new Date()): Season {
  const month = date.getMonth();
  return (Object.keys(SEASON_MONTHS) as Season[]).find((s) => SEASON_MONTHS[s].includes(month)) ?? "winter";
}
