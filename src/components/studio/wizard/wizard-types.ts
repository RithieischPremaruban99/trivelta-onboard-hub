export type WizardStep = 1 | 2 | 3 | 4 | 5 | "complete";

export type BrandPersonality =
  | "modern-crypto"
  | "classic-casino"
  | "challenger"
  | "luxury-premium"
  | "mass-market";

export type PlatformType = "sportsbook" | "casino" | "both";

export type BrandIdentityChoice = "logo" | "fresh";

export interface WizardState {
  step: WizardStep;
  brandIdentityChoice?: BrandIdentityChoice;
  targetCountry?: string;
  isMultiMarket?: boolean;        // distinguishes "Multi-Market chosen" from "nothing chosen yet"
  targetPersonality?: BrandPersonality;
  targetPlatformType?: PlatformType;
  brandPrompt?: string;
  logoUrl?: string;
}

export function getTotalSteps(_state: WizardState): number {
  // Always 5 to keep step indicator consistent. Logo path skips the
  // personality stage (visually shown as "Step 4 of 5" jumping from 2).
  return 5;
}

export interface CountryEntry {
  iso: string;
  name: string;
  region: string;
  language: string;
  flag: string;
}

export const TOP_COUNTRIES: CountryEntry[] = [
  { iso: "NG", name: "Nigeria",      region: "africa-west-anglo", language: "en", flag: "🇳🇬" },
  { iso: "KE", name: "Kenya",        region: "africa-east",       language: "en", flag: "🇰🇪" },
  { iso: "GH", name: "Ghana",        region: "africa-west-anglo", language: "en", flag: "🇬🇭" },
  { iso: "TZ", name: "Tanzania",     region: "africa-east",       language: "sw", flag: "🇹🇿" },
  { iso: "ZA", name: "South Africa", region: "africa-south",      language: "en", flag: "🇿🇦" },
  { iso: "UG", name: "Uganda",       region: "africa-east",       language: "en", flag: "🇺🇬" },
  { iso: "MX", name: "Mexico",       region: "latam-mexico",      language: "es", flag: "🇲🇽" },
  { iso: "BR", name: "Brazil",       region: "latam-brazil",      language: "pt", flag: "🇧🇷" },
  { iso: "AR", name: "Argentina",    region: "latam-cono-sur",    language: "es", flag: "🇦🇷" },
  { iso: "CO", name: "Colombia",     region: "latam-andes",       language: "es", flag: "🇨🇴" },
];

export type OptionStatus = "idle" | "loading" | "streaming" | "done" | "error";

export interface GeneratedOption {
  id: 1 | 2 | 3;
  variationLabel: string;
  status: OptionStatus;
  palette: import("@/lib/tcm-palette").TCMPalette | null;
  reasoning: string;
  keyColorsSummary: string;
  streamingText: string;
}

export const PERSONALITY_TITLES: Record<BrandPersonality, string> = {
  "modern-crypto":  "Modern Crypto",
  "classic-casino": "Classic Casino",
  "challenger":     "Challenger",
  "luxury-premium": "Luxury Premium",
  "mass-market":    "Mass Market",
};

export const PERSONALITY_VARIATIONS: Record<
  BrandPersonality,
  [BrandPersonality, BrandPersonality]
> = {
  "modern-crypto":  ["challenger",     "luxury-premium"],
  "classic-casino": ["luxury-premium", "modern-crypto" ],
  "challenger":     ["mass-market",    "modern-crypto" ],
  "luxury-premium": ["classic-casino", "modern-crypto" ],
  "mass-market":    ["challenger",     "modern-crypto" ],
};

export const ALL_COUNTRIES: CountryEntry[] = [
  // Africa - West Anglophone
  { iso: "NG", name: "Nigeria",      region: "africa-west-anglo", language: "en", flag: "🇳🇬" },
  { iso: "GH", name: "Ghana",        region: "africa-west-anglo", language: "en", flag: "🇬🇭" },
  { iso: "SL", name: "Sierra Leone", region: "africa-west-anglo", language: "en", flag: "🇸🇱" },
  { iso: "LR", name: "Liberia",      region: "africa-west-anglo", language: "en", flag: "🇱🇷" },
  { iso: "GM", name: "Gambia",       region: "africa-west-anglo", language: "en", flag: "🇬🇲" },
  // Africa - West Francophone
  { iso: "SN", name: "Senegal",       region: "africa-west-franco", language: "fr", flag: "🇸🇳" },
  { iso: "CI", name: "Côte d'Ivoire", region: "africa-west-franco", language: "fr", flag: "🇨🇮" },
  { iso: "ML", name: "Mali",          region: "africa-west-franco", language: "fr", flag: "🇲🇱" },
  { iso: "BF", name: "Burkina Faso",  region: "africa-west-franco", language: "fr", flag: "🇧🇫" },
  { iso: "NE", name: "Niger",         region: "africa-west-franco", language: "fr", flag: "🇳🇪" },
  { iso: "GN", name: "Guinea",        region: "africa-west-franco", language: "fr", flag: "🇬🇳" },
  { iso: "TG", name: "Togo",          region: "africa-west-franco", language: "fr", flag: "🇹🇬" },
  { iso: "BJ", name: "Benin",         region: "africa-west-franco", language: "fr", flag: "🇧🇯" },
  // Africa - East
  { iso: "KE", name: "Kenya",       region: "africa-east", language: "en", flag: "🇰🇪" },
  { iso: "TZ", name: "Tanzania",    region: "africa-east", language: "sw", flag: "🇹🇿" },
  { iso: "UG", name: "Uganda",      region: "africa-east", language: "en", flag: "🇺🇬" },
  { iso: "RW", name: "Rwanda",      region: "africa-east", language: "en", flag: "🇷🇼" },
  { iso: "ET", name: "Ethiopia",    region: "africa-east", language: "en", flag: "🇪🇹" },
  { iso: "BI", name: "Burundi",     region: "africa-east", language: "fr", flag: "🇧🇮" },
  { iso: "SS", name: "South Sudan", region: "africa-east", language: "en", flag: "🇸🇸" },
  // Africa - Southern
  { iso: "ZA", name: "South Africa", region: "africa-south",      language: "en", flag: "🇿🇦" },
  { iso: "NA", name: "Namibia",      region: "africa-south",      language: "en", flag: "🇳🇦" },
  { iso: "BW", name: "Botswana",     region: "africa-south",      language: "en", flag: "🇧🇼" },
  { iso: "ZW", name: "Zimbabwe",     region: "africa-south",      language: "en", flag: "🇿🇼" },
  { iso: "ZM", name: "Zambia",       region: "africa-south",      language: "en", flag: "🇿🇲" },
  { iso: "MW", name: "Malawi",       region: "africa-south",      language: "en", flag: "🇲🇼" },
  { iso: "MZ", name: "Mozambique",   region: "africa-south-luso", language: "pt", flag: "🇲🇿" },
  { iso: "LS", name: "Lesotho",      region: "africa-south",      language: "en", flag: "🇱🇸" },
  { iso: "SZ", name: "Eswatini",     region: "africa-south",      language: "en", flag: "🇸🇿" },
  // Africa - Central
  { iso: "CD", name: "DR Congo",                 region: "africa-central",    language: "fr", flag: "🇨🇩" },
  { iso: "CM", name: "Cameroon",                 region: "africa-central",    language: "fr", flag: "🇨🇲" },
  { iso: "GA", name: "Gabon",                    region: "africa-central",    language: "fr", flag: "🇬🇦" },
  { iso: "AO", name: "Angola",                   region: "africa-south-luso", language: "pt", flag: "🇦🇴" },
  { iso: "CG", name: "Congo Republic",           region: "africa-central",    language: "fr", flag: "🇨🇬" },
  { iso: "TD", name: "Chad",                     region: "africa-central",    language: "fr", flag: "🇹🇩" },
  { iso: "CF", name: "Central African Republic", region: "africa-central",    language: "fr", flag: "🇨🇫" },
  // Africa - North/Arabic
  { iso: "EG", name: "Egypt",   region: "africa-north-arabic", language: "ar", flag: "🇪🇬" },
  { iso: "MA", name: "Morocco", region: "africa-north-arabic", language: "ar", flag: "🇲🇦" },
  { iso: "TN", name: "Tunisia", region: "africa-north-arabic", language: "ar", flag: "🇹🇳" },
  { iso: "DZ", name: "Algeria", region: "africa-north-arabic", language: "ar", flag: "🇩🇿" },
  { iso: "LY", name: "Libya",   region: "africa-north-arabic", language: "ar", flag: "🇱🇾" },
  { iso: "SD", name: "Sudan",   region: "africa-north-arabic", language: "ar", flag: "🇸🇩" },
  // Africa - Islands
  { iso: "MG", name: "Madagascar", region: "africa-island", language: "fr", flag: "🇲🇬" },
  { iso: "MU", name: "Mauritius",  region: "africa-island", language: "en", flag: "🇲🇺" },
  { iso: "SC", name: "Seychelles", region: "africa-island", language: "en", flag: "🇸🇨" },
  { iso: "CV", name: "Cape Verde", region: "africa-island", language: "pt", flag: "🇨🇻" },
  // LATAM - Mexico + Central America
  { iso: "MX", name: "Mexico",      region: "latam-mexico",  language: "es", flag: "🇲🇽" },
  { iso: "GT", name: "Guatemala",   region: "latam-central", language: "es", flag: "🇬🇹" },
  { iso: "HN", name: "Honduras",    region: "latam-central", language: "es", flag: "🇭🇳" },
  { iso: "SV", name: "El Salvador", region: "latam-central", language: "es", flag: "🇸🇻" },
  { iso: "NI", name: "Nicaragua",   region: "latam-central", language: "es", flag: "🇳🇮" },
  { iso: "CR", name: "Costa Rica",  region: "latam-central", language: "es", flag: "🇨🇷" },
  { iso: "PA", name: "Panama",      region: "latam-central", language: "es", flag: "🇵🇦" },
  { iso: "BZ", name: "Belize",      region: "latam-central", language: "en", flag: "🇧🇿" },
  // LATAM - Caribbean
  { iso: "DO", name: "Dominican Republic", region: "latam-caribbean-es", language: "es", flag: "🇩🇴" },
  { iso: "CU", name: "Cuba",               region: "latam-caribbean-es", language: "es", flag: "🇨🇺" },
  { iso: "PR", name: "Puerto Rico",        region: "latam-caribbean-es", language: "es", flag: "🇵🇷" },
  { iso: "JM", name: "Jamaica",            region: "latam-caribbean-en", language: "en", flag: "🇯🇲" },
  { iso: "TT", name: "Trinidad & Tobago",  region: "latam-caribbean-en", language: "en", flag: "🇹🇹" },
  { iso: "BS", name: "Bahamas",            region: "latam-caribbean-en", language: "en", flag: "🇧🇸" },
  { iso: "BB", name: "Barbados",           region: "latam-caribbean-en", language: "en", flag: "🇧🇧" },
  { iso: "CW", name: "Curaçao",            region: "latam-caribbean-en", language: "en", flag: "🇨🇼" },
  // LATAM - Andes
  { iso: "CO", name: "Colombia",  region: "latam-andes", language: "es", flag: "🇨🇴" },
  { iso: "VE", name: "Venezuela", region: "latam-andes", language: "es", flag: "🇻🇪" },
  { iso: "EC", name: "Ecuador",   region: "latam-andes", language: "es", flag: "🇪🇨" },
  { iso: "PE", name: "Peru",      region: "latam-andes", language: "es", flag: "🇵🇪" },
  { iso: "BO", name: "Bolivia",   region: "latam-andes", language: "es", flag: "🇧🇴" },
  // LATAM - Cono Sur
  { iso: "AR", name: "Argentina", region: "latam-cono-sur", language: "es", flag: "🇦🇷" },
  { iso: "CL", name: "Chile",     region: "latam-cono-sur", language: "es", flag: "🇨🇱" },
  { iso: "UY", name: "Uruguay",   region: "latam-cono-sur", language: "es", flag: "🇺🇾" },
  { iso: "PY", name: "Paraguay",  region: "latam-cono-sur", language: "es", flag: "🇵🇾" },
  // LATAM - Brazil + Guianas
  { iso: "BR", name: "Brazil",        region: "latam-brazil",  language: "pt", flag: "🇧🇷" },
  { iso: "GY", name: "Guyana",        region: "latam-guianas", language: "en", flag: "🇬🇾" },
  { iso: "SR", name: "Suriname",      region: "latam-guianas", language: "nl", flag: "🇸🇷" },
  { iso: "GF", name: "French Guiana", region: "latam-guianas", language: "fr", flag: "🇬🇫" },
];
