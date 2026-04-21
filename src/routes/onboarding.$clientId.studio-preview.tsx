import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Lock, ArrowLeft, Smartphone, Monitor } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
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
}

/* ── Brand Assets Card ──────────────────────────────────────────────────── */

const PALETTE_SWATCHES: Array<{ key: keyof TCMPalette; label: string }> = [
  { key: "primaryBackgroundColor", label: "Background" },
  { key: "primary", label: "Primary" },
  { key: "secondary", label: "Secondary" },
  { key: "dark", label: "Dark" },
  { key: "primaryTextColor", label: "Text" },
  { key: "accentGreenSecondary", label: "Accent" },
];

function BrandAssetsCard() {
  const { palette, appIcons, appName, language } = useStudio();
  const languageLabel = LANGUAGE_NAMES[language] ?? language;

  return (
    <div className="rounded-xl border border-border bg-card/60 px-6 py-5 mb-6">
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-4">
        Brand Assets
      </div>
      <div className="flex flex-wrap items-center gap-6">

        {/* Logo */}
        {appIcons.appNameLogo ? (
          <div className="h-12 w-auto max-w-[120px] flex-shrink-0 flex items-center">
            <img
              src={appIcons.appNameLogo}
              alt="App logo"
              className="h-full w-auto object-contain"
            />
          </div>
        ) : (
          <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] text-muted-foreground">No logo</span>
          </div>
        )}

        {/* Divider */}
        <div className="h-10 w-px bg-border flex-shrink-0" />

        {/* App name + language */}
        <div className="flex flex-col gap-1 flex-shrink-0">
          <div className="text-sm font-semibold text-foreground">{appName || "—"}</div>
          <div className="text-[11px] text-muted-foreground">{languageLabel}</div>
        </div>

        {/* Divider */}
        <div className="h-10 w-px bg-border flex-shrink-0" />

        {/* Palette swatches */}
        <div className="flex items-center gap-2 flex-wrap">
          {PALETTE_SWATCHES.map(({ key, label }) => {
            const value = palette[key] as string | undefined;
            if (!value) return null;
            return (
              <div key={key} className="flex flex-col items-center gap-1">
                <div
                  className="h-7 w-7 rounded-md border border-white/10 shadow-sm"
                  style={{ background: value }}
                  title={`${label}: ${value}`}
                />
                <span className="text-[9px] text-muted-foreground/70">{label}</span>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}

/* ── Inner preview (needs StudioContext) ────────────────────────────────── */

function PreviewInner() {
  return (
    <div className="w-full">
      <BrandAssetsCard />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Mobile */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-muted-foreground" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              Mobile
            </span>
          </div>
          <div
            className="rounded-xl border border-border overflow-hidden bg-card/20"
            style={{ height: 640 }}
          >
            <BettingAppPreview viewMode="mobile" readOnly />
          </div>
        </div>

        {/* Web */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4 text-muted-foreground" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              Web
            </span>
          </div>
          <div
            className="rounded-xl border border-border overflow-hidden bg-card/20"
            style={{ height: 640 }}
          >
            <BettingAppPreview viewMode="web" readOnly />
          </div>
        </div>

      </div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────── */

function StudioPreviewPage() {
  const { clientId } = useParams({ from: "/onboarding/$clientId/studio-preview" });
  const { user, loading: authLoading } = useAuth();
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
        .select("studio_config, studio_locked")
        .eq("client_id", clientId)
        .maybeSingle();

      if (!data?.studio_locked) {
        // Not locked — redirect back to editable Studio
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

      setConfig({ palette, manualOverrides, brandPromptHistory, icons, language, appName, appLabels });
      setReady(true);
    })();
  }, [authLoading, user, clientId, navigate]);

  if (authLoading || !ready || !config) {
    return (
      <div className="min-h-screen grid place-items-center">
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
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/95 backdrop-blur px-6 py-3">
          <button
            onClick={() => navigate({ to: "/onboarding/$clientId/studio-locked", params: { clientId } })}
            className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">Locked Design Preview</span>
          </div>
          <span className="ml-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-success">
            Read-only
          </span>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-7xl px-6 py-8">
          <PreviewInner />
        </div>
      </div>
    </StudioProvider>
  );
}
