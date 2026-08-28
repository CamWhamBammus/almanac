import type { Challenge, Event, Habit, HabitCompletion, JournalEntry, PlantType, Priority, Repeat, RestDay, Task } from "@prisma/client";

export type { Challenge, Event, Habit, HabitCompletion, JournalEntry, PlantType, Priority, Repeat, RestDay, Task };

export type HabitWithCompletions = Habit & { completions: HabitCompletion[] };

export const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: "Low",
  NORMAL: "Normal",
  HIGH: "High",
};

export const PRIORITY_ORDER: Priority[] = ["HIGH", "NORMAL", "LOW"];

export const REPEAT_LABELS: Record<Repeat, string> = {
  NONE: "Doesn't repeat",
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
};

export const REPEAT_ORDER: Repeat[] = ["NONE", "DAILY", "WEEKLY", "MONTHLY"];

export const WEEKDAY_SHORT_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export const PLANT_TYPE_LABELS: Record<PlantType, string> = {
  TREE: "Tree",
  PINE: "Pine",
  WILLOW: "Willow",
  BUSH: "Bush",
  FLOWER: "Flower",
  SUNFLOWER: "Sunflower",
  LAVENDER: "Lavender",
  SUCCULENT: "Succulent",
  CACTUS: "Cactus",
  FERN: "Fern",
  VINE: "Vine",
  MUSHROOM: "Mushroom",
};

export const PLANT_TYPE_ORDER: PlantType[] = [
  "TREE",
  "PINE",
  "WILLOW",
  "BUSH",
  "FLOWER",
  "SUNFLOWER",
  "LAVENDER",
  "SUCCULENT",
  "CACTUS",
  "FERN",
  "VINE",
  "MUSHROOM",
];
