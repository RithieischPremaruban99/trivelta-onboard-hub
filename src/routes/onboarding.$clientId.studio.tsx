import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Send, Loader2, Smartphone, Monitor, Sparkles,
  RefreshCw, CheckCircle2, ChevronDown, ChevronUp, Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  sourcePrompt?: string;
}

/* ── Color utilities ────────────────────────────────────────────────────── */

function rgbaToHex(rgba: string): string {
  const m = rgba.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!m) return "#000000";
  return (
    "#" +
    [m[1], m[2], m[3]]
      .map((n) => parseInt(n).toString(16).padStart(2, "0"))
      .join("")
  );
}

function extractAlpha(rgba: string): number {
  const m = rgba.match(/rgba?\([^)]*,\s*([\d.]+)\s*\)/);
  return m ? parseFloat(m[1]) : 1;
}

function hexToRgba(hex: string, alpha = 1): string {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/* ── Studio Color Field ─────────────────────────────────────────────────── */

function StudioColorField({
  label,
  colorKey,
}: {
  label: string;
  colorKey: keyof StudioThemeColors;
}) {
  const { themeColors, setThemeColors } = useStudio();
  const rgba = themeColors[colorKey];
  const alpha = extractAlpha(rgba);
  const [hexInput, setHexInput] = useState(() => rgbaToHex(rgba));

  // Keep hex input in sync when AI applies color changes externally
  useEffect(() => {
    setHexInput(rgbaToHex(rgba));
  }, [rgba]);

  const applyHex = (v: string) => {
    if (/^#[0-9a-fA-F]{6}$/.test(v)) {
      setThemeColors((prev) => ({ ...prev, [colorKey]: hexToRgba(v, alpha) }));
    }
  };

  return (
    <div className="flex items-center gap-2.5">
      {/* Color swatch — overlays a transparent native color input */}
      <label className="relative h-8 w-8 shrink-0 cursor-pointer">
        <div
          className="h-8 w-8 rounded-md border border-border shadow-sm"
          style={{ background: rgba }}
        />
        <input
          type="color"
          value={rgbaToHex(rgba)}
          onChange={(e) => {
            setHexInput(e.target.value);
            setThemeColors((prev) => ({
              ...prev,
              [colorKey]: hexToRgba(e.target.value, alpha),
            }));
          }}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </label>

      <div className="min-w-0 flex-1">
        <div className="mb-0.5 text-[10px] leading-none text-muted-foreground">
          {label}
        </div>
        <Input
          value={hexInput}
          onChange={(e) => {
            setHexInput(e.target.value);
            applyHex(e.target.value);
          }}
          onBlur={() => setHexInput(rgbaToHex(rgba))}
          className="h-7 font-mono text-[11px]"
          placeholder="#000000"
          maxLength={7}
        />
      </div>
    </div>
  );
}

/* ── Asset upload zone ──────────────────────────────────────────────────── */

function AssetUploadZone({
  label,
  type,
  currentUrl,
}: {
  label: string;
  type: "logo" | "icon";
  currentUrl: string | null;
}) {
  const { setAppIcons } = useStudio();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      if (type === "logo") {
        setAppIcons((prev) => ({ ...prev, appNameLogo: url, topLeftAppIcon: url }));
        toast.success("Logo applied to preview", { duration: 2000 });
      } else {
        setAppIcons((prev) => ({ ...prev, topLeftAppIcon: url }));
        toast.success("Icon applied to preview", { duration: 2000 });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        className="hidden"
        onChange={handleFile}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full rounded-lg border-2 border-dashed border-border bg-background/40 px-3 py-2.5 transition-colors hover:border-primary/50 hover:bg-accent/30"
      >
        {currentUrl ? (
          <div className="flex items-center gap-2.5">
            <img
              src={currentUrl}
              alt={label}
              className={cn(
                "rounded object-contain",
                type === "logo" ? "h-6 max-w-[72px]" : "h-7 w-7",
              )}
            />
            <div className="text-left">
              <div className="text-[11px] font-medium text-foreground">{label}</div>
              <div className="text-[10px] text-muted-foreground">Click to replace</div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-muted/60">
              <Upload className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="text-left">
              <div className="text-[11px] font-medium text-foreground">{label}</div>
              <div className="text-[10px] text-muted-foreground">PNG, JPG, SVG</div>
            </div>
          </div>
        )}
      </button>
    </>
  );
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
  };

  return (
    <div className="space-y-1.5">
      {msg.content && (
        <p className="text-[12px] leading-relaxed text-secondary-foreground whitespace-pre-wrap">
          {msg.content}
        </p>
      )}
      <div className="overflow-hidden rounded-lg border border-white/10">
        <img
          src={msg.imageUrl}
          alt={`Generated ${msg.imageType}`}
          className="w-full object-cover"
          style={{ maxHeight: msg.imageType === "logo" ? 90 : 130 }}
        />
      </div>
      <div className="flex gap-1.5">
        <button
          onClick={handleUse}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition-all"
          style={{
            background: used ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.1)",
            color: used ? "#4ade80" : "white",
            border: `1px solid ${used ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.15)"}`,
          }}
        >
          <CheckCircle2 className="h-3 w-3" />
          {used ? "Applied!" : `Use ${msg.imageType}`}
        </button>
        {msg.sourcePrompt && (
          <button
            onClick={() => onRegenerate(msg.sourcePrompt!)}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium"
            style={{
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.6)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <RefreshCw className="h-3 w-3" />
            Again
          </button>
        )}
      </div>
    </div>
  );
}

/* ── StudioInner ─────────────────────────────────────────────────────────── */

function StudioInner({ clientId }: { clientId: string }) {
  const { welcomeInfo } = useOnboardingCtx();
  const { themeColors, setThemeColors, appIcons, setAppIcons, previewMode, setPreviewMode } =
    useStudio();

  // AI chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [displayMessages, setDisplayMessages] = useState<DisplayMessage[]>([
    {
      role: "assistant",
      content:
        'Describe colors or ask me to generate a logo.\nTry: "Make buttons green" or "Generate a logo for BetKing"',
    },
  ]);
  const [apiHistory, setApiHistory] = useState<ApiMessage[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [saved, setSaved] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (chatOpen) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages, chatOpen]);

  /* Debounced auto-save */
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
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [themeColors, appIcons, saveConfig]);

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

  /* Send AI message */
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || thinking) return;

      setDisplayMessages((prev) => [...prev, { role: "user", content: trimmed }]);
      const nextApiHistory = [...apiHistory, { role: "user" as const, content: trimmed }];
      setApiHistory(nextApiHistory);
      setInput("");
      setThinking(true);

      try {
        const { data, error } = await supabase.functions.invoke("studio-chat", {
          body: { messages: nextApiHistory, clientId },
        });

        // Surface API-level errors from the edge function response body
        const bodyErr: string = (data as Record<string, unknown>)?.error as string ?? "";
        if (error || bodyErr) {
          const errStr = bodyErr || String(error);
          const isKeyErr =
            errStr.includes("API_KEY") ||
            errStr.includes("not configured") ||
            errStr.includes("ANTHROPIC");
          setDisplayMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: isKeyErr
                ? "API key not configured — contact your administrator."
                : "Something went wrong. Please try again.",
            },
          ]);
          return;
        }

        const { text: responseText, config, imageUrl, imageType } = data as {
          text: string;
          config: Partial<StudioThemeColors> | null;
          imageUrl: string | null;
          imageType: "logo" | "icon" | null;
        };

        setDisplayMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: responseText,
            ...(imageUrl && {
              imageUrl,
              imageType: imageType ?? "logo",
              sourcePrompt: trimmed,
            }),
          },
        ]);
        setApiHistory((prev) => [
          ...prev,
          { role: "assistant", content: responseText },
        ]);

        if (config && Object.keys(config).length > 0) {
          setThemeColors((prev) => ({ ...prev, ...config }));
          toast.success("Colors applied", { duration: 2000 });
        }
      } catch (err) {
        const errStr = String(err);
        const isKeyErr =
          errStr.includes("API_KEY") ||
          errStr.includes("not configured") ||
          errStr.includes("ANTHROPIC");
        setDisplayMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: isKeyErr
              ? "API key not configured — contact your administrator."
              : "Something went wrong. Please try again.",
          },
        ]);
      } finally {
        setThinking(false);
      }
    },
    [thinking, apiHistory, clientId, setThemeColors],
  );

  /* Color sections */
  const singleColors: { label: string; key: keyof StudioThemeColors }[] = [
    { label: "Background", key: "primaryBg" },
    { label: "Primary", key: "primary" },
    { label: "Secondary", key: "secondary" },
    { label: "Light Text", key: "lightText" },
    { label: "Placeholder", key: "placeholder" },
  ];

  const gradients: {
    label: string;
    startKey: keyof StudioThemeColors;
    endKey: keyof StudioThemeColors;
  }[] = [
    { label: "Button Gradient", startKey: "primaryButton", endKey: "primaryButtonGradient" },
    { label: "Box Gradient", startKey: "boxGradient1", endKey: "boxGradient2" },
    { label: "Header Gradient", startKey: "headerBorder1", endKey: "headerBorder2" },
    { label: "Won Gradient", startKey: "wonGradient1", endKey: "wonGradient2" },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <TriveltaNav
        right={
          welcomeInfo && (
            <div className="hidden text-right sm:block">
              <div className="text-[13px] font-semibold text-foreground">
                {welcomeInfo.clientName}
              </div>
              <div className="flex items-center justify-end gap-1.5 font-mono text-[9px] uppercase tracking-[0.22em] text-primary">
                <Sparkles className="h-2.5 w-2.5" /> Platform Studio
              </div>
            </div>
          )
        }
      />

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left: Controls (340px, scrollable) ──────────────────────── */}
        <div className="flex w-[340px] min-w-[280px] flex-col overflow-y-auto border-r border-border bg-card">

          {/* Section header */}
          <div className="sticky top-0 z-10 border-b border-border bg-card px-4 py-2.5">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Manual Controls
            </div>
          </div>

          <div className="flex-1 space-y-6 px-4 py-4">

            {/* ── Base colors ─────────────────────────────────────────── */}
            <div>
              <div className="mb-3 text-[11px] font-semibold text-foreground/60 uppercase tracking-wide">
                Base Colors
              </div>
              <div className="space-y-3">
                {singleColors.map(({ label, key }) => (
                  <StudioColorField key={key} label={label} colorKey={key} />
                ))}
              </div>
            </div>

            {/* ── Gradients ───────────────────────────────────────────── */}
            {gradients.map(({ label, startKey, endKey }) => (
              <div key={label}>
                <div className="mb-2 flex items-center gap-2">
                  <div className="text-[11px] font-semibold text-foreground/60 uppercase tracking-wide whitespace-nowrap">
                    {label}
                  </div>
                  <div
                    className="h-2.5 flex-1 rounded-full border border-border/50"
                    style={{
                      background: `linear-gradient(90deg, ${themeColors[startKey]}, ${themeColors[endKey]})`,
                    }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <StudioColorField label="Start" colorKey={startKey} />
                  <StudioColorField label="End" colorKey={endKey} />
                </div>
              </div>
            ))}

            {/* ── Brand assets ────────────────────────────────────────── */}
            <div>
              <div className="mb-3 text-[11px] font-semibold text-foreground/60 uppercase tracking-wide">
                Brand Assets
              </div>
              <div className="space-y-2">
                <AssetUploadZone
                  label="Upload Logo"
                  type="logo"
                  currentUrl={appIcons.appNameLogo}
                />
                <AssetUploadZone
                  label="Upload Icon"
                  type="icon"
                  currentUrl={appIcons.topLeftAppIcon}
                />
              </div>
            </div>

            {/* Save indicator */}
            {saved && (
              <p className="text-center text-[11px] font-medium text-success">✓ Theme saved</p>
            )}
          </div>

          {/* ── AI Assistant (collapsible, pinned to bottom) ─────────── */}
          <div className="sticky bottom-0 border-t border-border bg-card">
            <button
              type="button"
              onClick={() => setChatOpen((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-3 transition-colors hover:bg-secondary/40"
            >
              <div className="text-left">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
                  <Sparkles className="h-3 w-3 text-primary" />
                  AI Assistant
                </div>
                <div className="mt-0.5 text-[10px] text-muted-foreground">
                  Colors: Claude &nbsp;•&nbsp; Logos: DALL-E
                </div>
              </div>
              {chatOpen ? (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>

            {chatOpen && (
              <div className="border-t border-border">
                {/* Messages — max 200px */}
                <div className="max-h-[200px] space-y-2 overflow-y-auto px-3 py-2">
                  {displayMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] rounded-xl px-3 py-1.5 text-[12px] leading-relaxed",
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground rounded-tr-sm"
                            : "bg-secondary text-secondary-foreground rounded-tl-sm",
                        )}
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
                      <div className="flex items-center gap-1 rounded-xl rounded-tl-sm bg-secondary px-3 py-2">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input row */}
                <div className="flex gap-2 border-t border-border p-2.5">
                  <input
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                    placeholder="Describe colors or ask to generate a logo..."
                    value={input}
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
                    disabled={!input.trim() || thinking}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
                  >
                    {thinking ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Preview ───────────────────────────────────────────── */}
        <div className="flex flex-1 flex-col overflow-hidden bg-[#0a0a0e]">
          {/* Mobile / Web toggle */}
          <div className="flex items-center justify-center gap-2 border-b border-white/10 px-4 py-2.5">
            <button
              onClick={() => setPreviewMode("mobile")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all",
                previewMode === "mobile"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Smartphone className="h-3.5 w-3.5" /> Mobile
            </button>
            <button
              onClick={() => setPreviewMode("website")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all",
                previewMode === "website"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
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

/* ── StudioPage — auth guard + saved config loader ───────────────────────── */

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
        if (saved.colors) {
          setInitialColors({ ...defaultStudioColors, ...saved.colors });
          setInitialIcons({ ...defaultStudioAppIcons, ...(saved.icons ?? {}) });
        } else {
          // Legacy: flat color object
          setInitialColors({
            ...defaultStudioColors,
            ...(data.studio_config as Partial<StudioThemeColors>),
          });
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
