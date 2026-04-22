// NOTE (Phase 3): Context migrated from themeColors → palette.
// Consumers BettingAppPreview and studio.tsx fine-tune panel must be updated
// in Phase 4 (preview) and Phase 5 (UI) respectively. TypeScript errors in
// those files are expected until those phases are completed.

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { type Language, type TCMStrings, getStrings, LANGUAGE_NAMES } from "@/lib/tcm-strings";
import { type TCMPalette, DEFAULT_TCM_PALETTE } from "@/lib/tcm-palette";

export type { Language, TCMStrings };
export { LANGUAGE_NAMES };

// ---------------------------------------------------------------------------
// Legacy types - kept for backward compatibility with admin.tsx, dashboard.tsx,
// and studio-preview.$clientId.tsx which read old studio_config shapes.
// Do NOT use these in new Studio UI code - use TCMPalette instead.
// ---------------------------------------------------------------------------

/** @deprecated Use TCMPalette from @/lib/tcm-palette instead */
export interface StudioThemeColors {
  primaryBg: string;
  primary: string;
  secondary: string;
  primaryButton: string;
  primaryButtonGradient: string;
  boxGradient1: string;
  boxGradient2: string;
  lightText: string;
  placeholderText: string;
  navbarLabel: string;
  textSecondary: string;
  darkTextColor: string;
  headerGradient1: string;
  headerGradient2: string;
  wonGradient1: string;
  wonGradient2: string;
  wonColor: string;
  lostColor: string;
  payoutWonColor: string;
  lossAmountText: string;
  winStatusGradient1: string;
  winStatusGradient2: string;
  loseStatusGradient1: string;
  loseStatusGradient2: string;
  inactiveButtonBg: string;
  inactiveButtonText: string;
  inactiveButtonTextSecondary: string;
  inactiveTabUnderline: string;
  dark: string;
  darkContainer: string;
  betcardHeaderBg: string;
  modalBackground: string;
  notificationBg: string;
  freeBetBackground: string;
  bgColor: string;
  flexBetHeaderBg: string;
  flexBetFooterBg: string;
  vsColor: string;
  borderAndGradientBg: string;
  activeSecondaryGradient: string;
}

/** @deprecated Legacy defaults - use DEFAULT_TCM_PALETTE from @/lib/tcm-palette instead */
export const defaultStudioColors: StudioThemeColors = {
  primaryBg: "rgba(8, 8, 11, 1)",
  primary: "rgba(253, 111, 39, 1)",
  secondary: "rgba(252, 66, 51, 1)",
  primaryButton: "rgba(252, 66, 51, 1)",
  primaryButtonGradient: "rgba(252, 167, 50, 1)",
  boxGradient1: "rgba(245, 131, 0, 1)",
  boxGradient2: "rgba(3, 249, 73, 1)",
  lightText: "rgba(255, 255, 255, 1)",
  placeholderText: "rgba(146, 146, 158, 1)",
  navbarLabel: "rgba(255, 255, 255, 0.6)",
  textSecondary: "rgba(146, 146, 158, 1)",
  darkTextColor: "rgba(8, 8, 11, 1)",
  headerGradient1: "rgba(37, 37, 47, 1)",
  headerGradient2: "rgba(20, 20, 27, 1)",
  wonGradient1: "rgba(62, 192, 130, 1)",
  wonGradient2: "rgba(7, 158, 9, 0.416)",
  wonColor: "rgba(62, 192, 130, 1)",
  lostColor: "rgba(239, 68, 68, 1)",
  payoutWonColor: "rgba(62, 192, 130, 1)",
  lossAmountText: "rgba(239, 68, 68, 1)",
  winStatusGradient1: "rgba(62, 192, 130, 1)",
  winStatusGradient2: "rgba(7, 158, 9, 0.416)",
  loseStatusGradient1: "rgba(239, 68, 68, 1)",
  loseStatusGradient2: "rgba(180, 40, 40, 0.4)",
  inactiveButtonBg: "rgba(95, 41, 24, 1)",
  inactiveButtonText: "rgba(255, 255, 255, 0.7)",
  inactiveButtonTextSecondary: "rgba(255, 255, 255, 0.4)",
  inactiveTabUnderline: "rgba(146, 146, 158, 0.3)",
  dark: "rgba(18, 18, 25, 1)",
  darkContainer: "rgba(25, 25, 35, 1)",
  betcardHeaderBg: "rgba(20, 20, 27, 1)",
  modalBackground: "rgba(12, 12, 16, 0.95)",
  notificationBg: "rgba(37, 37, 47, 1)",
  freeBetBackground: "rgba(253, 111, 39, 0.12)",
  bgColor: "rgba(8, 8, 11, 1)",
  flexBetHeaderBg: "rgba(20, 20, 27, 1)",
  flexBetFooterBg: "rgba(12, 12, 16, 1)",
  vsColor: "rgba(146, 146, 158, 1)",
  borderAndGradientBg: "rgba(255, 255, 255, 0.06)",
  activeSecondaryGradient: "rgba(252, 66, 51, 0.15)",
};

// ---------------------------------------------------------------------------
// Legacy field mapping - old ThemeColors key → new TCMPalette key
// Exported for use in studio.tsx hydration (Phase 5).
// ---------------------------------------------------------------------------

export const LEGACY_FIELD_MAP: Record<string, keyof TCMPalette> = {
  primary: "primary",
  primaryBg: "primaryBackgroundColor",
  secondary: "secondary",
  primaryButton: "primaryButton",
  primaryButtonGradient: "primaryButtonGradient",
  boxGradient1: "boxGradientColorStart",
  boxGradient2: "boxGradientColorEnd",
  lightText: "lightTextColor",
  placeholderText: "textInputPlaceholderText",
  navbarLabel: "navbarLabel",
  textSecondary: "textSecondaryColor",
  darkTextColor: "darkTextColor",
  headerGradient1: "headerBorderGradient1",
  headerGradient2: "headerBorderGradient2",
  wonGradient1: "wonGradient1",
  wonGradient2: "wonGradient2",
  wonColor: "wonColor",
  lostColor: "lostColor",
  payoutWonColor: "payoutWonColor",
  lossAmountText: "lossAmountText",
  winStatusGradient1: "winStatusGradient1",
  winStatusGradient2: "winStatusGradient2",
  loseStatusGradient1: "loseStatusGradient1",
  loseStatusGradient2: "loseStatusGradient2",
  inactiveButtonBg: "inactiveButtonBg",
  inactiveButtonText: "inactiveButtonTextPrimary",
  inactiveButtonTextSecondary: "inactiveButtonTextSecondary",
  inactiveTabUnderline: "inactiveTabUnderline",
  dark: "dark",
  darkContainer: "darkContainerBackground",
  betcardHeaderBg: "betcardHeaderBg",
  modalBackground: "modalBackground",
  notificationBg: "notificationSectionBg",
  freeBetBackground: "freeBetBackground",
  flexBetHeaderBg: "flexBetHeaderBg",
  flexBetFooterBg: "flexBetFooterBg",
  vsColor: "vsColor",
  borderAndGradientBg: "borderAndGradientBg",
  activeSecondaryGradient: "activeSecondaryGradientColor",
  bgColor: "bgColor",
};

/**
 * Migrate a legacy ThemeColors object to a full TCMPalette.
 * Any old field not in LEGACY_FIELD_MAP is ignored.
 * Any new field not covered by the mapping defaults to DEFAULT_TCM_PALETTE.
 * Exported for use in studio.tsx hydration (Phase 5).
 */
export function migrateLegacyThemeColors(
  legacy: Partial<StudioThemeColors>,
): TCMPalette {
  const result = { ...DEFAULT_TCM_PALETTE };
  for (const [oldKey, value] of Object.entries(legacy)) {
    const newKey = LEGACY_FIELD_MAP[oldKey];
    if (newKey && value) {
      (result as unknown as Record<string, string>)[newKey] = value;
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// App labels & icons
// ---------------------------------------------------------------------------

export interface StudioAppLabels {
  appName: string;
  currencySymbol: string;
  feed: string;
  sportsbook: string;
  discovery: string;
  socialCasino: string;
  profile: string;
  signIn: string;
}

const defaultAppLabels: StudioAppLabels = {
  appName: "BetNova",
  currencySymbol: "₦",
  feed: "Feed",
  sportsbook: "Sports",
  discovery: "Discovery",
  socialCasino: "Casino",
  profile: "Profile",
  signIn: "Sign In",
};

export interface StudioAppIcons {
  topLeftAppIcon: string | null;
  appNameLogo: string | null;
}

export const defaultStudioAppIcons: StudioAppIcons = {
  topLeftAppIcon: null,
  appNameLogo: null,
};

// ---------------------------------------------------------------------------
// Saved config shape - expanded to hold both new and legacy formats
// ---------------------------------------------------------------------------

export interface StudioSavedConfig {
  // New format (Phase 3+)
  palette?: Partial<TCMPalette>;
  manualOverrides?: (keyof TCMPalette)[];
  brandPromptHistory?: Array<{ prompt: string; timestamp: string; feedback?: string; reasoning?: string; keyColorsSummary?: string; logoVariants?: LogoVariant[] }>;
  // Legacy format (pre-Phase 3) - kept for backward compat reads
  colors?: Partial<StudioThemeColors>;
  icons?: Partial<StudioAppIcons>;
  language?: Language;
  appName?: string;
  appLabels?: Partial<StudioAppLabels>;
}

// ---------------------------------------------------------------------------
// Brand prompt history entry
// ---------------------------------------------------------------------------

export interface LogoVariant {
  url: string;
  seed: number;
  prompt: string;
}

export interface BrandPromptEntry {
  prompt: string;
  timestamp: string;
  feedback?: string;
  reasoning?: string;
  keyColorsSummary?: string;
  logoVariants?: LogoVariant[];
}

// ---------------------------------------------------------------------------
// Context state
// ---------------------------------------------------------------------------

export interface StudioState {
  // Palette
  palette: TCMPalette;
  setPalette: (palette: TCMPalette) => void;
  updatePaletteField: (fieldName: keyof TCMPalette, value: string) => void;
  resetPaletteField: (fieldName: keyof TCMPalette) => void;
  resetPalette: () => void;

  // Manual override tracking
  manualOverrides: Set<keyof TCMPalette>;
  isOverridden: (fieldName: keyof TCMPalette) => boolean;

  // Brand prompt history
  brandPromptHistory: BrandPromptEntry[];
  addBrandPrompt: (prompt: string, feedback?: string, reasoning?: string, keyColorsSummary?: string, logoVariants?: LogoVariant[]) => void;

  // App assets
  appIcons: StudioAppIcons;
  setAppIcons: React.Dispatch<React.SetStateAction<StudioAppIcons>>;
  appLabels: StudioAppLabels;
  setAppLabels: React.Dispatch<React.SetStateAction<StudioAppLabels>>;

  // Preview
  previewMode: "mobile" | "website";
  setPreviewMode: (mode: "mobile" | "website") => void;

  // Localisation
  language: Language;
  setLanguage: (lang: Language) => void;
  strings: TCMStrings;

  // App identity
  appName: string;
  setAppName: (name: string) => void;

  // Lock state (managed by studio.tsx, surfaced here for consumers)
  locked: boolean;
  canLock: boolean;

  // Heading font - always "Sora"
  headingFont: string;
}

// ---------------------------------------------------------------------------
// Context + hook
// ---------------------------------------------------------------------------

const StudioCtx = createContext<StudioState | null>(null);

export const useStudio = () => {
  const ctx = useContext(StudioCtx);
  if (!ctx) throw new Error("useStudio must be used within StudioProvider");
  return ctx;
};

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

const MAX_HISTORY = 20;

export const StudioProvider: React.FC<{
  children: React.ReactNode;
  initialPalette?: TCMPalette;
  initialManualOverrides?: (keyof TCMPalette)[];
  initialBrandPromptHistory?: BrandPromptEntry[];
  initialIcons?: StudioAppIcons;
  initialLanguage?: Language;
  initialAppName?: string;
  initialAppLabels?: Partial<StudioAppLabels>;
  initialLocked?: boolean;
  /** @deprecated Pass initialPalette instead. Accepted for backward compat with studio-preview. */
  initialColors?: StudioThemeColors;
}> = ({
  children,
  initialPalette,
  initialManualOverrides,
  initialBrandPromptHistory,
  initialIcons,
  initialLanguage,
  initialAppName,
  initialAppLabels,
  initialLocked,
  initialColors,
}) => {
  // Resolve legacy initialColors → initialPalette if initialPalette not provided
  const resolvedInitialPalette: TCMPalette = initialPalette
    ?? (initialColors ? migrateLegacyThemeColors(initialColors) : DEFAULT_TCM_PALETTE);
  // ── Palette ────────────────────────────────────────────────────────────────
  const [palette, setPaletteState] = useState<TCMPalette>(resolvedInitialPalette);
  const [manualOverrides, setManualOverrides] = useState<Set<keyof TCMPalette>>(
    new Set(initialManualOverrides ?? []),
  );
  const [brandPromptHistory, setBrandPromptHistory] = useState<BrandPromptEntry[]>(
    initialBrandPromptHistory ?? [],
  );

  // Tracks the last palette set by the AI (for per-field reset)
  const lastAIPaletteRef = useRef<TCMPalette | null>(resolvedInitialPalette);

  // ── App assets & UI ────────────────────────────────────────────────────────
  const [appIcons, setAppIcons] = useState<StudioAppIcons>(
    initialIcons ?? defaultStudioAppIcons,
  );
  const [appLabels, setAppLabels] = useState<StudioAppLabels>({
    ...defaultAppLabels,
    ...initialAppLabels,
    appName: initialAppName ?? initialAppLabels?.appName ?? defaultAppLabels.appName,
  });
  const [previewMode, setPreviewMode] = useState<"mobile" | "website">("mobile");
  const [language, setLanguage] = useState<Language>(initialLanguage ?? "en");

  // appName is also exposed directly for convenience (mirrors appLabels.appName)
  const setAppName = useCallback((name: string) => {
    setAppLabels((prev) => ({ ...prev, appName: name }));
  }, []);

  const appName = appLabels.appName;

  // Lock state - provided by studio.tsx via initialLocked prop (Phase 5 wires this fully)
  const locked = initialLocked ?? false;
  const canLock = !!appIcons.appNameLogo;

  // ── Strings ────────────────────────────────────────────────────────────────
  const strings = useMemo(
    () =>
      getStrings(language, {
        APP_NAME: appName,
        CURRENCY_SYMBOL: defaultAppLabels.currencySymbol,
      }),
    [language, appName],
  );

  // ── Palette helpers ────────────────────────────────────────────────────────

  /** Replace entire palette (called after successful generate-palette response). */
  const setPalette = useCallback((newPalette: TCMPalette) => {
    setPaletteState(newPalette);
    lastAIPaletteRef.current = newPalette;
    // manualOverrides intentionally NOT cleared - overrides persist across AI generations
  }, []);

  /** Manually edit a single field (Quick Edit / Advanced Mode). */
  const updatePaletteField = useCallback(
    (fieldName: keyof TCMPalette, value: string) => {
      setPaletteState((prev) => ({ ...prev, [fieldName]: value }));
      setManualOverrides((prev) => new Set([...prev, fieldName]));
    },
    [],
  );

  /**
   * Reset a single field to the last AI-generated value (or default if no AI
   * palette has been generated yet).
   */
  const resetPaletteField = useCallback((fieldName: keyof TCMPalette) => {
    const fallback =
      lastAIPaletteRef.current?.[fieldName] ?? DEFAULT_TCM_PALETTE[fieldName];
    setPaletteState((prev) => ({ ...prev, [fieldName]: fallback }));
    setManualOverrides((prev) => {
      const next = new Set(prev);
      next.delete(fieldName);
      return next;
    });
  }, []);

  /** Reset entire palette to DEFAULT_TCM_PALETTE and clear all overrides. */
  const resetPalette = useCallback(() => {
    setPaletteState(DEFAULT_TCM_PALETTE);
    setManualOverrides(new Set());
    lastAIPaletteRef.current = null;
  }, []);

  const isOverridden = useCallback(
    (fieldName: keyof TCMPalette) => manualOverrides.has(fieldName),
    [manualOverrides],
  );

  /** Record a brand prompt in history (max 20 entries). */
  const addBrandPrompt = useCallback(
    (prompt: string, feedback?: string, reasoning?: string, keyColorsSummary?: string, logoVariants?: LogoVariant[]) => {
      const entry: BrandPromptEntry = {
        prompt,
        timestamp: new Date().toISOString(),
        ...(feedback && { feedback }),
        ...(reasoning && { reasoning }),
        ...(keyColorsSummary && { keyColorsSummary }),
        ...(logoVariants && logoVariants.length > 0 && { logoVariants }),
      };
      setBrandPromptHistory((prev) =>
        [entry, ...prev].slice(0, MAX_HISTORY),
      );
    },
    [],
  );

  // ── Context value ──────────────────────────────────────────────────────────

  return (
    <StudioCtx.Provider
      value={{
        palette,
        setPalette,
        updatePaletteField,
        resetPaletteField,
        resetPalette,
        manualOverrides,
        isOverridden,
        brandPromptHistory,
        addBrandPrompt,
        appIcons,
        setAppIcons,
        appLabels,
        setAppLabels,
        previewMode,
        setPreviewMode,
        language,
        setLanguage,
        strings,
        appName,
        setAppName,
        locked,
        canLock,
        headingFont: "Sora",
      }}
    >
      {children}
    </StudioCtx.Provider>
  );
};
