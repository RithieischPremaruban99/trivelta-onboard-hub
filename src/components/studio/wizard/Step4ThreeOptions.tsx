import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import type { TCMPalette } from "@/lib/tcm-palette";
import type { BrandPersonality, PlatformType } from "./wizard-types";
import { PERSONALITY_TITLES, PERSONALITY_VARIATIONS } from "./wizard-types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

interface Props {
  clientId: string;
  brandPrompt: string;
  logoUrl: string | undefined;
  selectedCountry: string | undefined;
  isMultiMarket: boolean;
  selectedPlatformType: PlatformType | undefined;
  selectedPersonality: BrandPersonality;
  onBack: () => void;
  onNext: () => void;
}

type OptionStatus = "idle" | "loading" | "streaming" | "done" | "error";

interface OptionState {
  status: OptionStatus;
  palette: TCMPalette | null;
  summaryText: string;
  streamingText: string;
}

const OPTION_LABELS = ["Option A", "Option B", "Option C"] as const;

export function Step4ThreeOptions({
  clientId,
  brandPrompt,
  logoUrl,
  selectedCountry,
  isMultiMarket,
  selectedPlatformType,
  selectedPersonality,
  onBack,
  onNext,
}: Props) {
  // variations[0] and [1] are the alternate personalities for options B and C
  const variations = PERSONALITY_VARIATIONS[selectedPersonality];

  // Personality used per option index: A = user's choice, B/C = neighboring personalities
  function optionPersonality(index: 0 | 1 | 2): BrandPersonality {
    return index === 0 ? selectedPersonality : variations[index - 1];
  }

  function optionLabel(index: 0 | 1 | 2): string {
    return index === 0
      ? `${PERSONALITY_TITLES[selectedPersonality]} (your pick)`
      : PERSONALITY_TITLES[variations[index - 1]];
  }

  const [options, setOptions] = useState<OptionState[]>([
    { status: "idle", palette: null, summaryText: "", streamingText: "" },
    { status: "idle", palette: null, summaryText: "", streamingText: "" },
    { status: "idle", palette: null, summaryText: "", streamingText: "" },
  ]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const startedRef = useRef(false);

  const updateOption = useCallback((index: number, patch: Partial<OptionState>) => {
    setOptions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...patch };
      return updated;
    });
  }, []);

  const generateOption = useCallback(
    async (index: 0 | 1 | 2) => {
      updateOption(index, { status: "loading", streamingText: "", summaryText: "", palette: null });

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.access_token) throw new Error("Not authenticated");

        const payload = {
          brandPrompt,
          ...(logoUrl && { logoUrl }),
          ...(!isMultiMarket && selectedCountry && { targetCountry: selectedCountry }),
          targetPersonality: optionPersonality(index),
          ...(selectedPlatformType && { targetPlatformType: selectedPlatformType }),
        };

        const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-palette`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let streamingText = "";

        outer: while (true) {
          const { done, value } = await reader.read();
          if (done) {
            updateOption(index, { status: "error", streamingText: "" });
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
              // internal — ignore
            } else if (evt.type === "reasoning_chunk" && typeof evt.text === "string") {
              streamingText += evt.text;
              updateOption(index, { status: "streaming", streamingText });
            } else if (evt.type === "complete" && evt.palette) {
              const summaryText =
                typeof evt.keyColorsSummary === "string"
                  ? evt.keyColorsSummary
                  : typeof evt.reasoning === "string"
                  ? evt.reasoning
                  : streamingText;
              updateOption(index, {
                status: "done",
                palette: evt.palette as TCMPalette,
                summaryText,
                streamingText: summaryText,
              });
              reader.cancel().catch(() => {});
              break outer;
            } else if (evt.type === "error") {
              throw new Error(typeof evt.message === "string" ? evt.message : "Generation failed");
            } else if (evt.type === "conversational") {
              throw new Error("Unexpected conversational response from palette generator");
            }
          }
        }
      } catch (err) {
        console.error(`[Step4] Option ${index} error:`, err);
        updateOption(index, { status: "error", streamingText: "" });
      }
    },
    [
      brandPrompt,
      logoUrl,
      isMultiMarket,
      selectedCountry,
      selectedPersonality,
      selectedPlatformType,
      variations,
      updateOption,
    ],
  );

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    generateOption(0);
    generateOption(1);
    generateOption(2);
  }, [generateOption]);

  async function handleSelect(index: number) {
    const opt = options[index];
    if (opt.status !== "done" || !opt.palette || saving) return;

    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("onboarding_forms")
        .upsert(
          { client_id: clientId, studio_config: { palette: opt.palette } },
          { onConflict: "client_id" },
        );
      if (error) throw error;

      setSelectedIndex(index);
      toast.success("Palette selected! Opening Studio…");
      setTimeout(() => onNext(), 700);
    } catch (err) {
      console.error("[Step4] Save failed:", err);
      toast.error("Failed to save selection. Please try again.");
      setSaving(false);
    }
  }

  const allSettled = options.every((o) => o.status === "done" || o.status === "error");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-100 mb-1">Choose your brand palette</h2>
        <p className="text-sm text-zinc-400">
          Three AI-generated options for your{" "}
          <span className="text-zinc-300">{PERSONALITY_TITLES[selectedPersonality]}</span> brand.
          Select the one that resonates most.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {options.map((opt, i) => {
          const isSelected = selectedIndex === i;
          const isDone = opt.status === "done";
          const isError = opt.status === "error";

          return (
            <div
              key={i}
              className={cn(
                "flex flex-col rounded-xl border p-4 gap-3 transition-all",
                "bg-zinc-900 border-zinc-700",
                isSelected && "ring-2 ring-blue-500 border-blue-500",
                isDone && !isSelected && "hover:border-zinc-500",
              )}
            >
              {/* Header */}
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  {OPTION_LABELS[i]}
                </span>
                <span className="text-xs text-zinc-500 truncate">{optionLabel(i as 0 | 1 | 2)}</span>
              </div>

              {/* Preview */}
              {isDone && opt.palette ? (
                <PaletteCardPreview palette={opt.palette} />
              ) : isError ? (
                <div className="h-28 rounded-lg bg-zinc-800 flex flex-col items-center justify-center gap-2 border border-dashed border-zinc-600">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <span className="text-xs text-zinc-500">Generation failed</span>
                  <button
                    onClick={() => generateOption(i as 0 | 1 | 2)}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-0.5"
                  >
                    <RefreshCw className="h-3 w-3" /> Retry
                  </button>
                </div>
              ) : (
                <div className="h-28 rounded-lg bg-zinc-800 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 text-zinc-400 animate-spin" />
                  <span className="text-xs text-zinc-500">
                    {opt.status === "loading" ? "Starting…" : "Generating palette…"}
                  </span>
                </div>
              )}

              {/* Summary */}
              {(opt.status === "streaming" || opt.status === "done") && opt.streamingText && (
                <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                  {opt.streamingText}
                </p>
              )}

              {/* Select button */}
              <Button
                onClick={() => handleSelect(i)}
                disabled={!isDone || saving || selectedIndex !== null}
                className={cn(
                  "w-full text-sm mt-auto",
                  isSelected
                    ? "bg-blue-600 hover:bg-blue-600 text-white"
                    : "bg-zinc-800 border border-zinc-600 text-zinc-200 hover:bg-zinc-700 hover:border-zinc-500",
                )}
                variant="ghost"
              >
                {isSelected ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1.5" />
                    Selected
                  </>
                ) : (
                  "Select this palette →"
                )}
              </Button>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={saving}
          className="bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
        >
          ← Back
        </Button>
        {allSettled && selectedIndex === null && (
          <p className="text-xs text-zinc-500">Select a palette to continue to Studio</p>
        )}
      </div>
    </div>
  );
}

function PaletteCardPreview({ palette }: { palette: TCMPalette }) {
  return (
    <div
      className="rounded-lg overflow-hidden h-28 w-full"
      style={{ backgroundColor: palette.primaryBackgroundColor, border: "1px solid rgba(255,255,255,0.06)" }}
    >
      {/* Primary color bar */}
      <div className="h-1" style={{ backgroundColor: palette.primary }} />

      <div className="p-3 flex flex-col gap-2 h-full">
        {/* Label */}
        <span
          className="text-xs font-semibold leading-none"
          style={{ color: palette.lightTextColor }}
        >
          Brand Preview
        </span>

        {/* Color swatches */}
        <div className="flex gap-1.5">
          {[
            palette.primary,
            palette.secondary,
            palette.primaryButton,
            palette.activeSecondaryGradientColor,
          ].map((c, i) => (
            <div
              key={i}
              className="h-4 w-4 rounded-full flex-shrink-0"
              style={{
                backgroundColor: c,
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.15)",
              }}
            />
          ))}
        </div>

        {/* CTA button mock */}
        <div
          className="self-start text-xs px-2 py-0.5 rounded font-medium"
          style={{
            backgroundColor: palette.primaryButton,
            color: palette.lightTextColor,
          }}
        >
          Bet Now
        </div>
      </div>
    </div>
  );
}
