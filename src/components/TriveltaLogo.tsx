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
  className,
}: {
  size?: Size;
  /** Show the "STUDIO" lockup divider + wordmark. Defaults to true. */
  withSubtitle?: boolean;
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
            "font-semibold uppercase text-white leading-none",
            dims.text,
            dims.pl,
          )}
          style={{
            letterSpacing: "0.24em",
            borderLeft: "2px solid rgba(255,255,255,0.85)",
          }}
        >
          Studio
        </span>
      )}
    </div>
  );
}
