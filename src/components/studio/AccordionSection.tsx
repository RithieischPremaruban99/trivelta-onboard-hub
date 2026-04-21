import { type ReactNode, type RefObject, useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AccordionSectionProps {
  title: string;
  icon?: ReactNode;
  subtitle?: string;
  badge?: string;
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  /** Attach a ref to the outer wrapper div (used for tour spotlight). */
  sectionRef?: RefObject<HTMLDivElement | null>;
}

export function AccordionSection({
  title,
  icon,
  subtitle,
  badge,
  active,
  onClick,
  children,
  sectionRef,
}: AccordionSectionProps) {
  const [hasBeenActive, setHasBeenActive] = useState(active);
  useEffect(() => {
    if (active) setHasBeenActive(true);
  }, [active]);

  return (
    <div
      ref={sectionRef as RefObject<HTMLDivElement>}
      className={cn(
        "relative flex flex-col border-b border-border/60 last:border-0",
        active ? "flex-1 min-h-0" : "shrink-0",
      )}
    >
      {/* Active accent dot on left edge */}
      {active && (
        <span
          aria-hidden
          className="pointer-events-none absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-primary shadow-[0_0_8px_var(--primary)]"
        />
      )}

      {/* Header */}
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "group flex w-full shrink-0 items-center justify-between px-5 py-3.5 text-left transition-colors duration-200",
          active
            ? "bg-gradient-to-r from-primary/[0.07] via-primary/[0.02] to-transparent shadow-[inset_0_-1px_0_0_var(--border)]"
            : "hover:bg-muted/40",
        )}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          {icon && (
            <span
              className={cn(
                "grid h-7 w-7 shrink-0 place-items-center rounded-lg transition-colors duration-200",
                active
                  ? "bg-primary/15 text-primary ring-1 ring-primary/20"
                  : "bg-muted/60 text-muted-foreground group-hover:bg-muted",
                "[&>svg]:h-4 [&>svg]:w-4",
              )}
            >
              {icon}
            </span>
          )}
          <span className="text-xs font-semibold tracking-tight text-foreground">
            {title}
          </span>
          {subtitle && (
            <span className="text-[10px] font-medium text-muted-foreground/70">
              {subtitle}
            </span>
          )}
          {badge && (
            <span className="rounded-full bg-gradient-to-r from-primary/25 to-primary/10 px-2 py-0.5 text-[9px] font-bold tracking-wide text-primary ring-1 ring-primary/20">
              {badge}
            </span>
          )}
        </div>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
            active && "rotate-180 text-primary",
          )}
        />
      </button>

      {/* Body */}
      {hasBeenActive && (
        <div
          className={cn(
            "flex flex-col min-h-0 transition-opacity duration-200",
            active ? "flex-1 overflow-y-auto opacity-100 animate-fade-in" : "hidden opacity-0",
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}
