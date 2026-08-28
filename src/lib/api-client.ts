import type { Event, HabitCompletion, PlantType, Priority, Repeat, Task } from "@prisma/client";
import type { Challenge, HabitWithCompletions } from "@/types";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? "Something went wrong.");
  }
  return res.json();
}

export const api = {
  listTasks: () => fetch("/api/tasks", { cache: "no-store" }).then((r) => json<Task[]>(r)),

  createTask: (data: {
    title: string;
    notes?: string;
    dueDate?: string | null;
    priority?: Priority;
    repeat?: Repeat;
  }) =>
    fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => json<Task>(r)),

  updateTask: (
    id: string,
    data: Partial<{
      title: string;
      notes: string | null;
      dueDate: string | null;
      priority: Priority;
      repeat: Repeat;
      done: boolean;
    }>
  ) =>
    fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => json<Task>(r)),

  deleteTask: (id: string) => fetch(`/api/tasks/${id}`, { method: "DELETE" }).then((r) => json(r)),

  listEvents: () => fetch("/api/events", { cache: "no-store" }).then((r) => json<Event[]>(r)),

  createEvent: (data: {
    title: string;
    notes?: string;
    date: string;
    startTime?: string;
    endTime?: string;
    repeat?: Repeat;
    repeatUntil?: string | null;
  }) =>
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => json<Event>(r)),

  updateEvent: (
    id: string,
    data: Partial<{
      title: string;
      notes: string | null;
      date: string;
      startTime: string | null;
      endTime: string | null;
      repeat: Repeat;
      repeatUntil: string | null;
    }>
  ) =>
    fetch(`/api/events/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => json<Event>(r)),

  deleteEvent: (id: string) => fetch(`/api/events/${id}`, { method: "DELETE" }).then((r) => json(r)),

  listHabits: () => fetch("/api/habits", { cache: "no-store" }).then((r) => json<HabitWithCompletions[]>(r)),

  listArchivedHabits: () =>
    fetch("/api/habits?archived=true", { cache: "no-store" }).then((r) => json<HabitWithCompletions[]>(r)),

  createHabit: (data: {
    name: string;
    notes?: string;
    daysOfWeek?: number[];
    targetCount?: number;
    plantType?: PlantType;
  }) =>
    fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => json<HabitWithCompletions>(r)),

  updateHabit: (
    id: string,
    data: Partial<{
      name: string;
      notes: string | null;
      archived: boolean;
      daysOfWeek: number[];
      targetCount: number;
      plantType: PlantType;
      sortOrder: number;
    }>
  ) =>
    fetch(`/api/habits/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => json<HabitWithCompletions>(r)),

  deleteHabit: (id: string) => fetch(`/api/habits/${id}`, { method: "DELETE" }).then((r) => json(r)),

  listChallenges: () => fetch("/api/challenges", { cache: "no-store" }).then((r) => json<Challenge[]>(r)),

  createChallenge: (habitId: string, targetDays: number) =>
    fetch("/api/challenges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ habitId, targetDays }),
    }).then((r) => json<Challenge>(r)),

  finishChallenge: (id: string, action: "complete" | "abandon") =>
    fetch(`/api/challenges/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    }).then((r) => json<Challenge>(r)),

  listJournal: () =>
    fetch("/api/journal", { cache: "no-store" }).then((r) => json<{ id: string; date: string; body: string }[]>(r)),

  /** Empty body clears the day's entry. */
  saveJournal: (dateKey: string, body: string) =>
    fetch("/api/journal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: dateKey, body }),
    }).then((r) => json<{ date: string; body: string | null }>(r)),

  listRestDays: () => fetch("/api/rest-days", { cache: "no-store" }).then((r) => json<{ date: string }[]>(r)),

  /** Posting a date that's already resting clears it. */
  toggleRestDay: (dateKey: string) =>
    fetch("/api/rest-days", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: dateKey }),
    }).then((r) => json<{ date: string; resting: boolean }>(r)),

  toggleHabitCompletion: (id: string, dateKey: string) =>
    fetch(`/api/habits/${id}/toggle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: dateKey }),
    }).then((r) => json<HabitCompletion[]>(r)),
};
