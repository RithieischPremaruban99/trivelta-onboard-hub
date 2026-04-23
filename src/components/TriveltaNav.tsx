/**
 * Shared top navigation for the Trivelta onboarding portal.
 * Mirrors trivelta.com header style: logo left, content right, subtle border.
 *
 * Pass `right` to slot in client name / status / actions.
 * Pass `bottomSlot` to render an animated progress bar below the nav.
 */
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { TriveltaLogo } from "@/components/TriveltaLogo";

export function TriveltaNav({
  right,
  bottomSlot,
  homeHref = "/",
  product,
  badge,
  className,
}: {
  right?: React.ReactNode;
  bottomSlot?: React.ReactNode;
  homeHref?: string;
  /** Product wordmark passed to TriveltaLogo. */
  product?: string;
  /** Small pill badge rendered next to the logo (e.g. "Admin"). */
  badge?: string;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-xl",
        className,
      )}
    >
      <div className="relative flex h-[60px] w-full items-center px-5 sm:px-8">
        <div className="flex items-center gap-2.5">
          <Link to={homeHref} className="flex items-center">
            <TriveltaLogo size="xl" withSubtitle product={product} />
          </Link>
          {badge && (
            <span className="rounded-md border border-border bg-card/60 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
              {badge}
            </span>
          )}
        </div>
        {right && <div className="ml-auto flex items-center gap-3">{right}</div>}
      </div>
      {bottomSlot}
    </header>
  );
}
