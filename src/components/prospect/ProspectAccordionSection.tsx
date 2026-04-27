import { useState } from "react";
import {
  Building2,
  CreditCard,
  ShieldCheck,
  Megaphone,
  Wrench,
  Sparkles,
  ChevronDown,
  CheckCircle2,
} from "lucide-react";
import type { LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProspectSection } from "@/lib/prospect-fields";
import { ProspectField } from "./ProspectField";

/* ── Icon registry (only icons used in PROSPECT_SECTIONS) ── */

const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  Building2,
  CreditCard,
  ShieldCheck,
  Megaphone,
  Wrench,
  Sparkles,
};

interface Props {
  section: ProspectSection;
  /** Values for this section (storageKey bucket) */
  values: Record<string, unknown>;
  /** All values across all sections — needed for conditional field evaluation */
  allValues?: Record<string, Record<string, unknown>>;
  onChange: (fieldKey: string, value: unknown) => void;
  isOpen: boolean;
  onToggle: () => void;
  disabled?: boolean;
  /** 1-based section number for display */
  sectionNumber?: number;
}

/** Check if a value counts as "filled" */
function isFilled(v: unknown): boolean {
  if (v === undefined || v === null) return false;
  if (typeof v === "string" && v.trim() === "") return false;
  if (Array.isArray(v) && v.length === 0) return false;
  return true;
}

export function ProspectAccordionSection({
  section,
  values,
  allValues,
  onChange,
  isOpen,
  onToggle,
  disabled,
  sectionNumber,
}: Props) {
  const Icon = ICON_MAP[section.icon] ?? Building2;
  const [showOptional, setShowOptional] = useState(false);

  // Separate fields by tier
  const requiredFields = section.fields.filter((f) => f.tier === "required" || !f.tier);
  const recommendedFields = section.fields.filter((f) => f.tier === "recommended");
  const optionalFields = section.fields.filter((f) => f.tier === "optional");

  // Count filled fields (all tiers)
  const filledCount = section.fields.filter((f) => isFilled(values[f.key])).length;
  const totalCount = section.fields.length;

  // Check if all required fields are filled (for section status icon)
  const requiredFilled = requiredFields.every((f) => {
    // Skip conditionally hidden fields
    if (f.conditionalOn) {
      const depValue = values[f.conditionalOn.dependsOn];
      const showWhen = f.conditionalOn.showWhen;
      const matches = Array.isArray(showWhen)
        ? showWhen.includes(String(depValue ?? ""))
        : String(depValue ?? "") === showWhen;
      if (!matches) return true; // hidden → counts as satisfied
    }
    return isFilled(values[f.key]);
  });

  const hasAnyRecommended = recommendedFields.some((f) => isFilled(values[f.key]));
  const allRequiredFilled = requiredFilled;

  // Status icon in header
  const statusIcon = allRequiredFilled && filledCount > 0 ? "complete" :
    filledCount > 0 ? "in-progress" : "empty";

  return (
    <div className="mb-3 overflow-hidden rounded-xl border border-border/40 bg-card/30">
      {/* ── Section header / toggle ── */}
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex w-full items-center gap-3 px-5 py-3.5 transition-colors",
          isOpen ? "bg-gradient-to-r from-primary/5 to-transparent" : "hover:bg-muted/40",
        )}
        aria-expanded={isOpen}
      >
        {/* Number badge */}
        {sectionNumber != null && (
          <div
            className={cn(
              "grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-bold transition-colors",
              statusIcon === "complete"
                ? "bg-success/20 text-success"
                : statusIcon === "in-progress"
                  ? "bg-primary/15 text-primary"
                  : "bg-muted/30 text-muted-foreground",
            )}
          >
            {statusIcon === "complete" ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              sectionNumber
            )}
          </div>
        )}

        {/* Icon */}
        <div
          className={cn(
            "grid h-7 w-7 shrink-0 place-items-center rounded-lg transition-colors",
            isOpen ? "bg-primary/10" : "bg-muted/30",
          )}
        >
          <Icon className={cn("h-4 w-4", isOpen ? "text-primary" : "text-muted-foreground")} />
        </div>

        {/* Title + subtitle */}
        <div className="flex-1 text-left">
          <div className="text-sm font-semibold tracking-tight text-foreground">
            {section.title}
          </div>
          <div className="mt-0.5 text-[11px] font-medium text-muted-foreground">
            {section.subtitle}
          </div>
        </div>

        {/* Field progress count */}
        <div
          className={cn(
            "text-[10px] font-bold uppercase tracking-wide",
            statusIcon === "complete"
              ? "text-success"
              : statusIcon === "in-progress"
                ? "text-primary"
                : "text-foreground/60",
          )}
        >
          {filledCount}/{totalCount}
        </div>

        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {/* ── Section content ── */}
      {isOpen && (
        <div className="border-t border-border/20 px-5 py-5">

          {/* Required fields */}
          {requiredFields.length > 0 && (
            <div className="space-y-4">
              {requiredFields.map((field) => (
                <ProspectField
                  key={field.key}
                  field={field}
                  value={values[field.key]}
                  onChange={(v) => onChange(field.key, v)}
                  otherValue={values[`${field.key}_other`] as string | undefined}
                  onOtherChange={(v) => onChange(`${field.key}_other`, v)}
                  disabled={disabled}
                  sectionValues={values}
                />
              ))}
            </div>
          )}

          {/* Recommended fields */}
          {recommendedFields.length > 0 && (
            <div className={cn("space-y-4", requiredFields.length > 0 && "mt-5")}>
              {requiredFields.length > 0 && (
                <div className="text-[9px] font-bold uppercase tracking-[0.25em] text-muted-foreground/60 pb-1 border-b border-border/30">
                  Recommended
                </div>
              )}
              <div className="space-y-4 opacity-90">
                {recommendedFields.map((field) => (
                  <ProspectField
                    key={field.key}
                    field={field}
                    value={values[field.key]}
                    onChange={(v) => onChange(field.key, v)}
                    otherValue={values[`${field.key}_other`] as string | undefined}
                    onOtherChange={(v) => onChange(`${field.key}_other`, v)}
                    disabled={disabled}
                    sectionValues={values}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Optional fields (collapsed by default) */}
          {optionalFields.length > 0 && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowOptional((v) => !v)}
                className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70 hover:text-foreground/80 transition-colors"
              >
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-150",
                    showOptional && "rotate-180",
                  )}
                />
                {showOptional ? "Hide optional fields" : `Show optional fields (${optionalFields.length})`}
              </button>

              {showOptional && (
                <div className="mt-3 space-y-4 rounded-lg border border-border/30 bg-muted/10 px-4 py-4">
                  <div className="text-[9px] font-bold uppercase tracking-[0.25em] text-muted-foreground/50">
                    Optional
                  </div>
                  {optionalFields.map((field) => (
                    <ProspectField
                      key={field.key}
                      field={field}
                      value={values[field.key]}
                      onChange={(v) => onChange(field.key, v)}
                      otherValue={values[`${field.key}_other`] as string | undefined}
                      onOtherChange={(v) => onChange(`${field.key}_other`, v)}
                      disabled={disabled}
                      sectionValues={values}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
