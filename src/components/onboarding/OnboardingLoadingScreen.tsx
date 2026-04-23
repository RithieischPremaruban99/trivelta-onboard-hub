import logoUrl from "@/assets/trivelta-logo.png";

export function OnboardingLoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-4">
          <img src={logoUrl} alt="Trivelta" className="h-7 w-auto select-none" draggable={false} />
          <div className="h-6 w-px bg-border/50 shrink-0" />
          <span className="text-[13px] font-bold tracking-tight">TRIVELTA AI</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative h-4 w-4 shrink-0">
            <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
          </div>
          <span className="text-sm text-muted-foreground">Loading your workspace…</span>
        </div>
      </div>
    </div>
  );
}
