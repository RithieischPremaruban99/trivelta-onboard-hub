/**
 * useFormAutoSave — debounced auto-save hook for the onboarding form.
 *
 * Watches all form values via a watch() function (react-hook-form style or
 * a custom equivalent), diffs against dirtyFields, and saves only changed
 * fields to Supabase every 800ms.
 *
 * Status indicator values:
 *   "idle"    — no changes since last save
 *   "saving"  — debounce triggered, save in-flight
 *   "saved"   — last save succeeded
 *   "error"   — last save failed
 */

import { useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import type { SupabaseClient } from "@supabase/supabase-js";

export type AutoSaveStatus = "idle" | "saving" | "saved" | "error";

interface UseFormAutoSaveOptions {
  /** The prospect/client row ID to update */
  prospectId: string;
  /** A function that returns current form values (or a subscribe function) */
  watch: (cb: (value: Record<string, unknown>) => void) => { unsubscribe: () => void };
  /** Object whose keys are the names of fields that have changed */
  dirtyFields: Record<string, unknown>;
  /** Supabase client instance */
  supabase: SupabaseClient;
  /** Table to update — defaults to "prospects" */
  table?: string;
  /** Debounce delay in ms — defaults to 800 */
  delay?: number;
}

export function useFormAutoSave({
  prospectId,
  watch,
  dirtyFields,
  supabase,
  table = "prospects",
  delay = 800,
}: UseFormAutoSaveOptions) {
  const [status, setStatus] = useState<AutoSaveStatus>("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const save = useDebouncedCallback(async (formData: Record<string, unknown>) => {
    const dirtyKeys = Object.keys(dirtyFields);
    if (dirtyKeys.length === 0) {
      setStatus("idle");
      return;
    }

    setStatus("saving");

    // Only send fields that are actually dirty
    const dirtyData = dirtyKeys.reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = formData[key];
      return acc;
    }, {});

    const { error } = await supabase
      .from(table)
      .update(dirtyData)
      .eq("id", prospectId);

    if (error) {
      setStatus("error");
      console.error("[useFormAutoSave] Save failed:", error.message);
    } else {
      setStatus("saved");
      setLastSaved(new Date());
    }
  }, delay);

  useEffect(() => {
    const sub = watch((value: Record<string, unknown>) => save(value));
    return () => sub.unsubscribe();
  }, [watch, save]);

  return { status, lastSaved };
}

/* ─── Save indicator helper ───────────────────────────────────── */

/**
 * Returns human-readable label for the save status indicator.
 * `lastSaved` is used to compute "X sec ago".
 */
export function saveStatusLabel(
  status: AutoSaveStatus,
  lastSaved: Date | null,
): string {
  if (status === "saving") return "Saving…";
  if (status === "error") return "Couldn't save";
  if (status === "saved" && lastSaved) {
    const sec = Math.round((Date.now() - lastSaved.getTime()) / 1000);
    if (sec < 5) return "Saved just now";
    if (sec < 60) return `Saved ${sec}s ago`;
    const min = Math.floor(sec / 60);
    return `Saved ${min}m ago`;
  }
  return "Auto-saved";
}
