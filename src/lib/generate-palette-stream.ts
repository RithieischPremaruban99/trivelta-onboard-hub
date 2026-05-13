/**
 * Shared streaming helper for the `generate-palette` edge function.
 * Used by both AIChatPanel and the logo-upload auto-extraction in the studio route.
 */
import { supabase } from "@/integrations/supabase/client";
import type { TCMPalette } from "@/lib/tcm-palette";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export interface GeneratePalettePayload {
  brandPrompt: string;
  language?: string;
  logoUrl?: string;
  currentPalette?: TCMPalette;
  manualOverrides?: string[];
  forceFullGeneration?: boolean;
  regenerationFeedback?: string;
  conversationHistory?: Array<{ role: string; content: string }>;
}

export interface StreamCallbacks {
  onReasoningChunk?: (text: string, accumulated: string) => void;
  onThinkingChunk?: () => void;
  onConversational?: (message: string) => void;
  onComplete?: (result: {
    palette: TCMPalette;
    reasoning?: string;
    keyColorsSummary?: string;
    warnings?: string[];
  }) => void;
  onError?: (message: string) => void;
  onStreamEndedUnexpectedly?: (hadStarted: boolean) => void;
}

export interface StreamOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

/**
 * Calls the generate-palette edge function and dispatches stream events to callbacks.
 * Returns when the stream is finished (complete / error / conversational / drop).
 */
export async function streamGeneratePalette(
  payload: GeneratePalettePayload,
  callbacks: StreamCallbacks,
  opts: StreamOptions = {},
): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("No active session — please sign in again");

  const abortController = new AbortController();
  const onExternalAbort = () => abortController.abort();
  if (opts.signal) opts.signal.addEventListener("abort", onExternalAbort);
  const timeoutMs = opts.timeoutMs ?? 90_000;
  const timeoutId = setTimeout(() => abortController.abort(), timeoutMs);

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-palette`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(payload),
      signal: abortController.signal,
    });

    if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let streamingStarted = false;
    let streamedReasoning = "";
    let streamCompleted = false;

    outer: while (true) {
      const { done, value } = await reader.read();
      if (done) {
        if (!streamCompleted) callbacks.onStreamEndedUnexpectedly?.(streamingStarted);
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";

      for (const part of parts) {
        if (!part.startsWith("data: ")) continue;
        const jsonStr = part.slice(6).trim();
        if (!jsonStr) continue;
        let evt: Record<string, unknown>;
        try {
          evt = JSON.parse(jsonStr);
        } catch {
          continue;
        }

        if (evt.type === "thinking_chunk") {
          callbacks.onThinkingChunk?.();
        } else if (evt.type === "reasoning_chunk" && typeof evt.text === "string") {
          streamingStarted = true;
          streamedReasoning += evt.text;
          callbacks.onReasoningChunk?.(evt.text, streamedReasoning);
        } else if (evt.type === "conversational" && typeof evt.message === "string") {
          streamCompleted = true;
          callbacks.onConversational?.(evt.message);
          reader.cancel().catch(() => {});
          break outer;
        } else if (evt.type === "complete" && evt.palette) {
          streamCompleted = true;
          callbacks.onComplete?.({
            palette: evt.palette as TCMPalette,
            reasoning: typeof evt.reasoning === "string" ? evt.reasoning : undefined,
            keyColorsSummary:
              typeof evt.keyColorsSummary === "string" ? evt.keyColorsSummary : undefined,
            warnings: Array.isArray(evt.warnings) ? (evt.warnings as string[]) : undefined,
          });
          reader.cancel().catch(() => {});
          break outer;
        } else if (evt.type === "error") {
          streamCompleted = true;
          const msg = typeof evt.message === "string" ? evt.message : JSON.stringify(evt);
          callbacks.onError?.(msg);
          reader.cancel().catch(() => {});
          break outer;
        }
      }
    }
  } finally {
    clearTimeout(timeoutId);
    if (opts.signal) opts.signal.removeEventListener("abort", onExternalAbort);
  }
}
