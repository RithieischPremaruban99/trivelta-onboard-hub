/**
 * FieldInfoPopover — structured info popover for onboarding form fields.
 * Renders a small ℹ️ button that opens a Popover with:
 *   - What is this?    (always)
 *   - Why it matters   (if present)
 *   - Options          (cards with speed/risk/cost colored badges)
 *   - In your market   (marketContext)
 *   - Our recommendation (highlighted box)
 */

import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/* ─── Types ──────────────────────────────────────────────────── */

export type FieldInfoOption = {
  label: string;
  description: string;
  speed?: "fast" | "medium" | "slow";
  risk?: "low" | "medium" | "high";
  cost?: "low" | "medium" | "high";
  badge?: string;
};

export type FieldInfoData = {
  what: string;
  why?: string;
  options?: FieldInfoOption[];
  marketContext?: string;
  recommendation?: string;
  recommendationReason?: string;
  /** Returns a recommended value label for the given country string, or null */
  countryRecommendation?: (country: string) => string | null;
};

/* ─── Badge color helpers ─────────────────────────────────────── */

function speedColor(v: "fast" | "medium" | "slow") {
  return v === "fast"
    ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
    : v === "medium"
      ? "bg-amber-500/15 text-amber-600 border-amber-500/30"
      : "bg-rose-500/15 text-rose-600 border-rose-500/30";
}

function riskColor(v: "low" | "medium" | "high") {
  return v === "low"
    ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
    : v === "medium"
      ? "bg-amber-500/15 text-amber-600 border-amber-500/30"
      : "bg-rose-500/15 text-rose-600 border-rose-500/30";
}

function costColor(v: "low" | "medium" | "high") {
  return v === "low"
    ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
    : v === "medium"
      ? "bg-amber-500/15 text-amber-600 border-amber-500/30"
      : "bg-rose-500/15 text-rose-600 border-rose-500/30";
}

/* ─── FieldInfoPopover ────────────────────────────────────────── */

export function FieldInfoPopover({ info }: { info: FieldInfoData }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 border border-primary/25 text-primary hover:bg-primary/20 hover:border-primary/40 hover:scale-110 active:scale-95 transition-all ml-2 shrink-0"
          aria-label="More information about this field"
        >
          <Info className="h-3 w-3" strokeWidth={2.5} />
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-80 max-h-[480px] overflow-y-auto p-0 text-sm"
        align="start"
        sideOffset={6}
      >
        <div className="space-y-0 divide-y divide-border/40">

          {/* What is this */}
          <div className="px-4 py-3">
            <div className="text-[9px] font-bold uppercase tracking-[0.25em] text-muted-foreground mb-1.5">
              What is this?
            </div>
            <p className="text-[12px] leading-relaxed text-foreground/85">{info.what}</p>
          </div>

          {/* Why it matters */}
          {info.why && (
            <div className="px-4 py-3">
              <div className="text-[9px] font-bold uppercase tracking-[0.25em] text-muted-foreground mb-1.5">
                Why it matters
              </div>
              <p className="text-[12px] leading-relaxed text-foreground/75">{info.why}</p>
            </div>
          )}

          {/* Options */}
          {info.options && info.options.length > 0 && (
            <div className="px-4 py-3">
              <div className="text-[9px] font-bold uppercase tracking-[0.25em] text-muted-foreground mb-2">
                Options
              </div>
              <div className="space-y-2">
                {info.options.map((opt) => (
                  <div
                    key={opt.label}
                    className="rounded-lg border border-border/50 bg-card/40 px-3 py-2.5"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-[11px] font-semibold text-foreground leading-tight">
                        {opt.label}
                      </span>
                      {opt.badge && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-primary/15 text-primary border border-primary/30 shrink-0">
                          {opt.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-foreground/65 leading-relaxed mb-1.5">
                      {opt.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {opt.speed && (
                        <span
                          className={cn(
                            "text-[9px] font-semibold px-1.5 py-0.5 rounded border",
                            speedColor(opt.speed),
                          )}
                        >
                          Speed: {opt.speed}
                        </span>
                      )}
                      {opt.risk && (
                        <span
                          className={cn(
                            "text-[9px] font-semibold px-1.5 py-0.5 rounded border",
                            riskColor(opt.risk),
                          )}
                        >
                          Risk: {opt.risk}
                        </span>
                      )}
                      {opt.cost && (
                        <span
                          className={cn(
                            "text-[9px] font-semibold px-1.5 py-0.5 rounded border",
                            costColor(opt.cost),
                          )}
                        >
                          Cost: {opt.cost}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* In your market */}
          {info.marketContext && (
            <div className="px-4 py-3">
              <div className="text-[9px] font-bold uppercase tracking-[0.25em] text-muted-foreground mb-1.5">
                In your market
              </div>
              <p className="text-[12px] leading-relaxed text-foreground/75">{info.marketContext}</p>
            </div>
          )}

          {/* Our recommendation */}
          {info.recommendation && (
            <div className="px-4 py-3">
              <div className="text-[9px] font-bold uppercase tracking-[0.25em] text-muted-foreground mb-1.5">
                Our recommendation
              </div>
              <div className="rounded-lg border border-primary/30 bg-primary/8 px-3 py-2.5">
                <div className="text-[12px] font-semibold text-primary mb-0.5">
                  {info.recommendation}
                </div>
                {info.recommendationReason && (
                  <p className="text-[11px] text-foreground/70 leading-relaxed">
                    {info.recommendationReason}
                  </p>
                )}
              </div>
            </div>
          )}

        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ─── Registry lookup helper ─────────────────────────────────── */

import { PROSPECT_FIELD_INFO } from "@/lib/prospect-field-info";

/**
 * ProspectFieldInfoPopover — looks up a field key in the registry
 * and renders the popover. Silent no-op if not registered.
 */
export function ProspectFieldInfoPopover({ fieldKey }: { fieldKey: string }) {
  const info = PROSPECT_FIELD_INFO[fieldKey];
  if (!info) return null;
  return <FieldInfoPopover info={info} />;
}
