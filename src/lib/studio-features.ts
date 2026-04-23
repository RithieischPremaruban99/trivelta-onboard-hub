export const STUDIO_FEATURES = [
  "landing_page_generator",
  "ai_chat",
  "color_editor",
  "animation_tools",
  "logo_editor",
  "asset_library",
] as const;

export type StudioFeature = (typeof STUDIO_FEATURES)[number];

export interface StudioFeatures {
  landing_page_generator: boolean;
  ai_chat: boolean;
  color_editor: boolean;
  animation_tools: boolean;
  logo_editor: boolean;
  asset_library: boolean;
}

export const DEFAULT_STUDIO_FEATURES: StudioFeatures = {
  landing_page_generator: true,
  ai_chat: false,
  color_editor: false,
  animation_tools: false,
  logo_editor: false,
  asset_library: false,
};

export const STUDIO_FEATURE_LABELS: Record<
  StudioFeature,
  { label: string; description: string }
> = {
  landing_page_generator: {
    label: "Landing Page Generator",
    description:
      "Client can generate branded landing, terms, privacy, and responsible gambling pages via AI.",
  },
  ai_chat: {
    label: "AI Design Chat",
    description:
      "Conversational AI assistant for design decisions and brand guidance.",
  },
  color_editor: {
    label: "Color Palette Editor",
    description: "Edit and preview brand colors and accent combinations.",
  },
  animation_tools: {
    label: "Animation Tools",
    description: "Micro-interactions, hover effects, and motion design.",
  },
  logo_editor: {
    label: "Logo Editor",
    description: "Upload, replace, and variant-manage brand logos.",
  },
  asset_library: {
    label: "Asset Library",
    description:
      "Browse and download branded banner, social, and email assets.",
  },
};
