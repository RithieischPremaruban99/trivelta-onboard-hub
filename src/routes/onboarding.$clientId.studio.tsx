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
import { TriveltaLogo } from "@/components/TriveltaLogo";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Send, Loader2, Smartphone, Monitor, Sparkles,
  RefreshCw, CheckCircle2, Upload, ArrowRight,
  Lock, Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding/$clientId/studio")({
  component: StudioPage,
});

/* ── Types ──────────────────────────────────────────────────────────────── */

interface ApiMessage { role: "user" | "assistant"; content: string }

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
  return "#" + [m[1], m[2], m[3]].map((n) => parseInt(n).toString(16).padStart(2, "0")).join("");
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
  compact = false,
  readOnly = false,
}: {
  label: string;
  colorKey: keyof StudioThemeColors;
  compact?: boolean;
  readOnly?: boolean;
}) {
  const { themeColors, setThemeColors } = useStudio();
  const rgba = themeColors[colorKey];
  const alpha = extractAlpha(rgba);
  const [hexInput, setHexInput] = useState(() => rgbaToHex(rgba));

  useEffect(() => { setHexInput(rgbaToHex(rgba)); }, [rgba]);

  const applyHex = (v: string) => {
    if (readOnly) return;
    if (/^#[0-9a-fA-F]{6}$/.test(v)) {
      setThemeColors((prev) => ({ ...prev, [colorKey]: hexToRgba(v, alpha) }));
    }
  };

  return (
    <div className={cn("flex items-center gap-2", readOnly && "opacity-60")}>
      <label className={cn("relative shrink-0", readOnly ? "cursor-default" : "cursor-pointer")}>
        <div
          className={cn("rounded-md border border-border/60 shadow-sm", compact ? "h-7 w-7" : "h-8 w-8")}
          style={{ background: rgba }}
        />
        <input
          type="color"
          value={rgbaToHex(rgba)}
          disabled={readOnly}
          onChange={(e) => {
            if (readOnly) return;
            setHexInput(e.target.value);
            setThemeColors((prev) => ({ ...prev, [colorKey]: hexToRgba(e.target.value, alpha) }));
          }}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-default"
        />
      </label>
      <div className="min-w-0 flex-1">
        {!compact && (
          <div className="mb-0.5 text-[10px] leading-none text-muted-foreground">{label}</div>
        )}
        <Input
          value={hexInput}
          readOnly={readOnly}
          onChange={(e) => { setHexInput(e.target.value); applyHex(e.target.value); }}
          onBlur={() => setHexInput(rgbaToHex(rgba))}
          className={cn("font-mono", compact ? "h-7 text-[10px]" : "h-7 text-[11px]", readOnly && "cursor-default")}
          placeholder="#000000"
          maxLength={7}
          title={label}
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
  readOnly = false,
}: {
  label: string;
  type: "logo" | "icon";
  currentUrl: string | null;
  readOnly?: boolean;
}) {
  const { setAppIcons } = useStudio();
  const fileRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState("");
  const [dragging, setDragging] = useState(false);

  const applyUrl = (url: string) => {
    if (!url.trim() || readOnly) return;
    if (type === "logo") {
      setAppIcons((prev) => ({ ...prev, appNameLogo: url, topLeftAppIcon: url }));
    } else {
      setAppIcons((prev) => ({ ...prev, topLeftAppIcon: url }));
    }
    toast.success(`${label} applied`, { duration: 1500 });
    setUrlInput("");
  };

  const applyFile = (file: File) => {
    if (readOnly) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      if (type === "logo") {
        setAppIcons((prev) => ({ ...prev, appNameLogo: url, topLeftAppIcon: url }));
      } else {
        setAppIcons((prev) => ({ ...prev, topLeftAppIcon: url }));
      }
      toast.success(`${label} applied to preview`, { duration: 1500 });
    };
    reader.readAsDataURL(file);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) applyFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (readOnly) return;
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) applyFile(file);
  };

  return (
    <div className="space-y-1.5">
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        className="hidden"
        onChange={handleFile}
        disabled={readOnly}
      />

      {/* Drop zone */}
      <button
        type="button"
        disabled={readOnly}
        onClick={() => !readOnly && fileRef.current?.click()}
        onDragEnter={() => { if (!readOnly) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className={cn(
          "group w-full rounded-xl border-2 border-dashed px-4 py-4 text-left transition-all",
          readOnly
            ? "cursor-default border-border/40 bg-background/20"
            : dragging
            ? "border-primary bg-primary/10"
            : "border-border bg-background/30 hover:border-primary/40 hover:bg-accent/20",
        )}
      >
        {currentUrl ? (
          <div className="flex items-center gap-3">
            {type === "logo" ? (
              <img src={currentUrl} alt={label} className="h-8 max-w-[96px] rounded object-contain" />
            ) : (
              <img src={currentUrl} alt={label} className="h-10 w-10 rounded-lg object-contain" />
            )}
            <div>
              <div className="text-[12px] font-semibold text-foreground">{label}</div>
              {!readOnly && <div className="text-[11px] text-muted-foreground">Click to replace · drag & drop</div>}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-1 text-center">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-muted/50">
              <Upload className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <div className="text-[12px] font-semibold text-foreground">{label}</div>
              <div className="text-[11px] text-muted-foreground">
                {readOnly ? "Not uploaded" : "PNG, JPG, SVG — drag & drop or click"}
              </div>
            </div>
          </div>
        )}
      </button>

      {/* Paste URL */}
      {!readOnly && (
        <div className="flex items-center gap-1.5">
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") applyUrl(urlInput); }}
            placeholder="or paste image URL…"
            className="h-6 text-[10px] text-muted-foreground placeholder:text-muted-foreground/50"
          />
          {urlInput && (
            <button
              onClick={() => applyUrl(urlInput)}
              className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold text-primary hover:bg-primary/10"
            >
              Apply
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Section label ──────────────────────────────────────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/60">
      {children}
    </div>
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
  return (
    <div className="space-y-2">
      {msg.content && (
        <p className="whitespace-pre-wrap text-[11px] leading-relaxed">{msg.content}</p>
      )}
      <div className="overflow-hidden rounded-lg border border-white/10">
        <img
          src={msg.imageUrl}
          alt={`Generated ${msg.imageType}`}
          className="w-full object-cover"
          style={{ maxHeight: msg.imageType === "logo" ? 88 : 120 }}
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => { onUse(msg.imageUrl!, msg.imageType!); setUsed(true); }}
          className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-semibold"
          style={{
            background: used ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.1)",
            color: used ? "#4ade80" : "white",
            border: `1px solid ${used ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.15)"}`,
          }}
        >
          <CheckCircle2 className="h-3 w-3" />
          {used ? "Applied!" : `Use as ${msg.imageType}`}
        </button>
        {msg.sourcePrompt && (
          <button
            onClick={() => onRegenerate(msg.sourcePrompt!)}
            className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-medium"
            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <RefreshCw className="h-3 w-3" /> Generate another
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Lock confirmation modal ─────────────────────────────────────────────── */

function LockModal({
  onConfirm,
  onCancel,
  loading,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-[340px] rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="mb-1 flex items-center gap-2">
          <Lock className="h-4 w-4 text-success" />
          <span className="text-[15px] font-semibold">Lock Design?</span>
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Once locked, colors and brand assets can't be changed from the Studio. Your Trivelta team will use these values to configure your platform.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-border px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-success px-4 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
            Lock Design
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── StudioInner ─────────────────────────────────────────────────────────── */

function StudioInner({
  clientId,
  initialLocked,
  initialLockedAt,
}: {
  clientId: string;
  initialLocked: boolean;
  initialLockedAt: string | null;
}) {
  const { welcomeInfo } = useOnboardingCtx();
  const navigate = useNavigate();
  const { themeColors, setThemeColors, appIcons, setAppIcons, previewMode, setPreviewMode } = useStudio();

  const [activeTab, setActiveTab] = useState<"design" | "ai">("design");
  const [locked, setLocked] = useState(initialLocked);
  const [lockedAt, setLockedAt] = useState<string | null>(initialLockedAt);
  const [lockModalOpen, setLockModalOpen] = useState(false);
  const [locking, setLocking] = useState(false);

  const [displayMessages, setDisplayMessages] = useState<DisplayMessage[]>([
    { role: "assistant", content: "Describe your colors or ask me to generate a logo.\n\nTry: \"make the buttons green\" or \"generate a logo for BetKing\"" },
  ]);
  const [apiHistory, setApiHistory] = useState<ApiMessage[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [saving, setSaving] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages]);

  /* ── Immediate save ── */
  const saveNow = useCallback(async () => {
    const payload: StudioSavedConfig = { colors: themeColors, icons: appIcons };
    await supabase.from("onboarding_forms").upsert(
      { client_id: clientId, studio_config: payload as never },
      { onConflict: "client_id" },
    );
  }, [clientId, themeColors, appIcons]);

  /* ── Debounced auto-save (skip when locked) ── */
  const scheduleAutoSave = useCallback(
    (colors: StudioThemeColors, icons: StudioAppIcons) => {
      if (locked) return;
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(async () => {
        const payload: StudioSavedConfig = { colors, icons };
        await supabase.from("onboarding_forms").upsert(
          { client_id: clientId, studio_config: payload as never },
          { onConflict: "client_id" },
        );
      }, 2000);
    },
    [clientId, locked],
  );

  useEffect(() => {
    scheduleAutoSave(themeColors, appIcons);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [themeColors, appIcons, scheduleAutoSave]);

  /* ── Save & Continue ── */
  const handleSaveAndContinue = async () => {
    setSaving(true);
    try {
      if (!locked) await saveNow();
      navigate({ to: "/onboarding/$clientId/success", params: { clientId } });
    } finally {
      setSaving(false);
    }
  };

  /* ── Lock design ── */
  const handleLock = async () => {
    setLocking(true);
    try {
      const now = new Date().toISOString();
      const payload: StudioSavedConfig = { colors: themeColors, icons: appIcons };
      await supabase.from("onboarding_forms").upsert(
        {
          client_id: clientId,
          studio_config: payload as never,
          studio_locked: true,
          studio_locked_at: now,
        },
        { onConflict: "client_id" },
      );
      setLocked(true);
      setLockedAt(now);
      setLockModalOpen(false);
      toast.success("Design locked! Your team has been notified.");
    } catch {
      toast.error("Failed to lock design — try again.");
    } finally {
      setLocking(false);
    }
  };

  /* ── Use AI-generated image ── */
  const handleUseImage = useCallback((url: string, type: "logo" | "icon") => {
    if (type === "logo") {
      setAppIcons((prev) => ({ ...prev, topLeftAppIcon: url, appNameLogo: url }));
    } else {
      setAppIcons((prev) => ({ ...prev, topLeftAppIcon: url }));
    }
  }, [setAppIcons]);

  /* ── AI message send ── */
  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;

    setDisplayMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    const nextHistory = [...apiHistory, { role: "user" as const, content: trimmed }];
    setApiHistory(nextHistory);
    setInput("");
    setThinking(true);

    try {
      const { data, error } = await supabase.functions.invoke("studio-chat", {
        body: { messages: nextHistory, clientId },
      });

      const bodyErr: string = (data as Record<string, unknown>)?.error as string ?? "";
      if (error || bodyErr) {
        const errStr = bodyErr || String(error);
        const isKeyErr = errStr.includes("API_KEY") || errStr.includes("not configured") || errStr.includes("ANTHROPIC");
        setDisplayMessages((prev) => [...prev, {
          role: "assistant",
          content: isKeyErr
            ? "API key not configured — contact your administrator."
            : "Something went wrong. Please try again.",
        }]);
        return;
      }

      const { text: responseText, config, imageUrl, imageType } = data as {
        text: string;
        config: Partial<StudioThemeColors> | null;
        imageUrl: string | null;
        imageType: "logo" | "icon" | null;
      };

      setDisplayMessages((prev) => [...prev, {
        role: "assistant",
        content: responseText,
        ...(imageUrl && { imageUrl, imageType: imageType ?? "logo", sourcePrompt: trimmed }),
      }]);
      setApiHistory((prev) => [...prev, { role: "assistant", content: responseText }]);

      if (config && Object.keys(config).length > 0) {
        setThemeColors((prev) => ({ ...prev, ...config }));
        toast.success("Colors applied", { duration: 1500 });
      }
    } catch (err) {
      const errStr = String(err);
      const isKeyErr = errStr.includes("API_KEY") || errStr.includes("not configured") || errStr.includes("ANTHROPIC");
      setDisplayMessages((prev) => [...prev, {
        role: "assistant",
        content: isKeyErr
          ? "API key not configured — contact your administrator."
          : "Something went wrong. Please try again.",
      }]);
    } finally {
      setThinking(false);
    }
  }, [thinking, apiHistory, clientId, setThemeColors]);

  /* ── Color definitions ── */
  const singleColors: { label: string; key: keyof StudioThemeColors }[] = [
    { label: "Background", key: "primaryBg" },
    { label: "Primary", key: "primary" },
    { label: "Secondary", key: "secondary" },
    { label: "Light Text", key: "lightText" },
    { label: "Placeholder", key: "placeholder" },
  ];
  const gradients: { label: string; startKey: keyof StudioThemeColors; endKey: keyof StudioThemeColors }[] = [
    { label: "Button Gradient", startKey: "primaryButton", endKey: "primaryButtonGradient" },
    { label: "Box Gradient", startKey: "boxGradient1", endKey: "boxGradient2" },
    { label: "Header Gradient", startKey: "headerBorder1", endKey: "headerBorder2" },
    { label: "Won Gradient", startKey: "wonGradient1", endKey: "wonGradient2" },
  ];

  const canLock = !!appIcons.appNameLogo && !!appIcons.topLeftAppIcon;
  const lockedDate = lockedAt ? new Date(lockedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : null;

  return (
    <div className="flex h-screen flex-col overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 flex h-[56px] shrink-0 items-center border-b border-border bg-background/90 backdrop-blur-xl px-5">
        <div className="flex w-[35%] shrink-0 items-center">
          <TriveltaLogo size="sm" />
        </div>
        <div className="flex flex-1 items-center justify-center gap-2">
          {welcomeInfo && (
            <>
              <span className="text-[13px] font-semibold text-foreground">{welcomeInfo.clientName}</span>
              <span className="text-muted-foreground/40">·</span>
            </>
          )}
          <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
            <Sparkles className="h-2.5 w-2.5" /> Platform Studio
          </span>
        </div>
        <div className="flex w-[35%] shrink-0 items-center justify-end">
          <button
            onClick={handleSaveAndContinue}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-[12px] font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Save & Continue
            {!saving && <ArrowRight className="h-3.5 w-3.5 text-primary" />}
          </button>
        </div>
      </header>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT PANEL (35%) ──────────────────────────────────────── */}
        <div className="flex w-[35%] min-w-[280px] max-w-[420px] flex-col overflow-hidden border-r border-border bg-card">

          {/* Tab bar */}
          <div className="flex shrink-0 border-b border-border">
            <button
              onClick={() => setActiveTab("design")}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 py-3 text-[12px] font-semibold transition-colors",
                activeTab === "design"
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Palette className="h-3.5 w-3.5" /> Design
            </button>
            <button
              onClick={() => { setActiveTab("ai"); setTimeout(() => chatInputRef.current?.focus(), 50); }}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 py-3 text-[12px] font-semibold transition-colors",
                activeTab === "ai"
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Sparkles className="h-3.5 w-3.5" /> AI
            </button>
          </div>

          {/* ── DESIGN TAB ──────────────────────────────────────────── */}
          {activeTab === "design" && (
            <>
              {/* Locked banner */}
              {locked && (
                <div className="flex shrink-0 items-center gap-2 border-b border-success/20 bg-success/10 px-4 py-2">
                  <Lock className="h-3.5 w-3.5 text-success" />
                  <span className="text-[11px] font-semibold text-success">Design Locked{lockedDate ? ` · ${lockedDate}` : ""}</span>
                </div>
              )}

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto">
                <div className="space-y-6 px-4 py-4">

                  {/* Brand Assets */}
                  <div>
                    <SectionLabel>Brand Assets</SectionLabel>
                    <div className="space-y-3">
                      <AssetUploadZone label="Logo" type="logo" currentUrl={appIcons.appNameLogo} readOnly={locked} />
                      <AssetUploadZone label="App Icon" type="icon" currentUrl={appIcons.topLeftAppIcon} readOnly={locked} />
                    </div>
                  </div>

                  {/* Colors */}
                  <div>
                    <SectionLabel>Colors</SectionLabel>
                    <div className="space-y-2.5">
                      {singleColors.map(({ label, key }) => (
                        <StudioColorField key={key} label={label} colorKey={key} readOnly={locked} />
                      ))}
                    </div>
                  </div>

                  {/* Gradients */}
                  <div>
                    <SectionLabel>Gradients</SectionLabel>
                    <div className="space-y-4">
                      {gradients.map(({ label, startKey, endKey }) => (
                        <div key={label}>
                          <div className="mb-2 flex items-center gap-2.5">
                            <span className="text-[11px] font-medium text-foreground/70">{label}</span>
                            <div
                              className="h-2 flex-1 rounded-full border border-border/40"
                              style={{ background: `linear-gradient(90deg, ${themeColors[startKey]}, ${themeColors[endKey]})` }}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <StudioColorField label={`${label} start`} colorKey={startKey} compact readOnly={locked} />
                            <StudioColorField label={`${label} end`} colorKey={endKey} compact readOnly={locked} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

              {/* Lock button (pinned bottom) */}
              <div className="shrink-0 border-t border-border p-4">
                {locked ? (
                  <div className="flex items-center justify-center gap-2 rounded-xl border border-success/20 bg-success/10 py-3 text-[13px] font-semibold text-success">
                    <CheckCircle2 className="h-4 w-4" />
                    Design Locked{lockedDate ? ` · ${lockedDate}` : ""}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {!canLock && (
                      <p className="text-center text-[11px] text-muted-foreground">
                        Upload logo & icon to enable
                      </p>
                    )}
                    <button
                      onClick={() => setLockModalOpen(true)}
                      disabled={!canLock}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-success py-3 text-[13px] font-bold text-white shadow-md transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <Lock className="h-4 w-4" />
                      Lock Design
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── AI TAB ──────────────────────────────────────────────── */}
          {activeTab === "ai" && (
            <div className="flex flex-1 flex-col overflow-hidden">
              {/* Model badge */}
              <div className="flex shrink-0 items-center justify-center gap-1.5 border-b border-border px-4 py-2.5">
                <span className="rounded-md bg-primary/10 px-2.5 py-1 font-mono text-[10px] font-semibold text-primary">
                  Colors & Branding: Claude&nbsp;&nbsp;·&nbsp;&nbsp;Logos & Icons: DALL-E 3
                </span>
              </div>

              {/* Messages */}
              <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
                {displayMessages.map((msg, i) => (
                  <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[90%] rounded-xl px-3 py-2 text-[12px] leading-relaxed",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-secondary text-secondary-foreground rounded-tl-sm",
                    )}>
                      {msg.role === "assistant" && msg.imageUrl ? (
                        <ImageMessage msg={msg} onUse={handleUseImage} onRegenerate={sendMessage} />
                      ) : (
                        <span className="whitespace-pre-wrap">{msg.content}</span>
                      )}
                    </div>
                  </div>
                ))}
                {thinking && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-1 rounded-xl rounded-tl-sm bg-secondary px-3 py-2.5">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="flex shrink-0 items-center gap-2 border-t border-border p-3">
                <input
                  ref={chatInputRef}
                  className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-[12px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/50"
                  placeholder={'Describe colors\u2026 or \u201cgenerate a logo for BetKing\u201d'}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || thinking}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground disabled:opacity-40"
                >
                  {thinking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL (65%) ─────────────────────────────────────── */}
        <div className="flex flex-1 flex-col overflow-hidden bg-[#0a0a0e]">

          {/* Mode toggle */}
          <div className="flex shrink-0 items-center justify-center gap-2 border-b border-white/8 px-4 py-3">
            <button
              onClick={() => setPreviewMode("mobile")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-5 py-2 text-[13px] font-semibold transition-all",
                previewMode === "mobile"
                  ? "bg-white/12 text-white shadow-sm ring-1 ring-white/20"
                  : "text-white/40 hover:text-white/70",
              )}
            >
              <Smartphone className="h-4 w-4" /> Mobile
            </button>
            <button
              onClick={() => setPreviewMode("website")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-5 py-2 text-[13px] font-semibold transition-all",
                previewMode === "website"
                  ? "bg-white/12 text-white shadow-sm ring-1 ring-white/20"
                  : "text-white/40 hover:text-white/70",
              )}
            >
              <Monitor className="h-4 w-4" /> Web
            </button>
          </div>

          {/* Preview */}
          <div className="flex-1 overflow-auto">
            <BettingAppPreview />
          </div>
        </div>
      </div>

      {/* ── Lock confirmation modal ──────────────────────────────────── */}
      {lockModalOpen && (
        <LockModal
          onConfirm={handleLock}
          onCancel={() => setLockModalOpen(false)}
          loading={locking}
        />
      )}
    </div>
  );
}

/* ── StudioPage — auth guard + config loader ─────────────────────────────── */

function StudioPage() {
  const { clientId } = useParams({ from: "/onboarding/$clientId/studio" });
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [initialColors, setInitialColors] = useState<StudioThemeColors | undefined>(undefined);
  const [initialIcons, setInitialIcons] = useState<StudioAppIcons | undefined>(undefined);
  const [initialLocked, setInitialLocked] = useState(false);
  const [initialLockedAt, setInitialLockedAt] = useState<string | null>(null);
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
        .select("studio_config, studio_locked, studio_locked_at")
        .eq("client_id", clientId)
        .maybeSingle();

      if (data?.studio_config && typeof data.studio_config === "object") {
        const saved = data.studio_config as StudioSavedConfig;
        if (saved.colors) {
          setInitialColors({ ...defaultStudioColors, ...saved.colors });
          setInitialIcons({ ...defaultStudioAppIcons, ...(saved.icons ?? {}) });
        } else {
          setInitialColors({ ...defaultStudioColors, ...(data.studio_config as Partial<StudioThemeColors>) });
        }
      }

      if (data?.studio_locked) {
        setInitialLocked(true);
        setInitialLockedAt(data.studio_locked_at ?? null);
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
      <StudioInner
        clientId={clientId}
        initialLocked={initialLocked}
        initialLockedAt={initialLockedAt}
      />
    </StudioProvider>
  );
}
