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
  className,
}: {
  right?: React.ReactNode;
  bottomSlot?: React.ReactNode;
  homeHref?: string;
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
        <Link to={homeHref} className="flex items-center">
          <TriveltaLogo size="md" withSubtitle />
        </Link>
        {right && (
          <div className="ml-auto flex items-center gap-3">{right}</div>
        )}
      </div>
      {bottomSlot}
    </header>
  );
}
