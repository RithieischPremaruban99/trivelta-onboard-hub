import { TriveltaLogo } from "@/components/TriveltaLogo";

interface OnboardingLoadingScreenProps {
  variant?: "onboarding" | "studio";
}

export function OnboardingLoadingScreen({ variant = "onboarding" }: OnboardingLoadingScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6">

        {variant === "studio" ? (
          <TriveltaLogo size="xl" product="AI · Studio" poweredBy />
        ) : (
          <TriveltaLogo size="xl" product="Onboarding" />
        )}

        <div className="flex items-center gap-2">
          <div className="relative h-4 w-4 shrink-0">
            <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
          </div>
          <span className="text-sm text-muted-foreground">
            {variant === "studio" ? "Loading your workspace…" : "Loading…"}
          </span>
        </div>

      </div>
    </div>
  );
}
