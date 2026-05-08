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

const LOADING_PHASES = [
  { until: 3000, text: "Analyzing brand context" },
  { until: 7000, text: "Crafting color harmony" },
  { until: Infinity, text: "Finalizing palette" },
];

function useLoadingPhase(isLoading: boolean): string {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setElapsed(0);
      return;
    }
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsed(Date.now() - start);
    }, 200);
    return () => clearInterval(interval);
  }, [isLoading]);

  const phase = LOADING_PHASES.find((p) => elapsed < p.until);
  return phase?.text ?? "Generating";
}

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

const BRIEF_VARIATIONS = [
  {
    label: "Bold & energetic",
    modifier: " — render this with bold, saturated color treatment. High-energy, mass-market athletic feel. Vibrant primaries with strong contrast. Keep the same brand color family throughout — this version differs only in saturation and energy, not hue.",
  },
  {
    label: "Deep & sophisticated",
    modifier: " — render this with deeper, more refined color treatment. Sophisticated, hospitality-grade feel. Muted primaries with elegant restraint. Keep the same brand color family throughout — this version differs only in depth and refinement, not hue.",
  },
  {
    label: "Light & modern",
    modifier: " — render this with lighter, cleaner color treatment. Modern, tech-forward feel. Crisp primaries with airy negative space. Keep the same brand color family throughout — this version differs only in lightness and modernity, not hue.",
  },
] as const;

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
    if (logoUrl) {
      return BRIEF_VARIATIONS[index].label;
    }
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
        // Get session, attempt refresh if expired/missing
        let { data: { session } } = await supabase.auth.getSession();

        // Check if session is missing or about to expire (within 60s)
        const expiresInMs = session?.expires_at
          ? (session.expires_at * 1000) - Date.now()
          : -1;
        const needsRefresh = !session?.access_token || expiresInMs < 60000;

        if (needsRefresh) {
          console.log("[Step4] Session needs refresh, attempting...");
          const refreshResult = await supabase.auth.refreshSession();

          if (refreshResult.error || !refreshResult.data.session?.access_token) {
            throw new Error("Session expired. Please sign in again.");
          }

          session = refreshResult.data.session;
          console.log("[Step4] Session refreshed successfully");
        }

        const isLogoMode = Boolean(logoUrl);
        const optionBrief = isLogoMode
          ? brandPrompt + BRIEF_VARIATIONS[index].modifier
          : brandPrompt;

        const payload = {
          brandPrompt: optionBrief,
          ...(logoUrl && { logoUrl }),
          ...(!isMultiMarket && selectedCountry && { targetCountry: selectedCountry }),
          ...(!isLogoMode && { targetPersonality: optionPersonality(index) }),
          ...(selectedPlatformType && { targetPlatformType: selectedPlatformType }),
        };

        const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-palette`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${session?.access_token ?? SUPABASE_ANON_KEY}`,
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

  const handleRegenerate = useCallback(() => {
    setOptions([
      { status: "idle", palette: null, summaryText: "", streamingText: "" },
      { status: "idle", palette: null, summaryText: "", streamingText: "" },
      { status: "idle", palette: null, summaryText: "", streamingText: "" },
    ]);
    setSelectedIndex(null);
    setTimeout(() => {
      generateOption(0);
      generateOption(1);
      generateOption(2);
    }, 50);
  }, [generateOption]);

  async function handleSelect(index: number) {
    const opt = options[index];
    if (opt.status !== "done" || !opt.palette || saving) return;

    setSaving(true);
    try {
      // Read existing studio_config to preserve other fields
      const { data: existingForm } = await (supabase as any)
        .from("onboarding_forms")
        .select("studio_config")
        .eq("client_id", clientId)
        .maybeSingle();

      const existingConfig = (existingForm?.studio_config && typeof existingForm.studio_config === "object")
        ? existingForm.studio_config as Record<string, unknown>
        : {};

      // Build brandContext from current wizard state (for Re-generate mode)
      const brandContext = {
        targetCountry: selectedCountry,
        isMultiMarket,
        ...(selectedPersonality && { targetPersonality: selectedPersonality }),
        ...(selectedPlatformType && { targetPlatformType: selectedPlatformType }),
      };

      // Build prompt history entry from this generation
      const newHistoryEntry = {
        prompt: brandPrompt,
        timestamp: new Date().toISOString(),
        ...(opt.summaryText && { keyColorsSummary: opt.summaryText }),
      };

      // Append to existing history (or start new)
      const existingHistory = Array.isArray(existingConfig.brandPromptHistory)
        ? (existingConfig.brandPromptHistory as Array<unknown>)
        : [];

      const mergedConfig = {
        ...existingConfig,
        palette: opt.palette,
        brandContext,
        brandPromptHistory: [newHistoryEntry, ...existingHistory].slice(0, 20),
        ...(logoUrl && { logoUrl }),
      };

      const { error } = await (supabase as any)
        .from("onboarding_forms")
        .upsert(
          { client_id: clientId, studio_config: mergedConfig },
          { onConflict: "client_id" },
        );
      if (error) throw error;

      setSelectedIndex(index);
      toast.success("Palette selected! Opening Studio…");
      setTimeout(() => onNext(), 700);
    } catch (err) {
      console.error("[Step4] Save failed:", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      if (
        errMsg.toLowerCase().includes("jwt") ||
        errMsg.toLowerCase().includes("expired") ||
        errMsg.toLowerCase().includes("unauthorized")
      ) {
        toast.error("Session expired. Please refresh the page and try again.");
      } else {
        toast.error("Failed to save selection. Please try again.");
      }
      setSaving(false);
    }
  }

  const allSettled = options.every((o) => o.status === "done" || o.status === "error");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground mb-1">Choose your brand palette</h2>
        <p className="text-sm text-muted-foreground">
          Three AI-generated options for your{" "}
          <span className="text-foreground">{PERSONALITY_TITLES[selectedPersonality]}</span> brand.
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
                "flex flex-col rounded-xl border gap-0 transition-all duration-200 min-h-[420px] overflow-hidden",
                "bg-card border-border",
                isSelected && "ring-2 ring-primary border-primary",
                isDone && !isSelected && "hover:border-primary/40",
              )}
            >
              {/* Header — subtle distinction */}
              <div className="flex flex-col gap-0.5 bg-muted/30 border-b border-border px-5 py-3">
                <span className="micro-label">{OPTION_LABELS[i]}</span>
                <span className="text-sm font-semibold text-foreground truncate">{optionLabel(i as 0 | 1 | 2)}</span>
              </div>

              <div className="flex flex-col gap-3 p-5 flex-1">
                {/* Preview */}
                {isDone && opt.palette ? (
                  <div className="card-reveal">
                    <PaletteCardPreview palette={opt.palette} reasoning={opt.summaryText} />
                  </div>
                ) : isError ? (
                  <div className="flex-1 rounded-lg bg-muted flex flex-col items-center justify-center gap-2 border border-dashed border-border">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <span className="text-xs text-muted-foreground">Generation failed</span>
                    <button
                      onClick={() => generateOption(i as 0 | 1 | 2)}
                      className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 mt-0.5"
                    >
                      <RefreshCw className="h-3 w-3" /> Retry
                    </button>
                  </div>
                ) : (
                  <PremiumLoadingState status={opt.status} streamingText={opt.streamingText} />
                )}

                {/* Select button */}
                <Button
                  onClick={() => handleSelect(i)}
                  disabled={!isDone || saving || selectedIndex !== null}
                  className={cn(
                    "w-full text-sm mt-auto h-11",
                    isSelected
                      ? "btn-premium"
                      : "bg-muted hover:bg-muted/70 border border-border text-foreground",
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
          className="h-11 px-6 bg-transparent border-border text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          ← Back
        </Button>

        {options.some((o) => o.status === "done" || o.status === "error") && (
          <Button
            variant="outline"
            onClick={handleRegenerate}
            disabled={options.some((o) => o.status === "loading" || o.status === "streaming") || saving}
            className="h-11 px-6 bg-transparent border-border text-muted-foreground hover:bg-muted hover:text-foreground gap-2"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Generate 3 New Options
          </Button>
        )}
      </div>
    </div>
  );
}

interface PaletteCardPreviewProps {
  palette: TCMPalette;
  reasoning: string;
}

function PaletteCardPreview({ palette, reasoning }: PaletteCardPreviewProps) {
  return (
    <div className="flex flex-col gap-3 flex-1">
      {/* Brand colors — primary dominant, secondary as smaller accent */}
      <div className="flex items-center gap-2">
        <div
          className="swatch-reveal h-10 w-10 rounded-full border-2 border-zinc-700/50 shadow-md"
          style={{ backgroundColor: palette.primary, animationDelay: "0ms" }}
          title="Primary brand color"
        />
        {palette.secondary && (
          <div
            className="swatch-reveal h-6 w-6 rounded-full border-2 border-zinc-700/50 shadow-md"
            style={{ backgroundColor: palette.secondary, animationDelay: "80ms" }}
            title="Accent color (used sparingly)"
          />
        )}
      </div>

      {/* Mini Sportsbook Mockup */}
      <div
        className="rounded-lg overflow-hidden border flex flex-col text-[9px] leading-tight"
        style={{
          backgroundColor: palette.primaryBackgroundColor,
          color: palette.lightTextColor,
          borderColor: palette.borderAndGradientBg,
        }}
      >
        {/* Top bar */}
        <div
          className="px-2 py-1.5 flex items-center justify-between border-b"
          style={{ borderColor: palette.borderAndGradientBg }}
        >
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: palette.primary }} />
            <span className="font-semibold" style={{ color: palette.lightTextColor }}>
              YourBrand
            </span>
          </div>
          <div className="flex gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: palette.lightTextColor, opacity: 0.4 }} />
            <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: palette.lightTextColor, opacity: 0.4 }} />
          </div>
        </div>

        {/* Bonus banner */}
        <div
          className="px-2 py-1.5 text-center font-semibold"
          style={{
            background: palette.secondary
              ? `linear-gradient(135deg, ${palette.primaryButton}, ${palette.secondary})`
              : palette.primaryButton,
            color: palette.darkTextColor,
          }}
        >
          🎁 100% WELCOME BONUS
        </div>

        {/* CTA buttons */}
        <div className="px-2 py-2 flex gap-1.5">
          <div
            className="flex-1 rounded text-center py-1 font-bold"
            style={{
              backgroundColor: palette.activeSecondaryGradientColor ?? palette.primaryButton,
              color: palette.darkTextColor,
            }}
          >
            🔥 BetBuilder
          </div>
          <div
            className="flex-1 rounded text-center py-1 font-bold"
            style={{
              backgroundColor: palette.secondary ?? palette.primaryButton,
              color: palette.darkTextColor,
            }}
          >
            ⇄ Peer-to-Peer
          </div>
        </div>

        {/* Live game card */}
        <div
          className="mx-2 mb-2 rounded p-1.5 flex flex-col gap-1"
          style={{
            backgroundColor: palette.boxGradientColorStart ?? palette.primaryBackgroundColor,
            border: `1px solid ${palette.borderAndGradientBg}`,
          }}
        >
          <div className="flex items-center justify-between">
            <span style={{ color: palette.primary, fontWeight: "bold" }}>● LIVE</span>
            <span style={{ color: palette.lightTextColor, opacity: 0.6 }}>Premier League</span>
          </div>
          <span style={{ color: palette.lightTextColor }}>Liverpool vs Arsenal</span>
          <div className="flex gap-1">
            {["1.85", "3.55", "4.15"].map((odds) => (
              <div
                key={odds}
                className="flex-1 rounded text-center py-0.5 font-semibold"
                style={{
                  backgroundColor: palette.primaryButton,
                  color: palette.lightTextColor,
                }}
              >
                {odds}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reasoning bullets */}
      {reasoning && <ReasoningBullets text={reasoning} />}
    </div>
  );
}

interface ReasoningBulletsProps {
  text: string;
}

function ReasoningBullets({ text }: ReasoningBulletsProps) {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const bullets: string[] = [];
  let nonBulletText = "";

  for (const line of lines) {
    const bulletMatch = line.match(/^[•*\-]\s+(.+)$/);
    if (bulletMatch) {
      bullets.push(bulletMatch[1].trim());
    } else {
      nonBulletText += (nonBulletText ? " " : "") + line;
    }
  }

  if (bullets.length >= 2) {
    return (
      <ul className="text-sm text-muted-foreground leading-relaxed space-y-1.5 pl-0">
        {bullets.map((b, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-muted-foreground/60 shrink-0">•</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
  );
}

interface PremiumLoadingStateProps {
  status: OptionStatus;
  streamingText: string;
}

function PremiumLoadingState({ status, streamingText }: PremiumLoadingStateProps) {
  const isActive = status === "loading" || status === "streaming";
  const phaseText = useLoadingPhase(isActive);

  return (
    <div className="flex flex-col gap-3 px-1 py-2">
      {/* Color swatches skeleton */}
      <div className="flex items-center gap-2">
        <div className="h-10 w-10 rounded-full shimmer-skeleton" />
        <div className="h-6 w-6 rounded-full shimmer-skeleton" />
      </div>

      {/* Mockup skeleton */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="h-7 shimmer-skeleton" />
        <div className="h-8 shimmer-skeleton" />
        <div className="px-2 py-2 flex gap-1.5">
          <div className="flex-1 h-7 rounded shimmer-skeleton" />
          <div className="flex-1 h-7 rounded shimmer-skeleton" />
        </div>
        <div className="mx-2 mb-2 h-20 rounded shimmer-skeleton" />
      </div>

      {/* Status text with subtle pulse dot */}
      <div className="flex items-center gap-2 pt-1">
        <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
        <span className="text-xs text-muted-foreground">
          {phaseText}…
        </span>
      </div>

      {/* Streaming text preview if available */}
      {status === "streaming" && streamingText && (
        <div className="text-xs text-muted-foreground/70 leading-relaxed line-clamp-3 italic">
          {streamingText}
        </div>
      )}
    </div>
  );
}
