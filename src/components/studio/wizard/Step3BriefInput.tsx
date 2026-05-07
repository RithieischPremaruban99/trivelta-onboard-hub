import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LogoUploadField } from "@/components/studio/LogoUploadField";
import { ALL_COUNTRIES } from "./wizard-types";
import type { BrandPersonality, PlatformType } from "./wizard-types";

interface Props {
  clientId: string;
  brandPrompt: string;
  logoUrl: string | undefined;
  selectedCountry: string | undefined;
  isMultiMarket: boolean;
  selectedPlatformType: PlatformType | undefined;
  selectedPersonality: BrandPersonality | undefined;
  onChangeBrief: (text: string) => void;
  onLogoUploaded: (url: string) => void;
  onLogoRemoved: () => void;
  onBack: () => void;
  onNext: () => void;
}

const PERSONALITY_LABELS: Record<BrandPersonality, string> = {
  "modern-crypto": "Modern Crypto",
  "classic-casino": "Classic Casino",
  "challenger": "Challenger",
  "luxury-premium": "Luxury Premium",
  "mass-market": "Mass Market",
};

const PLATFORM_LABELS: Record<PlatformType, string> = {
  "sportsbook": "Sportsbook",
  "casino": "Casino",
  "both": "Sportsbook + Casino",
};

const PLATFORM_ICONS: Record<PlatformType, string> = {
  "sportsbook": "🏈",
  "casino": "🎰",
  "both": "🎯",
};

const MIN_BRIEF_LENGTH = 5;

export function Step3BriefInput({
  clientId,
  brandPrompt,
  logoUrl,
  selectedCountry,
  isMultiMarket,
  selectedPlatformType,
  selectedPersonality,
  onChangeBrief,
  onLogoUploaded,
  onLogoRemoved,
  onBack,
  onNext,
}: Props) {
  const briefLength = brandPrompt.trim().length;
  const canProceed = briefLength >= MIN_BRIEF_LENGTH;

  const countryEntry = selectedCountry
    ? ALL_COUNTRIES.find((c) => c.iso === selectedCountry)
    : null;
  const countryLabel = isMultiMarket
    ? "🌍 Multi-Market / Global"
    : countryEntry
    ? `${countryEntry.flag} ${countryEntry.name}`
    : "—";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground mb-1">
          Tell us about your brand
        </h2>
        <p className="text-sm text-muted-foreground">
          A 1–2 sentence description. This is the main signal for the palette generator.
        </p>
      </div>

      {/* Brief Textarea */}
      <div className="flex flex-col gap-2">
        <label className="micro-label">Brand brief</label>
        <Textarea
          value={brandPrompt}
          onChange={(e) => onChangeBrief(e.target.value)}
          placeholder="E.g. Premium crypto casino targeting savvy young professionals — modern, sophisticated, with a sleek dark aesthetic."
          rows={4}
          className="bg-card border-border text-foreground placeholder:text-muted-foreground/60 resize-none focus:border-primary focus-visible:ring-primary"
        />
        <div className="text-xs text-muted-foreground">
          {briefLength < MIN_BRIEF_LENGTH
            ? `Minimum ${MIN_BRIEF_LENGTH} characters`
            : `${briefLength} characters`}
        </div>
      </div>

      {/* Logo Upload */}
      <div className="flex flex-col gap-2">
        <label className="micro-label">Brand logo (optional)</label>
        <div className="bg-card border border-border rounded-xl p-5">
          <LogoUploadField
            clientId={clientId}
            currentLogoUrl={logoUrl ?? null}
            onUploadComplete={onLogoUploaded}
            onRemove={onLogoRemoved}
          />
        </div>
      </div>

      {/* Context Summary */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="micro-label mb-3">Your context so far</h3>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <div className="micro-label mb-1">Market</div>
            <div className="text-foreground font-medium">{countryLabel}</div>
          </div>
          <div>
            <div className="micro-label mb-1">Platform</div>
            <div className="text-foreground font-medium">
              {selectedPlatformType
                ? `${PLATFORM_ICONS[selectedPlatformType]} ${PLATFORM_LABELS[selectedPlatformType]}`
                : "—"}
            </div>
          </div>
          <div>
            <div className="micro-label mb-1">Personality</div>
            <div className="text-foreground font-medium">
              {selectedPersonality ? PERSONALITY_LABELS[selectedPersonality] : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between pt-2">
        <Button
          variant="outline"
          onClick={onBack}
          className="h-11 px-6 bg-transparent border-border text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          ← Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!canProceed}
          className="btn-premium h-11 px-6 min-w-[180px] disabled:opacity-40"
        >
          Generate 3 Options →
        </Button>
      </div>
    </div>
  );
}
