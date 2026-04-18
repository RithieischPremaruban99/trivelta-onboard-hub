/**
 * Partner logo strip — mirrors the "Our Partners and Clients" row on trivelta.com.
 * Placeholder text chips for now; swap each <span> for an <img> once the
 * real partner SVGs are uploaded to /src/assets/partners/*.
 */
const PARTNERS = ["Evolution", "Sportradar", "Zendesk", "SEON", "Spribe"];

export function PartnerLogos({ label = "Our Partners and Clients" }: { label?: string }) {
  return (
    <div className="w-full">
      <div
        className="text-[11px] font-semibold uppercase text-[#6b7280]"
        style={{ letterSpacing: "1.5px" }}
      >
        {label}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-8 gap-y-4">
        {PARTNERS.map((name) => (
          <span
            key={name}
            className="text-[16px] font-medium text-[#6b7280] transition-colors hover:text-foreground"
          >
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}
