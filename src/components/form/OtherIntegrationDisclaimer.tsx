import { AlertTriangle } from "lucide-react";

export function OtherIntegrationDisclaimer() {
  return (
    <div className="mt-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 flex items-start gap-2.5">
      <AlertTriangle className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
      <div className="text-[11px] leading-relaxed text-foreground/80">
        <span className="font-semibold text-amber-200">Please discuss with your Account Manager.</span>{" "}
        Selecting an unlisted provider may impact your launch date and result in additional integration costs.
        Please align with your Account Manager before proceeding.
      </div>
    </div>
  );
}
