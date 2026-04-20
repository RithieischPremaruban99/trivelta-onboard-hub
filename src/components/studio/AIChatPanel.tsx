import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { useStudio } from "@/contexts/StudioContext";
import { type TCMPalette } from "@/lib/tcm-palette";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
}

function buildWelcomeMessage(hasLogo: boolean): string {
  if (hasLogo) {
    return "Hi! I'm Marcus. I can see your logo is already uploaded. Describe your brand direction and I'll generate a complete color palette that complements it.";
  }
  return "Hi! I'm Marcus, your brand designer. Describe your platform's brand in 1-2 sentences and I'll generate a complete palette. (Tip: upload your logo in Brand Assets first for better color matching.)";
}

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
  } = useStudio();

  const hasLogo = !!(appIcons.appNameLogo || appIcons.topLeftAppIcon);

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    { role: "assistant", content: buildWelcomeMessage(hasLogo) },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update welcome message if logo is uploaded after initial mount
  const prevHasLogoRef = useRef(hasLogo);
  useEffect(() => {
    if (hasLogo !== prevHasLogoRef.current) {
      prevHasLogoRef.current = hasLogo;
      setMessages((prev) => {
        // Only update if the first message is still the unmodified welcome
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

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading || locked) return;

      setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
      setInput("");
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
        addBrandPrompt(trimmed);

        const summaryText: string =
          data.keyColorsSummary || "Palette applied — check the preview on the right.";

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
    ],
  );

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
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="max-w-[92%] rounded-2xl rounded-tl-sm bg-secondary px-3.5 py-3">
              <div className="flex items-center gap-2 text-[12px] text-secondary-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                <span>Generating palette…</span>
              </div>
              <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-border">
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
          className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-[12px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50"
          placeholder={locked ? "Design is locked" : "Describe your brand colors…"}
          value={input}
          disabled={locked}
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
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm disabled:opacity-40"
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
