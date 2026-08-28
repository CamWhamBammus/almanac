"use client";

import { useEffect, useState } from "react";
import { getDayStartHour, setDayStartHour as persistDayStartHour } from "@/lib/dateKey";

/** Same shared-preference pattern as useTheme — read on mount, write on change. */
export function useDayStartHour() {
  const [dayStartHour, setDayStartHourState] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDayStartHourState(getDayStartHour());
  }, []);

  function setDayStartHour(hour: number) {
    setDayStartHourState(hour);
    persistDayStartHour(hour);
  }

  return { dayStartHour, setDayStartHour };
}
