/**
 * Partner logo strip — mirrors the "Trusted by" row on trivelta.com.
 * Placeholder text chips for now; swap each <span> for an <img> once the
 * real partner SVGs are uploaded to /src/assets/partners/*.
 */
const PARTNERS = ["Evolution", "Sportradar", "Zendesk", "SEON", "Spribe"];

export function PartnerLogos({ label = "Trusted infrastructure" }: { label?: string }) {
  return (
    <div className="flex flex-col items-start gap-3">
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        {PARTNERS.map((name) => (
          <span
            key={name}
            className="text-[15px] font-semibold tracking-tight text-muted-foreground/80 transition-colors hover:text-foreground"
          >
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}
