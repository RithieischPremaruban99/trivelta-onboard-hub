/**
 * Trivelta logo: official horizontal color mark + wordmark.
 * Source asset: src/assets/trivelta-logo.png
 */
import { cn } from "@/lib/utils";
import logoUrl from "@/assets/trivelta-logo.png";

export function TriveltaLogo({
  size = "md",
  withSubtitle = false,
  className,
}: {
  size?: "sm" | "md" | "lg";
  withSubtitle?: boolean;
  className?: string;
}) {
  const dims = {
    sm: { h: "h-5", sub: "text-[8px]" },
    md: { h: "h-7", sub: "text-[9px]" },
    lg: { h: "h-9", sub: "text-[10px]" },
  }[size];

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <img
        src={logoUrl}
        alt="Trivelta"
        className={cn(dims.h, "w-auto select-none")}
        draggable={false}
      />
      {withSubtitle && (
        <div
          className={cn(
            "border-l border-border pl-2.5 font-mono uppercase tracking-[0.22em] text-muted-foreground leading-none",
            dims.sub,
          )}
        >
          Onboarding
          <br />
          Hub
        </div>
      )}
    </div>
  );
}
