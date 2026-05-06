/**
 * Auto-Derivation: 15 Atomic Fields → Full TCMPalette
 */

import { type TCMPalette, DEFAULT_TCM_PALETTE } from "./tcm-palette";

export interface AtomicPalette {
  primary: string;
  secondary: string;
  primaryBackgroundColor: string;
  dark: string;
  modalBackground: string;
  primaryButton: string;
  lightTextColor: string;
  primaryTextColor: string;
  freeBetBackground: string;
  boxGradientColorStart: string;
  boxGradientColorEnd: string;
  borderAndGradientBg: string;
  activeSecondaryGradientColor: string;
  wonColor: string;
  lostColor: string;
}

interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

function parseRgba(rgba: string): RGBA {
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!match) return { r: 0, g: 0, b: 0, a: 1 };
  return {
    r: parseInt(match[1]),
    g: parseInt(match[2]),
    b: parseInt(match[3]),
    a: match[4] ? parseFloat(match[4]) : 1,
  };
}

function toRgba(c: RGBA): string {
  return `rgba(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)}, ${c.a})`;
}

function withAlpha(rgba: string, alpha: number): string {
  const c = parseRgba(rgba);
  return toRgba({ ...c, a: alpha });
}

function adjustLightness(rgba: string, deltaPercent: number): string {
  const c = parseRgba(rgba);
  const factor = 1 + deltaPercent / 100;
  return toRgba({
    r: Math.max(0, Math.min(255, c.r * factor)),
    g: Math.max(0, Math.min(255, c.g * factor)),
    b: Math.max(0, Math.min(255, c.b * factor)),
    a: c.a,
  });
}

function isWarm(rgba: string): boolean {
  const c = parseRgba(rgba);
  return c.r > c.b;
}

function desaturate(rgba: string, amount: number = 0.5): string {
  const c = parseRgba(rgba);
  const gray = (c.r + c.g + c.b) / 3;
  return toRgba({
    r: c.r * (1 - amount) + gray * amount,
    g: c.g * (1 - amount) + gray * amount,
    b: c.b * (1 - amount) + gray * amount,
    a: c.a,
  });
}

export function derivePalette(atomic: AtomicPalette): TCMPalette {
  const palette: TCMPalette = { ...DEFAULT_TCM_PALETTE };

  // Apply atomic fields
  Object.assign(palette, atomic);

  // Background ladder
  palette.darkContainerBackground = adjustLightness(atomic.dark, 7);
  palette.bgColor = parseRgba(atomic.primaryBackgroundColor).r < 30
    ? "rgba(0, 0, 0, 1)"
    : atomic.primaryBackgroundColor;
  palette.inputBackgroundColor = adjustLightness(palette.darkContainerBackground, 2);
  palette.betcardHeaderBg = adjustLightness(atomic.dark, 2);
  palette.flexBetHeaderBg = palette.darkContainerBackground;
  palette.flexBetFooterBg = adjustLightness(atomic.dark, 3);
  palette.notificationSectionBg = adjustLightness(atomic.primaryBackgroundColor, 4);

  // Text ladder
  palette.textSecondaryColor = withAlpha(atomic.lightTextColor, 0.63);
  palette.textInputPlaceholderText = withAlpha(atomic.lightTextColor, 0.57);
  palette.navbarLabel = withAlpha(atomic.lightTextColor, 0.86);
  palette.chatMessageTextColor = isWarm(atomic.primary)
    ? adjustLightness(atomic.lightTextColor, -3)
    : atomic.lightTextColor;

  // Button gradient
  palette.primaryButtonGradient = adjustLightness(atomic.primaryButton, 15);

  // Inactive buttons
  palette.inactiveButtonBg = desaturate(adjustLightness(atomic.primary, -40), 0.6);
  palette.inactiveButtonTextPrimary = desaturate(adjustLightness(atomic.primary, 30), 0.4);
  palette.inactiveButtonTextSecondary = withAlpha(palette.inactiveButtonTextPrimary, 0.4);

  // Win/Loss gradient families
  palette.wonGradient1 = atomic.wonColor;
  palette.wonGradient2 = adjustLightness(atomic.wonColor, -15);
  palette.winStatusGradient1 = atomic.wonColor;
  palette.winStatusGradient2 = adjustLightness(atomic.wonColor, -10);
  palette.winStatusBorderGradient1 = withAlpha(atomic.wonColor, 0.5);
  palette.payoutWonColor = atomic.wonColor;

  // Action icon box
  palette.actionIconBoxBg = withAlpha(atomic.primary, 0.15);

  // VS color
  palette.vsColor = withAlpha(atomic.lightTextColor, 0.4);

  // Border color
  palette.borderColor = atomic.borderAndGradientBg;

  return palette;
}
