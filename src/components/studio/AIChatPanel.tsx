import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { TriveltaLogo } from "@/components/TriveltaLogo";
import { toast } from "sonner";
import { useStudio, type LogoVariant } from "@/contexts/StudioContext";
import { type TCMPalette } from "@/lib/tcm-palette";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
  logoVariants?: LogoVariant[];
}

/* ── Logo request detector ────────────────────────────────────────────────── */

function isLogoRequest(text: string): boolean {
  const lower = text.toLowerCase();
  const verbs = /\b(create|generate|design|make|draw|build|give\s+me|need|want|produce)\b/;
  const subjects = /\b(logo|brand\s*mark|wordmark|app\s+icon|brand\s+identity|icon)\b/;
  return verbs.test(lower) && subjects.test(lower);
}

/* ── Welcome message ──────────────────────────────────────────────────────── */

function buildWelcomeMessage(hasLogo: boolean): string {
  if (hasLogo) {
    return "Hi! I'm your Trivelta Assistant. I can see your logo is already uploaded. Describe your brand direction and I'll generate a complete color palette that complements it. Want me to generate alternative logos too? Just ask.";
  }
  return "Hi! I'm your Trivelta Assistant — your brand designer. Describe your platform in 1-2 sentences and I'll generate a complete color palette. I can also generate logos — just ask \"create a logo for BetNova\". Or upload your own logo in Brand Assets.";
}

/* ── Component ────────────────────────────────────────────────────────────── */

export function AIChatPanel() {
  const {
    setPalette,
    addBrandPrompt,
    brandPromptHistory,
    palette,
    manualOverrides,
    locked,
    language,
    appIcons,
    setAppIcons,
    appName,
  } = useStudio();

  const hasLogo = !!(appIcons.appNameLogo || appIcons.topLeftAppIcon);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (brandPromptHistory.length === 0) {
      return [{ role: "assistant", content: buildWelcomeMessage(hasLogo) }];
    }
    // Reconstruct from persisted history (newest-first → reverse for chronological display)
    const msgs: ChatMessage[] = [{ role: "assistant", content: buildWelcomeMessage(hasLogo) }];
    for (const entry of [...brandPromptHistory].reverse()) {
      msgs.push({ role: "user", content: entry.prompt });
      if (entry.logoVariants && entry.logoVariants.length > 0) {
        msgs.push({
          role: "assistant",
          content: `Here are the logo variants I generated for ${appName || "your brand"}. Click one to apply it.`,
          logoVariants: entry.logoVariants,
        });
      } else {
        const reply = entry.reasoning || entry.keyColorsSummary;
        if (reply) {
          msgs.push({ role: "assistant", content: reply });
        }
      }
    }
    return msgs;
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<"palette" | "logo">("palette");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update welcome message if logo is uploaded after initial mount
  const prevHasLogoRef = useRef(hasLogo);
  useEffect(() => {
    if (hasLogo !== prevHasLogoRef.current) {
      prevHasLogoRef.current = hasLogo;
      setMessages((prev) => {
        if (prev.length === 1 && prev[0].role === "assistant") {
          return [{ role: "assistant", content: buildWelcomeMessage(hasLogo) }];
        }
        return prev;
      });
    }
  }, [hasLogo]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  /* ── Logo select handler ────────────────────────────────────────────────── */

  const handleLogoSelect = useCallback(
    (logoUrl: string) => {
      setAppIcons((prev) => ({
        ...prev,
        appNameLogo: logoUrl,
        topLeftAppIcon: logoUrl,
      }));
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Logo applied! You can see it in Brand Assets on the left. Want me to adjust your color palette to complement it?",
        },
      ]);
    },
    [setAppIcons],
  );

  /* ── Logo generation ────────────────────────────────────────────────────── */

  const handleLogoGeneration = useCallback(
    async (userMessage: string) => {
      setLoadingType("logo");
      setLoading(true);

      try {
        const { data, error } = await supabase.functions.invoke("generate-logo", {
          body: {
            userRequest: userMessage,
            primaryColor: palette.primary,
            secondaryColor: palette.secondary,
            fallbackBrandName: appName || "the platform",
          },
        });

        if (error) throw new Error(error.message);

        const logos = (data?.logos ?? []) as LogoVariant[];

        if (logos.length === 0) {
          throw new Error("No logo variants returned");
        }

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Here are 3 logo variants — ${data.extractedBrandName || appName || "your brand"}. Click one to use it.`,
            logoVariants: logos,
          },
        ]);

        addBrandPrompt(userMessage, "Logo variants generated", undefined, undefined, logos);
      } catch (err) {
        console.error("[AIChatPanel] generate-logo error:", err);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "I couldn't generate logos right now. Please try again, or upload your own logo in Brand Assets.",
            isError: true,
          },
        ]);
      } finally {
        setLoading(false);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
    },
    [palette.primary, palette.secondary, appName, addBrandPrompt],
  );

  /* ── Palette generation ─────────────────────────────────────────────────── */

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading || locked) return;

      setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
      setInput("");

      // Route logo requests to logo generation
      if (isLogoRequest(trimmed)) {
        await handleLogoGeneration(trimmed);
        return;
      }

      setLoadingType("palette");
      setLoading(true);

      try {
        const isRefinement = brandPromptHistory.length > 0;

        const { data, error } = await supabase.functions.invoke("generate-palette", {
          body: {
            brandPrompt: trimmed,
            language,
            logoUrl: appIcons.appNameLogo || appIcons.topLeftAppIcon || undefined,
            currentPalette: isRefinement ? palette : undefined,
            manualOverrides: Array.from(manualOverrides),
            ...(isRefinement && { regenerationFeedback: trimmed }),
          },
        });

        if (error) throw error;

        if (!data?.palette) {
          throw new Error("No palette returned from AI");
        }

        setPalette(data.palette as TCMPalette);
        const reasoning: string | undefined =
          typeof data.reasoning === "string" ? data.reasoning : undefined;
        const keyColorsSummary: string | undefined =
          typeof data.keyColorsSummary === "string" ? data.keyColorsSummary : undefined;
        addBrandPrompt(trimmed, undefined, reasoning, keyColorsSummary);

        const summaryText: string =
          reasoning || keyColorsSummary || "Palette applied — check the preview on the right.";

        setMessages((prev) => [...prev, { role: "assistant", content: summaryText }]);

        if (Array.isArray(data.warnings) && data.warnings.length > 0) {
          toast.warning((data.warnings as string[]).join("; "), { duration: 4000 });
        }
      } catch (err) {
        console.error("[AIChatPanel] generate-palette error:", err);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Something went wrong generating your palette. Please try again.",
            isError: true,
          },
        ]);
      } finally {
        setLoading(false);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
    },
    [
      loading,
      locked,
      palette,
      manualOverrides,
      brandPromptHistory,
      language,
      appIcons,
      setPalette,
      addBrandPrompt,
      handleLogoGeneration,
    ],
  );

  /* ── Cycling progress hints ─────────────────────────────────────────────── */

  const PALETTE_HINTS = [
    "Analyzing brand direction…",
    "Mapping semantic colors…",
    "Applying contrast grammar…",
    "Finalizing palette…",
  ];
  const LOGO_HINTS = [
    "Understanding your brand…",
    "Designing variants…",
    "Rendering high-resolution PNG…",
  ];
  const [hintIndex, setHintIndex] = useState(0);
  useEffect(() => {
    if (!loading) {
      setHintIndex(0);
      return;
    }
    const id = setInterval(() => setHintIndex((i) => i + 1), 3000);
    return () => clearInterval(id);
  }, [loading]);

  const hints = loadingType === "logo" ? LOGO_HINTS : PALETTE_HINTS;
  const currentHint = hints[hintIndex % hints.length];
  const headline =
    loadingType === "logo" ? "Creating logo variants…" : "Generating your color palette…";

  /* ── Render ─────────────────────────────────────────────────────────────── */

  return (
    <div className="flex flex-col h-full">
      {/* Messages — fills available space */}
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[92%] rounded-2xl px-3.5 py-2.5 text-[12px] leading-relaxed",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : msg.isError
                    ? "bg-destructive/10 text-destructive rounded-tl-sm border border-destructive/20"
                    : "bg-secondary text-secondary-foreground rounded-tl-sm",
              )}
            >
              {msg.content}

              {/* Logo variant picker */}
              {msg.logoVariants && msg.logoVariants.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {msg.logoVariants.map((logo, idx) => (
                    <button
                      key={logo.seed}
                      onClick={() => handleLogoSelect(logo.url)}
                      className="group relative aspect-square overflow-hidden rounded-lg border-2 border-border bg-muted/30 transition-all hover:border-primary hover:shadow-lg"
                      title={`Use logo variant ${idx + 1}`}
                    >
                      <img
                        src={logo.url}
                        alt={`Logo variant ${idx + 1}`}
                        className="h-full w-full object-contain p-2"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/70 opacity-0 transition-opacity group-hover:opacity-100">
                        <span className="rounded-md bg-primary px-2 py-1 text-[10px] font-bold text-primary-foreground">
                          Use this
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start animate-fade-in">
            <div className="max-w-[92%] rounded-2xl rounded-tl-sm border border-primary/15 bg-gradient-to-br from-secondary via-secondary to-primary/[0.04] px-4 py-3.5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="animate-pulse-scale">
                  <TriveltaLogo size="sm" withSubtitle={false} />
                </div>
                <div className="flex items-center gap-1.5 text-[12px] font-semibold text-secondary-foreground">
                  <span>Trivelta Assistant is thinking</span>
                  <span className="flex items-end gap-0.5 pb-0.5">
                    <span className="h-1 w-1 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
                    <span className="h-1 w-1 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
                    <span className="h-1 w-1 animate-bounce rounded-full bg-primary" />
                  </span>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-muted-foreground">{headline}</div>
              <div
                key={currentHint}
                className="mt-0.5 animate-fade-in text-[10.5px] italic text-muted-foreground/70"
              >
                {currentHint}
              </div>
              <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-border/60">
                <div className="progress-shimmer h-full rounded-full" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input — sticky at bottom */}
      <div className="shrink-0 flex items-center gap-2 border-t border-border px-3 py-3">
        <input
          ref={inputRef}
          className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-[12px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder={
            locked
              ? "Design is locked"
              : loading
                ? "Trivelta Assistant is working…"
                : "Describe your brand, or ask for a logo…"
          }
          value={input}
          disabled={locked || loading}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage(input);
            }
          }}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || loading || locked}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}
