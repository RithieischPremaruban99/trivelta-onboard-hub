import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BrandPersonality, PlatformType } from "./wizard-types";

interface Props {
  selectedPersonality: BrandPersonality | undefined;
  selectedPlatformType: PlatformType | undefined;
  onSelectPersonality: (personality: BrandPersonality) => void;
  onSelectPlatformType: (type: PlatformType) => void;
  onBack: () => void;
  onNext: () => void;
}

interface PersonalityOption {
  key: BrandPersonality;
  title: string;
  description: string;
  references: string;
}

interface PlatformOption {
  key: PlatformType;
  label: string;
  icon: string;
  description: string;
}

const PLATFORM_TYPES: PlatformOption[] = [
  { key: "sportsbook",  label: "Sportsbook",          icon: "🏈", description: "Sports betting only" },
  { key: "casino",      label: "Casino",               icon: "🎰", description: "Casino games only" },
  { key: "both",        label: "Sportsbook + Casino",  icon: "🎯", description: "Combined platform" },
];

const PERSONALITIES: PersonalityOption[] = [
  {
    key: "modern-crypto",
    title: "Modern Crypto",
    description: "Sleek, tech-forward, dark-base aesthetic",
    references: "Like Stake, Roobet, Rollbit",
  },
  {
    key: "classic-casino",
    title: "Classic Casino",
    description: "Traditional luxury, established trust signals",
    references: "Like Bet365, Caesars, MGM",
  },
  {
    key: "challenger",
    title: "Challenger",
    description: "Bold, anti-mainstream, unexpected combinations",
    references: "Like Pinnacle, Smarkets",
  },
  {
    key: "luxury-premium",
    title: "Luxury Premium",
    description: "Sophisticated, jewel tones, VIP-feel",
    references: "Like Hollywoodbets premium, Tsogo",
  },
  {
    key: "mass-market",
    title: "Mass Market",
    description: "Bold primaries, energetic, accessible",
    references: "Like Bet9ja, SportyBet, GwalaBet, Caliente",
  },
];

export function Step2PersonalityPicker({
  selectedPersonality,
  selectedPlatformType,
  onSelectPersonality,
  onSelectPlatformType,
  onBack,
  onNext,
}: Props) {
  const canProceed = !!selectedPersonality && !!selectedPlatformType;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-100 mb-1">
          What's your platform and personality?
        </h2>
        <p className="text-sm text-zinc-400">
          First pick what you're building, then your brand style. Both shape the palette as hints — the AI weighs them with your brief.
        </p>
      </div>

      {/* Platform Type Toggle */}
      <div>
        <h3 className="text-xs uppercase tracking-wider text-zinc-500 font-medium mb-2">
          Platform type
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {PLATFORM_TYPES.map((p) => {
            const selected = selectedPlatformType === p.key;
            return (
              <button
                key={p.key}
                onClick={() => onSelectPlatformType(p.key)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg border px-3 py-3 transition-all cursor-pointer",
                  "bg-zinc-900 border-zinc-700 hover:border-blue-500/50 hover:bg-zinc-800",
                  selected && "ring-2 ring-blue-500 bg-blue-500/10 border-blue-500"
                )}
              >
                <span className="text-xl leading-none">{p.icon}</span>
                <span className="text-sm font-medium text-zinc-100">{p.label}</span>
                <span className="text-xs text-zinc-500">{p.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Personality Cards */}
      <div>
        <h3 className="text-xs uppercase tracking-wider text-zinc-500 font-medium mb-2">
          Brand personality
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {PERSONALITIES.map((p) => {
            const selected = selectedPersonality === p.key;
            return (
              <button
                key={p.key}
                onClick={() => onSelectPersonality(p.key)}
                className={cn(
                  "flex flex-col gap-3 rounded-xl border p-5 transition-all cursor-pointer text-left",
                  "bg-zinc-900 border-zinc-700 hover:border-blue-500/50 hover:bg-zinc-800",
                  selected && "ring-2 ring-blue-500 bg-blue-500/10 border-blue-500"
                )}
              >
                <div>
                  <h3 className="text-base font-semibold text-zinc-100 mb-1">{p.title}</h3>
                  <p className="text-xs text-zinc-400 mb-2 leading-snug">{p.description}</p>
                  <p className="text-xs text-zinc-500 italic">{p.references}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between pt-2">
        <Button
          variant="outline"
          onClick={onBack}
          className="bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
        >
          ← Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!canProceed}
          className="min-w-[120px] bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40"
        >
          Next →
        </Button>
      </div>
    </div>
  );
}
