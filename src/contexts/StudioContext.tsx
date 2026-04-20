import React, { createContext, useContext, useMemo, useState } from 'react';
import { type Language, type TCMStrings, getStrings, LANGUAGE_NAMES } from '@/lib/tcm-strings';
export type { Language, TCMStrings };
export { LANGUAGE_NAMES };

export interface StudioThemeColors {
  // CORE BRAND
  primaryBg: string;
  primary: string;
  secondary: string;
  primaryButton: string;
  primaryButtonGradient: string;
  // BOX GRADIENT
  boxGradient1: string;
  boxGradient2: string;
  // TEXT
  lightText: string;
  placeholderText: string;
  navbarLabel: string;
  textSecondary: string;
  darkTextColor: string;
  // HEADER
  headerGradient1: string;
  headerGradient2: string;
  // WIN / LOSS
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
  // BUTTONS & INACTIVE
  inactiveButtonBg: string;
  inactiveButtonText: string;
  inactiveButtonTextSecondary: string;
  inactiveTabUnderline: string;
  // BACKGROUNDS
  dark: string;
  darkContainer: string;
  betcardHeaderBg: string;
  modalBackground: string;
  notificationBg: string;
  freeBetBackground: string;
  bgColor: string;
  flexBetHeaderBg: string;
  flexBetFooterBg: string;
  // MISC
  vsColor: string;
  borderAndGradientBg: string;
  activeSecondaryGradient: string;
}

export const defaultStudioColors: StudioThemeColors = {
  // CORE BRAND
  primaryBg: 'rgba(8, 8, 11, 1)',
  primary: 'rgba(253, 111, 39, 1)',
  secondary: 'rgba(252, 66, 51, 1)',
  primaryButton: 'rgba(252, 66, 51, 1)',
  primaryButtonGradient: 'rgba(252, 167, 50, 1)',
  // BOX GRADIENT
  boxGradient1: 'rgba(245, 131, 0, 1)',
  boxGradient2: 'rgba(3, 249, 73, 1)',
  // TEXT
  lightText: 'rgba(255, 255, 255, 1)',
  placeholderText: 'rgba(146, 146, 158, 1)',
  navbarLabel: 'rgba(255, 255, 255, 0.6)',
  textSecondary: 'rgba(146, 146, 158, 1)',
  darkTextColor: 'rgba(8, 8, 11, 1)',
  // HEADER
  headerGradient1: 'rgba(37, 37, 47, 1)',
  headerGradient2: 'rgba(20, 20, 27, 1)',
  // WIN / LOSS
  wonGradient1: 'rgba(62, 192, 130, 1)',
  wonGradient2: 'rgba(7, 158, 9, 0.416)',
  wonColor: 'rgba(62, 192, 130, 1)',
  lostColor: 'rgba(239, 68, 68, 1)',
  payoutWonColor: 'rgba(62, 192, 130, 1)',
  lossAmountText: 'rgba(239, 68, 68, 1)',
  winStatusGradient1: 'rgba(62, 192, 130, 1)',
  winStatusGradient2: 'rgba(7, 158, 9, 0.416)',
  loseStatusGradient1: 'rgba(239, 68, 68, 1)',
  loseStatusGradient2: 'rgba(180, 40, 40, 0.4)',
  // BUTTONS & INACTIVE
  inactiveButtonBg: 'rgba(95, 41, 24, 1)',
  inactiveButtonText: 'rgba(255, 255, 255, 0.7)',
  inactiveButtonTextSecondary: 'rgba(255, 255, 255, 0.4)',
  inactiveTabUnderline: 'rgba(146, 146, 158, 0.3)',
  // BACKGROUNDS
  dark: 'rgba(18, 18, 25, 1)',
  darkContainer: 'rgba(25, 25, 35, 1)',
  betcardHeaderBg: 'rgba(20, 20, 27, 1)',
  modalBackground: 'rgba(12, 12, 16, 0.95)',
  notificationBg: 'rgba(37, 37, 47, 1)',
  freeBetBackground: 'rgba(253, 111, 39, 0.12)',
  bgColor: 'rgba(8, 8, 11, 1)',
  flexBetHeaderBg: 'rgba(20, 20, 27, 1)',
  flexBetFooterBg: 'rgba(12, 12, 16, 1)',
  // MISC
  vsColor: 'rgba(146, 146, 158, 1)',
  borderAndGradientBg: 'rgba(255, 255, 255, 0.06)',
  activeSecondaryGradient: 'rgba(252, 66, 51, 0.15)',
};

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
  appName: 'BetNova',
  currencySymbol: '₦',
  feed: 'Feed',
  sportsbook: 'Sports',
  discovery: 'Discovery',
  socialCasino: 'Casino',
  profile: 'Profile',
  signIn: 'Sign In',
};

export interface StudioAppIcons {
  topLeftAppIcon: string | null;
  appNameLogo: string | null;
}

export const defaultStudioAppIcons: StudioAppIcons = {
  topLeftAppIcon: null,
  appNameLogo: null,
};

export interface StudioState {
  themeColors: StudioThemeColors;
  setThemeColors: React.Dispatch<React.SetStateAction<StudioThemeColors>>;
  appLabels: StudioAppLabels;
  appIcons: StudioAppIcons;
  setAppIcons: React.Dispatch<React.SetStateAction<StudioAppIcons>>;
  previewMode: 'mobile' | 'website';
  setPreviewMode: (mode: 'mobile' | 'website') => void;
  headingFont: string;
  language: Language;
  setLanguage: (lang: Language) => void;
  strings: TCMStrings;
  appName: string;
  setAppName: (name: string) => void;
}

const StudioCtx = createContext<StudioState | null>(null);

export const useStudio = () => {
  const ctx = useContext(StudioCtx);
  if (!ctx) throw new Error('useStudio must be used within StudioProvider');
  return ctx;
};

export interface StudioSavedConfig {
  colors?: Partial<StudioThemeColors>;
  icons?: Partial<StudioAppIcons>;
  language?: Language;
  appName?: string;
}

export const StudioProvider: React.FC<{
  children: React.ReactNode;
  initialColors?: StudioThemeColors;
  initialIcons?: StudioAppIcons;
  initialLanguage?: Language;
  initialAppName?: string;
}> = ({ children, initialColors, initialIcons, initialLanguage, initialAppName }) => {
  const [themeColors, setThemeColors] = useState<StudioThemeColors>(initialColors ?? defaultStudioColors);
  const [appIcons, setAppIcons] = useState<StudioAppIcons>(initialIcons ?? defaultStudioAppIcons);
  const [previewMode, setPreviewMode] = useState<'mobile' | 'website'>('mobile');
  const [language, setLanguage] = useState<Language>(initialLanguage ?? 'en');
  const [appName, setAppName] = useState<string>(initialAppName ?? defaultAppLabels.appName);

  const strings = useMemo(
    () => getStrings(language, {
      APP_NAME: appName,
      CURRENCY_SYMBOL: defaultAppLabels.currencySymbol,
    }),
    [language, appName],
  );

  return (
    <StudioCtx.Provider
      value={{
        themeColors,
        setThemeColors,
        appLabels: { ...defaultAppLabels, appName },
        appIcons,
        setAppIcons,
        previewMode,
        setPreviewMode,
        headingFont: 'Sora',
        language,
        setLanguage,
        strings,
        appName,
        setAppName,
      }}
    >
      {children}
    </StudioCtx.Provider>
  );
};
