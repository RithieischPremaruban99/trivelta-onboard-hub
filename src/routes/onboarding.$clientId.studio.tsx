import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/lib/auth-context";
import { useOnboardingCtx } from "@/lib/onboarding-context";
import { supabase } from "@/integrations/supabase/client";
import {
  StudioProvider,
  useStudio,
  defaultStudioColors,
  defaultStudioAppIcons,
  migrateLegacyThemeColors,
  type StudioThemeColors,
  type StudioAppIcons,
  type StudioSavedConfig,
  type StudioAppLabels,
  type BrandPromptEntry,
  type Language,
  LANGUAGE_NAMES,
} from "@/contexts/StudioContext";
import { type TCMPalette, DEFAULT_TCM_PALETTE } from "@/lib/tcm-palette";
import BettingAppPreview from "@/components/studio/BettingAppPreview";
import { AIChatPanel } from "@/components/studio/AIChatPanel";
import { QuickEditPanel } from "@/components/studio/QuickEditPanel";
import { AdvancedModePanel } from "@/components/studio/AdvancedModePanel";
import { AccordionSection } from "@/components/studio/AccordionSection";
import { TriveltaLogo } from "@/components/TriveltaLogo";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Loader2,
  Smartphone,
  Monitor,
  Sparkles,
  CheckCircle2,
  Upload,
  ArrowRight,
  Lock,
  Palette,
  ChevronDown,
  ChevronUp,
  Download,
  ShieldAlert,
  ShieldCheck,
  Mail,
  Clapperboard,
  Info,
  Sliders,
  Settings2,
  AlertTriangle,
} from "lucide-react";
import Lottie from "lottie-react";
import { cn } from "@/lib/utils";

/* ── Constants ──────────────────────────────────────────────────────────── */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export const Route = createFileRoute("/onboarding/$clientId/studio")({
  component: StudioPage,
});

/* ── Lottie recolor utilities ───────────────────────────────────────────── */

/** Parse "rgba(r, g, b, a)" → [r01, g01, b01] floats, or null if unparseable. */
function parseRgbaTo01(css: string): [number, number, number] | null {
  const m = css.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/);
  if (!m) return null;
  return [parseFloat(m[1]) / 255, parseFloat(m[2]) / 255, parseFloat(m[3]) / 255];
}

function colorDist(a: [number, number, number], b: [number, number, number]): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

/** Build the brand palette candidates we'll snap Lottie colors to. */
function buildBrandPalette(pal: TCMPalette): Array<[number, number, number]> {
  const fields: Array<keyof TCMPalette> = [
    "primaryBackgroundColor",
    "primary",
    "secondary",
    "primaryButton",
    "primaryButtonGradient",
    "wonGradient1",
    "wonGradient2",
    "lightTextColor",
  ];
  return fields
    .map((k) => parseRgbaTo01(pal[k]))
    .filter((c): c is [number, number, number] => c !== null);
}

function isColorArr(arr: unknown[]): arr is number[] {
  return (
    (arr.length === 3 || arr.length === 4) &&
    (arr as number[]).every((v) => typeof v === "number" && v >= -0.001 && v <= 1.001)
  );
}

function snapColor(arr: number[], palette: Array<[number, number, number]>): void {
  const src: [number, number, number] = [arr[0], arr[1], arr[2]];
  let best = palette[0];
  let bestDist = Infinity;
  for (const p of palette) {
    const d = colorDist(src, p);
    if (d < bestDist) {
      bestDist = d;
      best = p;
    }
  }
  arr[0] = best[0];
  arr[1] = best[1];
  arr[2] = best[2];
  // alpha (arr[3]) is intentionally preserved
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function walkLottieColors(
  node: unknown,
  isColorK: boolean,
  palette: Array<[number, number, number]>,
): void {
  if (Array.isArray(node)) {
    if (isColorK) {
      if (isColorArr(node as unknown[])) {
        snapColor(node as number[], palette);
      } else {
        // Animated keyframes: recolor s and e vectors inside each keyframe object
        for (const kf of node as unknown[]) {
          if (kf && typeof kf === "object") {
            const obj = kf as Record<string, unknown>;
            if (Array.isArray(obj.s) && isColorArr(obj.s)) snapColor(obj.s as number[], palette);
            if (Array.isArray(obj.e) && isColorArr(obj.e)) snapColor(obj.e as number[], palette);
          }
        }
      }
    } else {
      for (const item of node) walkLottieColors(item, false, palette);
    }
  } else if (node !== null && typeof node === "object") {
    const obj = node as Record<string, unknown>;
    for (const [k, v] of Object.entries(obj)) {
      if (k === "c" && v !== null && typeof v === "object" && !Array.isArray(v)) {
        // Color property — descend directly into its `k` value
        const cp = v as Record<string, unknown>;
        if (cp.k !== undefined) walkLottieColors(cp.k, true, palette);
      } else {
        walkLottieColors(v, false, palette);
      }
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function recolorLottieJson(json: any, palette: TCMPalette): any {
  const clone = JSON.parse(JSON.stringify(json));
  walkLottieColors(clone, false, buildBrandPalette(palette));
  return clone;
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
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) applyFile(f);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={readOnly}
        onClick={() => !readOnly && fileRef.current?.click()}
        onDragEnter={() => {
          if (!readOnly) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files?.[0];
          if (f?.type.startsWith("image/")) applyFile(f);
        }}
        className={cn(
          "w-full rounded-xl border-2 border-dashed transition-all text-left",
          compact ? "px-3 py-2" : "px-4 py-3",
          readOnly
            ? "cursor-default border-border/30 bg-background/10"
            : dragging
              ? "border-primary bg-primary/10"
              : "border-border bg-background/30 hover:border-primary/40 hover:bg-accent/20",
        )}
      >
        {currentUrl ? (
          <div className="flex items-center gap-2.5">
            {type === "logo" ? (
              <img
                src={currentUrl}
                alt="Logo"
                className="h-7 max-w-[80px] rounded object-contain"
              />
            ) : (
              <img src={currentUrl} alt="Icon" className="h-8 w-8 rounded-lg object-contain" />
            )}
            <div>
              <div
                className={cn(
                  "font-semibold text-foreground",
                  compact ? "text-[11px]" : "text-[12px]",
                )}
              >
                {label}
              </div>
              {!readOnly && (
                <div className="text-[10px] text-muted-foreground">Click to replace</div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted/50">
              <Upload className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div>
              <div
                className={cn(
                  "font-semibold text-foreground",
                  compact ? "text-[11px]" : "text-[12px]",
                )}
              >
                {label}
              </div>
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

/* ── Save & Lock modals ──────────────────────────────────────────────────── */

function LockConfirmModal({
  onConfirm,
  onCancel,
  loading,
  isAdmin = false,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
  isAdmin?: boolean;
}) {
  const [confirmInput, setConfirmInput] = useState("");
  const confirmed = confirmInput === "LOCK";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-[460px] rounded-2xl border border-border bg-card p-7 shadow-2xl">
        {/* Header */}
        <div className="mb-4 flex items-start gap-3">
          <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-destructive/10">
            <ShieldAlert className="h-4.5 w-4.5 text-destructive" />
          </div>
          <div className="flex-1">
            <div className="text-[16px] font-semibold text-foreground leading-tight">
              Lock Design &amp; Send to Trivelta Team?
            </div>
            <div className="mt-0.5 text-[11px] text-destructive font-medium">This action is permanent and cannot be undone.</div>
          </div>
        </div>

        {/* Admin override pill */}
        {isAdmin && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-3 py-2">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="text-[12px] font-semibold text-primary">Submitting as Admin</span>
            <span className="text-[11px] text-muted-foreground">— overriding primary contact requirement</span>
          </div>
        )}

        {/* Body */}
        <div className="space-y-3 text-[13px] leading-relaxed text-muted-foreground">
          <p>
            Once locked, you cannot modify colors, brand assets, language, or any other
            configuration from this Studio.
          </p>
          <p>
            Your complete design package will be sent to your Trivelta Account Manager immediately.
            Our technical team will begin configuring your platform based on these exact
            specifications.
          </p>
          <p className="text-[12px]">
            If you need changes after locking, contact your Account Manager directly — changes may
            cause deployment delays.
          </p>
        </div>

        {/* What gets locked */}
        <div className="mt-4 rounded-lg border border-border bg-muted/30 px-4 py-3">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            This will lock:
          </div>
          <ul className="space-y-1 text-[12px] text-foreground">
            <li className="flex items-center gap-2"><Lock className="h-3 w-3 text-muted-foreground shrink-0" /> All 344 color fields</li>
            <li className="flex items-center gap-2"><Lock className="h-3 w-3 text-muted-foreground shrink-0" /> Your logo and app icon</li>
            <li className="flex items-center gap-2"><Lock className="h-3 w-3 text-muted-foreground shrink-0" /> Language and app name</li>
            <li className="flex items-center gap-2"><Lock className="h-3 w-3 text-muted-foreground shrink-0" /> All manual color overrides</li>
          </ul>
        </div>

        {/* Typed confirmation */}
        <div className="mt-5">
          <label className="mb-1.5 block text-[12px] font-medium text-foreground">
            Type <span className="font-mono font-bold text-destructive">LOCK</span> to confirm
          </label>
          <input
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            placeholder="LOCK"
            autoFocus
            className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-destructive/50"
          />
        </div>

        {/* Actions */}
        <div className="mt-5 flex justify-end gap-2.5">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-border px-5 py-2.5 text-[13px] font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading || !confirmed}
            className="flex items-center gap-2 rounded-xl bg-destructive px-5 py-2.5 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Lock className="h-3.5 w-3.5" />
            )}
            Lock &amp; Send to Team
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── StudioInner ─────────────────────────────────────────────────────────── */

export function StudioInner({
  clientId,
  initialLocked,
  initialLockedAt,
}: {
  clientId: string;
  initialLocked: boolean;
  initialLockedAt: string | null;
}) {
  const { welcomeInfo, clientRole, ownerEmail } = useOnboardingCtx();
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const isAdmin = role === "admin";
  const canSubmit = clientRole === "client_owner" || isAdmin;
  const {
    palette,
    manualOverrides,
    brandPromptHistory,
    appIcons,
    setAppIcons,
    appLabels,
    previewMode,
    setPreviewMode,
    language,
    setLanguage,
    appName,
    setAppName,
    canLock,
  } = useStudio();

  /* ── State ── */
  const [locked, setLocked] = useState(initialLocked);
  const [lockedAt, setLockedAt] = useState<string | null>(initialLockedAt);
  const [lockModalOpen, setLockModalOpen] = useState(false);
  type SaveStatus = "idle" | "saving" | "saved" | "error";
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const savedFadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [locking, setLocking] = useState(false);
  type ActivePanel = "chat" | "quickEdit" | "advanced" | "animations" | null;
  const [activePanel, setActivePanel] = useState<ActivePanel>("chat");
  const [controlsOpen, setControlsOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [lottieData, setLottieData] = useState<Record<string, any | null>>({
    loading: null,
    splash: null,
    live: null,
  });
  useEffect(() => {
    const slots = [
      { key: "loading", url: "https://assets3.lottiefiles.com/packages/lf20_poqmycou.json" },
      { key: "splash", url: "https://assets3.lottiefiles.com/packages/lf20_kkflmtur.json" },
      { key: "live", url: "https://assets3.lottiefiles.com/packages/lf20_xl5uw1a2.json" },
    ];
    slots.forEach(({ key, url }) => {
      fetch(url)
        .then((r) => r.json())
        .then((data) => setLottieData((prev) => ({ ...prev, [key]: data })))
        .catch(() => {
          /* silently ignore — placeholder just won't render */
        });
    });
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [uploadedAnimations, setUploadedAnimations] = useState<
    Record<string, { data: object; url: string | null; uploading: boolean } | null>
  >({ loading: null, splash: null, live: null });

  const handleAnimationUpload = useCallback(
    async (slotKey: string, file: File) => {
      if (!file.name.endsWith(".json")) {
        toast.error("Please upload a Lottie JSON file (.json)");
        return;
      }
      try {
        const text = await file.text();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = JSON.parse(text) as any;
        const recolored = recolorLottieJson(raw, palette);

        setUploadedAnimations((prev) => ({
          ...prev,
          [slotKey]: { data: recolored, url: null, uploading: true },
        }));

        const fileName = `${clientId}/animation-${slotKey}-${Date.now()}.json`;
        const blob = new Blob([JSON.stringify(recolored)], { type: "application/json" });
        const { data: storageData, error } = await supabase.storage
          .from("studio-assets")
          .upload(fileName, blob, { contentType: "application/json", upsert: true });

        if (error) console.warn("[studio] Animation upload failed:", error);
        const url = storageData
          ? supabase.storage.from("studio-assets").getPublicUrl(fileName).data.publicUrl
          : null;

        setUploadedAnimations((prev) => ({
          ...prev,
          [slotKey]: { data: recolored, url, uploading: false },
        }));
        toast.success("Animation recolored with your brand colors");
      } catch (e) {
        toast.error("Failed to process animation — check the file is a valid Lottie JSON");
        console.error(e);
        setUploadedAnimations((prev) => ({ ...prev, [slotKey]: null }));
      }
    },
    [clientId, palette],
  );

  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Ref to the preview container div for instant CSS var updates before React re-render
  const previewContainerRef = useRef<HTMLDivElement>(null);
  // Tour refs — each points to a spotlighted area
  const tourChatRef = useRef<HTMLDivElement>(null);
  const tourFineTuneRef = useRef<HTMLDivElement>(null);
  const tourPreviewRef = useRef<HTMLDivElement>(null);
  const tourLockRef = useRef<HTMLDivElement>(null);
  const tourRefs = {
    chat: tourChatRef,
    fineTune: tourFineTuneRef,
    preview: tourPreviewRef,
    lock: tourLockRef,
  } as Record<string, React.RefObject<HTMLDivElement>>;

  // Tour state — show automatically on first visit, show help button after
  const [tourActive, setTourActive] = useState(
    () => !localStorage.getItem(`trivelta_studio_tour_${clientId}`),
  );
  const [showHelp, setShowHelp] = useState(
    () => !!localStorage.getItem(`trivelta_studio_tour_${clientId}`),
  );

  // Keep chat open while tour is running so step 2 spotlight has content to highlight
  useEffect(() => {
    if (tourActive) setActivePanel("chat");
  }, [tourActive]);

  /* ── Save helpers ── */
  const saveNow = useCallback(async () => {
    const payload: StudioSavedConfig = {
      palette,
      manualOverrides: Array.from(manualOverrides),
      brandPromptHistory,
      icons: appIcons,
      language,
      appName,
      appLabels,
    };
    await supabase
      .from("onboarding_forms")
      .upsert(
        { client_id: clientId, studio_config: payload as never },
        { onConflict: "client_id" },
      );
  }, [clientId, palette, manualOverrides, brandPromptHistory, appIcons, language, appName, appLabels]);

  const scheduleAutoSave = useCallback(
    (
      pal: TCMPalette,
      overrides: Set<keyof TCMPalette>,
      history: BrandPromptEntry[],
      icons: StudioAppIcons,
    ) => {
      if (locked) return;
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      setSaveStatus("saving");
      autoSaveTimer.current = setTimeout(async () => {
        try {
          await supabase
            .from("onboarding_forms")
            .upsert(
              {
                client_id: clientId,
                studio_config: {
                  palette: pal,
                  manualOverrides: Array.from(overrides),
                  brandPromptHistory: history,
                  icons,
                  language,
                  appName,
                  appLabels,
                } as never,
              },
              { onConflict: "client_id" },
            );
          setSaveStatus("saved");
          setLastSavedAt(new Date());
          if (savedFadeTimer.current) clearTimeout(savedFadeTimer.current);
          savedFadeTimer.current = setTimeout(() => setSaveStatus("idle"), 2000);
        } catch {
          setSaveStatus("error");
        }
      }, 2000);
    },
    [clientId, locked, language, appName, appLabels],
  );

  useEffect(() => {
    scheduleAutoSave(palette, manualOverrides, brandPromptHistory, appIcons);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [palette, manualOverrides, brandPromptHistory, appIcons, scheduleAutoSave]);

  /* ── Call design-locked edge function; returns true on success ── */
  const callDesignLocked = useCallback(async (): Promise<boolean> => {
    console.log("[Studio] Triggering design-locked function for client", clientId);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      console.log("[Studio] Auth session present:", !!session?.access_token);
      const res = await fetch(`${SUPABASE_URL}/functions/v1/design-locked`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? SUPABASE_ANON_KEY}`,
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          client_id: clientId,
          submitted_by: isAdmin ? "admin" : "client_owner",
          submitter_email: user?.email ?? null,
        }),
      });
      const responseText = await res.text();
      console.log("[Studio] design-locked response:", res.status, responseText);
      if (!res.ok) {
        console.error("[Studio] design-locked HTTP error", res.status, responseText);
        return false;
      }
      return true;
    } catch (e) {
      console.error("[Studio] design-locked fetch error:", e);
      return false;
    }
  }, [clientId, isAdmin, user]);

  /* ── Lock design ── */
  const handleLock = async () => {
    if (!canSubmit) return;
    setLocking(true);
    try {
      const now = new Date().toISOString();
      console.log("[Studio] Writing studio_locked=true to DB for client", clientId);
      await supabase.from("onboarding_forms").upsert(
        {
          client_id: clientId,
          studio_config: {
            palette,
            manualOverrides: Array.from(manualOverrides),
            brandPromptHistory,
            icons: appIcons,
            language,
            appName,
            appLabels,
          } as never,
          studio_locked: true,
          studio_locked_at: now,
          notion_sync_pending: false,
        },
        { onConflict: "client_id" },
      );
      console.log("[Studio] DB upsert complete. Calling design-locked edge function…");
      setLocked(true);
      setLockedAt(now);
      setLockModalOpen(false);

      const notionOk = await callDesignLocked();
      if (notionOk) {
        toast.success("Design submitted! Your Trivelta team has been notified.");
      } else {
        toast.warning("Design submitted. Notion sync will complete automatically.");
        await supabase
          .from("onboarding_forms")
          .upsert({ client_id: clientId, notion_sync_pending: true }, { onConflict: "client_id" });
      }

      navigate({ to: "/onboarding/$clientId/studio-locked", params: { clientId } });
    } catch {
      toast.error("Failed to submit design - try again.");
    } finally {
      setLocking(false);
    }
  };

  const lockedDate = lockedAt
    ? new Date(lockedAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 flex h-[52px] shrink-0 items-center border-b border-border bg-background/90 backdrop-blur-xl px-5">
        <div className="flex w-[35%] shrink-0 items-center">
          <TriveltaLogo size="sm" withSubtitle product="Studio" />
        </div>
        <div className="flex flex-1 items-center justify-center gap-2">
          {welcomeInfo && (
            <>
              <span className="text-[13px] font-semibold text-foreground">
                {welcomeInfo.clientName}
              </span>
              <span className="text-muted-foreground/40">·</span>
            </>
          )}
          <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
            <Sparkles className="h-2.5 w-2.5" /> Platform Studio
          </span>
        </div>
        <div className="flex w-[35%] shrink-0 items-center justify-end gap-3">
          {/* Save indicator — only when not locked */}
          {!locked && (
            <div className="flex items-center gap-1.5 text-[11px]">
              {saveStatus === "saving" && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Saving…
                </span>
              )}
              {saveStatus === "saved" && (
                <span className="flex items-center gap-1 text-success">
                  <CheckCircle2 className="h-3 w-3" />
                  Saved
                </span>
              )}
              {saveStatus === "error" && (
                <span className="flex items-center gap-1 text-destructive">
                  <AlertTriangle className="h-3 w-3" />
                  Couldn't save
                </span>
              )}
              {saveStatus === "idle" && lastSavedAt && (
                <span className="text-muted-foreground/50">
                  {(() => {
                    const diff = Math.floor((Date.now() - lastSavedAt.getTime()) / 1000);
                    if (diff < 60) return "Saved · just now";
                    if (diff < 3600) return `Saved · ${Math.floor(diff / 60)}m ago`;
                    return null;
                  })()}
                </span>
              )}
            </div>
          )}
          {locked && (
            <button
              onClick={() =>
                navigate({ to: "/onboarding/$clientId/studio-locked", params: { clientId } })
              }
              className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-4 py-2 text-[12px] font-semibold text-success transition-colors hover:bg-success/15"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Design Submitted
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

      {!locked && !canSubmit && (
        <div className="shrink-0 flex items-center justify-center gap-2 border-b border-border bg-muted/40 px-5 py-2 text-[12px] text-muted-foreground">
          <Info className="h-3.5 w-3.5 shrink-0" />
          You can edit this design. Only{" "}
          <span className="font-semibold text-foreground">{ownerEmail ?? "the account owner"}</span>{" "}
          can submit the final version.
        </div>
      )}

      {/* ── BODY ────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ══ LEFT PANEL ═══════════════════════════════════════════════ */}
        <div className="flex flex-col overflow-hidden border-r border-border bg-card w-[35%] min-w-[300px] max-w-[440px]">

          {/* Always-visible identity strip */}
          <div className="shrink-0 flex items-center gap-2 border-b border-border px-3 py-2">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/15">
              <Sparkles className="h-3 w-3 text-primary" />
            </div>
            <span className="truncate text-[11px] font-bold text-foreground">
              {welcomeInfo?.clientName ?? "Studio"}
            </span>
          </div>

          {/* ── Brand Assets (compact, collapsible) ─────────────────── */}
          <div className="shrink-0 border-b border-border">
            <button
              type="button"
              onClick={() => setControlsOpen((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-secondary/40"
            >
              <div className="flex items-center gap-2">
                <Palette className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[11px] font-semibold text-foreground">Brand Assets</span>
              </div>
              {controlsOpen ? (
                <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>

            {controlsOpen && (
              <div className="border-t border-border">
                <div className="px-4 py-3 border-b border-border">
                  <div className="mb-2 text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">
                    Language
                  </div>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as Language)}
                    disabled={locked}
                    className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {Object.entries(LANGUAGE_NAMES).map(([code, name]) => (
                      <option key={code} value={code}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="px-4 py-3 border-b border-border">
                  <div className="mb-2 text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">
                    App Name
                  </div>
                  <Input
                    value={appName}
                    onChange={(e) => !locked && setAppName(e.target.value)}
                    disabled={locked}
                    className="h-7 text-[11px]"
                    placeholder="BetNova"
                    maxLength={50}
                  />
                </div>
                <div className="px-4 py-3">
                  <div className="mb-2 text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">
                    Logo &amp; Icon
                  </div>
                  <div className="space-y-2">
                    <AssetUploadZone
                      label="Logo"
                      type="logo"
                      currentUrl={appIcons.appNameLogo}
                      readOnly={locked}
                      compact
                    />
                    <AssetUploadZone
                      label="App Icon"
                      type="icon"
                      currentUrl={appIcons.topLeftAppIcon}
                      readOnly={locked}
                      compact
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Exclusive accordion (fills remaining height) ─────────── */}
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">

            {/* Panel 1 — AI Palette Generator */}
            <AccordionSection
              sectionRef={tourChatRef}
              title="AI Palette Generator"
              icon={<Sparkles className="h-3.5 w-3.5" />}
              active={activePanel === "chat"}
              onClick={() => setActivePanel((prev) => (prev === "chat" ? null : "chat"))}
              badge={locked ? "Locked" : undefined}
            >
              {locked && (
                <div className="flex items-center gap-1.5 border-b border-border px-4 py-2 text-[11px] font-semibold text-success">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Design Locked{lockedDate ? ` · ${lockedDate}` : ""}
                </div>
              )}
              <AIChatPanel />
            </AccordionSection>

            {/* Panel 2 — Quick Edit */}
            <AccordionSection
              sectionRef={tourFineTuneRef}
              title="Quick Edit"
              icon={<Sliders className="h-3.5 w-3.5" />}
              subtitle="25 key fields"
              active={activePanel === "quickEdit"}
              onClick={() => setActivePanel((prev) => (prev === "quickEdit" ? null : "quickEdit"))}
              badge={manualOverrides.size > 0 ? `${manualOverrides.size} edited` : undefined}
            >
              <QuickEditPanel />
            </AccordionSection>

            {/* Panel 3 — Advanced Mode */}
            <AccordionSection
              title="Advanced Mode"
              icon={<Settings2 className="h-3.5 w-3.5" />}
              subtitle="All 344 fields"
              active={activePanel === "advanced"}
              onClick={() => setActivePanel((prev) => (prev === "advanced" ? null : "advanced"))}
            >
              <AdvancedModePanel />
            </AccordionSection>

            {/* Panel 4 — Animations */}
            <AccordionSection
              title="Animations"
              icon={<Clapperboard className="h-3.5 w-3.5" />}
              active={activePanel === "animations"}
              onClick={() => setActivePanel((prev) => (prev === "animations" ? null : "animations"))}
            >
              <div className="px-4 py-3 space-y-4">
                <div className="flex gap-2.5 rounded-lg border border-primary/20 bg-primary/8 p-3">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    Animations are created by your Trivelta design team based on your brand colors
                    and logo. After locking your design, your Account Manager will commission the
                    animations.
                  </p>
                </div>

                {[
                  { key: "loading", label: "Loading Animation" },
                  { key: "splash", label: "Splash Screen" },
                  { key: "live", label: "Live Icon" },
                ].map(({ key, label }) => {
                  const uploaded = uploadedAnimations[key];
                  const previewData = uploaded?.data ?? lottieData[key];
                  const isUploaded = !!uploaded;
                  const isUploading = uploaded?.uploading === true;
                  return (
                    <div key={key}>
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">
                          {label}
                        </span>
                        {!locked && (
                          <label className="flex cursor-pointer items-center gap-1 rounded-md border border-border bg-background/60 px-2 py-0.5 text-[9px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">
                            {isUploading ? (
                              <Loader2 className="h-2.5 w-2.5 animate-spin" />
                            ) : (
                              <Upload className="h-2.5 w-2.5" />
                            )}
                            {isUploaded ? "Replace" : "Upload"}
                            <input
                              type="file"
                              accept=".json"
                              className="sr-only"
                              disabled={isUploading}
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleAnimationUpload(key, f);
                                e.target.value = "";
                              }}
                            />
                          </label>
                        )}
                      </div>
                      <div
                        className="relative flex items-center justify-center overflow-hidden rounded-lg border border-border bg-background/60"
                        style={{ height: 120 }}
                      >
                        {previewData ? (
                          <Lottie
                            animationData={previewData}
                            loop
                            style={{ height: 100, width: "100%" }}
                          />
                        ) : (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/40" />
                        )}
                        <span
                          className={cn(
                            "absolute bottom-1.5 right-2 rounded-sm px-1 py-0.5 font-mono text-[8px] uppercase tracking-wide",
                            isUploaded
                              ? "bg-primary/15 text-primary"
                              : "bg-background/80 text-muted-foreground/60",
                          )}
                        >
                          {isUploaded ? "Brand colors applied" : "Placeholder"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </AccordionSection>

          </div>
          {/* end exclusive accordion */}

          {/* ── Lock Design (always visible at bottom) ─────────────────── */}
          <div ref={tourLockRef} className="shrink-0 border-t border-border p-3">
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
                {canLock && !canSubmit && (
                  <p className="mb-1.5 text-center text-[11px] text-muted-foreground">
                    Only {ownerEmail ?? "the account owner"} can submit
                  </p>
                )}
                <button
                  onClick={() => canSubmit && setLockModalOpen(true)}
                  disabled={!canLock || !canSubmit}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-success py-3 text-[13px] font-bold text-white shadow-md transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Lock className="h-4 w-4" />
                  Submit for Platform Setup
                </button>
                <p className="mt-1.5 text-center text-[10px] text-muted-foreground/60">
                  Sends your design to the Trivelta team. Cannot be undone.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ══ RIGHT PANEL - Preview (65%) ══════════════════════════════ */}
        <div ref={tourPreviewRef} className="flex flex-1 flex-col overflow-hidden bg-[#07070a]">
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

          {/* Preview */}
          <div
            ref={previewContainerRef}
            className="flex-1 overflow-auto transition-all duration-300"
          >
            <BettingAppPreview />
          </div>
        </div>
      </div>

      {/* ── Studio tour (first-time only) ───────────────────────────────── */}
      {tourActive && (
        <StudioTour
          clientId={clientId}
          onDone={() => {
            setTourActive(false);
            setShowHelp(true);
          }}
          refs={tourRefs}
        />
      )}

      {/* ── Help button (replay tour) ────────────────────────────────────── */}
      {showHelp && !tourActive && (
        <button
          onClick={() => {
            localStorage.removeItem(`trivelta_studio_tour_${clientId}`);
            setShowHelp(false);
            setTourActive(true);
          }}
          className="fixed bottom-5 right-5 z-50 grid h-8 w-8 place-items-center rounded-full border border-border bg-card text-[13px] font-bold text-muted-foreground shadow-md transition-colors hover:border-primary/50 hover:text-primary"
          title="Replay Studio tour"
        >
          ?
        </button>
      )}

      {/* ── Unified lock confirmation modal ─────────────────────────────── */}
      {lockModalOpen && (
        <LockConfirmModal
          onConfirm={handleLock}
          onCancel={() => setLockModalOpen(false)}
          loading={locking}
          isAdmin={isAdmin && clientRole !== "client_owner"}
        />
      )}

    </div>
  );
}

/* ── Studio Tour ────────────────────────────────────────────────────────── */

const TOUR_STEPS = [
  {
    refKey: null as string | null,
    title: "Welcome to Trivelta Studio",
    text: "This is where you'll design your platform. We'll show you around in 30 seconds.",
    cta: "Let's go →",
  },
  {
    refKey: "chat",
    title: "Your AI Palette Generator",
    text: "Describe what you want in plain language. Try: 'I want a dark green theme for a Nigerian sportsbook'. The AI will generate your full 344-field color palette instantly.",
    cta: "Next →",
  },
  {
    refKey: "fineTune",
    title: "Quick Edit Colors",
    text: "Prefer to control colors yourself? Click 'Quick Edit' to tweak the 25 most important fields. For full control, use Advanced Mode (all 344 fields).",
    cta: "Next →",
  },
  {
    refKey: "preview",
    title: "Live Platform Preview",
    text: "See your changes in real time. Toggle between Mobile and Web view to see exactly how your platform will look.",
    cta: "Next →",
  },
  {
    refKey: "lock",
    title: "Lock Your Design When Ready",
    text: "When you're happy with your colors and logo, click 'Lock My Design'. Your Account Manager will then configure your platform exactly as shown here.",
    cta: "Start designing →",
  },
];

function StudioTour({
  clientId,
  onDone,
  refs,
}: {
  clientId: string;
  onDone: () => void;
  refs: Record<string, React.RefObject<HTMLDivElement>>;
}) {
  const [step, setStep] = useState(0);
  const [fading, setFading] = useState(false);
  const [spotRect, setSpotRect] = useState<DOMRect | null>(null);

  const current = TOUR_STEPS[step];
  const CARD_W = 340;
  const PAD = 12;

  useLayoutEffect(() => {
    const el = current.refKey ? refs[current.refKey]?.current : null;
    const update = () => setSpotRect(el ? el.getBoundingClientRect() : null);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  const done = useCallback(() => {
    setFading(true);
    setTimeout(() => {
      localStorage.setItem(`trivelta_studio_tour_${clientId}`, "1");
      onDone();
    }, 250);
  }, [clientId, onDone]);

  const next = useCallback(() => {
    if (step < TOUR_STEPS.length - 1) setStep((s) => s + 1);
    else done();
  }, [step, done]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") done();
      if ((e.key === "Enter" || e.key === " ") && (e.target as HTMLElement).tagName !== "BUTTON") {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [done, next]);

  const cardStyle = (): React.CSSProperties => {
    const CARD_H = 230;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (!spotRect) {
      return {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%,-50%)",
        width: CARD_W,
      };
    }
    const cx = spotRect.left + spotRect.width / 2;
    const left = Math.max(PAD, Math.min(cx - CARD_W / 2, vw - CARD_W - PAD));
    const spaceBelow = vh - spotRect.bottom - PAD;
    const spaceAbove = spotRect.top - PAD;
    let top: number;
    if (spaceBelow >= CARD_H) {
      top = spotRect.bottom + PAD;
    } else if (spaceAbove >= CARD_H) {
      top = spotRect.top - CARD_H - PAD;
    } else {
      top = Math.max(
        PAD,
        Math.min(spotRect.top + (spotRect.height - CARD_H) / 2, vh - CARD_H - PAD),
      );
    }
    return { position: "fixed", top, left, width: CARD_W };
  };

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        pointerEvents: "all",
        opacity: fading ? 0 : 1,
        transition: "opacity 250ms ease",
      }}
    >
      {/* Spotlight / dark backdrop */}
      {spotRect ? (
        <div
          style={{
            position: "fixed",
            top: spotRect.top - PAD,
            left: spotRect.left - PAD,
            width: spotRect.width + PAD * 2,
            height: spotRect.height + PAD * 2,
            borderRadius: 12,
            // box-shadow creates the dark overlay; the div center is transparent, showing content
            boxShadow: "0 0 0 100vmax rgba(0,0,0,0.78)",
            border: "2px solid rgba(99,179,237,0.6)",
            pointerEvents: "none",
          }}
        />
      ) : (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.78)",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Tour card */}
      <div
        className="rounded-xl border border-white/10 bg-card shadow-2xl"
        style={{ ...cardStyle(), position: "fixed", zIndex: 10000, pointerEvents: "all" }}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-primary" />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Studio Tour
            </span>
          </div>
          <button
            onClick={done}
            className="text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            Skip tour
          </button>
        </div>

        <div className="px-5 py-4">
          <p className="mb-0.5 font-mono text-[9px] uppercase tracking-[0.15em] text-primary">
            Step {step + 1} of {TOUR_STEPS.length}
          </p>
          <h3 className="mb-2 text-[15px] font-semibold leading-snug text-foreground">
            {current.title}
          </h3>
          <p className="text-[12px] leading-relaxed text-muted-foreground">{current.text}</p>
        </div>

        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <div className="flex gap-1.5">
            {TOUR_STEPS.map((_, i) => (
              <span
                key={i}
                className="block h-1.5 rounded-full transition-all duration-200"
                style={{
                  width: i === step ? 16 : 6,
                  background: i === step ? "var(--primary)" : "rgba(255,255,255,0.15)",
                }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="rounded-lg px-3 py-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
              >
                ← Back
              </button>
            )}
            <button
              onClick={next}
              className="rounded-lg bg-primary px-4 py-1.5 text-[12px] font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
            >
              {current.cta}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ── StudioPage - auth guard + config loader ─────────────────────────────── */

function StudioPage() {
  const { clientId } = useParams({ from: "/onboarding/$clientId/studio" });
  const { user, loading: authLoading } = useAuth();
  const { welcomeInfo } = useOnboardingCtx();
  const navigate = useNavigate();
  const [initialPalette, setInitialPalette] = useState<TCMPalette | undefined>(undefined);
  const [initialManualOverrides, setInitialManualOverrides] = useState<
    (keyof TCMPalette)[] | undefined
  >(undefined);
  const [initialBrandPromptHistory, setInitialBrandPromptHistory] = useState<
    BrandPromptEntry[] | undefined
  >(undefined);
  const [initialIcons, setInitialIcons] = useState<StudioAppIcons | undefined>(undefined);
  const [initialLanguage, setInitialLanguage] = useState<Language | undefined>(undefined);
  const [initialAppName, setInitialAppName] = useState<string | undefined>(undefined);
  const [initialAppLabels, setInitialAppLabels] = useState<Partial<StudioAppLabels> | undefined>(undefined);
  const [initialLocked, setInitialLocked] = useState(false);
  const [initialLockedAt, setInitialLockedAt] = useState<string | null>(null);
  const [accessLocked, setAccessLocked] = useState(false);
  const [studioAccess, setStudioAccess] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    document.title = "Trivelta Studio";
  }, []);

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
          .select("submitted_at, studio_config, studio_locked, studio_locked_at")
          .eq("client_id", clientId)
          .maybeSingle(),
        supabase
          .from("clients")
          .select("studio_access, studio_access_locked")
          .eq("id", clientId)
          .maybeSingle(),
      ]);

      const data = formRes.data;

      // If form not submitted → redirect to form
      if (!data?.submitted_at) {
        navigate({ to: "/onboarding/$clientId/form", params: { clientId }, replace: true });
        return;
      }

      if (data?.studio_config && typeof data.studio_config === "object") {
        const saved = data.studio_config as StudioSavedConfig;

        if (saved.palette) {
          // New format (Phase 3+): has TCMPalette
          setInitialPalette({ ...DEFAULT_TCM_PALETTE, ...saved.palette });
          if (saved.manualOverrides) setInitialManualOverrides(saved.manualOverrides);
          if (saved.brandPromptHistory) setInitialBrandPromptHistory(saved.brandPromptHistory);
          setInitialIcons({ ...defaultStudioAppIcons, ...(saved.icons ?? {}) });
        } else if (saved.colors) {
          // Legacy format: has 'colors' key with old StudioThemeColors shape
          setInitialPalette(
            migrateLegacyThemeColors({ ...defaultStudioColors, ...saved.colors }),
          );
          setInitialIcons({ ...defaultStudioAppIcons, ...(saved.icons ?? {}) });
        } else {
          // Very old format: raw StudioThemeColors object (no wrapper)
          setInitialPalette(
            migrateLegacyThemeColors(
              data.studio_config as Partial<StudioThemeColors>,
            ),
          );
        }

        if (saved.language) setInitialLanguage(saved.language);
        if (saved.appName) setInitialAppName(saved.appName);
        if (saved.appLabels) setInitialAppLabels(saved.appLabels);
      }

      if (data?.studio_locked) {
        setInitialLocked(true);
        setInitialLockedAt(data.studio_locked_at ?? null);
      }

      setStudioAccess(clientRes.data?.studio_access ?? false);
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

  // Studio access not yet granted by AE
  if (!studioAccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mx-auto max-w-[460px]">
          <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full bg-primary/10 ring-2 ring-primary/20">
            <Palette className="h-10 w-10 text-primary/60" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Studio Access Coming Soon
          </h1>
          <p className="mx-auto mt-4 max-w-[380px] text-[15px] leading-relaxed text-muted-foreground">
            Your Trivelta team is preparing your Studio workspace. You'll receive an update from
            your Account Manager once it's ready.
          </p>

          {welcomeInfo?.amName && (
            <div className="mt-8 rounded-xl border border-border bg-card p-5 text-left">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Your Account Manager
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/15 font-semibold text-sm text-primary ring-1 ring-primary/30">
                  {welcomeInfo.amName
                    .split(" ")
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
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
                  {welcomeInfo.amName
                    .split(" ")
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
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
    <StudioFadeWrapper clientId={clientId}>
      <StudioProvider
        initialPalette={initialPalette}
        initialManualOverrides={initialManualOverrides}
        initialBrandPromptHistory={initialBrandPromptHistory ?? []}
        initialIcons={initialIcons}
        initialLanguage={initialLanguage}
        initialAppName={initialAppName}
        initialAppLabels={initialAppLabels}
      >
        <StudioInner
          clientId={clientId}
          initialLocked={initialLocked}
          initialLockedAt={initialLockedAt}
        />
      </StudioProvider>
    </StudioFadeWrapper>
  );
}

/** Subtle fade-in on first mount when user arrives via the studio-intro splash. */
function StudioFadeWrapper({
  clientId,
  children,
}: {
  clientId: string;
  children: React.ReactNode;
}) {
  const [fromIntro, setFromIntro] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    try {
      const key = `studio-from-intro-${clientId}`;
      if (sessionStorage.getItem(key) === "true") {
        sessionStorage.removeItem(key);
        setFromIntro(true);
        setVisible(false);
        const t = setTimeout(() => setVisible(true), 100);
        return () => clearTimeout(t);
      }
    } catch {
      /* ignore */
    }
  }, [clientId]);

  if (!fromIntro) return <>{children}</>;
  return (
    <div
      className={`transition-opacity duration-500 ease-out ${visible ? "opacity-100" : "opacity-0"}`}
    >
      {children}
    </div>
  );
}
