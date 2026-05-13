import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Send, Undo2 } from "lucide-react";
import { TriveltaIcon } from "@/components/TriveltaIcon";
import { toast } from "sonner";
import { useStudio, type LogoVariant } from "@/contexts/StudioContext";
import { type TCMPalette } from "@/lib/tcm-palette";
import { supabase } from "@/integrations/supabase/client";
import { streamGeneratePalette } from "@/lib/generate-palette-stream";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
  logoVariants?: LogoVariant[];
  isStreaming?: boolean;
  suggestions?: string[];
}

const MAX_PERSISTED_MESSAGES = 30;

function getSuggestions(prompt: string): string[] {
  const lower = prompt.toLowerCase();
  const operators = ["bet365", "sportybet", "betway", "hollywoodbets", "caliente", "betano"];
  const markets = ["nigeria", "ghana", "kenya", "mexico", "brazil", "south africa"];

  if (operators.some((o) => lower.includes(o))) {
    return ["Inspired by, not exact copy", "Darker version", "Add gold accent"];
  }
  if (markets.some((m) => lower.includes(m))) {
    return ["More premium for this market", "Brighter & bolder", "Add gold accent"];
  }
  if (lower.includes("dark")) {
    return ["Even darker", "Darken background only", "Keep this, try warmer tones"];
  }
  if (lower.includes("light") || lower.includes("bright")) {
    return ["Slightly darker", "Add more contrast", "Keep this, try cooler tones"];
  }
  return ["Make it darker", "Add gold accent", "More contrast"];
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

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
    return "Your logo is uploaded. Describe your brand direction and I'll generate a complete color palette that uses your logo's colors as the anchor. Try: \"dark premium casino for France\" or \"energetic sportsbook for Nigeria\".";
  }
  return "Describe your brand in 1-2 sentences and I'll generate a complete color palette for your platform. You can also upload your logo in Brand Assets — I'll use its colors as the foundation.";
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
    canUndo,
    undoLastChange,
    pushPaletteSnapshot,
    chatMessages: persistedChatMessages,
    setChatMessages,
  } = useStudio();

  const hasLogo = !!(appIcons.appNameLogo || appIcons.topLeftAppIcon);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const welcome: ChatMessage = { role: "assistant", content: buildWelcomeMessage(hasLogo) };
    // Prefer fully-persisted chat thread if available
    if (persistedChatMessages && persistedChatMessages.length > 0) {
      return [welcome, ...persistedChatMessages];
    }
    if (brandPromptHistory.length === 0) {
      return [welcome];
    }
    // Legacy reconstruction from brandPromptHistory (newest-first → reverse)
    const msgs: ChatMessage[] = [welcome];
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
  // Keep a ref so sendMessage can read current messages without a stale closure
  const messagesRef = useRef(messages);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  // Persist chat thread to StudioContext (auto-saved by studio.tsx).
  // Skip welcome (always regenerated), streaming entries, and logo variant blobs.
  useEffect(() => {
    const persisted = messages
      .slice(1)
      .filter((m) => !m.isStreaming)
      .map((m) => {
        const out: { role: "user" | "assistant"; content: string; isError?: boolean; suggestions?: string[] } = {
          role: m.role,
          content: m.content,
        };
        if (m.isError) out.isError = true;
        if (m.suggestions && m.suggestions.length > 0) out.suggestions = m.suggestions;
        return out;
      })
      .slice(-MAX_PERSISTED_MESSAGES);
    setChatMessages(persisted);
  }, [messages, setChatMessages]);

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
        const logoPayload = {
          userRequest: userMessage,
          primaryColor: palette.primary,
          secondaryColor: palette.secondary,
          fallbackBrandName: appName || "the platform",
        };
        console.log("[AIChatPanel] Calling generate-logo with:", logoPayload);
        const { data, error } = await supabase.functions.invoke("generate-logo", {
          body: logoPayload,
        });

        if (error) {
          console.error("[AIChatPanel] generate-logo error:", error);
          throw new Error(error.message);
        }
        console.log("[AIChatPanel] generate-logo response:", data);

        const logos = (data?.logos ?? []) as LogoVariant[];

        if (logos.length === 0) {
          throw new Error("No logo variants returned");
        }

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Here are 3 logo variants - ${data.extractedBrandName || appName || "your brand"}. Click one to use it.`,
            logoVariants: logos,
          },
        ]);

        addBrandPrompt(userMessage, "Logo variants generated", undefined, undefined, logos);
      } catch (err) {
        console.error("[AIChatPanel] generate-logo threw:", err);
        const errMsg = err instanceof Error ? err.message : "Unknown error";
        toast.error(`Logo generation failed: ${errMsg}`);
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

      // Detect undo-style commands — handle locally, no AI call
      const undoPattern = /^(undo|revert|go back|cancel last|undo (the |my )?(last |recent )?(change|changes|edit|adjustment))/i;
      if (undoPattern.test(trimmed)) {
        if (canUndo) {
          const success = undoLastChange();
          if (success) {
            setMessages((prev) => [
              ...prev,
              { role: "assistant", content: "Undone — reverted to the previous palette. Click Undo again or use the chat to keep going back." },
            ]);
            toast.success("Last change undone");
          } else {
            setMessages((prev) => [
              ...prev,
              { role: "assistant", content: "Nothing to undo." },
            ]);
          }
        } else {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: "Nothing to undo yet — make a refinement first, then I can revert it." },
          ]);
        }
        return;
      }

      // Route logo requests to logo generation
      if (isLogoRequest(trimmed)) {
        await handleLogoGeneration(trimmed);
        return;
      }

      setLoadingType("palette");
      setLoading(true);

      try {
        // Detect "theme direction change" — user wants a completely different look.
        // These must trigger fresh Sonnet generation, NOT Haiku refinement.
        // Key signals: named colors/themes ("blue theme", "dark green", "gold casino"),
        // explicit new-direction language ("completely", "instead", "different"),
        // or "theme" keyword which almost always means a new direction.
        const themeChangeSignals = /\b(theme|completely|totally|instead|new (?:color|palette|look|direction|brand)|go with|switch to|change (?:it )?to|make (?:it )?(?:a |more )?\w+ theme)\b/i;
        const isThemeChange = themeChangeSignals.test(trimmed);

        // Send currentPalette only for true refinements (not theme direction changes).
        // Edge function uses currentPalette presence to decide refinement vs fresh.
        const hasExistingPalette = brandPromptHistory.length > 0 && !isThemeChange;

        // Send last 8 turns (both user + assistant) so AI sees its own prior responses.
        // AI messages truncated harder (100 chars) since they're context, not instructions.
        // User messages truncated to 300 chars.
        const conversationHistory = messagesRef.current
          .slice(1)
          .slice(-8)
          .map((m) => ({
            role: m.role,
            content: m.role === "user"
              ? m.content.slice(0, 300)
              // Strip JSON palette block (always starts on new line with {), keep only reasoning
              : m.content.replace(/\n\{[\s\S]*$/, "").trim().slice(0, 100),
          }));

        // ALWAYS send currentPalette when it exists — edge function needs it
        // to restore manualOverrides regardless of fresh vs refinement.
        // forceFullGeneration tells edge function to skip isSimpleRefinement
        // and always use Sonnet — used for theme direction changes.
        const palettePayload = {
          brandPrompt: trimmed,
          language,
          logoUrl: appIcons.appNameLogo || appIcons.topLeftAppIcon || undefined,
          currentPalette: hasExistingPalette ? palette : undefined,
          manualOverrides: Array.from(manualOverrides),
          ...(isThemeChange && hasExistingPalette && { forceFullGeneration: true }),
          ...(!isThemeChange && hasExistingPalette && { regenerationFeedback: trimmed }),
          ...(conversationHistory.length > 0 && { conversationHistory }),
        };
        console.log("[AIChatPanel] Calling generate-palette with:", palettePayload);

        let streamingStarted = false;

        await streamGeneratePalette(palettePayload, {
          onReasoningChunk: (_chunk, accumulated) => {
            if (!streamingStarted) {
              streamingStarted = true;
              setLoading(false);
              setMessages((prev) => [
                ...prev,
                { role: "assistant", content: "", isStreaming: true },
              ]);
            }
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                content: accumulated,
              };
              return updated;
            });
          },
          onConversational: (message) => {
            setLoading(false);
            setMessages((prev) => {
              const updated = streamingStarted
                ? [...prev]
                : [...prev, { role: "assistant" as const, content: "" }];
              updated[updated.length - 1] = {
                role: "assistant",
                content: message,
                isStreaming: false,
              };
              return updated;
            });
          },
          onComplete: ({ palette: newPalette, reasoning, keyColorsSummary, warnings }) => {
            pushPaletteSnapshot(palette);
            setPalette(newPalette);
            addBrandPrompt(trimmed, undefined, reasoning, keyColorsSummary);
            const displayText =
              reasoning || keyColorsSummary || "Palette applied - check the preview on the right.";
            const suggestions = getSuggestions(trimmed);
            setMessages((prev) => {
              const updated = streamingStarted ? [...prev] : [...prev, { role: "assistant" as const, content: "" }];
              updated[updated.length - 1] = {
                role: "assistant",
                content: displayText,
                isStreaming: false,
                suggestions,
              };
              return updated;
            });
            if (warnings && warnings.length > 0) {
              toast.warning(warnings.join("; "), { duration: 4000 });
            }
          },
          onError: (streamErr) => {
            console.error("[AIChatPanel] generate-palette stream error:", streamErr);
            toast.error(`Palette generation failed: ${streamErr}`);
            setMessages((prev) => {
              const base = streamingStarted ? [...prev] : [...prev, { role: "assistant" as const, content: "" }];
              base[base.length - 1] = {
                role: "assistant",
                content: "Something went wrong generating your palette. Please try again.",
                isError: true,
                isStreaming: false,
              };
              return base;
            });
          },
          onStreamEndedUnexpectedly: (hadStarted) => {
            if (hadStarted) {
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  content: updated[updated.length - 1].content.trim() || "Response ended unexpectedly. Please try again.",
                  isStreaming: false,
                  isError: !updated[updated.length - 1].content.trim(),
                };
                return updated;
              });
            } else if (evt.type === "conversational" && typeof evt.message === "string") {
              // Conversational reply — no palette change
              streamCompleted = true;
              setLoading(false);
              setMessages((prev) => {
                const updated = streamingStarted
                  ? [...prev]
                  : [...prev, { role: "assistant" as const, content: "" }];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: evt.message as string,
                  isStreaming: false,
                };
                return updated;
              });
              reader.cancel().catch(() => {});
              break outer;
            } else if (evt.type === "complete" && evt.palette) {
              streamCompleted = true;
              pushPaletteSnapshot(palette);
              setPalette(evt.palette as TCMPalette);
              const reasoning =
                typeof evt.reasoning === "string" ? evt.reasoning : undefined;
              const keyColorsSummary =
                typeof evt.keyColorsSummary === "string" ? evt.keyColorsSummary : undefined;
              addBrandPrompt(trimmed, undefined, reasoning, keyColorsSummary);
              const displayText =
                reasoning || keyColorsSummary || "Palette applied - check the preview on the right.";

              setMessages((prev) => {
                const updated = streamingStarted ? [...prev] : [...prev, { role: "assistant" as const, content: "" }];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: displayText,
                  isStreaming: false,
                };
                return updated;
              });

              if (Array.isArray(evt.warnings) && evt.warnings.length > 0) {
                // Show warnings as persistent chat message, not a disappearing toast
                const warningText = evt.warnings
                  .map((w: string) => `⚠️ ${w}`)
                  .join("\n");
                setMessages((prev) => [
                  ...prev,
                  {
                    role: "assistant" as const,
                    content: `Note: ${warningText}`,
                    isError: false,
                  },
                ]);
              }
              reader.cancel().catch(() => {});
              break outer;
            } else if (evt.type === "error") {
              streamCompleted = true;
              const streamErr = typeof evt.message === "string" ? evt.message : JSON.stringify(evt);
              console.error("[AIChatPanel] generate-palette stream error:", streamErr);
              toast.error(`Palette generation failed: ${streamErr}`);
              setMessages((prev) => {
                const base = streamingStarted ? [...prev] : [...prev, { role: "assistant" as const, content: "" }];
                base[base.length - 1] = {
                  role: "assistant",
                  content: "Something went wrong generating your palette. Please try again.",
                  isError: true,
                  isStreaming: false,
                };
                return base;
              });
              reader.cancel().catch(() => {});
              break outer;
            }
          },
        });
      } catch (err) {
        console.error("[AIChatPanel] generate-palette threw:", err);
        const isTimeout = err instanceof Error && err.name === "AbortError";
        const errMsg = isTimeout
          ? "Request timed out after 90s — please try again"
          : err instanceof Error ? err.message : "Unknown error";
        toast.error(isTimeout ? "Request timed out — please try again" : `Palette generation failed: ${errMsg}`);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: isTimeout
              ? "The request took too long to complete. This sometimes happens during peak load. Please try again."
              : "Something went wrong generating your palette. Please try again.",
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
      {/* Messages - fills available space */}
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
              {!msg.content && msg.isStreaming && (
                <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className="opacity-60">Thinking through your brand…</span>
                </div>
              )}
              {msg.content}
              {msg.isStreaming && (
                <span className="ml-0.5 inline-block h-[0.85em] w-0.5 animate-pulse bg-current align-middle opacity-70" />
              )}

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

              {/* Suggestion chips - one-time, palette-only, non-error */}
              {msg.role === "assistant" &&
                !msg.isError &&
                !msg.isStreaming &&
                !msg.logoVariants &&
                msg.suggestions &&
                msg.suggestions.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {msg.suggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setMessages((prev) =>
                            prev.map((m, idx) =>
                              idx === i ? { ...m, suggestions: undefined } : m,
                            ),
                          );
                          sendMessage(s);
                        }}
                        disabled={loading || locked}
                        className="rounded-full border border-border bg-muted/30 px-3 py-1 text-xs transition-colors hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {s}
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
                <TriveltaIcon className="h-8 w-8 animate-pulse-scale" />
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

      {/* Undo bar */}
      {canUndo && (
        <div className="shrink-0 flex items-center border-t border-border px-3 pt-2 pb-1">
          <button
            onClick={() => {
              const success = undoLastChange();
              if (success) toast.success("Last change undone");
            }}
            className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
            title="Undo last AI change"
          >
            <Undo2 className="h-3 w-3" />
            Undo last change
          </button>
        </div>
      )}

      {/* Input - sticky at bottom */}
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
