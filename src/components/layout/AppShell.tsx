"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  CalendarDays,
  CalendarRange,
  Command,
  Download,
  Footprints,
  Leaf,
  ListChecks,
  Monitor,
  Moon,
  Search,
  Sprout,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/useTheme";
import { useDayStartHour } from "@/hooks/useDayStartHour";
import { THEME_PREFERENCE_LABELS, THEME_PREFERENCE_ORDER, THEME_SWATCH } from "@/lib/theme";

const DAY_START_HOUR_OPTIONS = [0, 2, 3, 4, 5, 6, 8, 10, 12];

function formatDayStartHour(hour: number): string {
  if (hour === 0) return "Midnight";
  if (hour === 12) return "Noon";
  return `${hour} AM`;
}
import { QuickCapture } from "@/components/quickcapture/QuickCapture";
import { RestoreBackupModal } from "@/components/backup/RestoreBackupModal";
import { SearchPalette } from "@/components/search/SearchPalette";
import { UnlockToast } from "@/components/habits/UnlockToast";
import { MILESTONES, type Milestone } from "@/lib/progression";
import { PageTransition } from "@/components/layout/PageTransition";

const NAV_ITEMS = [
  { href: "/", label: "Garden", icon: Sprout },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/tasks", label: "Tasks", icon: ListChecks },
  { href: "/week", label: "This Week", icon: CalendarRange },
  { href: "/records", label: "Records", icon: Award },
  { href: "/path", label: "Path", icon: Footprints },
];

export function AppShell({ children, growthPoints }: { children: ReactNode; growthPoints: number }) {
  const pathname = usePathname();
  const { preference, setTheme } = useTheme();
  const { dayStartHour, setDayStartHour } = useDayStartHour();
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [justUnlocked, setJustUnlocked] = useState<Milestone[]>([]);

  // Any router.refresh() anywhere re-runs the layout, so this sees every
  // milestone crossing regardless of which page triggered it.
  const prevPoints = useRef(growthPoints);
  useEffect(() => {
    const before = prevPoints.current;
    if (growthPoints > before) {
      const crossed = MILESTONES.filter((m) => m.points > before && m.points <= growthPoints);
      if (crossed.length > 0) setJustUnlocked(crossed);
    }
    prevPoints.current = growthPoints;
  }, [growthPoints]);
  const [restoreOpen, setRestoreOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setQuickCaptureOpen(true);
      }
      // ⌘K adds, ⌘/ finds — deliberately separate so neither mode has to
      // guess what you meant from what you typed.
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex min-h-screen">
      {/*
        Deliberately not themed — the same constant landmark treatment as
        Reading Cabin's AppShell. Colors below are literal, not the shared
        design tokens that Dusk et al. override.
      */}
      <aside className="flex w-56 shrink-0 flex-col border-r border-[#7a5738]/12 bg-[#10190f] text-[#f6efe1]">
        <div className="flex items-center gap-2 px-5 py-6">
          <Leaf size={20} className="text-[#8ea377]" strokeWidth={1.75} />
          <span className="font-serif text-[1.05rem] tracking-tight">Almanac</span>
        </div>

        <nav className="flex flex-col gap-0.5 px-3">
          {NAV_ITEMS.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-[#f6efe1]/10 text-[#fdfbf5]"
                    : "text-[#f6efe1]/60 hover:bg-[#f6efe1]/5 hover:text-[#f6efe1]"
                )}
              >
                <Icon size={16} strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto px-5 py-5">
          <button
            onClick={() => setQuickCaptureOpen(true)}
            className="mb-3 flex w-full items-center justify-center gap-1.5 rounded-md border border-[#f6efe1]/12 px-2.5 py-1.5 text-xs text-[#f6efe1]/60 transition-colors hover:border-[#f6efe1]/25 hover:text-[#f6efe1]"
          >
            <Command size={12} strokeWidth={2} />
            Quick add
          </button>

          <button
            onClick={() => setSearchOpen(true)}
            title="Find a task, event or habit (⌘/)"
            className="mb-3 flex w-full items-center justify-center gap-1.5 rounded-md border border-[#f6efe1]/12 px-2.5 py-1.5 text-xs text-[#f6efe1]/60 transition-colors hover:border-[#f6efe1]/25 hover:text-[#f6efe1]"
          >
            <Search size={12} strokeWidth={2} />
            Search
          </button>

          <div className="mb-3 flex items-center gap-1.5">
            {THEME_PREFERENCE_ORDER.map((t) => {
              const active = preference === t;
              const ring = active ? "ring-[#f6efe1]/70" : "ring-[#f6efe1]/15 hover:ring-[#f6efe1]/40";
              if (t === "auto") {
                return (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    title="Auto — follow system"
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full ring-1 ring-offset-1 ring-offset-[#10190f] transition-all",
                      ring
                    )}
                  >
                    <Monitor size={11} className="text-[#f6efe1]/70" strokeWidth={2} />
                  </button>
                );
              }
              const [surface, accent] = THEME_SWATCH[t];
              return (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  title={`${THEME_PREFERENCE_LABELS[t]} theme`}
                  className={cn("h-5 w-5 shrink-0 rounded-full ring-1 ring-offset-1 ring-offset-[#10190f] transition-all", ring)}
                  style={{ background: `linear-gradient(135deg, ${surface} 50%, ${accent} 50%)` }}
                />
              );
            })}
          </div>

          <label className="mb-3 block">
            <span className="mb-1 flex items-center gap-1.5 text-[11px] text-[#f6efe1]/40">
              <Moon size={11} strokeWidth={2} />
              Day starts at
            </span>
            <select
              value={dayStartHour}
              onChange={(e) => setDayStartHour(Number(e.target.value))}
              className="w-full rounded-md border border-[#f6efe1]/12 bg-transparent px-2 py-1.5 text-xs text-[#f6efe1]/70 transition-colors focus:border-[#f6efe1]/40 focus:outline-none"
            >
              {DAY_START_HOUR_OPTIONS.map((h) => (
                <option key={h} value={h} className="bg-[#10190f] text-[#f6efe1]">
                  {formatDayStartHour(h)}
                </option>
              ))}
            </select>
          </label>

          <div className="mb-3 flex flex-col gap-1.5">
            <a
              href="/api/backup"
              download
              title="Download everything as a JSON backup"
              className="flex items-center gap-1.5 text-[11px] text-[#f6efe1]/35 transition-colors hover:text-[#f6efe1]/70"
            >
              <Download size={11} strokeWidth={2} />
              Export a backup
            </a>
            <button
              onClick={() => setRestoreOpen(true)}
              title="Add back anything missing from an exported backup"
              className="flex items-center gap-1.5 text-[11px] text-[#f6efe1]/35 transition-colors hover:text-[#f6efe1]/70"
            >
              <Upload size={11} strokeWidth={2} />
              Restore a backup
            </button>
          </div>

          <p className="text-[11px] leading-relaxed text-[#f6efe1]/35">
            Where the cabin tends
            <br />
            what it&apos;s growing.
          </p>
        </div>
      </aside>

      <main className="min-w-0 flex-1 bg-parchment">
        <PageTransition>{children}</PageTransition>
      </main>

      <QuickCapture open={quickCaptureOpen} onClose={() => setQuickCaptureOpen(false)} />
      <RestoreBackupModal open={restoreOpen} onClose={() => setRestoreOpen(false)} />
      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
      <UnlockToast milestones={justUnlocked} onDismiss={() => setJustUnlocked([])} />
    </div>
  );
}
