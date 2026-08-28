import { addDays, addMonths, addWeeks, isAfter, isBefore } from "date-fns";
import { toDateKey } from "./dateKey";
import type { Event } from "@/types";

/**
 * One dated instance of an event. For a non-repeating event this is just
 * the row itself; for a repeating one it's a projection — the row is
 * stored once and expanded at read time, so a weekly lecture doesn't
 * litter the table with hundreds of near-identical rows.
 *
 * `id` stays the seed row's id (that's what edit/delete act on) while
 * `occurrenceKey` uniquely identifies the instance for React keys.
 */
export interface EventOccurrence extends Event {
  occurrenceDate: Date;
  occurrenceKey: string;
  isProjection: boolean;
}

function advance(date: Date, repeat: Event["repeat"]): Date | null {
  switch (repeat) {
    case "DAILY":
      return addDays(date, 1);
    case "WEEKLY":
      return addWeeks(date, 1);
    case "MONTHLY":
      return addMonths(date, 1);
    case "NONE":
      return null;
  }
}

// A repeating event with no end date would otherwise expand forever; every
// caller asks for a bounded window, but this is the backstop.
const MAX_OCCURRENCES = 750;

/**
 * Expands events into every occurrence falling within [rangeStart, rangeEnd]
 * inclusive, sorted by date then start time.
 */
export function expandEvents(events: Event[], rangeStart: Date, rangeEnd: Date): EventOccurrence[] {
  const out: EventOccurrence[] = [];

  for (const event of events) {
    const seed = new Date(event.date);

    if (event.repeat === "NONE") {
      if (!isBefore(seed, rangeStart) && !isAfter(seed, rangeEnd)) {
        out.push({ ...event, occurrenceDate: seed, occurrenceKey: event.id, isProjection: false });
      }
      continue;
    }

    const until = event.repeatUntil ? new Date(event.repeatUntil) : null;
    let cursor = seed;

    for (let i = 0; i < MAX_OCCURRENCES; i++) {
      if (isAfter(cursor, rangeEnd)) break;
      if (until && isAfter(cursor, until)) break;

      if (!isBefore(cursor, rangeStart)) {
        out.push({
          ...event,
          occurrenceDate: cursor,
          occurrenceKey: `${event.id}:${toDateKey(cursor)}`,
          isProjection: i > 0,
        });
      }

      const next = advance(cursor, event.repeat);
      if (!next) break;
      cursor = next;
    }
  }

  return out.sort((a, b) => {
    const byDate = a.occurrenceDate.getTime() - b.occurrenceDate.getTime();
    if (byDate !== 0) return byDate;
    return (a.startTime ?? "").localeCompare(b.startTime ?? "");
  });
}

/** Buckets expanded occurrences by local day key — the shape calendar/week views want. */
export function occurrencesByDay(occurrences: EventOccurrence[]): Map<string, EventOccurrence[]> {
  const map = new Map<string, EventOccurrence[]>();
  for (const occ of occurrences) {
    const key = toDateKey(occ.occurrenceDate);
    map.set(key, [...(map.get(key) ?? []), occ]);
  }
  return map;
}
