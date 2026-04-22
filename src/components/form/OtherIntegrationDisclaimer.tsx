import { AlertTriangle } from "lucide-react";

export function OtherIntegrationDisclaimer() {
  return (
    <div className="mt-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 flex items-start gap-2.5">
      <AlertTriangle className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
      <div className="text-[11px] leading-relaxed text-foreground/80">
        <span className="font-semibold text-amber-200">Custom integrations require review.</span>{" "}
        Additional integration work may be billed separately and could impact your launch timeline.
        Please discuss with your Account Manager before finalizing.
      </div>
    </div>
  );
}
