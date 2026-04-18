import { cn } from "@/lib/utils";

type Status = "onboarding" | "active" | "churned";

const styles: Record<Status, string> = {
  onboarding: "bg-primary/15 text-primary ring-primary/30",
  active: "bg-success/15 text-success ring-success/30",
  churned: "bg-muted text-muted-foreground ring-border",
};

const labels: Record<Status, string> = {
  onboarding: "Onboarding",
  active: "Active",
  churned: "Churned",
};

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ring-1 ring-inset font-mono",
        styles[status],
        className,
      )}
    >
      {labels[status]}
    </span>
  );
}
