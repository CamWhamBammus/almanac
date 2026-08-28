"use client";

import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";

const RestDaysContext = createContext<ReadonlySet<string>>(new Set());

/**
 * Rest days as day-keys, shared with every client component that needs to
 * know whether a date counted.
 *
 * A context rather than props because `isScheduledDay` is consulted deep in
 * the tree — the garden's plant cards, the heatmap, the week view — and
 * threading it through each by hand would be easy to leave half-done, which
 * would leave streaks disagreeing between views.
 */
export function RestDaysProvider({ days, children }: { days: string[]; children: ReactNode }) {
  const set = useMemo(() => new Set(days), [days]);
  return <RestDaysContext.Provider value={set}>{children}</RestDaysContext.Provider>;
}

export function useRestDays(): ReadonlySet<string> {
  return useContext(RestDaysContext);
}
