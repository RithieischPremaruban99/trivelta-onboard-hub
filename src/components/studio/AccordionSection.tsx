import { type ReactNode, type RefObject } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
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
  return (
    <div
      ref={sectionRef as RefObject<HTMLDivElement>}
      className={cn(
        "flex flex-col border-b border-border last:border-0",
        active ? "flex-1 min-h-0" : "shrink-0",
      )}
    >
      {/* Header — always visible */}
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex w-full shrink-0 items-center justify-between px-4 py-3 text-left transition-colors",
          active ? "bg-muted/50 hover:bg-muted/60" : "hover:bg-muted/30",
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          {icon && (
            <span className={cn("shrink-0", active ? "text-primary" : "text-muted-foreground")}>
              {icon}
            </span>
          )}
          <span className="text-[11px] font-semibold text-foreground">{title}</span>
          {subtitle && (
            <span className="text-[10px] text-muted-foreground">{subtitle}</span>
          )}
          {badge && (
            <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold text-primary">
              {badge}
            </span>
          )}
        </div>
        {active ? (
          <ChevronUp className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        )}
      </button>

      {/* Body — only rendered when active */}
      {active && (
        <div className="min-h-0 flex-1 overflow-y-auto">
          {children}
        </div>
      )}
    </div>
  );
}
