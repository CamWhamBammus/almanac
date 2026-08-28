import type { LucideIcon } from "lucide-react";

export function EmptyState({ icon: Icon, message }: { icon: LucideIcon; message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-2 py-8 text-center">
      <Icon size={28} strokeWidth={1.5} className="text-charcoal-600/20" />
      <p className="text-sm text-charcoal-600/50">{message}</p>
    </div>
  );
}
