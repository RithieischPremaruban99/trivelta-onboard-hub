import React, { createContext, useContext, useState } from 'react';

export interface StudioThemeColors {
  primaryBg: string;
  primary: string;
  secondary: string;
  primaryButton: string;
  primaryButtonGradient: string;
  boxGradient1: string;
  boxGradient2: string;
  lightText: string;
  placeholder: string;
  headerBorder1: string;
  headerBorder2: string;
  inactiveButton: string;
  wonGradient1: string;
  wonGradient2: string;
  cardBackground: string;
  navBarBackground: string;
  bottomNavBackground: string;
  oddsButtonActive: string;
  oddsButtonInactive: string;
  liveBadge: string;
  successColor: string;
  errorColor: string;
  warningColor: string;
  linkColor: string;
  inputBackground: string;
  inputBorder: string;
  dividerColor: string;
  tooltipBackground: string;
  badgeBackground: string;
  skeletonColor: string;
  overlayColor: string;
}

export const defaultStudioColors: StudioThemeColors = {
  primaryBg: 'rgba(8, 8, 11, 1)',
  primary: 'rgba(253, 111, 39, 1)',
  secondary: 'rgba(252, 66, 51, 1)',
  primaryButton: 'rgba(252, 66, 51, 1)',
  primaryButtonGradient: 'rgba(252, 167, 50, 1)',
  boxGradient1: 'rgba(245, 131, 0, 1)',
  boxGradient2: 'rgba(3, 249, 73, 1)',
  lightText: 'rgba(255, 255, 255, 1)',
  placeholder: 'rgba(146, 146, 158, 1)',
  headerBorder1: 'rgba(37, 37, 47, 1)',
  headerBorder2: 'rgba(20, 20, 27, 1)',
  inactiveButton: 'rgba(95, 41, 24, 1)',
  wonGradient1: 'rgba(62, 192, 130, 1)',
  wonGradient2: 'rgba(7, 158, 9, 0.416)',
  cardBackground: 'rgba(18, 18, 25, 1)',
  navBarBackground: 'rgba(12, 12, 16, 1)',
  bottomNavBackground: 'rgba(8, 8, 11, 0.95)',
  oddsButtonActive: 'rgba(253, 111, 39, 0.15)',
  oddsButtonInactive: 'rgba(37, 37, 47, 1)',
  liveBadge: 'rgba(239, 68, 68, 1)',
  successColor: 'rgba(34, 197, 94, 1)',
  errorColor: 'rgba(239, 68, 68, 1)',
  warningColor: 'rgba(234, 179, 8, 1)',
  linkColor: 'rgba(59, 130, 246, 1)',
  inputBackground: 'rgba(25, 25, 35, 1)',
  inputBorder: 'rgba(50, 50, 65, 1)',
  dividerColor: 'rgba(255, 255, 255, 0.06)',
  tooltipBackground: 'rgba(30, 30, 42, 1)',
  badgeBackground: 'rgba(253, 111, 39, 0.12)',
  skeletonColor: 'rgba(40, 40, 55, 1)',
  overlayColor: 'rgba(0, 0, 0, 0.7)',
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
}

export const StudioProvider: React.FC<{
  children: React.ReactNode;
  initialColors?: StudioThemeColors;
  initialIcons?: StudioAppIcons;
}> = ({ children, initialColors, initialIcons }) => {
  const [themeColors, setThemeColors] = useState<StudioThemeColors>(initialColors ?? defaultStudioColors);
  const [appIcons, setAppIcons] = useState<StudioAppIcons>(initialIcons ?? defaultStudioAppIcons);
  const [previewMode, setPreviewMode] = useState<'mobile' | 'website'>('mobile');

  return (
    <StudioCtx.Provider
      value={{
        themeColors,
        setThemeColors,
        appLabels: defaultAppLabels,
        appIcons,
        setAppIcons,
        previewMode,
        setPreviewMode,
        headingFont: 'Sora',
      }}
    >
      {children}
    </StudioCtx.Provider>
  );
};
