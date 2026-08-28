"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Upload } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface RestoreCounts {
  habits: number;
  completions: number;
  tasks: number;
  events: number;
}

interface RestoreResult {
  added: RestoreCounts;
  skipped: RestoreCounts;
}

function summarize(counts: RestoreCounts): string {
  const parts = [
    counts.habits && `${counts.habits} plant${counts.habits === 1 ? "" : "s"}`,
    counts.completions && `${counts.completions} completion${counts.completions === 1 ? "" : "s"}`,
    counts.tasks && `${counts.tasks} task${counts.tasks === 1 ? "" : "s"}`,
    counts.events && `${counts.events} event${counts.events === 1 ? "" : "s"}`,
  ].filter(Boolean) as string[];
  return parts.length ? parts.join(", ") : "nothing";
}

export function RestoreBackupModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RestoreResult | null>(null);

  function handleClose() {
    setError(null);
    setResult(null);
    setBusy(false);
    onClose();
  }

  async function handleFile(file: File) {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const text = await file.text();
      const res = await fetch("/api/backup/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: text,
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Restore failed.");
      setResult(body as RestoreResult);
      // Everything on screen is server-rendered from the database, so pull
      // fresh data in rather than trying to patch client state piecemeal.
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Restore failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Restore from a backup">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-charcoal-600">
          Pick an exported <code className="rounded bg-canopy-800/6 px-1 py-0.5 text-xs">.json</code> backup. This only
          adds back what&apos;s missing — anything already in your garden is left exactly as it is, and nothing is
          deleted or overwritten.
        </p>

        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />

        {result ? (
          <div className="rounded-md border border-moss-600/25 bg-moss-600/8 p-3">
            <p className="flex items-center gap-2 text-sm font-medium text-moss-600">
              <CheckCircle2 size={15} />
              Restored {summarize(result.added)}.
            </p>
            <p className="mt-1 text-xs text-charcoal-600/60">
              Left untouched: {summarize(result.skipped)} already present.
            </p>
          </div>
        ) : (
          <Button variant="secondary" onClick={() => fileRef.current?.click()} disabled={busy}>
            <Upload size={14} />
            {busy ? "Restoring…" : "Choose a backup file"}
          </Button>
        )}

        {error && <p className="text-sm text-clay-500">{error}</p>}

        <div className="flex justify-end">
          <Button variant="ghost" onClick={handleClose}>
            {result ? "Done" : "Cancel"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
