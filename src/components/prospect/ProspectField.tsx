import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProspectField as ProspectFieldDef } from "@/lib/prospect-fields";
import { FieldInfo } from "@/components/form/FieldInfo";

interface Props {
  field: ProspectFieldDef;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

const INPUT_BASE =
  "w-full rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed";

export function ProspectField({ field, value, onChange, disabled }: Props) {
  const label = (
    <label className="flex items-center text-xs font-semibold text-foreground mb-1.5">
      <span>{field.label}</span>
      {field.required && <span className="text-primary ml-1">*</span>}
      <FieldInfo fieldKey={field.key} />
    </label>
  );

  const helper = field.helperText ? (
    <p className="text-[11px] text-muted-foreground/80 mt-1">{field.helperText}</p>
  ) : null;

  /* ── text / email / phone / number ── */
  if (
    field.type === "text" ||
    field.type === "email" ||
    field.type === "phone" ||
    field.type === "number"
  ) {
    return (
      <div>
        {label}
        <input
          type={field.type === "phone" ? "tel" : field.type === "number" ? "number" : field.type}
          className={INPUT_BASE}
          placeholder={field.placeholder}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
        {helper}
      </div>
    );
  }

  /* ── textarea ── */
  if (field.type === "textarea") {
    return (
      <div>
        {label}
        <textarea
          className={cn(INPUT_BASE, "min-h-[80px] resize-y")}
          placeholder={field.placeholder}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
        {helper}
      </div>
    );
  }

  /* ── select ── */
  if (field.type === "select") {
    const selectVal = typeof value === "string" ? value : "";
    const showOtherDisclaimer =
      field.otherDisclaimer === "integration_launch_impact" && selectVal === "Other";
    return (
      <div>
        {label}
        <select
          className={cn(INPUT_BASE, "cursor-pointer")}
          value={selectVal}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        >
          <option value="">- Select -</option>
          {(field.options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        {helper}
        {showOtherDisclaimer && (
          <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
            <p className="text-[11px] leading-relaxed text-amber-600 dark:text-amber-400">
              Using an unlisted provider may delay your integration launch. Please discuss
              with your Account Manager before proceeding.
            </p>
          </div>
        )}
      </div>
    );
  }

  /* ── multi_select — checkbox pills ── */
  if (field.type === "multi_select") {
    const selected: string[] = Array.isArray(value) ? (value as string[]) : [];
    const knownOptions = field.options ?? [];
    const staleValues = selected.filter((v) => !knownOptions.includes(v));
    const showOtherDisclaimer =
      field.otherDisclaimer === "integration_launch_impact" && selected.includes("Other");
    return (
      <div>
        {label}
        <div className="flex flex-wrap gap-2">
          {knownOptions.map((opt) => {
            const isSelected = selected.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  if (disabled) return;
                  onChange(
                    isSelected ? selected.filter((v) => v !== opt) : [...selected, opt],
                  );
                }}
                disabled={disabled}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all",
                  isSelected
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border/40 bg-card/30 text-muted-foreground hover:bg-muted/30",
                  disabled && "opacity-60 cursor-not-allowed",
                )}
              >
                {opt}
              </button>
            );
          })}
          {staleValues.map((stale) => (
            <button
              key={stale}
              type="button"
              onClick={() => {
                if (disabled) return;
                onChange(selected.filter((v) => v !== stale));
              }}
              disabled={disabled}
              className={cn(
                "rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all",
                "border-border/20 bg-muted/20 text-muted-foreground/40 line-through",
                disabled && "cursor-not-allowed",
              )}
              title="Previously selected - no longer available"
            >
              {stale}
            </button>
          ))}
        </div>
        {helper}
        {showOtherDisclaimer && (
          <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
            <p className="text-[11px] leading-relaxed text-amber-600 dark:text-amber-400">
              Using an unlisted provider may delay your integration launch. Please discuss
              with your Account Manager before proceeding.
            </p>
          </div>
        )}
      </div>
    );
  }

  /* ── boolean_tri — Yes / No / Not sure yet ── */
  if (field.type === "boolean_tri") {
    const OPTIONS: Array<{ label: string; val: string }> = [
      { label: "Yes", val: "yes" },
      { label: "No", val: "no" },
      { label: "Not sure yet", val: "maybe" },
    ];
    const current = typeof value === "string" ? value : "";
    return (
      <div>
        {label}
        <div className="flex items-center gap-2">
          {OPTIONS.map(({ label: optLabel, val }) => (
            <button
              key={val}
              type="button"
              onClick={() => { if (!disabled) onChange(current === val ? "" : val); }}
              disabled={disabled}
              className={cn(
                "rounded-full border px-4 py-1.5 text-[11px] font-medium transition-all",
                current === val
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/40 bg-card/30 text-muted-foreground hover:bg-muted/30",
                disabled && "opacity-60 cursor-not-allowed",
              )}
            >
              {optLabel}
            </button>
          ))}
        </div>
        {helper}
      </div>
    );
  }

  return null;
}
