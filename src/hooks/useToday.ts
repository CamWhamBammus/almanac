"use client";

import { useEffect, useState } from "react";
import { effectiveNow, toDateKey, todayKey } from "@/lib/dateKey";

/**
 * SSR-safe "today." The server has no localStorage, so it always renders as
 * if the day starts at midnight; the client's first paint has to match that
 * exactly or React discards and re-renders the whole tree. So the first
 * render here also assumes midnight, and a mount effect corrects it to the
 * real day-start-hour-shifted value right after — a normal post-mount state
 * update, not a hydration mismatch.
 */
export function useToday(): { today: string; now: Date } {
  const [state, setState] = useState(() => ({ today: toDateKey(new Date()), now: new Date() }));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ today: todayKey(), now: effectiveNow() });
  }, []);

  return state;
}
