/**
 * Local calendar-day key, e.g. "2026-08-12" — the single source of truth
 * for "which day does this belong to." Tasks and events are bucketed by
 * this key rather than by comparing raw DateTimes, so a stored time
 * component (or lack of one) never shifts something into the wrong day.
 */
export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const DAY_START_HOUR_KEY = "almanac:day-start-hour";

/**
 * Hour (0-23) the day rolls over at — for a sleep schedule that runs past
 * midnight, so a 2am check-in still counts for the day you haven't gone to
 * bed on yet, instead of silently becoming tomorrow. Defaults to 0
 * (real midnight, i.e. no shift).
 */
export function getDayStartHour(): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(DAY_START_HOUR_KEY);
  if (raw === null) return 0;
  const hour = Number(raw);
  return Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : 0;
}

export function setDayStartHour(hour: number): void {
  window.localStorage.setItem(DAY_START_HOUR_KEY, String(hour));
}

/** "Now," shifted so anything before the day-start hour still reads as the previous day. */
export function effectiveNow(): Date {
  return new Date(Date.now() - getDayStartHour() * 60 * 60 * 1000);
}

export function todayKey(): string {
  return toDateKey(effectiveNow());
}

/** Parses a "YYYY-MM-DD" key back into a local midnight Date. */
export function dateKeyToDate(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}
