/**
 * Trivelta logo lockup: official horizontal color mark + "STUDIO" wordmark.
 * Used consistently across the entire platform (login, app shell, onboarding nav).
 * Source asset: src/assets/trivelta-logo.png
 */
import { cn } from "@/lib/utils";
import logoUrl from "@/assets/trivelta-logo.png";

type Size = "sm" | "md" | "lg";

const SIZE_MAP: Record<Size, { h: string; text: string; pl: string }> = {
  sm: { h: "h-5", text: "text-[12px]", pl: "pl-3" },
  md: { h: "h-7", text: "text-[15px]", pl: "pl-4" },
  lg: { h: "h-9", text: "text-[18px]", pl: "pl-5" },
};

export function TriveltaLogo({
  size = "md",
  withSubtitle = true,
  product = "Studio",
  className,
}: {
  size?: Size;
  /** Show the product lockup divider + wordmark. Defaults to true. */
  withSubtitle?: boolean;
  /** Product name shown after the divider. Defaults to "Studio". */
  product?: string;
  className?: string;
}) {
  const dims = SIZE_MAP[size];

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <img
        src={logoUrl}
        alt="Trivelta"
        className={cn(dims.h, "w-auto select-none")}
        draggable={false}
      />
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
            filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.35))",
          }}
        >
          {product}
        </span>
      )}
    </div>
  );
}
