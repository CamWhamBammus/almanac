"use client";

import { useState } from "react";
import { NotebookPen } from "lucide-react";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";

/**
 * The day's note. Saved explicitly rather than on every keystroke — a
 * journal you can't finish a sentence in without a write landing isn't
 * a journal.
 *
 * The caller keys this on the day so switching days remounts it with fresh
 * text, rather than syncing props into state in an effect.
 */
export function JournalField({
  dateKey,
  initial,
  onSaved,
}: {
  dateKey: string;
  initial: string;
  onSaved?: (body: string) => void;
}) {
  const [body, setBody] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const dirty = body.trim() !== initial.trim();

  async function save() {
    setSaving(true);
    try {
      await api.saveJournal(dateKey, body);
      onSaved?.(body.trim());
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h3 className="mb-2 flex items-center gap-1.5 text-xs font-medium tracking-wide text-charcoal-600/70 uppercase">
        <NotebookPen size={12} strokeWidth={2} />
        Journal
      </h3>
      <Textarea
        rows={3}
        value={body}
        onChange={(e) => {
          setBody(e.target.value);
          setSaved(false);
        }}
        placeholder="How did the day go?"
      />
      <div className="mt-2 flex items-center justify-end gap-2">
        {saved && !dirty && <span className="text-xs text-moss-600">Saved</span>}
        <Button size="sm" variant="secondary" onClick={save} disabled={!dirty || saving}>
          {saving ? "Saving…" : "Save note"}
        </Button>
      </div>
    </div>
  );
}
