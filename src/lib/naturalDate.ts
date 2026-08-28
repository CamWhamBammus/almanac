import * as chrono from "chrono-node";

/**
 * Splits a free-text capture like "call dentist tomorrow 3pm" into a clean
 * title and a parsed date/time, for Quick Capture's single-input flow.
 */
export function parseNaturalDate(
  text: string,
  referenceDate: Date = new Date()
): { title: string; date: Date | null; time: string | null } {
  const results = chrono.parse(text, referenceDate);
  if (results.length === 0) {
    return { title: text.trim(), date: null, time: null };
  }

  const result = results[0];
  const date = result.start.date();
  const time = result.start.isCertain("hour")
    ? `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
    : null;

  const title = (text.slice(0, result.index) + text.slice(result.index + result.text.length))
    .replace(/\s+/g, " ")
    .trim();

  return { title: title || text.trim(), date, time };
}
