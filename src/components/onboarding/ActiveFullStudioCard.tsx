import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Wand2 } from "lucide-react";

interface ActiveFullStudioCardProps {
  clientId: string;
}

export function ActiveFullStudioCard({ clientId }: ActiveFullStudioCardProps) {
  return (
    <Link to="/onboarding/$clientId/studio-intro" params={{ clientId }} className="block">
      <div className="group relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.08] via-card/60 to-transparent p-6 shadow-premium transition-all hover:shadow-premium-hover cursor-pointer">
        {/* Decorative orbs */}
        <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-primary/15 opacity-60 blur-[80px]" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-32 w-32 rounded-full bg-primary/5 blur-[60px]" />

        {/* Active badge */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 backdrop-blur-sm">
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
            Full Access
          </span>
        </div>

        <div className="relative z-10 space-y-4">
          {/* Icon */}
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
            <Wand2 className="h-5 w-5 text-primary" />
          </div>

          {/* Title */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-foreground">Trivelta AI Studio</h3>
              <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                Full Suite · Trivelta AI
              </span>
            </div>
            <p className="mt-2 max-w-xl text-xs leading-relaxed text-muted-foreground">
              Customize every detail of your platform with AI — from color systems to animations to
              live natural-language editing.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-2 pt-2">
            {[
              "AI Design Chat — describe changes in plain English",
              "Color Palette Editor — 344 design tokens",
              "Animation Tools — micro-interactions + motion",
              "AI Logo Generation + Asset Library",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <Check className="h-3 w-3 shrink-0 text-primary" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          {/* CTA row */}
          <div className="flex items-center justify-between border-t border-primary/20 pt-4">
            <span className="text-xs text-muted-foreground">Open Full Studio</span>
            <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </Link>
  );
}
