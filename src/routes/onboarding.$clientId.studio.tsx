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
  type PersistedChatMessage,
  type SportCategory,
  type Language,
  LANGUAGE_NAMES,
} from "@/contexts/StudioContext";
import { type TCMPalette, DEFAULT_TCM_PALETTE } from "@/lib/tcm-palette";
import { derivePalette, type AtomicPalette } from "@/lib/derive-palette";
import { streamGeneratePalette } from "@/lib/generate-palette-stream";
import BettingAppPreview from "@/components/studio/BettingAppPreview";
import { AIChatPanel } from "@/components/studio/AIChatPanel";
import { QuickEditPanel } from "@/components/studio/QuickEditPanel";
import { AdvancedModePanel } from "@/components/studio/AdvancedModePanel";
import { SportCategoriesPanel } from "@/components/studio/SportCategoriesPanel";
import { AppConfigPanel } from "@/components/studio/AppConfigPanel";
import { AccordionSection } from "@/components/studio/AccordionSection";
import { LandingPageGenerator } from "@/components/studio/LandingPageGenerator";
import { InviteTeamDialog } from "@/components/studio/InviteTeamDialog";
import { useStudioFeatures } from "@/hooks/useStudioFeatures";
import {
  DEFAULT_STUDIO_FEATURES,
  type StudioFeatures,
} from "@/lib/studio-features";
import { TriveltaLogo } from "@/components/TriveltaLogo";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  LockOpen,
  Palette,
  ChevronDown,
  ChevronUp,
  Download,
  ShieldAlert,
  ShieldCheck,
  Mail,

  Info,
  Sliders,
  Settings2,
  AlertTriangle,
  FileText,
  Trophy,
  Settings,
  Menu,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import logoUrl from "@/assets/trivelta-logo.png";
import { OnboardingLoadingScreen } from "@/components/onboarding/OnboardingLoadingScreen";

/* ── Constants ──────────────────────────────────────────────────────────── */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

/* ── Safe localStorage wrapper (handles private browsing / quota errors) ── */

const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Silent fail - private browsing, quota exceeded, etc.
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Silent fail
    }
  },
};

export const Route = createFileRoute("/onboarding/$clientId/studio")({
  component: StudioPage,
});

/* ── Asset upload zone ──────────────────────────────────────────────────── */

function AssetUploadZone({
  label,
  type,
  currentUrl,
  readOnly = false,
  compact = false,
  clientId,
}: {
  label: string;
  type: "logo" | "icon";
  currentUrl: string | null;
  readOnly?: boolean;
  compact?: boolean;
  clientId: string;
}) {
  const { setAppIcons, setPalette, language } = useStudio();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [extractingPalette, setExtractingPalette] = useState(false);

  const extractPaletteFromLogo = async (logoUrl: string) => {
    setExtractingPalette(true);
    const extractToast = toast.loading("Extracting brand colors from your logo...");
    try {
      await streamGeneratePalette(
        {
          brandPrompt:
            "Extract the dominant brand colors from this logo and build a complete dark sportsbook palette around them. Use the logo's primary color as the exact anchor for the primary field.",
          language,
          logoUrl,
        },
        {
          onComplete: ({ palette: newPalette }) => {
            setPalette(newPalette);
            toast.success("Brand colors extracted from logo ✓", { id: extractToast });
          },
          onError: () => {
            toast.error(
              "Could not extract colors — describe your brand in the AI Chat instead",
              { id: extractToast },
            );
          },
          onStreamEndedUnexpectedly: () => {
            toast.error(
              "Could not extract colors — describe your brand in the AI Chat instead",
              { id: extractToast },
            );
          },
        },
      );
    } catch {
      toast.error(
        "Could not extract colors — describe your brand in the AI Chat instead",
        { id: extractToast },
      );
    } finally {
      setExtractingPalette(false);
    }
  };

  const uploadToStorage = async (file: File): Promise<string | null> => {
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `logos/${clientId}/${Date.now()}-${safeName}`;
      const { error } = await supabase.storage
        .from("studio-assets")
        .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("studio-assets").getPublicUrl(path);
      return data.publicUrl ?? null;
    } catch (err) {
      console.warn("[studio] storage upload failed, falling back to base64", err);
      return null;
    }
  };

  const readAsDataUri = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (ev) => resolve(ev.target?.result as string);
      reader.onerror = () => reject(new Error("read failed"));
      reader.readAsDataURL(file);
    });

  const applyFile = async (file: File) => {
    if (readOnly) return;
    let url = await uploadToStorage(file);
    if (!url) {
      try {
        url = await readAsDataUri(file);
      } catch {
        toast.error(`Could not read ${label.toLowerCase()}`);
        return;
      }
    }
    if (type === "logo") {
      setAppIcons((prev) => ({ ...prev, appNameLogo: url!, topLeftAppIcon: url! }));
      toast.success(`${label} applied`, { duration: 1500 });
      // Auto-extract brand palette from logo (async, non-blocking)
      void extractPaletteFromLogo(url);
    } else {
      setAppIcons((prev) => ({ ...prev, topLeftAppIcon: url! }));
      toast.success(`${label} applied`, { duration: 1500 });
    }
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
              {extractingPalette && type === "logo" ? (
                <div className="text-[10px] text-primary flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  Extracting brand colors…
                </div>
              ) : !readOnly ? (
                <div className="text-[10px] text-muted-foreground">Click to replace</div>
              ) : null}
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
            <span className="text-[11px] text-muted-foreground">- overriding primary contact requirement</span>
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
            If you need changes after locking, contact your Account Manager directly - changes may
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
  isAssignedAM = false,
}: {
  clientId: string;
  initialLocked: boolean;
  initialLockedAt: string | null;
  isAssignedAM?: boolean;
}) {
  const { welcomeInfo, clientRole, ownerEmail } = useOnboardingCtx();
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const isAdmin = role === "admin" || role === "account_executive";
  const shouldShowPill = isAdmin || isAssignedAM;
  const [showStudioDebug, setShowStudioDebug] = useState(import.meta.env.DEV);

  useEffect(() => {
    if (import.meta.env.DEV) return;
    const hostname = window.location.hostname;
    setShowStudioDebug(
      hostname.includes("id-preview--") ||
        hostname.includes("-dev.lovable.app") ||
        hostname === "localhost",
    );
  }, []);

  if (showStudioDebug) {
    console.log(
      "[Studio] user role:",
      role,
      "isAdmin:",
      isAdmin,
      "isAssignedAM:",
      isAssignedAM,
      "shouldShowPill:",
      shouldShowPill,
    );
  }

  const { hasFeature } = useStudioFeatures(clientId);
  const canSubmit = clientRole === "client_owner" || shouldShowPill;
  const {
    palette,
    setPalette,
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
    chatMessages,
    sportCategories,
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
  const [unlockConfirmOpen, setUnlockConfirmOpen] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  type ActivePanel = "landingPages" | "chat" | "quickEdit" | "advanced" | "sportCategories" | "appConfig" | null;
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);

  // On mount, pick the preview mode that fits the viewport best.
  // Below 1100px (iPad portrait, narrow laptops) → mobile preview fits better.
  useEffect(() => {
    if (typeof window === "undefined") return;
    setPreviewMode(window.innerWidth < 1100 ? "mobile" : "website");
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Ref to the preview container div for instant CSS var updates before React re-render
  const previewContainerRef = useRef<HTMLDivElement>(null);
  // Tour refs - each points to a spotlighted area
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

  // Tour state - show automatically on first visit, show help button after
  const [tourActive, setTourActive] = useState(
    () => !safeLocalStorage.getItem(`trivelta_studio_tour_${clientId}`),
  );
  const [showHelp, setShowHelp] = useState(
    () => !!safeLocalStorage.getItem(`trivelta_studio_tour_${clientId}`),
  );

  // Panel synced with tour step via onStepChange callback — see <StudioTour> below

  /* ── Save helpers ── */
  const saveNow = useCallback(async () => {
    const payload: StudioSavedConfig = {
      palette,
      manualOverrides: Array.from(manualOverrides),
      brandPromptHistory,
      chatMessages,
      sportCategories,
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
  }, [clientId, palette, manualOverrides, brandPromptHistory, chatMessages, sportCategories, appIcons, language, appName, appLabels]);

  const scheduleAutoSave = useCallback(
    (
      pal: TCMPalette,
      overrides: Set<keyof TCMPalette>,
      history: BrandPromptEntry[],
      icons: StudioAppIcons,
      chat: PersistedChatMessage[],
      sports: SportCategory[],
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
                  chatMessages: chat,
                  sportCategories: sports,
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
    scheduleAutoSave(palette, manualOverrides, brandPromptHistory, appIcons, chatMessages, sportCategories);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [palette, manualOverrides, brandPromptHistory, appIcons, chatMessages, sportCategories, scheduleAutoSave]);

  /* ── Atomic palette POC test mode (?test_atomic=purple|cyan|green) ── */
  const TEST_ATOMIC_THEMES: Record<string, AtomicPalette> = {
    purple: {
      primary: "rgba(124, 58, 237, 1)",
      secondary: "rgba(212, 175, 55, 1)",
      primaryBackgroundColor: "rgba(10, 8, 20, 1)",
      dark: "rgba(15, 12, 25, 1)",
      modalBackground: "rgba(20, 16, 32, 1)",
      primaryButton: "rgba(124, 58, 237, 1)",
      lightTextColor: "rgba(255, 255, 255, 1)",
      primaryTextColor: "rgba(255, 255, 255, 1)",
      freeBetBackground: "rgba(124, 58, 237, 0.15)",
      boxGradientColorStart: "rgba(91, 33, 182, 1)",
      boxGradientColorEnd: "rgba(124, 58, 237, 1)",
      borderAndGradientBg: "rgba(124, 58, 237, 0.3)",
      activeSecondaryGradientColor: "rgba(124, 58, 237, 1)",
      wonColor: "rgba(34, 197, 94, 1)",
      lostColor: "rgba(239, 68, 68, 1)",
    },
    cyan: {
      primary: "rgba(0, 200, 240, 1)",
      secondary: "rgba(212, 175, 55, 1)",
      primaryBackgroundColor: "rgba(6, 8, 18, 1)",
      dark: "rgba(10, 14, 24, 1)",
      modalBackground: "rgba(14, 18, 30, 1)",
      primaryButton: "rgba(0, 200, 240, 1)",
      lightTextColor: "rgba(255, 255, 255, 1)",
      primaryTextColor: "rgba(0, 30, 50, 1)",
      freeBetBackground: "rgba(0, 200, 240, 0.15)",
      boxGradientColorStart: "rgba(0, 150, 200, 1)",
      boxGradientColorEnd: "rgba(0, 200, 240, 1)",
      borderAndGradientBg: "rgba(0, 200, 240, 0.3)",
      activeSecondaryGradientColor: "rgba(0, 200, 240, 1)",
      wonColor: "rgba(34, 197, 94, 1)",
      lostColor: "rgba(239, 68, 68, 1)",
    },
    green: {
      primary: "rgba(0, 166, 81, 1)",
      secondary: "rgba(255, 215, 0, 1)",
      primaryBackgroundColor: "rgba(8, 12, 8, 1)",
      dark: "rgba(12, 18, 12, 1)",
      modalBackground: "rgba(16, 24, 16, 1)",
      primaryButton: "rgba(0, 166, 81, 1)",
      lightTextColor: "rgba(255, 255, 255, 1)",
      primaryTextColor: "rgba(255, 255, 255, 1)",
      freeBetBackground: "rgba(0, 166, 81, 0.15)",
      boxGradientColorStart: "rgba(0, 130, 60, 1)",
      boxGradientColorEnd: "rgba(0, 166, 81, 1)",
      borderAndGradientBg: "rgba(0, 166, 81, 0.3)",
      activeSecondaryGradientColor: "rgba(0, 166, 81, 1)",
      wonColor: "rgba(34, 197, 94, 1)",
      lostColor: "rgba(239, 68, 68, 1)",
    },
  };

  const testAtomic = new URLSearchParams(window.location.search).get("test_atomic");

  useEffect(() => {
    if (testAtomic && TEST_ATOMIC_THEMES[testAtomic]) {
      const atomic = TEST_ATOMIC_THEMES[testAtomic];
      const merged = derivePalette(atomic);
      setPalette(merged);
      console.log(`[StudioTest] Applied atomic theme: ${testAtomic}`, merged);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testAtomic]);

  /* ── Call design-locked edge function; returns true on success ── */
  const callDesignLocked = useCallback(async (): Promise<boolean> => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
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
      await supabase.from("onboarding_forms").upsert(
        {
          client_id: clientId,
          studio_config: {
            palette,
            manualOverrides: Array.from(manualOverrides),
            brandPromptHistory,
            chatMessages,
            sportCategories,
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

  /* ── Unlock design (admin / assigned AM only) ── */
  const handleUnlock = async () => {
    setUnlockConfirmOpen(false);
    setUnlocking(true);
    try {
      const { error } = await supabase
        .from("onboarding_forms")
        .update({ studio_locked: false, studio_locked_at: null })
        .eq("client_id", clientId);
      if (error) throw error;
      setLocked(false);
      setLockedAt(null);
      toast.success("Design unlocked - client can now make changes.");
    } catch {
      toast.error("Failed to unlock design - please try again.");
    } finally {
      setUnlocking(false);
    }
  };

  /* ── Admin direct lock (no submit emails, no modal) ── */
  const [adminLocking, setAdminLocking] = useState(false);
  const handleAdminLock = async () => {
    setAdminLocking(true);
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("onboarding_forms")
        .update({ studio_locked: true, studio_locked_at: now })
        .eq("client_id", clientId);
      if (error) throw error;
      setLocked(true);
      setLockedAt(now);
      toast.success("Design locked by admin.");
    } catch {
      toast.error("Failed to lock design - please try again.");
    } finally {
      setAdminLocking(false);
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
      <header className="sticky top-0 z-30 flex h-[60px] shrink-0 items-center border-b border-border bg-background/90 backdrop-blur-xl px-5">
        <div className="flex w-auto lg:w-[30%] xl:w-[35%] shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setMobilePanelOpen(true)}
            aria-label="Open controls"
            className="grid h-9 w-9 place-items-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:text-foreground lg:hidden"
            style={{ touchAction: "manipulation" }}
          >
            <Menu className="h-4 w-4" />
          </button>
          <TriveltaLogo size="xl" withSubtitle product="AI · Studio" />
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
        <div className="flex w-auto lg:w-[30%] xl:w-[35%] shrink-0 items-center justify-end gap-3">
          {showStudioDebug && (
            <span className="hidden max-w-[260px] truncate rounded-md border border-border bg-muted px-2 py-1 font-mono text-[10px] text-muted-foreground lg:inline-flex">
              [DEBUG: role={role ?? "null"}, canShowPill={String(shouldShowPill)}]
            </span>
          )}
          {/* Save indicator - only when not locked */}
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
          <InviteTeamDialog clientId={clientId} />
          {shouldShowPill && (
            <button
              onClick={locked ? () => setUnlockConfirmOpen(true) : handleAdminLock}
              disabled={adminLocking || unlocking}
              className={`flex items-center gap-2 rounded-lg border-2 px-3.5 py-2 text-[13px] font-bold uppercase tracking-wide shadow-sm ring-2 transition-all disabled:opacity-50 ${
                locked
                  ? "border-success/60 bg-success/25 text-success ring-success/30 hover:bg-success/35"
                  : "border-amber-500/70 bg-amber-500/30 text-amber-700 ring-amber-400/30 hover:bg-amber-500/40 dark:text-amber-300"
              }`}
              title={locked ? `Locked${lockedDate ? ` on ${lockedDate}` : ""} · click to unlock` : "Click to lock design"}
            >
              {adminLocking || unlocking ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : locked ? (
                <LockOpen className="h-3.5 w-3.5" />
              ) : (
                <Lock className="h-3.5 w-3.5" />
              )}
              {locked ? "Unlock" : "Lock"}
            </button>
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
          {!shouldShowPill && locked && (
            <div className="flex items-center gap-1.5 rounded-md border border-success/40 bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success">
              <CheckCircle2 className="h-3 w-3" />
              Locked
            </div>
          )}
        </div>
      </header>

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
        {/* Mobile drawer scrim */}
        {mobilePanelOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setMobilePanelOpen(false)}
            aria-hidden
          />
        )}
        <div
          className={cn(
            "studio-left-panel flex flex-col overflow-hidden border-r border-border bg-card",
            // Drawer behavior below lg (iPad portrait + landscape use drawer)
            "fixed inset-y-0 left-0 z-50 w-[320px] shadow-2xl transition-transform duration-200 lg:static lg:z-auto lg:shadow-none lg:translate-x-0",
            mobilePanelOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
            // Responsive widths (lg+ shows static panel)
            "lg:w-[320px] xl:w-[35%] xl:min-w-[300px] xl:max-w-[440px]",
          )}
        >

          {/* Always-visible identity strip */}
          <div className="shrink-0 flex items-center gap-2 border-b border-border px-3 py-2">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/15">
              <Sparkles className="h-3 w-3 text-primary" />
            </div>
            <span className="truncate text-[11px] font-bold text-foreground flex-1">
              {welcomeInfo?.clientName ?? "Studio"}
            </span>
            <button
              type="button"
              onClick={() => setMobilePanelOpen(false)}
              aria-label="Close controls"
              className="lg:hidden grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted/40 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
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
                      clientId={clientId}
                    />
                    <AssetUploadZone
                      label="App Icon"
                      type="icon"
                      currentUrl={appIcons.topLeftAppIcon}
                      readOnly={locked}
                      compact
                      clientId={clientId}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Exclusive accordion (fills remaining height) ─────────── */}
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">

            {/* Panel 0 - Landing Pages (canvas switcher — no body content)
                Clicking the header switches the right canvas from mobile preview
                to the full LandingPageGenerator. Body shows a minimal hint only. */}
            {hasFeature("landing_page_generator") && (
              <AccordionSection
                title="Landing Pages"
                icon={<FileText className="h-3.5 w-3.5" />}
                active={activePanel === "landingPages"}
                onClick={() =>
                  setActivePanel((prev) => (prev === "landingPages" ? null : "landingPages"))
                }
              >
                <div className="px-4 py-2.5 text-[11px] text-muted-foreground/60 italic select-none">
                  Generator open in canvas →
                </div>
              </AccordionSection>
            )}

            {/* Panel 1 - AI Palette Generator (gated: ai_chat) */}
            {hasFeature("ai_chat") && (
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
            )}

            {/* Panel 2 - Quick Edit (gated: color_editor) */}
            {hasFeature("color_editor") && (
              <AccordionSection
                sectionRef={tourFineTuneRef}
                title="Quick Edit"
                icon={<Sliders className="h-3.5 w-3.5" />}
                subtitle="25 key fields"
                active={activePanel === "quickEdit"}
                onClick={() =>
                  setActivePanel((prev) => (prev === "quickEdit" ? null : "quickEdit"))
                }
                badge={manualOverrides.size > 0 ? `${manualOverrides.size} edited` : undefined}
              >
                <QuickEditPanel />
              </AccordionSection>
            )}

            {/* Panel 3 - Advanced Mode (gated: color_editor) */}
            {hasFeature("color_editor") && (
              <AccordionSection
                title="Advanced Mode"
                icon={<Settings2 className="h-3.5 w-3.5" />}
                subtitle="All 344 fields"
                active={activePanel === "advanced"}
                onClick={() =>
                  setActivePanel((prev) => (prev === "advanced" ? null : "advanced"))
                }
              >
                <AdvancedModePanel />
              </AccordionSection>
            )}

            {/* Panel - App Configuration (currency + welcome offer) */}
            <AccordionSection
              title="App Configuration"
              icon={<Settings className="h-3.5 w-3.5" />}
              subtitle="Currency · welcome offer"
              active={activePanel === "appConfig"}
              onClick={() =>
                setActivePanel((prev) => (prev === "appConfig" ? null : "appConfig"))
              }
            >
              <AppConfigPanel clientId={clientId} />
            </AccordionSection>

            {/* Panel - Sport Categories */}
            <AccordionSection
              title="Sport Categories"
              icon={<Trophy className="h-3.5 w-3.5" />}
              subtitle="Reorder & rename"
              active={activePanel === "sportCategories"}
              onClick={() =>
                setActivePanel((prev) => (prev === "sportCategories" ? null : "sportCategories"))
              }
            >
              <SportCategoriesPanel readOnly={clientId === "8e1aee03-7a76-4ad8-a336-6a8a1dae9fc0"} />
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
                {!canLock && !isAdmin && (
                  <p className="mb-1.5 text-center text-[11px] text-muted-foreground">
                    Upload or generate a logo to enable
                  </p>
                )}
                {!canLock && isAdmin && (
                  <p className="mb-1.5 text-center text-[11px] text-muted-foreground">
                    Admin override: submitting without logo is permitted
                  </p>
                )}
                {canLock && !canSubmit && (
                  <p className="mb-1.5 text-center text-[11px] text-muted-foreground">
                    Only {ownerEmail ?? "the account owner"} can submit
                  </p>
                )}
                <button
                  onClick={() => canSubmit && setLockModalOpen(true)}
                  disabled={(!canLock && !isAdmin) || !canSubmit}
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

        {/* ══ RIGHT PANEL ══════════════════════════════════════════════ */}
        {activePanel === "landingPages" ? (
          /* Landing Pages canvas — full width generator */
          <div className="flex flex-1 flex-col overflow-y-auto bg-background">
            <LandingPageGenerator clientId={clientId} layout="fullpage" />
          </div>
        ) : (
          /* Default — mobile/web betting app preview */
          <div ref={tourPreviewRef} className="flex flex-1 flex-col overflow-hidden bg-[#07070a]">
            {/* Mobile / Web toggle */}
            <div className="flex shrink-0 items-center justify-center gap-2 border-b border-white/[0.07] px-4 py-2.5">
              <button
                onClick={() => setPreviewMode("mobile")}
                style={{ touchAction: "manipulation" }}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-5 py-2.5 text-[13px] font-semibold transition-all",
                  previewMode === "mobile"
                    ? "bg-white/10 text-white ring-1 ring-white/20"
                    : "text-white/35 hover:text-white/65",
                )}
              >
                <Smartphone className="h-4 w-4" /> Mobile
              </button>
              <button
                onClick={() => setPreviewMode("website")}
                style={{ touchAction: "manipulation" }}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-5 py-2.5 text-[13px] font-semibold transition-all",
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
              <BettingAppPreview clientId={clientId} />
            </div>
          </div>
        )}
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
          onStepChange={(refKey) => {
            if (refKey === "fineTune") setActivePanel("quickEdit");
            else if (refKey === "chat") setActivePanel("chat");
          }}
        />
      )}

      {/* ── Help button (replay tour) ────────────────────────────────────── */}
      {showHelp && !tourActive && (
        <button
          onClick={() => {
            safeLocalStorage.removeItem(`trivelta_studio_tour_${clientId}`);
            setShowHelp(false);
            setTourActive(true);
          }}
          className="fixed bottom-5 right-5 z-50 grid h-8 w-8 place-items-center rounded-full border border-border bg-card text-[13px] font-bold text-muted-foreground shadow-md transition-colors hover:border-primary/50 hover:text-primary"
          title="Replay Studio tour"
        >
          ?
        </button>
      )}

      {/* ── Unlock confirmation dialog ───────────────────────────────────── */}
      <AlertDialog open={unlockConfirmOpen} onOpenChange={setUnlockConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlock design for this client?</AlertDialogTitle>
            <AlertDialogDescription>
              The client will be able to edit their design again. The existing Notion page will be
              preserved - your tech team will see both the old locked design and any new changes
              after re-lock.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnlock}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Unlock Design
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
    title: "Welcome to your Studio",
    text: "Your brand is generated and ready. This is where you refine the details — colors, copy, layout — until it's exactly right. Takes 30 seconds to learn.",
    cta: "Show me around →",
  },
  {
    refKey: "fineTune",
    title: "Quick Edit — your refinement hub",
    text: "These 25 fields cover 80% of brand decisions: primary color, button styles, accents, fonts. Tweak anything and see live updates. For deep control, switch to Advanced Mode (all 344 fields).",
    cta: "Next →",
  },
  {
    refKey: "chat",
    title: "AI Chat — for bigger changes",
    text: "Want to shift the entire mood? Describe it in plain language: 'Make it more premium' or 'Use a navy primary'. The AI rewrites your palette intelligently. Or generate a fresh logo by asking.",
    cta: "Next →",
  },
  {
    refKey: "preview",
    title: "Live Preview — what your users will see",
    text: "Every change reflects here in real time. Toggle between Mobile and Web to see your platform from both angles. This is the actual UI your players will use.",
    cta: "Next →",
  },
  {
    refKey: "lock",
    title: "Lock when ready",
    text: "Happy with your brand? Click Lock My Design and your Account Manager builds the platform exactly as shown. You can request changes anytime — locking just signals 'this is the version to build'.",
    cta: "Start designing →",
  },
];

function StudioTour({
  clientId,
  onDone,
  refs,
  onStepChange,
}: {
  clientId: string;
  onDone: () => void;
  refs: Record<string, React.RefObject<HTMLDivElement>>;
  onStepChange?: (refKey: string | null) => void;
}) {
  const [step, setStep] = useState(0);
  const [fading, setFading] = useState(false);
  const [spotRect, setSpotRect] = useState<DOMRect | null>(null);

  const current = TOUR_STEPS[step];
  const CARD_W = 340;

  useEffect(() => {
    onStepChange?.(current.refKey);
  }, [step, current.refKey, onStepChange]);
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
      safeLocalStorage.setItem(`trivelta_studio_tour_${clientId}`, "1");
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
            boxShadow: "0 0 0 100vmax rgba(0,0,0,0.78), 0 0 24px hsl(var(--primary) / 0.4)",
            border: "2px solid hsl(var(--primary) / 0.7)",
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
        className="rounded-xl border border-border bg-card shadow-2xl"
        style={{
          ...cardStyle(),
          position: "fixed",
          zIndex: 10000,
          pointerEvents: "all",
          transition: "top 350ms cubic-bezier(0.16, 1, 0.3, 1), left 350ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
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
            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            Skip tour
            <span className="text-[9px] opacity-60">·</span>
          </button>
        </div>

        <div className="px-5 py-4">
          <p className="micro-label mb-1.5 text-primary">
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
                className="block h-1.5 rounded-full transition-all duration-300 ease-out"
                style={{
                  width: i === step ? 20 : 6,
                  background:
                    i === step
                      ? "hsl(var(--primary))"
                      : i < step
                      ? "hsl(var(--primary) / 0.4)"
                      : "hsl(var(--muted-foreground) / 0.2)",
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
              className="btn-premium h-8 px-4 text-[12px] font-semibold rounded-lg"
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
  const { user, role, loading: authLoading, signOut } = useAuth();
  const { welcomeInfo } = useOnboardingCtx();
  const navigate = useNavigate();
  const [isLandingPageOnlyMode, setIsLandingPageOnlyMode] = useState(false);
  const [initialPalette, setInitialPalette] = useState<TCMPalette | undefined>(undefined);
  const [initialManualOverrides, setInitialManualOverrides] = useState<
    (keyof TCMPalette)[] | undefined
  >(undefined);
  const [initialBrandPromptHistory, setInitialBrandPromptHistory] = useState<
    BrandPromptEntry[] | undefined
  >(undefined);
  const [initialChatMessages, setInitialChatMessages] = useState<
    PersistedChatMessage[] | undefined
  >(undefined);
  const [initialSportCategories, setInitialSportCategories] = useState<
    SportCategory[] | undefined
  >(undefined);
  const [initialIcons, setInitialIcons] = useState<StudioAppIcons | undefined>(undefined);
  const [initialLanguage, setInitialLanguage] = useState<Language | undefined>(undefined);
  const [initialAppName, setInitialAppName] = useState<string | undefined>(undefined);
  const [initialAppLabels, setInitialAppLabels] = useState<Partial<StudioAppLabels> | undefined>(undefined);
  const [initialLocked, setInitialLocked] = useState(false);
  const [initialLockedAt, setInitialLockedAt] = useState<string | null>(null);
  const [accessLocked, setAccessLocked] = useState(false);
  const [studioAccess, setStudioAccess] = useState(false);
  const [isAssignedAM, setIsAssignedAM] = useState(false);
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
      const [formRes, clientRes, camRes] = await Promise.all([
        supabase
          .from("onboarding_forms")
          .select("submitted_at, studio_config, studio_locked, studio_locked_at")
          .eq("client_id", clientId)
          .maybeSingle(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any)
          .from("clients")
          .select("studio_access, studio_access_locked, studio_features, landing_pages_submitted_at")
          .eq("id", clientId)
          .maybeSingle(),
        supabase
          .from("client_account_managers")
          .select("am_email")
          .eq("client_id", clientId)
          .eq("am_email", user.email ?? "")
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
          if (saved.chatMessages) setInitialChatMessages(saved.chatMessages);
          if (saved.sportCategories) setInitialSportCategories(saved.sportCategories);
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

      // Smart redirect: if no brand exists, send user to wizard
      const hasBrand =
        data?.studio_config &&
        typeof data.studio_config === "object" &&
        ((data.studio_config as any).palette || (data.studio_config as any).colors);

      if (!hasBrand) {
        navigate({ to: `/onboarding/${clientId}/wizard`, replace: true });
        return;
      }

      if (data?.studio_locked) {
        setInitialLocked(true);
        setInitialLockedAt(data.studio_locked_at ?? null);
      }

      const hasAccess = clientRes.data?.studio_access ?? false;
      setStudioAccess(hasAccess);
      if (clientRes.data?.studio_access_locked) {
        setAccessLocked(true);
      }

      // Check if current user is the assigned AM for this client
      if (role === "account_manager" && camRes.data) {
        setIsAssignedAM(true);
      }

      // Compute studio feature flags early — needed for access gate below
      const studioFeatures: StudioFeatures = {
        ...DEFAULT_STUDIO_FEATURES,
        ...((clientRes.data as { studio_features?: Partial<StudioFeatures> })
          ?.studio_features ?? {}),
      };
      const enabledFeatureCount = Object.values(studioFeatures).filter(Boolean).length;
      const hasFeatureAccess = enabledFeatureCount > 0;

      // Non-admins/non-AMs without studio access are redirected with a toast,
      // UNLESS they have at least one studio_feature enabled (e.g. landing_page_generator)
      const isAdminOrAM =
        role === "admin" || role === "account_executive" || role === "account_manager";
      if (!hasAccess && !hasFeatureAccess && !isAdminOrAM) {
        toast.error(
          "Studio access has not been granted yet. Please contact your Account Manager.",
        );
        navigate({ to: "/onboarding/$clientId/success", params: { clientId }, replace: true });
        return;
      }

      if (!isAdminOrAM) {
        // Edge case: all features disabled → redirect
        if (enabledFeatureCount === 0) {
          toast.error(
            "No Studio features are enabled for your account. Contact your Account Manager.",
          );
          navigate({ to: "/onboarding/$clientId/success", params: { clientId }, replace: true });
          return;
        }

        // Landing-page-only mode triggers when:
        //   (a) only landing_page_generator is enabled (regardless of completion) — so
        //       the client lands on the generator OR its post-submission success screen, OR
        //   (b) landing pages are NOT yet completed AND it's their only path forward.
        // If other features are enabled AND landing pages are already submitted, fall
        // through to the full Studio so the AE-unlocked tools are immediately visible.
        const landingPagesCompleted = Boolean(
          (clientRes.data as { landing_pages_submitted_at?: string | null } | null)
            ?.landing_pages_submitted_at,
        );
        const otherEnabled = enabledFeatureCount > 1; // anything besides landing_page_generator
        if (
          studioFeatures.landing_page_generator &&
          (enabledFeatureCount === 1 || !landingPagesCompleted) &&
          !(landingPagesCompleted && otherEnabled)
        ) {
          setIsLandingPageOnlyMode(true);
        }
      }

      setReady(true);
    })();
  }, [authLoading, user, clientId]);

  if (authLoading || !ready) {
    return <OnboardingLoadingScreen variant="studio" />;
  }

  // AM has locked Studio access - show block page instead of Studio
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
        initialChatMessages={initialChatMessages ?? []}
        initialSportCategories={initialSportCategories}
        initialIcons={initialIcons}
        initialLanguage={initialLanguage}
        initialAppName={initialAppName}
        initialAppLabels={initialAppLabels}
      >
        {isLandingPageOnlyMode ? (
          <LandingPageFullPageShell
            clientId={clientId}
            userEmail={user?.email ?? ""}
            onSignOut={signOut}
          />
        ) : (
          <StudioInner
            clientId={clientId}
            initialLocked={initialLocked}
            initialLockedAt={initialLockedAt}
            isAssignedAM={isAssignedAM}
          />
        )}
      </StudioProvider>
    </StudioFadeWrapper>
  );
}

/* ── Landing-page-only full-page shell ──────────────────────────────────── */
/**
 * Shown to clients whose only enabled feature is landing_page_generator.
 * Strips out all Studio chrome (accordion panels, mobile preview, save state)
 * and renders a focused full-width page builder instead.
 *
 * Header decision: uses a minimal custom nav bar rather than the Studio header
 * (save state + lock controls are irrelevant here) or StageHeader (which
 * carries "ONBOARDING" branding that doesn't fit a standalone page builder).
 */
function LandingPageFullPageShell({
  clientId,
  userEmail,
  onSignOut,
}: {
  clientId: string;
  userEmail: string;
  onSignOut: () => void;
}) {
  useEffect(() => {
    document.title = "Your Landing Pages · Trivelta";
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl shrink-0">
        <div className="px-5 sm:px-8 h-[60px] flex items-center justify-between">

          {/* Left: Logo + wordmark */}
          <TriveltaLogo size="xl" product="AI · Studio" />

          {/* Right: User + sign out */}
          <div className="flex items-center gap-3">
            {userEmail && (
              <span className="hidden sm:block text-xs text-muted-foreground">{userEmail}</span>
            )}
            <button
              onClick={onSignOut}
              className="rounded-lg border border-border/60 px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground"
            >
              Sign out
            </button>
          </div>

        </div>
      </header>

      {/* Premium brand banner */}
      <div className="border-b border-primary/10 bg-gradient-to-r from-primary/[0.04] via-primary/[0.08] to-primary/[0.04] overflow-hidden shrink-0">
        <div className="max-w-7xl mx-auto px-8 py-3 flex items-center justify-center gap-3">
          <div className="relative shrink-0">
            <Sparkles className="h-4 w-4 text-primary relative z-10" />
            <div className="absolute inset-0 blur-md bg-primary/40 rounded-full animate-pulse" />
          </div>
          <div className="flex items-center gap-2 text-[12px]">
            <span className="text-muted-foreground">Welcome to</span>
            <span className="font-semibold text-foreground">Trivelta AI Studio</span>
            <span className="text-muted-foreground/50">·</span>
            <span className="text-muted-foreground">Exclusive access, powered by</span>
            <span className="font-semibold text-primary">Trivelta AI</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <LandingPageGenerator clientId={clientId} layout="fullpage" />
      </div>
    </div>
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
        const t = setTimeout(() => setVisible(true), 50);
        return () => clearTimeout(t);
      }
    } catch {
      /* ignore */
    }
  }, [clientId]);

  if (!fromIntro) return <>{children}</>;
  return (
    <div
      className={cn(
        "transition-all duration-700 ease-out",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
      )}
    >
      {children}
    </div>
  );
}
