import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Image as ImageIcon, Palette } from "lucide-react";
import type { BrandIdentityChoice } from "./wizard-types";

interface Props {
  selectedChoice: BrandIdentityChoice | undefined;
  onSelect: (choice: BrandIdentityChoice) => void;
  onBack: () => void;
  onNext: () => void;
}

export function Step2BrandIdentityChoice({
  selectedChoice,
  onSelect,
  onBack,
  onNext,
}: Props) {
  const canContinue = Boolean(selectedChoice);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          How do you want to define your brand?
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose your starting point. We'll tailor the rest of the wizard accordingly.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => onSelect("logo")}
          className={cn(
            "rounded-xl border bg-card p-6 text-left transition-all duration-200",
            "hover:border-primary/40 hover:bg-muted",
            "border-border",
            selectedChoice === "logo" && "ring-2 ring-primary border-primary bg-primary/5",
          )}
        >
          <div className="flex flex-col items-start gap-4">
            <div className="rounded-lg bg-primary/10 p-3">
              <ImageIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">I have a logo</h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                Upload your logo and we'll match the brand colors. The palette will be derived from
                your logo's dominant color.
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => onSelect("fresh")}
          className={cn(
            "rounded-xl border bg-card p-6 text-left transition-all duration-200",
            "hover:border-primary/40 hover:bg-muted",
            "border-border",
            selectedChoice === "fresh" && "ring-2 ring-primary border-primary bg-primary/5",
          )}
        >
          <div className="flex flex-col items-start gap-4">
            <div className="rounded-lg bg-primary/10 p-3">
              <Palette className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Start fresh</h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                Pick a brand style and we'll create a complete palette. We'll generate the colors
                based on your direction.
              </p>
            </div>
          </div>
        </button>
      </div>

      <div className="flex justify-between pt-2">
        <Button
          variant="outline"
          onClick={onBack}
          className="bg-transparent border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          ← Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!canContinue}
          className="btn-premium h-11 px-6 disabled:opacity-40"
        >
          Next →
        </Button>
      </div>
    </div>
  );
}
