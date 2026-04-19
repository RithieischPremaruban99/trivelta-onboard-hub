/**
 * Partner logo strip — official brand SVGs sourced from each company's
 * public website / press materials. Rendered monochrome via CSS filter
 * (brightness-0 invert) so they sit cleanly on the dark navy background.
 */
import evolutionLogo from "@/assets/partners/evolution.svg";
import sportradarLogo from "@/assets/partners/sportradar.svg";
import zendeskLogo from "@/assets/partners/zendesk.svg";
import seonLogo from "@/assets/partners/seon.svg";
import spribeLogo from "@/assets/partners/spribe.svg";

const PARTNERS: Array<{ name: string; src: string }> = [
  { name: "Evolution", src: evolutionLogo },
  { name: "Sportradar", src: sportradarLogo },
  { name: "Zendesk", src: zendeskLogo },
  { name: "SEON", src: seonLogo },
  { name: "Spribe", src: spribeLogo },
];

export function PartnerLogos({ label = "Our Partners and Clients" }: { label?: string }) {
  return (
    <div className="w-full">
      <div
        className="text-[11px] font-semibold uppercase text-[#6b7280]"
        style={{ letterSpacing: "1.5px" }}
      >
        {label}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-5">
        {PARTNERS.map((p) => (
          <img
            key={p.name}
            src={p.src}
            alt={p.name}
            loading="lazy"
            className="opacity-50 brightness-0 invert transition-opacity hover:opacity-90"
            style={{ height: p.height, width: "auto" }}
          />
        ))}
      </div>
    </div>
  );
}
