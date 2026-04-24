import { Image, Info, Lock, MessageSquare, Palette, Wand2, Zap } from "lucide-react";

export function LockedFullStudioTeaser() {
  return (
    <div
      className="relative rounded-2xl border border-border/50 bg-gradient-to-br from-card/70 via-card/40 to-card/20 p-6 overflow-hidden cursor-not-allowed select-none backdrop-blur-sm"
      aria-disabled="true"
    >
      {/* Dimmed decorative layers */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl opacity-40">
        <div className="absolute -top-12 -right-12 h-48 w-48 bg-gradient-to-bl from-primary/10 via-primary/[0.03] to-transparent rounded-full blur-[60px]" />
      </div>

      {/* Lock badge */}
      <div className="absolute top-5 right-5 z-10">
        <div className="flex items-center gap-1.5 rounded-full border border-border/50 bg-gradient-to-b from-card/80 to-card/40 backdrop-blur-md px-3 py-1 shadow-sm">
          <Lock className="h-3 w-3 text-muted-foreground" strokeWidth={2.5} />
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Coming Soon
          </span>
        </div>
      </div>

      <div className="relative opacity-70 space-y-5 pointer-events-none">
        {/* Dimmed icon */}
        <div className="relative inline-block">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/[0.08] via-primary/[0.04] to-transparent border border-border/40 flex items-center justify-center backdrop-blur-sm">
            <Wand2 className="h-6 w-6 text-primary/50" />
          </div>
        </div>

        {/* Title */}
        <div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <h3 className="text-lg font-bold tracking-tight text-foreground/70">
              Trivelta AI Studio
            </h3>
            <span className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-[0.14em]">
              Full Suite · Trivelta AI
            </span>
          </div>
          <p className="text-[13px] text-muted-foreground/80 mt-2 leading-relaxed">
            Customize every visual detail of your platform — from complete color systems to motion
            design to natural language editing. The full Studio suite.
          </p>
        </div>

        {/* Locked feature list */}
        <div className="space-y-2.5 pt-1">
          {[
            { icon: MessageSquare, label: "AI Design Chat — describe changes in plain English" },
            { icon: Palette, label: "Color Palette Editor — 344 design tokens" },
            { icon: Zap, label: "Animation Tools — micro-interactions + motion" },
            { icon: Image, label: "AI Logo Generation + Brand Asset Library" },
          ].map((feat, i) => {
            const Icon = feat.icon;
            return (
              <div key={i} className="flex items-center gap-2.5">
                <div className="h-4 w-4 rounded-full bg-muted/30 border border-border/40 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-2.5 w-2.5 text-muted-foreground/60" strokeWidth={2} />
                </div>
                <span className="text-[12px] text-muted-foreground/70">{feat.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Unlock note */}
      <div className="relative mt-5 pt-4 border-t border-border/30 flex items-start gap-2">
        <Info className="h-3.5 w-3.5 text-muted-foreground/60 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
          Your Trivelta Account Manager will unlock the full Studio suite after onboarding review.
        </p>
      </div>
    </div>
  );
}
