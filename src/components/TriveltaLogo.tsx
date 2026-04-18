/**
 * Trivelta logo: blue chevron mark + "TRIVELTA" wordmark.
 * Designed to be swappable — when the real SVG/PNG is uploaded, replace the
 * <Mark /> internals with an <img src=... /> and keep the same outer layout.
 */
import { cn } from "@/lib/utils";

function Mark({ className }: { className?: string }) {
  // Stylised chevron / arrow inspired by trivelta.com header mark.
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-primary", className)}
      aria-hidden="true"
    >
      <path
        d="M6 8 L16 22 L26 8"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11 6 L21 6"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}

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
    sm: { mark: "h-5 w-5", text: "text-[12px]", sub: "text-[8px]" },
    md: { mark: "h-7 w-7", text: "text-[14px]", sub: "text-[9px]" },
    lg: { mark: "h-9 w-9", text: "text-[17px]", sub: "text-[10px]" },
  }[size];

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Mark className={dims.mark} />
      <div className="leading-tight">
        <div
          className={cn(
            "font-bold tracking-[0.18em] text-foreground",
            dims.text,
          )}
        >
          TRIVELTA
        </div>
        {withSubtitle && (
          <div
            className={cn(
              "font-mono uppercase tracking-[0.22em] text-muted-foreground",
              dims.sub,
            )}
          >
            Onboarding Hub
          </div>
        )}
      </div>
    </div>
  );
}
