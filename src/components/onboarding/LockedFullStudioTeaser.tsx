import { Info, Lock, Wand2 } from "lucide-react";

export function LockedFullStudioTeaser() {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-card/60 to-card/20 p-6 cursor-not-allowed select-none"
      aria-disabled="true"
    >
      {/* Dimmed glow */}
      <div className="pointer-events-none absolute top-0 right-0 h-40 w-40 -translate-y-12 translate-x-12 rounded-full bg-gradient-to-bl from-primary/20 to-transparent opacity-30 blur-3xl" />

      {/* Coming Soon badge */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 rounded-full border border-border/40 bg-background/80 px-2.5 py-1 backdrop-blur-sm">
        <Lock className="h-3 w-3 text-muted-foreground" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Coming Soon
        </span>
      </div>

      <div className="pointer-events-none relative space-y-4 opacity-60">
        {/* Icon */}
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/10 bg-primary/5">
          <Wand2 className="h-5 w-5 text-primary/40" />
        </div>

        {/* Title */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-muted-foreground">Trivelta AI Studio</h3>
            <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60">
              Full Suite · Powered by Anthropic
            </span>
          </div>
          <p className="mt-2 max-w-xl text-xs leading-relaxed text-muted-foreground/70">
            Customize every detail of your platform with AI — from color systems to animations to
            live natural-language editing.
          </p>
        </div>

        {/* Locked feature list */}
        <div className="space-y-2 pt-2">
          {[
            "AI Design Chat — describe changes in plain English",
            "Color Palette Editor — 344 design tokens",
            "Animation Tools — micro-interactions + motion",
            "AI Logo Generation + Asset Library",
          ].map((item) => (
            <div
              key={item}
              className="flex items-center gap-2 text-[11px] text-muted-foreground/60"
            >
              <Lock className="h-3 w-3 shrink-0 text-muted-foreground/40" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Unlock footer */}
      <div className="relative mt-4 flex items-center gap-2 border-t border-border/30 pt-4">
        <Info className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
        <p className="text-[11px] leading-relaxed text-muted-foreground/70">
          Your Trivelta Account Manager will unlock this after onboarding review.
        </p>
      </div>
    </div>
  );
}
