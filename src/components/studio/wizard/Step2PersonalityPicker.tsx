import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BrandPersonality } from "./wizard-types";

interface Props {
  selectedPersonality: BrandPersonality | undefined;
  onSelect: (personality: BrandPersonality) => void;
  onBack: () => void;
  onNext: () => void;
}

interface PersonalityOption {
  key: BrandPersonality;
  title: string;
  description: string;
  references: string;
  colors: string[];
}

const PERSONALITIES: PersonalityOption[] = [
  {
    key: "modern-crypto",
    title: "Modern Crypto",
    description: "Sleek, tech-forward, dark-base aesthetic",
    references: "Like Stake, Roobet, Rollbit",
    colors: ["#00C8B4", "#1E3A8A", "#0A0A14"],
  },
  {
    key: "classic-casino",
    title: "Classic Casino",
    description: "Traditional luxury, established trust signals",
    references: "Like Bet365, Caesars, MGM",
    colors: ["#D4AF37", "#7F1D1D", "#08080F"],
  },
  {
    key: "challenger",
    title: "Challenger",
    description: "Bold, anti-mainstream, unexpected combinations",
    references: "Like Pinnacle, Smarkets",
    colors: ["#1A1A1A", "#FF6B35", "#F5F5F5"],
  },
  {
    key: "luxury-premium",
    title: "Luxury Premium",
    description: "Sophisticated, jewel tones, VIP-feel",
    references: "Like Hollywoodbets premium, Tsogo",
    colors: ["#D4AF37", "#0F4C3A", "#1A1A2E"],
  },
];

export function Step2PersonalityPicker({
  selectedPersonality,
  onSelect,
  onBack,
  onNext,
}: Props) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-100 mb-1">
          What's your brand personality?
        </h2>
        <p className="text-sm text-zinc-400">
          Pick the style direction that fits your brand. This is a hint — your brief can override it.
        </p>
      </div>

      {/* 2×2 grid */}
      <div className="grid grid-cols-2 gap-4">
        {PERSONALITIES.map((p) => {
          const selected = selectedPersonality === p.key;
          return (
            <button
              key={p.key}
              onClick={() => onSelect(p.key)}
              className={cn(
                "flex flex-col gap-3 rounded-xl border p-5 transition-all cursor-pointer text-left",
                "bg-zinc-900 border-zinc-700 hover:border-blue-500/50 hover:bg-zinc-800",
                selected && "ring-2 ring-blue-500 bg-blue-500/10 border-blue-500"
              )}
            >
              {/* Color dots */}
              <div className="flex gap-1.5">
                {p.colors.map((color, i) => (
                  <div
                    key={i}
                    className="h-6 w-6 rounded-full border border-zinc-700"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              <div>
                <h3 className="text-base font-semibold text-zinc-100 mb-1">
                  {p.title}
                </h3>
                <p className="text-xs text-zinc-400 mb-2 leading-snug">
                  {p.description}
                </p>
                <p className="text-xs text-zinc-500 italic">{p.references}</p>
              </div>
            </button>
          );
        })}
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
          disabled={!selectedPersonality}
          className="min-w-[120px] bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40"
        >
          Next →
        </Button>
      </div>
    </div>
  );
}
