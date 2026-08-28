import type { Priority } from "@prisma/client";
import { cn } from "@/lib/utils";

const styles: Record<Priority, string> = {
  LOW: "bg-charcoal-600/8 text-charcoal-600",
  NORMAL: "bg-moss-600/12 text-moss-600",
  HIGH: "bg-clay-500/14 text-clay-500",
};

const labels: Record<Priority, string> = {
  LOW: "Low",
  NORMAL: "Normal",
  HIGH: "High",
};

export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium tracking-wide",
        styles[priority],
        className
      )}
    >
      {labels[priority]}
    </span>
  );
}
