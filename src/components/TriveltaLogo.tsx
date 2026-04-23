/**
 * Trivelta logo lockup: official horizontal color mark + "STUDIO" wordmark.
 * Used consistently across the entire platform (login, app shell, onboarding nav).
 * Source asset: src/assets/trivelta-logo.png
 */
import { cn } from "@/lib/utils";
import logoUrl from "@/assets/trivelta-logo.png";

type Size = "sm" | "md" | "lg" | "xl";

const SIZE_MAP: Record<Size, { h: string; text: string; pl: string }> = {
  sm: { h: "h-5", text: "text-[12px]", pl: "pl-3" },
  md: { h: "h-7", text: "text-[15px]", pl: "pl-4" },
  lg: { h: "h-9", text: "text-[18px]", pl: "pl-5" },
  xl: { h: "h-10", text: "text-[18px]", pl: "pl-5" },
};

export function TriveltaLogo({
  size = "md",
  withSubtitle = true,
  product = "Studio",
  brandSuffix,
  poweredBy = false,
  className,
}: {
  size?: Size;
  /** Show the product lockup divider + wordmark. Defaults to true. */
  withSubtitle?: boolean;
  /** Product name shown after the divider. Defaults to "Studio". */
  product?: string;
  /** Optional suffix appended to the Trivelta wordmark before the divider (e.g. "AI"). */
  brandSuffix?: string;
  /** Show "Powered by Anthropic" micro-text below the lockup. */
  poweredBy?: boolean;
  className?: string;
}) {
  const dims = SIZE_MAP[size];

  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <div className="flex items-center gap-3">
        <img
          src={logoUrl}
          alt="Trivelta"
          className={cn(dims.h, "w-auto select-none")}
          draggable={false}
        />
        {brandSuffix && (
          <span
            className={cn("font-bold uppercase leading-none", dims.text)}
            style={{
              letterSpacing: "0.22em",
              backgroundImage:
                "linear-gradient(135deg, #ffffff 0%, #e8ecf2 30%, #b8bfca 55%, #f4f6fa 80%, #cfd5de 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              textShadow: "0 1px 2px rgba(0,0,0,0.25)",
              filter: "drop-shadow(0 0 6px rgba(220,224,232,0.15))",
            }}
          >
            {brandSuffix}
          </span>
        )}
        {withSubtitle && (
          <span
            className={cn(
              "font-semibold uppercase leading-none bg-clip-text text-transparent",
              dims.text,
              dims.pl,
            )}
            style={{
              letterSpacing: "0.24em",
              borderLeft: "2px solid rgba(220,224,232,0.55)",
              backgroundImage:
                "linear-gradient(135deg, #f4f6fa 0%, #d3d8e0 25%, #aab1bd 50%, #e8ecf2 75%, #b8bfca 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              textShadow: "0 1px 0 rgba(255,255,255,0.05)",
            }}
          >
            {product}
          </span>
        )}
      </div>
      {poweredBy && (
        <span className="text-[9px] text-muted-foreground/45 tracking-wide pl-0.5">
          Powered by Anthropic
        </span>
      )}
    </div>
  );
}
