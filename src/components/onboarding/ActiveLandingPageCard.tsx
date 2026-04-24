import { Check, Clock, Sparkles } from "lucide-react";

interface ActiveLandingPageCardProps {
  clientId: string;
}

export function ActiveLandingPageCard({ clientId: _clientId }: ActiveLandingPageCardProps) {
  return (
    <div className="relative rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.06] via-primary/[0.02] to-transparent p-6 overflow-hidden">
      {/* Premium glow layers — multiple for depth */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
        <div className="absolute -top-12 -right-12 h-48 w-48 bg-gradient-to-bl from-primary/15 via-primary/5 to-transparent rounded-full blur-[60px]" />
        <div className="absolute bottom-0 left-0 h-32 w-32 bg-gradient-to-tr from-primary/10 to-transparent rounded-full blur-[40px]" />
      </div>

      {/* "Next step" badge */}
      <div className="absolute top-5 right-5 z-10">
        <div className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-gradient-to-b from-primary/15 to-primary/5 backdrop-blur-md px-3 py-1 shadow-[0_2px_8px_rgba(99,102,241,0.15)]">
          <div className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-60 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
            Next Step
          </span>
        </div>
      </div>

      <div className="relative space-y-5">
        {/* Icon with depth */}
        <div className="relative inline-block">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center shadow-[0_4px_20px_rgba(99,102,241,0.2)] backdrop-blur-sm">
            <Sparkles className="h-6 w-6 text-primary drop-shadow-[0_2px_4px_rgba(99,102,241,0.4)]" />
          </div>
          {/* Subtle accent dot */}
          <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary shadow-[0_0_12px_rgba(99,102,241,0.6)] border-2 border-background" />
        </div>

        {/* Title + branding */}
        <div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <h3 className="text-lg font-bold tracking-tight">Landing Page Generator</h3>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.14em]">
              Powered by Anthropic
            </span>
          </div>
          <p className="text-[13px] text-muted-foreground/90 mt-2 leading-relaxed">
            After submitting this onboarding, you'll get exclusive access to generate your branded
            landing page, terms of service, privacy policy, and responsible gambling pages — all
            produced by AI in under 5 minutes.
          </p>
        </div>

        {/* Feature list with premium bullets */}
        <div className="space-y-2.5 pt-1">
          {[
            "Jurisdiction-compliant legal content",
            "Your brand colors, logo, and voice",
            "Desktop + mobile preview",
            "Downloadable ZIP ready for deployment",
          ].map((feature, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className="h-4 w-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center flex-shrink-0">
                <Check className="h-2.5 w-2.5 text-primary" strokeWidth={3} />
              </div>
              <span className="text-[12px] text-foreground/80">{feature}</span>
            </div>
          ))}
        </div>

        {/* Footer info — no CTA */}
        <div className="flex items-center gap-2 pt-4 mt-1 border-t border-primary/15">
          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Clock className="h-3 w-3 text-primary/80" />
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            You'll be guided to the generator automatically after completing this form.
          </p>
        </div>
      </div>
    </div>
  );
}
