import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { applyPatch, type Operation } from "fast-json-patch";
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
  Lock, Palette, ChevronDown, ChevronUp, ChevronsUp, ChevronsDown, Download, Undo2,
  ShieldAlert, Mail, Clapperboard, Info,
} from "lucide-react";
import Lottie from "lottie-react";
import { cn } from "@/lib/utils";

/* ── Constants ──────────────────────────────────────────────────────────── */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

// Allowed JSON Patch paths - mirrors ALLOWED PATCH PATHS in system prompt exactly
const ALLOWED_PATCH_PATHS = new Set([
  "/primaryBg", "/primary", "/secondary", "/primaryButton", "/primaryButtonGradient",
  "/wonGradient1", "/wonGradient2", "/boxGradient1", "/boxGradient2",
  "/headerGradient1", "/headerGradient2", "/lightText", "/placeholderText",
  // Also accept the internal key names so manual edits keep working
  "/headerBorder1", "/headerBorder2", "/placeholder", "/inactiveButton",
]);

const RGBA_RE = /^rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*[\d.]+\s*\)$/;

// Maps ThemeColors keys to --p-* CSS custom properties on the preview element
const THEME_TO_CSS_VAR: Partial<Record<keyof StudioThemeColors, string>> = {
  primaryBg: "--p-bg",
  primary: "--p-primary",
  secondary: "--p-secondary",
  lightText: "--p-text",
  placeholder: "--p-muted",
  primaryButton: "--p-btn",
  primaryButtonGradient: "--p-btn-grad",
  inactiveButton: "--p-inactive",
  wonGradient1: "--p-won1",
  wonGradient2: "--p-won2",
  headerBorder1: "--p-nav",
  headerBorder2: "--p-card",
};

const MAX_UNDO = 20;

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

/* ── Image-request detection (mirrors edge function) ────────────────────── */

function isImageRequest(text: string): boolean {
  const lower = text.toLowerCase();
  const wantsCreate = /\b(create|generate|design|make|draw|build|give me|need|want)\b/.test(lower);
  const isAsset = /\blogo\b|\bbrand mark\b|\bwordmark\b|\bapp icon\b|\bicon\b|\bfavicon\b/.test(lower);
  return wantsCreate && isAsset;
}

/* ── Response quality sanitizer ────────────────────────────────────────── */

function sanitizeChatText(raw: string): string {
  let t = raw
    .replace(/\*\*/g, "")       // strip markdown bold
    .replace(/\*/g, "")         // strip markdown italic
    .replace(/—/g, "-")         // em dash -> hyphen
    .replace(/!+\s*$/g, ".")    // trailing exclamation mark -> period
    .replace(/!(?=\s)/g, ".")   // mid-sentence exclamation -> period
    .trim();
  // Hard cap at 150 chars (first 2 sentences)
  if (t.length > 150) {
    const sentences = t.match(/[^.?]+[.?]+/g) ?? [t];
    t = sentences.slice(0, 2).join(" ").trim();
    if (!t) t = raw.slice(0, 150).trim();
  }
  return t;
}

/* ── Patch validation ───────────────────────────────────────────────────── */

function validateOps(ops: unknown): ops is Operation[] {
  if (!Array.isArray(ops)) return false;
  return ops.every(
    (op) =>
      op &&
      typeof op === "object" &&
      op.op === "replace" &&
      typeof op.path === "string" &&
      ALLOWED_PATCH_PATHS.has(op.path) &&
      typeof op.value === "string" &&
      RGBA_RE.test(op.value.trim()),
  );
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
    if (/^#[0-9a-fA-F]{6}$/.test(v))
      setThemeColors((prev) => ({ ...prev, [colorKey]: hexToRgba(v, alpha) }));
  };

  return (
    <div className={cn("flex items-center gap-2", readOnly && "pointer-events-none opacity-50")}>
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
          className={cn("font-mono", compact ? "h-7 text-[10px]" : "h-7 text-[11px]")}
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
  compact = false,
}: {
  label: string;
  type: "logo" | "icon";
  currentUrl: string | null;
  readOnly?: boolean;
  compact?: boolean;
}) {
  const { setAppIcons } = useStudio();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

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
      toast.success(`${label} applied`, { duration: 1500 });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        className="hidden"
        disabled={readOnly}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) applyFile(f); e.target.value = ""; }}
      />
      <button
        type="button"
        disabled={readOnly}
        onClick={() => !readOnly && fileRef.current?.click()}
        onDragEnter={() => { if (!readOnly) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f?.type.startsWith("image/")) applyFile(f); }}
        className={cn(
          "w-full rounded-xl border-2 border-dashed transition-all text-left",
          compact ? "px-3 py-2" : "px-4 py-3",
          readOnly ? "cursor-default border-border/30 bg-background/10" :
          dragging ? "border-primary bg-primary/10" :
          "border-border bg-background/30 hover:border-primary/40 hover:bg-accent/20",
        )}
      >
        {currentUrl ? (
          <div className="flex items-center gap-2.5">
            {type === "logo"
              ? <img src={currentUrl} alt="Logo" className="h-7 max-w-[80px] rounded object-contain" />
              : <img src={currentUrl} alt="Icon" className="h-8 w-8 rounded-lg object-contain" />
            }
            <div>
              <div className={cn("font-semibold text-foreground", compact ? "text-[11px]" : "text-[12px]")}>{label}</div>
              {!readOnly && <div className="text-[10px] text-muted-foreground">Click to replace</div>}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted/50">
              <Upload className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div>
              <div className={cn("font-semibold text-foreground", compact ? "text-[11px]" : "text-[12px]")}>{label}</div>
              <div className="text-[10px] text-muted-foreground">
                {readOnly ? "Not uploaded" : "PNG, SVG · drag or click"}
              </div>
            </div>
          </div>
        )}
      </button>
      {currentUrl && (
        <a
          href={currentUrl}
          download={type === "logo" ? "logo.png" : "app-icon.png"}
          onClick={(e) => e.stopPropagation()}
          className="mt-1.5 flex items-center justify-center gap-1.5 rounded-lg border border-border/50 px-3 py-1 text-[10px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
        >
          <Download className="h-3 w-3" /> Download
        </a>
      )}
    </div>
  );
}

/* ── Image message ───────────────────────────────────────────────────────── */

function ImageMessage({
  msg,
  onUse,
  onRegenerate,
}: {
  msg: DisplayMessage;
  onUse: (url: string, type: "logo" | "icon") => void;
  onRegenerate: (prompt: string) => void;
}) {
  const [usedAs, setUsedAs] = useState<"logo" | "icon" | null>(null);
  return (
    <div className="space-y-2">
      {msg.content && (
        <div className="text-[12px] leading-relaxed prose-chat">
          <ReactMarkdown>{msg.content}</ReactMarkdown>
        </div>
      )}
      {/* Full-width image */}
      <div className="w-full overflow-hidden rounded-lg border border-white/10">
        <img src={msg.imageUrl} alt={`Generated ${msg.imageType}`} className="w-full object-cover" />
      </div>
      {/* Action buttons */}
      <div className="flex flex-wrap gap-1.5 pt-0.5">
        <button
          onClick={() => { onUse(msg.imageUrl!, "logo"); setUsedAs("logo"); }}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-all"
          style={{
            background: usedAs === "logo" ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.1)",
            color: usedAs === "logo" ? "#4ade80" : "white",
            border: `1px solid ${usedAs === "logo" ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.15)"}`,
          }}
        >
          <CheckCircle2 className="h-3 w-3" />
          {usedAs === "logo" ? "Applied as Logo" : "Use as Logo"}
        </button>
        <button
          onClick={() => { onUse(msg.imageUrl!, "icon"); setUsedAs("icon"); }}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-all"
          style={{
            background: usedAs === "icon" ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.08)",
            color: usedAs === "icon" ? "#4ade80" : "rgba(255,255,255,0.7)",
            border: `1px solid ${usedAs === "icon" ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.1)"}`,
          }}
        >
          <CheckCircle2 className="h-3 w-3" />
          {usedAs === "icon" ? "Applied as Icon" : "Use as Icon"}
        </button>
        {msg.sourcePrompt && (
          <button
            onClick={() => onRegenerate(msg.sourcePrompt!)}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium"
            style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <RefreshCw className="h-3 w-3" /> Try again
          </button>
        )}
        <a
          href={msg.imageUrl}
          download="trivelta-logo.png"
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium"
          style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <Download className="h-3 w-3" /> Download PNG
        </a>
      </div>
    </div>
  );
}

/* ── Lock confirmation modal ─────────────────────────────────────────────── */

function SaveConfirmModal({
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
      <div className="w-[420px] rounded-2xl border border-border bg-card p-7 shadow-2xl">
        <div className="mb-1 flex items-center gap-2.5">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-success/15">
            <Lock className="h-4 w-4 text-success" />
          </div>
          <span className="text-[16px] font-semibold text-foreground">Lock your design?</span>
        </div>
        <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
          Once saved, your design will be sent to your Account Manager for implementation.
          You won't be able to make changes after this point - contact your AM if adjustments are needed.
        </p>
        <div className="mt-6 flex justify-end gap-2.5">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-border px-5 py-2.5 text-[13px] font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-success px-5 py-2.5 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
            Lock &amp; Submit Design
          </button>
        </div>
      </div>
    </div>
  );
}

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
          <span className="text-[15px] font-semibold">Lock My Design?</span>
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
            className="flex items-center gap-2 rounded-lg bg-success px-4 py-2 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
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

  /* ── State ── */
  const [locked, setLocked] = useState(initialLocked);
  const [lockedAt, setLockedAt] = useState<string | null>(initialLockedAt);
  const [lockModalOpen, setLockModalOpen] = useState(false);
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const [locking, setLocking] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(() => {
    try { return localStorage.getItem("studio-chat-open") !== "false"; } catch { return true; }
  });
  const [saving, setSaving] = useState(false);

  // Persist chat panel open/close state
  useEffect(() => {
    try { localStorage.setItem("studio-chat-open", String(chatOpen)); } catch { /* ignore */ }
  }, [chatOpen]);

  const [displayMessages, setDisplayMessages] = useState<DisplayMessage[]>([
    {
      role: "assistant",
      content: "Hi! I'm your platform design assistant. Describe the look and feel you want, or ask me to generate a logo.",
    },
  ]);
  const [apiHistory, setApiHistory] = useState<ApiMessage[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [pendingIsImage, setPendingIsImage] = useState(false);
  const [patchPending, setPatchPending] = useState(false);
  // Undo history: stack of previous themeColors snapshots + description
  const [undoStack, setUndoStack] = useState<Array<{ colors: StudioThemeColors; label: string }>>([]);
  const [animationsOpen, setAnimationsOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [lottieData, setLottieData] = useState<Record<string, any | null>>({
    loading: null, splash: null, live: null,
  });
  useEffect(() => {
    const slots = [
      { key: "loading", url: "https://assets3.lottiefiles.com/packages/lf20_poqmycou.json" },
      { key: "splash",  url: "https://assets3.lottiefiles.com/packages/lf20_kkflmtur.json" },
      { key: "live",    url: "https://assets3.lottiefiles.com/packages/lf20_xl5uw1a2.json" },
    ];
    slots.forEach(({ key, url }) => {
      fetch(url)
        .then((r) => r.json())
        .then((data) => setLottieData((prev) => ({ ...prev, [key]: data })))
        .catch(() => { /* silently ignore — placeholder just won't render */ });
    });
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Ref to the preview container div for instant CSS var updates before React re-render
  const previewContainerRef = useRef<HTMLDivElement>(null);
  // Stable Supabase Storage URL of the most recently generated or applied logo.
  // Populated when an image event arrives (before user clicks "Use as Logo").
  // Passed to the edge function as logoUrl so Claude Vision always gets a non-expiring URL.
  const stableLogoUrl = useRef<string | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages, thinking]);

  /* ── Save helpers ── */
  const saveNow = useCallback(async () => {
    const payload: StudioSavedConfig = { colors: themeColors, icons: appIcons };
    await supabase.from("onboarding_forms").upsert(
      { client_id: clientId, studio_config: payload as never },
      { onConflict: "client_id" },
    );
  }, [clientId, themeColors, appIcons]);

  const scheduleAutoSave = useCallback(
    (colors: StudioThemeColors, icons: StudioAppIcons) => {
      if (locked) return;
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(async () => {
        await supabase.from("onboarding_forms").upsert(
          { client_id: clientId, studio_config: { colors, icons } as never },
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
  const handleSaveAndContinue = () => {
    if (locked) {
      navigate({ to: "/onboarding/$clientId/success", params: { clientId } });
    } else {
      setSaveConfirmOpen(true);
    }
  };

  /* ── Call design-locked edge function; returns true on success ── */
  const callDesignLocked = useCallback(async (): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/design-locked`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? SUPABASE_ANON_KEY}`,
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ client_id: clientId }),
      });
      if (!res.ok) {
        console.error("[studio] design-locked HTTP", res.status, await res.text());
        return false;
      }
      return true;
    } catch (e) {
      console.error("[studio] design-locked fetch error:", e);
      return false;
    }
  }, [clientId]);

  /* ── Lock design ── */
  const handleLock = async () => {
    setLocking(true);
    try {
      const now = new Date().toISOString();
      await supabase.from("onboarding_forms").upsert(
        {
          client_id: clientId,
          studio_config: { colors: themeColors, icons: appIcons } as never,
          studio_locked: true,
          studio_locked_at: now,
          notion_sync_pending: false,
        },
        { onConflict: "client_id" },
      );
      setLocked(true);
      setLockedAt(now);
      setLockModalOpen(false);

      const notionOk = await callDesignLocked();
      if (notionOk) {
        toast.success("Design locked! Your Trivelta team has been notified.");
      } else {
        toast.warning("Design locked locally. Notion sync will retry automatically.");
        await supabase.from("onboarding_forms").upsert(
          { client_id: clientId, notion_sync_pending: true },
          { onConflict: "client_id" },
        );
      }
    } catch {
      toast.error("Failed to lock design - try again.");
    } finally {
      setLocking(false);
    }
  };

  /* -- Lock & submit (from Save & Continue modal) -- */
  const handleLockAndSubmit = async () => {
    setLocking(true);
    try {
      const now = new Date().toISOString();
      await supabase.from("onboarding_forms").upsert(
        {
          client_id: clientId,
          studio_config: { colors: themeColors, icons: appIcons } as never,
          studio_locked: true,
          studio_locked_at: now,
          notion_sync_pending: false,
        },
        { onConflict: "client_id" },
      );
      setLocked(true);
      setLockedAt(now);
      setSaveConfirmOpen(false);

      const notionOk = await callDesignLocked();
      if (notionOk) {
        toast.success("Design locked and submitted!");
      } else {
        toast.warning("Design locked locally. Notion sync will retry automatically.");
        await supabase.from("onboarding_forms").upsert(
          { client_id: clientId, notion_sync_pending: true },
          { onConflict: "client_id" },
        );
      }

      navigate({ to: "/onboarding/$clientId/success", params: { clientId } });
    } catch {
      toast.error("Failed to submit design - try again.");
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

  /* ── Apply color patch (JSON Patch ops) ── */
  const applyColorPatch = useCallback((ops: Operation[], label: string) => {
    setThemeColors((prev) => {
      // Push current snapshot to undo stack (capped at MAX_UNDO)
      setUndoStack((stack) => [
        { colors: prev, label },
        ...stack.slice(0, MAX_UNDO - 1),
      ]);

      // Tier-1: write CSS vars directly to preview container before React re-renders
      const previewEl = previewContainerRef.current;
      if (previewEl) {
        for (const op of ops) {
          if (op.op === "replace") {
            const key = op.path.slice(1) as keyof StudioThemeColors;
            const cssVar = THEME_TO_CSS_VAR[key];
            if (cssVar) previewEl.style.setProperty(cssVar, op.value as string);
          }
        }
      }

      // Apply patch atomically to a clone of themeColors
      try {
        const result = applyPatch({ ...prev }, ops as Operation[], false, false);
        return result.newDocument as StudioThemeColors;
      } catch {
        return prev; // if patch fails, leave colors unchanged
      }
    });
  }, [setThemeColors]);

  /* ── Undo last color patch ── */
  const handleUndo = useCallback(() => {
    setUndoStack((stack) => {
      if (stack.length === 0) return stack;
      const [top, ...rest] = stack;
      setThemeColors(top.colors);
      // Also revert CSS vars on the preview container
      const previewEl = previewContainerRef.current;
      if (previewEl) {
        for (const [key, cssVar] of Object.entries(THEME_TO_CSS_VAR)) {
          const val = top.colors[key as keyof StudioThemeColors];
          if (val) previewEl.style.setProperty(cssVar, val as string);
        }
      }
      toast.info(`Reverted: ${top.label}`, { duration: 2000 });
      return rest;
    });
  }, [setThemeColors]);

  // Ctrl+Z keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleUndo]);

  /* ── AI send (streaming SSE) ── */
  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;

    const isImg = isImageRequest(trimmed);
    setDisplayMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    const nextHistory = [...apiHistory, { role: "user" as const, content: trimmed }];
    setApiHistory(nextHistory);
    setInput("");
    setThinking(true);
    setPendingIsImage(isImg);
    setPatchPending(false);

    // Add a blank assistant message that we'll stream tokens into
    const assistantMsgIndex = nextHistory.length; // position in displayMessages after user msg
    setDisplayMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    let fullChatText = "";
    let appliedPatch = false;
    let imageReceived = false;

    try {
      // Get auth token for direct fetch (supabase.functions.invoke doesn't support SSE)
      const { data: sessionData } = await supabase.auth.getSession();
      const authToken = sessionData.session?.access_token ?? SUPABASE_ANON_KEY;

      const resp = await fetch(`${SUPABASE_URL}/functions/v1/studio-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`,
          "apikey": SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          message: trimmed,
          history: apiHistory,
          logoUrl: stableLogoUrl.current || appIcons.appNameLogo || appIcons.topLeftAppIcon || null,
          currentColors: themeColors,
        }),
      });

      if (!resp.ok || !resp.body) {
        throw new Error(`HTTP ${resp.status}: ${await resp.text()}`);
      }

      const reader = resp.body.getReader();
      const dec = new TextDecoder();
      let sseBuffer = "";

      const updateLastMsg = (updater: (msg: DisplayMessage) => DisplayMessage) => {
        setDisplayMessages((prev) => {
          const msgs = [...prev];
          const lastIdx = msgs.length - 1;
          if (lastIdx >= 0 && msgs[lastIdx].role === "assistant") {
            msgs[lastIdx] = updater(msgs[lastIdx]);
          }
          return msgs;
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        sseBuffer += dec.decode(value, { stream: true });
        const lines = sseBuffer.split("\n");
        sseBuffer = lines.pop()!; // keep partial last line

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          let event: Record<string, unknown>;
          try { event = JSON.parse(line.slice(6)); } catch { continue; }

          if (event.type === "token") {
            // Stream <chat> text into the assistant message
            const tok = event.text as string;
            fullChatText += tok;
            updateLastMsg((msg) => ({ ...msg, content: sanitizeChatText(fullChatText) }));

          } else if (event.type === "patch") {
            // Validate and apply color patch atomically
            const ops = event.ops as unknown;
            if (validateOps(ops)) {
              setPatchPending(true);
              const label = ops.map((o) => o.path.slice(1)).join(", ") + " change";
              applyColorPatch(ops, label);
              appliedPatch = true;
              toast.success("Colors updated", { duration: 1500 });
            } else {
              console.warn("[studio] Invalid patch ops - skipped:", ops);
            }
            setPatchPending(false);

          } else if (event.type === "generating") {
            // DALL-E has started - show progress bar in the message
            // The pendingIsImage indicator at the bottom handles this visually already,
            // but we also flag it on the message itself so the progress bar shows inline
            setPendingIsImage(true);

          } else if (event.type === "image") {
            const imageUrl = event.imageUrl as string | null;
            const imageType = (event.imageType ?? "logo") as "logo" | "icon";
            const imageError = event.imageError as string | null;
            imageReceived = true;
            if (imageUrl) {
              stableLogoUrl.current = imageUrl;
              updateLastMsg((msg) => ({ ...msg, imageUrl, imageType, sourcePrompt: trimmed }));
            } else if (imageError) {
              updateLastMsg((msg) => ({
                ...msg,
                content: (msg.content || sanitizeChatText(fullChatText)) +
                  "\n\nImage generation failed - please try again.",
              }));
            }

          } else if (event.type === "error") {
            const errStr = String(event.message ?? "");
            const isKeyErr = errStr.includes("API_KEY") || errStr.includes("not configured");
            updateLastMsg((msg) => ({
              ...msg,
              content: isKeyErr
                ? "API key not configured - contact your administrator."
                : "Something went wrong. Please try again.",
            }));

          } else if (event.type === "done") {
            // Finalize: ensure chat text is sanitized
            updateLastMsg((msg) => ({
              ...msg,
              content: sanitizeChatText(fullChatText) || msg.content,
            }));
            // Record final chat text in API history
            setApiHistory((prev) => [...prev, { role: "assistant", content: sanitizeChatText(fullChatText) }]);
          }
        }
      }

      // Fallback: if stream ended without a "done" event
      if (fullChatText) {
        updateLastMsg((msg) => ({ ...msg, content: sanitizeChatText(fullChatText) }));
        setApiHistory((prev) => {
          // Only append if not already added
          const last = prev[prev.length - 1];
          if (last?.role !== "assistant") {
            return [...prev, { role: "assistant", content: sanitizeChatText(fullChatText) }];
          }
          return prev;
        });
      }

    } catch (err) {
      const errStr = String(err);
      const isKeyErr = errStr.includes("API_KEY") || errStr.includes("not configured");
      setDisplayMessages((prev) => {
        const msgs = [...prev];
        const lastIdx = msgs.length - 1;
        if (lastIdx >= 0 && msgs[lastIdx].role === "assistant" && !msgs[lastIdx].content) {
          msgs[lastIdx] = {
            role: "assistant",
            content: isKeyErr
              ? "API key not configured - contact your administrator."
              : "Something went wrong. Please try again.",
          };
        }
        return msgs;
      });
    } finally {
      setThinking(false);
      setPendingIsImage(false);
      setPatchPending(false);
    }
  }, [thinking, apiHistory, clientId, applyColorPatch]);

  /* ── Color config ── */
  const singleColors: { label: string; key: keyof StudioThemeColors }[] = [
    { label: "Background", key: "primaryBg" },
    { label: "Primary", key: "primary" },
    { label: "Secondary", key: "secondary" },
    { label: "Light Text", key: "lightText" },
    { label: "Placeholder", key: "placeholder" },
  ];
  const gradients: { label: string; startKey: keyof StudioThemeColors; endKey: keyof StudioThemeColors }[] = [
    { label: "Button", startKey: "primaryButton", endKey: "primaryButtonGradient" },
    { label: "Box", startKey: "boxGradient1", endKey: "boxGradient2" },
    { label: "Header", startKey: "headerBorder1", endKey: "headerBorder2" },
    { label: "Won", startKey: "wonGradient1", endKey: "wonGradient2" },
  ];

  const canLock = !!appIcons.appNameLogo;
  const bothCollapsed = !chatOpen && !controlsOpen;
  const lockedDate = lockedAt
    ? new Date(lockedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : null;

  return (
    <div className="flex h-screen flex-col overflow-hidden">

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 flex h-[52px] shrink-0 items-center border-b border-border bg-background/90 backdrop-blur-xl px-5">
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
          {locked ? (
            <button
              onClick={() => navigate({ to: "/onboarding/$clientId/success", params: { clientId } })}
              className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-4 py-2 text-[12px] font-semibold text-success transition-colors hover:bg-success/15"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Design Submitted
            </button>
          ) : (
            <button
              onClick={handleSaveAndContinue}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-[12px] font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save &amp; Continue
              {!saving && <ArrowRight className="h-3.5 w-3.5 text-primary" />}
            </button>
          )}
        </div>
      </header>

      {locked && (
        <div className="shrink-0 flex items-center justify-center gap-2 border-b border-success/20 bg-success/8 px-5 py-2 text-[12px] font-semibold text-success">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          Design locked on {lockedDate} - Your Account Manager will be in touch
        </div>
      )}

      {/* ── BODY ────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ══ LEFT PANEL ═══════════════════════════════════════════════ */}
        <div className={cn(
          "flex flex-col overflow-hidden border-r border-border bg-card transition-[width] duration-200",
          bothCollapsed
            ? "w-[210px] min-w-[210px] max-w-[210px]"
            : "w-[35%] min-w-[300px] max-w-[440px]",
        )}>

          {/* Always-visible identity strip + collapse-all button */}
          <div className="shrink-0 flex items-center justify-between border-b border-border px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/15">
                <Sparkles className="h-3 w-3 text-primary" />
              </div>
              <span className="truncate text-[11px] font-bold text-foreground">
                {welcomeInfo?.clientName ?? "Studio"}
              </span>
            </div>
            <button
              onClick={() => {
                if (bothCollapsed) { setChatOpen(true); }
                else { setChatOpen(false); setControlsOpen(false); }
              }}
              className="ml-2 flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              title={bothCollapsed ? "Expand panels" : "Collapse all"}
            >
              {bothCollapsed
                ? <><ChevronsDown className="h-3 w-3" /> Expand</>
                : <><ChevronsUp className="h-3 w-3" /> Collapse</>
              }
            </button>
          </div>

          {/* ── AI Assistant toggle ──────────────────────────────────────── */}
          <button
            type="button"
            onClick={() => setChatOpen((v) => !v)}
            className="shrink-0 flex w-full items-center justify-between border-b border-border px-4 py-2.5 text-left transition-colors hover:bg-secondary/40"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-[11px] font-semibold text-foreground">AI Assistant</span>
              {!chatOpen && locked && (
                <CheckCircle2 className="h-3 w-3 text-success" />
              )}
            </div>
            {chatOpen
              ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
              : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            }
          </button>

          {/* ── AI chat expanded content ─────────────────────────────────── */}
          {chatOpen && (
            <>
              {/* Locked status bar (only shown when design is locked) */}
              {locked && (
                <div className="shrink-0 flex items-center gap-1.5 border-b border-border px-4 py-2 text-[11px] font-semibold text-success">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Design Locked{lockedDate ? ` · ${lockedDate}` : ""}
                </div>
              )}

              {/* Chat messages */}
              <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 space-y-3">
                {displayMessages.map((msg, i) => (
                  <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[92%] rounded-2xl px-3.5 py-2.5 text-[12px] leading-relaxed",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-secondary text-secondary-foreground rounded-tl-sm",
                    )}>
                      {msg.role === "assistant" && msg.imageUrl ? (
                        <ImageMessage msg={msg} onUse={handleUseImage} onRegenerate={sendMessage} />
                      ) : msg.role === "assistant" ? (
                        <div className="text-[12px] leading-relaxed prose-chat">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <span className="whitespace-pre-wrap text-[12px]">{msg.content}</span>
                      )}
                    </div>
                  </div>
                ))}

                {/* Image generation progress indicator (shown while DALL-E is running) */}
                {thinking && pendingIsImage && (
                  <div className="flex justify-start">
                    <div className="max-w-[92%] rounded-2xl rounded-tl-sm bg-secondary px-3.5 py-3">
                      <div className="flex items-center gap-2 text-[12px] font-medium text-secondary-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                        <span>Generating your logo - this takes 10-15 seconds</span>
                      </div>
                      <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-border">
                        <div className="progress-shimmer h-full rounded-full" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat input + undo */}
              <div className="shrink-0 flex items-center gap-2 border-t border-border px-3 py-3">
                {undoStack.length > 0 && (
                  <button
                    onClick={handleUndo}
                    title="Undo last color change (Ctrl+Z)"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  >
                    <Undo2 className="h-3.5 w-3.5" />
                  </button>
                )}
                <input
                  ref={chatInputRef}
                  className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-[12px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/50"
                  placeholder="Describe your brand colors... or ask for a logo"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
                  }}
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || thinking}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm disabled:opacity-40"
                >
                  {thinking && !pendingIsImage ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                </button>
              </div>
            </>
          )}

          {/* ── Fine-tune manually (collapsible) ────────────────────────── */}
          <div className="shrink-0 border-t border-border">
            <button
              type="button"
              onClick={() => setControlsOpen((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-secondary/40"
            >
              <div className="flex items-center gap-2">
                <Palette className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[11px] font-semibold text-foreground">Fine-tune manually</span>
              </div>
              {controlsOpen
                ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              }
            </button>

            {controlsOpen && (
              <div className="max-h-[300px] overflow-y-auto border-t border-border px-4 py-3 space-y-4">
                {/* Brand Assets */}
                <div>
                  <div className="mb-2 text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">Brand Assets</div>
                  <div className="space-y-2">
                    <AssetUploadZone label="Logo" type="logo" currentUrl={appIcons.appNameLogo} readOnly={locked} compact />
                    <AssetUploadZone label="App Icon" type="icon" currentUrl={appIcons.topLeftAppIcon} readOnly={locked} compact />
                  </div>
                </div>

                {/* Single colors */}
                <div>
                  <div className="mb-2 text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">Colors</div>
                  <div className="space-y-2">
                    {singleColors.map(({ label, key }) => (
                      <StudioColorField key={key} label={label} colorKey={key} readOnly={locked} />
                    ))}
                  </div>
                </div>

                {/* Gradients */}
                <div>
                  <div className="mb-2 text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">Gradients</div>
                  <div className="space-y-3.5">
                    {gradients.map(({ label, startKey, endKey }) => (
                      <div key={label}>
                        <div className="mb-1.5 flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground">{label}</span>
                          <div
                            className="h-1.5 flex-1 rounded-full border border-border/40"
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
            )}
          </div>

          {/* ── Animations (collapsible) ────────────────────────────────── */}
          <div className="shrink-0 border-t border-border">
            <button
              type="button"
              onClick={() => setAnimationsOpen((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-secondary/40"
            >
              <div className="flex items-center gap-2">
                <Clapperboard className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[11px] font-semibold text-foreground">Animations</span>
              </div>
              {animationsOpen
                ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              }
            </button>

            {animationsOpen && (
              <div className="border-t border-border px-4 py-3 space-y-4">
                {/* Info message */}
                <div className="flex gap-2.5 rounded-lg border border-primary/20 bg-primary/8 p-3">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    Animations are created by your Trivelta design team based on your brand colors and logo.
                    After locking your design, your Account Manager will commission the animations.
                  </p>
                </div>

                {/* Placeholder Lottie previews */}
                {[
                  { key: "loading", label: "Loading Animation" },
                  { key: "splash",  label: "Splash Screen" },
                  { key: "live",    label: "Live Icon" },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <div className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">
                      {label}
                    </div>
                    <div className="relative flex items-center justify-center overflow-hidden rounded-lg border border-border bg-background/60" style={{ height: 120 }}>
                      {lottieData[key] ? (
                        <Lottie
                          animationData={lottieData[key]}
                          loop
                          style={{ height: 100, width: "100%" }}
                        />
                      ) : (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/40" />
                      )}
                      <span className="absolute bottom-1.5 right-2 rounded-sm bg-background/80 px-1 py-0.5 font-mono text-[8px] uppercase tracking-wide text-muted-foreground/60">
                        Placeholder
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Lock Design (always visible) ───────────────────────────── */}
          <div className="shrink-0 border-t border-border p-3">
            {locked ? (
              <div className="flex items-center justify-center gap-2 rounded-xl border border-success/20 bg-success/10 py-3 text-[13px] font-bold text-success">
                <CheckCircle2 className="h-4 w-4" />
                Design Locked{lockedDate ? ` · ${lockedDate}` : ""}
              </div>
            ) : (
              <div>
                {!canLock && (
                  <p className="mb-1.5 text-center text-[11px] text-muted-foreground">
                    Upload or generate a logo to enable
                  </p>
                )}
                <button
                  onClick={() => setLockModalOpen(true)}
                  disabled={!canLock}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-success py-3 text-[13px] font-bold text-white shadow-md transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Lock className="h-4 w-4" />
                  Lock My Design
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ══ RIGHT PANEL - Preview (65%) ══════════════════════════════ */}
        <div className="flex flex-1 flex-col overflow-hidden bg-[#07070a]">

          {/* Mobile / Web toggle */}
          <div className="flex shrink-0 items-center justify-center gap-2 border-b border-white/[0.07] px-4 py-2.5">
            <button
              onClick={() => setPreviewMode("mobile")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-5 py-2 text-[13px] font-semibold transition-all",
                previewMode === "mobile"
                  ? "bg-white/10 text-white ring-1 ring-white/20"
                  : "text-white/35 hover:text-white/65",
              )}
            >
              <Smartphone className="h-4 w-4" /> Mobile
            </button>
            <button
              onClick={() => setPreviewMode("website")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-5 py-2 text-[13px] font-semibold transition-all",
                previewMode === "website"
                  ? "bg-white/10 text-white ring-1 ring-white/20"
                  : "text-white/35 hover:text-white/65",
              )}
            >
              <Monitor className="h-4 w-4" /> Web
            </button>
          </div>

          {/* Preview - ref used for instant CSS var updates before React re-render */}
          <div
            ref={previewContainerRef}
            className={cn(
              "flex-1 overflow-auto transition-all duration-300",
              patchPending && "ring-2 ring-primary/40 ring-inset",
            )}
          >
            <BettingAppPreview />
          </div>
        </div>
      </div>

      {/* ── Lock modal ──────────────────────────────────────────────────── */}
      {lockModalOpen && (
        <LockModal
          onConfirm={handleLock}
          onCancel={() => setLockModalOpen(false)}
          loading={locking}
        />
      )}

      {saveConfirmOpen && (
        <SaveConfirmModal
          onConfirm={handleLockAndSubmit}
          onCancel={() => setSaveConfirmOpen(false)}
          loading={locking}
        />
      )}
    </div>
  );
}

/* ── StudioPage - auth guard + config loader ─────────────────────────────── */

function StudioPage() {
  const { clientId } = useParams({ from: "/onboarding/$clientId/studio" });
  const { user, loading: authLoading } = useAuth();
  const { welcomeInfo } = useOnboardingCtx();
  const navigate = useNavigate();
  const [initialColors, setInitialColors] = useState<StudioThemeColors | undefined>(undefined);
  const [initialIcons, setInitialIcons] = useState<StudioAppIcons | undefined>(undefined);
  const [initialLocked, setInitialLocked] = useState(false);
  const [initialLockedAt, setInitialLockedAt] = useState<string | null>(null);
  const [accessLocked, setAccessLocked] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/onboarding/$clientId/auth", params: { clientId }, replace: true });
      return;
    }
    (async () => {
      const [formRes, clientRes] = await Promise.all([
        supabase
          .from("onboarding_forms")
          .select("studio_config, studio_locked, studio_locked_at")
          .eq("client_id", clientId)
          .maybeSingle(),
        supabase
          .from("clients")
          .select("studio_access_locked")
          .eq("id", clientId)
          .maybeSingle(),
      ]);

      const data = formRes.data;
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

      if (clientRes.data?.studio_access_locked) {
        setAccessLocked(true);
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

  // AM has locked Studio access — show block page instead of Studio
  if (accessLocked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mx-auto max-w-[460px]">
          <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full bg-destructive/10 ring-2 ring-destructive/20">
            <ShieldAlert className="h-10 w-10 text-destructive" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Studio Temporarily Unavailable
          </h1>
          <p className="mx-auto mt-4 max-w-[380px] text-[15px] leading-relaxed text-muted-foreground">
            Your Account Manager is currently reviewing and implementing your platform
            configuration. You'll be notified when Studio access is restored.
          </p>

          {welcomeInfo?.amName && (
            <div className="mt-8 rounded-xl border border-border bg-card p-5 text-left">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Your Account Manager
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/15 font-semibold text-sm text-primary ring-1 ring-primary/30">
                  {welcomeInfo.amName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-foreground">{welcomeInfo.amName}</div>
                  {welcomeInfo.amEmail && (
                    <div className="text-[13px] text-muted-foreground">
                      {welcomeInfo.amEmail.split(",")[0].trim()}
                    </div>
                  )}
                </div>
              </div>
              {welcomeInfo.amEmail && (
                <a
                  href={`mailto:${welcomeInfo.amEmail.split(",")[0].trim()}`}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background/60 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <Mail className="h-4 w-4" />
                  Contact your AM
                </a>
              )}
            </div>
          )}
        </div>
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
