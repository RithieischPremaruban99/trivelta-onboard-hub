import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Lock,
  ArrowLeft,
  Smartphone,
  Monitor,
  LayoutGrid,
  Globe,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  StudioProvider,
  useStudio,
  defaultStudioAppIcons,
  migrateLegacyThemeColors,
  type StudioSavedConfig,
  type StudioThemeColors,
  type StudioAppIcons,
  type StudioAppLabels,
  type BrandPromptEntry,
  type Language,
  LANGUAGE_NAMES,
} from "@/contexts/StudioContext";
import { type TCMPalette, DEFAULT_TCM_PALETTE } from "@/lib/tcm-palette";
import BettingAppPreview from "@/components/studio/BettingAppPreview";

export const Route = createFileRoute("/onboarding/$clientId/studio-preview")({
  component: StudioPreviewPage,
});

/* ── Types ──────────────────────────────────────────────────────────────── */

interface LoadedConfig {
  palette: TCMPalette;
  manualOverrides: (keyof TCMPalette)[];
  brandPromptHistory: BrandPromptEntry[];
  icons: StudioAppIcons;
  language: Language;
  appName: string;
  appLabels: Partial<StudioAppLabels>;
  lockedAt: string | null;
  submittedByEmail: string | null;
}

type ViewMode = "split" | "mobile" | "web";

/* ── Helpers ────────────────────────────────────────────────────────────── */

function formatLockedDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

const PALETTE_SWATCHES: Array<{ key: keyof TCMPalette; label: string }> = [
  { key: "primaryBackgroundColor", label: "Background" },
  { key: "primary", label: "Primary" },
  { key: "secondary", label: "Secondary" },
  { key: "dark", label: "Dark" },
  { key: "primaryTextColor", label: "Text" },
  { key: "accentGreenSecondary", label: "Accent" },
  { key: "wonColor", label: "Won" },
  { key: "lostColor", label: "Lost" },
];

/* ── Brand Assets Hero ──────────────────────────────────────────────────── */

function BrandAssetsHero({
  lockedAt,
  submittedBy,
}: {
  lockedAt: string | null;
  submittedBy: string | null;
}) {
  const { palette, appIcons, appName, language } = useStudio();
  const languageLabel = LANGUAGE_NAMES[language] ?? language;

  return (
    <section className="mx-auto max-w-7xl px-6 py-8">
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-primary/10 via-card/50 to-card/20 p-8 backdrop-blur-sm">
        {/* Decorative orb */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-primary/20 opacity-30 blur-3xl"
        />

        <div className="relative z-10">
          {/* Top meta row */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              <Lock className="h-3 w-3" />
              Locked Design · {formatLockedDate(lockedAt)}
            </div>
            {submittedBy && (
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Submitted by{" "}
                <span className="text-foreground/80">{submittedBy}</span>
              </div>
            )}
          </div>

          {/* Logo + name */}
          <div className="mb-8 flex items-center gap-6">
            <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl border border-border/50 bg-card/80 p-3 shadow-lg shadow-primary/10">
              {appIcons.appNameLogo ? (
                <img
                  src={appIcons.appNameLogo}
                  alt={appName || "App logo"}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="grid h-full w-full place-items-center rounded-xl bg-muted/50 text-[10px] text-muted-foreground">
                  No logo
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                App Name · {languageLabel}
              </div>
              <div className="truncate text-4xl font-bold text-foreground">
                {appName || "Untitled"}
              </div>
            </div>
          </div>

          {/* Palette */}
          <div>
            <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Color Palette
            </div>
            <div className="flex flex-wrap gap-4">
              {PALETTE_SWATCHES.map(({ key, label }) => {
                const value = palette[key] as string | undefined;
                if (!value) return null;
                return (
                  <div key={key} className="flex flex-col items-center gap-2">
                    <div
                      className="h-14 w-14 rounded-xl border-2 border-border/30 shadow-sm"
                      style={{ backgroundColor: value }}
                      title={`${label}: ${value}`}
                    />
                    <div className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Device Mode Tabs ───────────────────────────────────────────────────── */

function DeviceModeTabs({
  mode,
  onChange,
}: {
  mode: ViewMode;
  onChange: (m: ViewMode) => void;
}) {
  const tabs: Array<{ id: ViewMode; label: string; icon: typeof LayoutGrid }> = [
    { id: "split", label: "Side by Side", icon: LayoutGrid },
    { id: "mobile", label: "Mobile", icon: Smartphone },
    { id: "web", label: "Web", icon: Monitor },
  ];

  return (
    <div className="mx-auto flex max-w-7xl justify-center px-6">
      <div className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-card/50 p-1 backdrop-blur-sm">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold transition-all",
              mode === id
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                : "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Device Frames ──────────────────────────────────────────────────────── */

function MobileFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative mx-auto overflow-hidden rounded-[2.5rem] border border-border/60 bg-card/40 p-2 shadow-2xl shadow-primary/10 transition-all hover:shadow-primary/20",
        className,
      )}
    >
      {/* Status bar (faux) */}
      <div className="absolute left-1/2 top-2 z-20 flex h-6 w-32 -translate-x-1/2 items-center justify-center rounded-full bg-black/60">
        <span className="h-1.5 w-1.5 rounded-full bg-foreground/40" />
      </div>
      <div className="overflow-hidden rounded-[2rem]">{children}</div>
      {/* Home indicator */}
      <div className="pointer-events-none absolute bottom-2 left-1/2 z-20 h-1 w-24 -translate-x-1/2 rounded-full bg-foreground/30" />
    </div>
  );
}

function WebFrame({
  children,
  appName,
  className,
}: {
  children: React.ReactNode;
  appName: string;
  className?: string;
}) {
  const host = (appName || "app").toLowerCase().replace(/[^a-z0-9-]/g, "") || "app";
  return (
    <div
      className={cn(
        "mx-auto overflow-hidden rounded-2xl border border-border/60 bg-card/40 shadow-2xl shadow-primary/10 transition-all hover:shadow-primary/20",
        className,
      )}
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-3 border-b border-border/50 bg-card/80 px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
        </div>
        <div className="flex flex-1 items-center gap-2 rounded-md bg-background/60 px-3 py-1 text-[11px] text-muted-foreground">
          <Globe className="h-3 w-3" />
          <span>https://{host}.com</span>
        </div>
      </div>
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}

/* ── Preview Modes ──────────────────────────────────────────────────────── */

function SplitView() {
  const { appName } = useStudio();
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <Smartphone className="h-3.5 w-3.5" />
          Mobile
        </div>
        <MobileFrame className="w-full max-w-[340px]">
          <div style={{ height: 680 }}>
            <BettingAppPreview viewMode="mobile" readOnly />
          </div>
        </MobileFrame>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <Monitor className="h-3.5 w-3.5" />
          Web
        </div>
        <WebFrame appName={appName}>
          <div style={{ height: 680 }}>
            <BettingAppPreview viewMode="web" readOnly />
          </div>
        </WebFrame>
      </div>
    </div>
  );
}

function FullscreenMobile() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        <Smartphone className="h-3.5 w-3.5" />
        Mobile · Fullscreen
      </div>
      <MobileFrame className="w-full max-w-[420px]">
        <div style={{ height: 820 }}>
          <BettingAppPreview viewMode="mobile" readOnly />
        </div>
      </MobileFrame>
      <p className="text-[11px] text-muted-foreground">
        Tip: navigate the bottom tabs inside the device to explore Home, Sports,
        Discovery, Casino, and Profile.
      </p>
    </div>
  );
}

function FullscreenWeb() {
  const { appName } = useStudio();
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        <Monitor className="h-3.5 w-3.5" />
        Web · Fullscreen
      </div>
      <WebFrame appName={appName} className="w-full max-w-6xl">
        <div style={{ height: 820 }}>
          <BettingAppPreview viewMode="web" readOnly />
        </div>
      </WebFrame>
      <p className="text-[11px] text-muted-foreground">
        Tip: use the in-app navigation to explore Feed, Sports, Discovery, Casino,
        and Peer-to-Peer.
      </p>
    </div>
  );
}

/* ── Inner shell that consumes Studio context ──────────────────────────── */

function PreviewShell({
  lockedAt,
  submittedBy,
  onBack,
}: {
  lockedAt: string | null;
  submittedBy: string | null;
  onBack: () => void;
}) {
  const [viewMode, setViewMode] = useState<ViewMode>("split");

  return (
    <div className="relative min-h-screen bg-background">
      {/* Background gradient */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, color-mix(in oklab, hsl(var(--primary)) 8%, transparent), transparent 70%)",
        }}
      />

      {/* Sticky header */}
      <div className="sticky top-0 z-20 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-lg border border-border/50 bg-card/40 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            <Lock className="h-3 w-3" />
            Locked Design Preview
          </div>
          <span className="rounded-full bg-success/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-success">
            Read-only
          </span>
        </div>
      </div>

      <div className="relative z-10">
        <BrandAssetsHero lockedAt={lockedAt} submittedBy={submittedBy} />

        <div className="mb-6">
          <DeviceModeTabs mode={viewMode} onChange={setViewMode} />
        </div>

        <div
          className={cn(
            "mx-auto px-6 pb-16 transition-all duration-300",
            viewMode === "split" ? "max-w-7xl" : "max-w-7xl",
          )}
        >
          {viewMode === "split" && <SplitView />}
          {viewMode === "mobile" && <FullscreenMobile />}
          {viewMode === "web" && <FullscreenWeb />}
        </div>
      </div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────── */

function StudioPreviewPage() {
  const { clientId } = useParams({ from: "/onboarding/$clientId/studio-preview" });
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [config, setConfig] = useState<LoadedConfig | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    document.title = "Trivelta Hub · Design Preview";
  }, []);

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

      if (!data?.studio_locked) {
        navigate({ to: "/onboarding/$clientId/studio", params: { clientId }, replace: true });
        return;
      }

      let palette: TCMPalette = { ...DEFAULT_TCM_PALETTE };
      let manualOverrides: (keyof TCMPalette)[] = [];
      let brandPromptHistory: BrandPromptEntry[] = [];
      let icons: StudioAppIcons = { ...defaultStudioAppIcons };
      let language: Language = "en";
      let appName = "";
      let appLabels: Partial<StudioAppLabels> = {};

      if (data.studio_config && typeof data.studio_config === "object") {
        const saved = data.studio_config as StudioSavedConfig;

        if (saved.palette) {
          palette = { ...DEFAULT_TCM_PALETTE, ...saved.palette };
          if (saved.manualOverrides) manualOverrides = saved.manualOverrides;
          if (saved.brandPromptHistory) brandPromptHistory = saved.brandPromptHistory;
        } else if (saved.colors) {
          palette = migrateLegacyThemeColors({ ...(saved.colors as Partial<StudioThemeColors>) });
        } else {
          palette = migrateLegacyThemeColors(data.studio_config as Partial<StudioThemeColors>);
        }

        if (saved.icons) icons = { ...defaultStudioAppIcons, ...saved.icons };
        if (saved.language) language = saved.language;
        if (saved.appName) appName = saved.appName;
        if (saved.appLabels) appLabels = saved.appLabels;
      }

      setConfig({
        palette,
        manualOverrides,
        brandPromptHistory,
        icons,
        language,
        appName,
        appLabels,
        lockedAt: data.studio_locked_at ?? null,
        submittedByEmail: null,
      });
      setReady(true);
    })();
  }, [authLoading, user, clientId, navigate]);

  const handleBack = useMemo(() => {
    return () => {
      if (role === "admin" || role === "account_executive" || role === "account_manager") {
        navigate({ to: "/admin" });
      } else {
        navigate({ to: "/onboarding/$clientId/studio-locked", params: { clientId } });
      }
    };
  }, [role, navigate, clientId]);

  if (authLoading || !ready || !config) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <StudioProvider
      initialPalette={config.palette}
      initialManualOverrides={config.manualOverrides}
      initialBrandPromptHistory={config.brandPromptHistory}
      initialIcons={config.icons}
      initialLanguage={config.language}
      initialAppName={config.appName}
      initialAppLabels={config.appLabels}
      initialLocked
    >
      <PreviewShell
        lockedAt={config.lockedAt}
        submittedBy={config.submittedByEmail}
        onBack={handleBack}
      />
    </StudioProvider>
  );
}
