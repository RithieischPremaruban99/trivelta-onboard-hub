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
        {/* Logo lockup — matches login-page treatment exactly:
            h-7 logo PNG + metallic-gradient stage label via border-left separator */}
        <TriveltaLogo size="md" withSubtitle product={stage} />
        {rightContent && <div className="flex items-center gap-4">{rightContent}</div>}
      </div>
    </header>
  );
}
