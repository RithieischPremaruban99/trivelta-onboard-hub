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
      <div className="flex h-[60px] w-full items-center px-5 sm:px-8">
        {/* Logo lockup left-aligned to viewport edge — matches TriveltaNav (Suite) */}
        <TriveltaLogo size="xl" withSubtitle product={stage} />
        {rightContent && <div className="ml-auto flex items-center gap-4">{rightContent}</div>}
      </div>
    </header>
  );
}
