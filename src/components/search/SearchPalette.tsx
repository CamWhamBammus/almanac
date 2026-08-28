"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { CalendarDays, CheckSquare, Search, Sprout } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";
import { toDateKey } from "@/lib/dateKey";
import { Modal } from "@/components/ui/Modal";
import { TextInput } from "@/components/ui/Field";
import type { Event, HabitWithCompletions, Task } from "@/types";

type Kind = "task" | "event" | "habit";

interface Hit {
  kind: Kind;
  id: string;
  title: string;
  sub: string | null;
  href: string;
}

const ICONS: Record<Kind, typeof CheckSquare> = {
  task: CheckSquare,
  event: CalendarDays,
  habit: Sprout,
};

const KIND_LABELS: Record<Kind, string> = { task: "Task", event: "Event", habit: "Habit" };

function matches(haystack: (string | null)[], needle: string): boolean {
  const q = needle.toLowerCase();
  return haystack.some((h) => h && h.toLowerCase().includes(q));
}

/**
 * Find anything by name. Quick capture (⌘K) only ever *added* things — with
 * months of history piling up there was no way to get back to something.
 *
 * Everything is loaded once and filtered in memory: a local SQLite app has
 * hundreds of rows, not millions, so a search endpoint would be more moving
 * parts for no gain.
 */
export function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [data, setData] = useState<{ tasks: Task[]; events: Event[]; habits: HabitWithCompletions[] } | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    Promise.all([api.listTasks(), api.listEvents(), api.listHabits()]).then(([tasks, events, habits]) => {
      if (!cancelled) setData({ tasks, events, habits });
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const hits = useMemo<Hit[]>(() => {
    const q = query.trim();
    if (!data || q.length < 2) return [];

    const out: Hit[] = [];

    for (const t of data.tasks) {
      if (!matches([t.title, t.notes], q)) continue;
      out.push({
        kind: "task",
        id: t.id,
        title: t.title,
        sub: t.dueDate ? format(new Date(t.dueDate), "MMM d, yyyy") : "Someday",
        href: "/tasks",
      });
    }

    for (const e of data.events) {
      if (!matches([e.title, e.notes], q)) continue;
      const key = toDateKey(new Date(e.date));
      out.push({
        kind: "event",
        id: e.id,
        title: e.title,
        sub: `${format(new Date(e.date), "MMM d, yyyy")}${e.startTime ? ` · ${e.startTime}` : ""}`,
        href: `/calendar?day=${key}`,
      });
    }

    for (const h of data.habits) {
      if (!matches([h.name, h.notes], q)) continue;
      out.push({
        kind: "habit",
        id: h.id,
        title: h.name,
        sub: h.archived ? "Dormant" : "In the garden",
        href: `/?habit=${h.id}`,
      });
    }

    return out.slice(0, 40);
  }, [data, query]);

  function handleClose() {
    setQuery("");
    onClose();
  }

  function go(hit: Hit) {
    handleClose();
    router.push(hit.href);
  }

  return (
    <Modal open={open} onClose={handleClose} title="Find anything" width="lg">
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search
            size={15}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-charcoal-600/40"
          />
          <TextInput
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && hits[0]) go(hits[0]);
            }}
            placeholder="Search tasks, events and habits…"
            className="pl-9"
          />
        </div>

        {query.trim().length < 2 ? (
          <p className="px-1 py-6 text-center text-sm text-charcoal-600/45">
            {data ? "Type at least two characters." : "Loading…"}
          </p>
        ) : hits.length === 0 ? (
          <p className="px-1 py-6 text-center text-sm text-charcoal-600/45">
            Nothing matches &ldquo;{query.trim()}&rdquo;.
          </p>
        ) : (
          <div className="-mx-1 max-h-80 overflow-y-auto">
            {hits.map((hit) => {
              const Icon = ICONS[hit.kind];
              return (
                <button
                  key={`${hit.kind}:${hit.id}`}
                  onClick={() => go(hit)}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-canopy-800/6"
                >
                  <Icon size={15} className="shrink-0 text-charcoal-600/45" strokeWidth={1.75} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-charcoal-800">{hit.title}</span>
                    {hit.sub && <span className="block truncate text-xs text-charcoal-600/50">{hit.sub}</span>}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] tracking-wide uppercase",
                      "bg-canopy-800/6 text-charcoal-600/50"
                    )}
                  >
                    {KIND_LABELS[hit.kind]}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
