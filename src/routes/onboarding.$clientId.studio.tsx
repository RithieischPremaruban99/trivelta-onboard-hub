import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useOnboardingCtx } from "@/lib/onboarding-context";
import { supabase } from "@/integrations/supabase/client";
import { StudioProvider, useStudio, defaultStudioColors, type StudioThemeColors } from "@/contexts/StudioContext";
import BettingAppPreview from "@/components/studio/BettingAppPreview";
import { TriveltaNav } from "@/components/TriveltaNav";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Send, Loader2, Smartphone, Monitor, Sparkles } from "lucide-react";

export const Route = createFileRoute("/onboarding/$clientId/studio")({
  component: StudioPage,
});

/* ── Types ──────────────────────────────────────────────────────────────── */

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/* ── Inner component (needs StudioProvider above it) ─────────────────────── */

function StudioInner({ clientId }: { clientId: string }) {
  const { welcomeInfo } = useOnboardingCtx();
  const { themeColors, setThemeColors, previewMode, setPreviewMode } = useStudio();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your platform design assistant. Tell me about your brand — colors, vibe, target market — and I'll configure your platform theme in real time. Try saying something like \"make the buttons green\" or \"I want a dark blue theme\".",
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [saved, setSaved] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Scroll chat to bottom on new message */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* Load existing studio_config on mount */
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("onboarding_forms")
        .select("studio_config")
        .eq("client_id", clientId)
        .maybeSingle();

      if (data?.studio_config && typeof data.studio_config === "object") {
        setThemeColors((prev) => ({ ...prev, ...(data.studio_config as Partial<StudioThemeColors>) }));
      }
    })();
  }, [clientId]);

  /* Debounced save to onboarding_forms.studio_config */
  const saveConfig = useCallback(
    (colors: StudioThemeColors) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        await supabase
          .from("onboarding_forms")
          .upsert({ client_id: clientId, studio_config: colors as never }, { onConflict: "client_id" });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }, 2000);
    },
    [clientId],
  );

  /* Save whenever colors change */
  useEffect(() => {
    saveConfig(themeColors);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [themeColors, saveConfig]);

  /* Send message to studio-chat edge function */
  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || thinking) return;

    const userMsg: ChatMessage = { role: "user", content: trimmed };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setThinking(true);

    try {
      const { data, error } = await supabase.functions.invoke("studio-chat", {
        body: { messages: nextMessages, clientId },
      });

      if (error) throw error;

      const { text, config } = data as { text: string; config: Partial<StudioThemeColors> | null };

      setMessages((prev) => [...prev, { role: "assistant", content: text }]);

      if (config && Object.keys(config).length > 0) {
        setThemeColors((prev) => ({ ...prev, ...config }));
        toast.success("✓ Applied", { duration: 2000 });
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setThinking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <TriveltaNav
        right={
          welcomeInfo && (
            <div className="hidden text-right sm:block">
              <div className="text-[13px] font-semibold text-foreground">{welcomeInfo.clientName}</div>
              <div className="flex items-center justify-end gap-1.5 font-mono text-[9px] uppercase tracking-[0.22em] text-primary">
                <Sparkles className="h-2.5 w-2.5" /> Platform Studio
              </div>
            </div>
          )
        }
      />

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left: Chat (40%) ─────────────────────────────────────────── */}
        <div className="flex w-[40%] min-w-[320px] flex-col border-r border-border">
          {/* Chat header */}
          <div className="border-b border-border px-5 py-3">
            <div className="text-sm font-semibold text-foreground">Design Assistant</div>
            <div className="text-[11px] text-muted-foreground">Describe your brand and I'll configure the colors</div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="mr-2 mt-1 h-7 w-7 flex-shrink-0 rounded-full bg-primary/15 ring-1 ring-primary/30 grid place-items-center">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-secondary text-secondary-foreground rounded-tl-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {thinking && (
              <div className="flex justify-start">
                <div className="mr-2 mt-1 h-7 w-7 flex-shrink-0 rounded-full bg-primary/15 ring-1 ring-primary/30 grid place-items-center">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="bg-secondary text-secondary-foreground rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border p-4">
            {saved && (
              <div className="mb-2 text-center text-[11px] text-success font-medium">
                ✓ Theme saved
              </div>
            )}
            <div className="flex gap-2 items-end">
              <textarea
                className="flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 min-h-[44px] max-h-[120px]"
                placeholder="Describe your brand colors…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <Button
                size="icon"
                className="btn-trivelta h-11 w-11 flex-shrink-0"
                onClick={handleSend}
                disabled={!input.trim() || thinking}
              >
                {thinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              Press Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>

        {/* ── Right: Preview (60%) ─────────────────────────────────────── */}
        <div className="flex flex-1 flex-col overflow-hidden bg-[#0a0a0e]">
          {/* Preview mode toggle */}
          <div className="flex items-center justify-center gap-2 border-b border-white/10 py-3 px-4">
            <button
              onClick={() => setPreviewMode("mobile")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all ${
                previewMode === "mobile"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" /> Mobile
            </button>
            <button
              onClick={() => setPreviewMode("website")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all ${
                previewMode === "website"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Monitor className="h-3.5 w-3.5" /> Web
            </button>
          </div>

          {/* Preview area */}
          <div className="flex-1 overflow-auto">
            <BettingAppPreview />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Route component — loads initial colors, wraps with StudioProvider ── */

function StudioPage() {
  const { clientId } = useParams({ from: "/onboarding/$clientId/studio" });
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [initialColors, setInitialColors] = useState<StudioThemeColors | undefined>(undefined);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/onboarding/$clientId/auth", params: { clientId }, replace: true });
      return;
    }
    // Pre-load saved colors before mounting StudioProvider so there's no flash
    (async () => {
      const { data } = await supabase
        .from("onboarding_forms")
        .select("studio_config")
        .eq("client_id", clientId)
        .maybeSingle();

      if (data?.studio_config && typeof data.studio_config === "object") {
        setInitialColors({ ...defaultStudioColors, ...(data.studio_config as Partial<StudioThemeColors>) });
      }
      setReady(true);
    })();
  }, [authLoading, user, clientId]);

  if (authLoading || !ready) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <StudioProvider initialColors={initialColors}>
      <StudioInner clientId={clientId} />
    </StudioProvider>
  );
}
