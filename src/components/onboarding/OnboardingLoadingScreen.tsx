import logoUrl from "@/assets/trivelta-logo.png";

interface OnboardingLoadingScreenProps {
  variant?: "onboarding" | "studio";
}

export function OnboardingLoadingScreen({ variant = "onboarding" }: OnboardingLoadingScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6">

        {variant === "studio" ? (
          <div className="flex items-center gap-4">
            <img src={logoUrl} alt="Trivelta" className="h-7 w-auto select-none" draggable={false} />
            <div className="h-6 w-px bg-border/50 shrink-0" />
            <div className="flex flex-col leading-none">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold tracking-tight">TRIVELTA AI</span>
                <span className="text-muted-foreground/60 text-[11px]">/</span>
                <span className="text-[13px] text-muted-foreground tracking-wide">Studio</span>
              </div>
              <div className="text-[9px] text-muted-foreground/50 uppercase tracking-[0.15em] mt-1">
                Powered by Anthropic
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <img src={logoUrl} alt="Trivelta" className="h-7 w-auto select-none" draggable={false} />
            <div className="h-6 w-px bg-border/50 shrink-0" />
            <span className="text-[13px] font-semibold tracking-wide text-muted-foreground">
              Onboarding
            </span>
          </div>
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
