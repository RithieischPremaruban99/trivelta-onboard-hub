import { cn } from "@/lib/utils";
import { TriveltaLogo } from "@/components/TriveltaLogo";

export type Stage = "PRE-ONBOARDING" | "ONBOARDING" | "STUDIO" | "ADMIN";

export function StageHeader({
  stage,
  rightContent,
  className,
}: {
  stage: Stage;
  rightContent?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "sticky top-0 z-10 border-b border-border/40 bg-background/80 backdrop-blur-md",
        className,
      )}
    >
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <TriveltaLogo size="sm" withSubtitle={false} />
          <div className="h-4 w-px bg-border/60" />
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary">
            {stage}
          </span>
        </div>
        {rightContent && <div className="flex items-center gap-4">{rightContent}</div>}
      </div>
    </header>
  );
}
