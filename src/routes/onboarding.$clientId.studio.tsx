import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useOnboardingCtx } from "@/lib/onboarding-context";
import { supabase } from "@/integrations/supabase/client";
import {
  StudioProvider,
  useStudio,
  defaultStudioColors,
  defaultStudioAppIcons,
  type StudioThemeColors,
  type StudioAppIcons,
  type StudioSavedConfig,
} from "@/contexts/StudioContext";
import BettingAppPreview from "@/components/studio/BettingAppPreview";
import { TriveltaNav } from "@/components/TriveltaNav";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Send, Loader2, Smartphone, Monitor, Sparkles, RefreshCw, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/onboarding/$clientId/studio")({
  component: StudioPage,
});

/* ── Types ──────────────────────────────────────────────────────────────── */

interface ApiMessage {
  role: "user" | "assistant";
  content: string;
}

interface DisplayMessage {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
  imageType?: "logo" | "icon";
  // Original user prompt that triggered this image, for "Generate another"
  sourcePrompt?: string;
}

/* ── Image message bubble ────────────────────────────────────────────────── */

function ImageMessage({
  msg,
  onUse,
  onRegenerate,
}: {
  msg: DisplayMessage;
  onUse: (url: string, type: "logo" | "icon") => void;
  onRegenerate: (prompt: string) => void;
}) {
  const [used, setUsed] = useState(false);

  const handleUse = () => {
    onUse(msg.imageUrl!, msg.imageType!);
    setUsed(true);
    toast.success(`✓ ${msg.imageType === "logo" ? "Logo" : "Icon"} applied to preview`, { duration: 2500 });
  };

  return (
    <div className="space-y-2">
      {msg.content && (
        <p className="text-[13px] leading-relaxed text-secondary-foreground whitespace-pre-wrap">
          {msg.content}
        </p>
      )}
      <div className="rounded-xl overflow-hidden border border-white/10">
        <img
          src={msg.imageUrl}
          alt={`Generated ${msg.imageType}`}
          className="w-full object-cover"
          style={{ maxHeight: msg.imageType === "logo" ? 140 : 200 }}
        />
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleUse}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all"
          style={{
            background: used ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.1)",
            color: used ? "#4ade80" : "white",
            border: `1px solid ${used ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.15)"}`,
          }}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          {used ? "Applied!" : `Use this ${msg.imageType}`}
        </button>
        {msg.sourcePrompt && (
          <button
            onClick={() => onRegenerate(msg.sourcePrompt!)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all"
            style={{
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.7)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <RefreshCw className="h-3 w-3" />
            Generate another
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Inner component (needs StudioProvider above it) ─────────────────────── */

function StudioInner({ clientId }: { clientId: string }) {
  const { welcomeInfo } = useOnboardingCtx();
  const { themeColors, setThemeColors, appIcons, setAppIcons, previewMode, setPreviewMode } = useStudio();

  const [displayMessages, setDisplayMessages] = useState<DisplayMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your platform design assistant. Tell me about your brand — colors, vibe, target market — and I'll configure your theme in real time.\n\nYou can also ask me to generate a logo or app icon. Try:\n• \"Make the buttons green\"\n• \"I want a dark blue theme\"\n• \"Generate a logo for BetKing\"",
    },
  ]);
  // Separate API history (no image blobs — just text)
  const [apiHistory, setApiHistory] = useState<ApiMessage[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [saved, setSaved] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages]);

  /* Debounced save — persists both colors and icons */
  const saveConfig = useCallback(
    (colors: StudioThemeColors, icons: StudioAppIcons) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        const payload: StudioSavedConfig = { colors, icons };
        await supabase
          .from("onboarding_forms")
          .upsert(
            { client_id: clientId, studio_config: payload as never },
            { onConflict: "client_id" },
          );
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }, 2000);
    },
    [clientId],
  );

  useEffect(() => {
    saveConfig(themeColors, appIcons);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [themeColors, appIcons, saveConfig]);

  /* Send message */
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || thinking) return;

      const userDisplay: DisplayMessage = { role: "user", content: trimmed };
      const userApi: ApiMessage = { role: "user", content: trimmed };

      setDisplayMessages((prev) => [...prev, userDisplay]);
      const nextApiHistory = [...apiHistory, userApi];
      setApiHistory(nextApiHistory);
      setInput("");
      setThinking(true);

      try {
        const { data, error } = await supabase.functions.invoke("studio-chat", {
          body: { messages: nextApiHistory, clientId },
        });

        if (error) throw error;

        const {
          text: responseText,
          config,
          imageUrl,
          imageType,
        } = data as {
          text: string;
          config: Partial<StudioThemeColors> | null;
          imageUrl: string | null;
          imageType: "logo" | "icon" | null;
        };

        // Build display message
        const assistantDisplay: DisplayMessage = {
          role: "assistant",
          content: responseText,
          ...(imageUrl && { imageUrl, imageType: imageType ?? "logo", sourcePrompt: trimmed }),
        };
        setDisplayMessages((prev) => [...prev, assistantDisplay]);

        // Update API history with text only
        setApiHistory((prev) => [...prev, { role: "assistant", content: responseText }]);

        // Apply color changes
        if (config && Object.keys(config).length > 0) {
          setThemeColors((prev) => ({ ...prev, ...config }));
          toast.success("✓ Colors applied", { duration: 2000 });
        }
      } catch (err) {
        setDisplayMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Sorry, something went wrong. Please try again." },
        ]);
      } finally {
        setThinking(false);
      }
    },
    [thinking, apiHistory, clientId, setThemeColors],
  );

  const handleSend = () => sendMessage(input);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleUseImage = useCallback(
    (url: string, type: "logo" | "icon") => {
      if (type === "logo") {
        setAppIcons((prev) => ({ ...prev, topLeftAppIcon: url, appNameLogo: url }));
      } else {
        setAppIcons((prev) => ({ ...prev, topLeftAppIcon: url }));
      }
    },
    [setAppIcons],
  );

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
          <div className="border-b border-border px-5 py-3">
            <div className="text-sm font-semibold text-foreground">Design Assistant</div>
            <div className="text-[11px] text-muted-foreground">
              Describe your brand, adjust colors, or generate a logo
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {displayMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="mr-2 mt-1 h-7 w-7 flex-shrink-0 rounded-full bg-primary/15 ring-1 ring-primary/30 grid place-items-center">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm whitespace-pre-wrap"
                      : "bg-secondary text-secondary-foreground rounded-tl-sm"
                  }`}
                >
                  {msg.role === "assistant" && msg.imageUrl ? (
                    <ImageMessage
                      msg={msg}
                      onUse={handleUseImage}
                      onRegenerate={sendMessage}
                    />
                  ) : (
                    <span className="whitespace-pre-wrap">{msg.content}</span>
                  )}
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
              <div className="mb-2 text-center text-[11px] text-success font-medium">✓ Theme saved</div>
            )}
            <div className="flex gap-2 items-end">
              <textarea
                className="flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 min-h-[44px] max-h-[120px]"
                placeholder="Describe colors, or ask to generate a logo…"
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
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>

        {/* ── Right: Preview (60%) ─────────────────────────────────────── */}
        <div className="flex flex-1 flex-col overflow-hidden bg-[#0a0a0e]">
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

          <div className="flex-1 overflow-auto">
            <BettingAppPreview />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Route component — pre-loads saved config, wraps with StudioProvider ── */

function StudioPage() {
  const { clientId } = useParams({ from: "/onboarding/$clientId/studio" });
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [initialColors, setInitialColors] = useState<StudioThemeColors | undefined>(undefined);
  const [initialIcons, setInitialIcons] = useState<StudioAppIcons | undefined>(undefined);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/onboarding/$clientId/auth", params: { clientId }, replace: true });
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("onboarding_forms")
        .select("studio_config")
        .eq("client_id", clientId)
        .maybeSingle();

      if (data?.studio_config && typeof data.studio_config === "object") {
        const saved = data.studio_config as StudioSavedConfig;
        // Support both old format (flat colors) and new format ({ colors, icons })
        if (saved.colors) {
          setInitialColors({ ...defaultStudioColors, ...saved.colors });
          setInitialIcons({ ...defaultStudioAppIcons, ...(saved.icons ?? {}) });
        } else {
          // Legacy: flat color object saved directly
          setInitialColors({ ...defaultStudioColors, ...(data.studio_config as Partial<StudioThemeColors>) });
        }
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
    <StudioProvider initialColors={initialColors} initialIcons={initialIcons}>
      <StudioInner clientId={clientId} />
    </StudioProvider>
  );
}
