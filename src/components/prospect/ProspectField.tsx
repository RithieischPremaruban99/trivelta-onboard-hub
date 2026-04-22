import { cn } from "@/lib/utils";
import type { ProspectField as ProspectFieldDef } from "@/lib/prospect-fields";

interface Props {
  field: ProspectFieldDef;
  value: unknown;
  onChange: (value: unknown) => void;
}

const INPUT_BASE =
  "w-full rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:border-primary/40 focus:outline-none transition-colors";

export function ProspectField({ field, value, onChange }: Props) {
  const label = (
    <label className="text-xs font-semibold text-foreground block mb-1.5">
      {field.label}
      {field.required && <span className="text-primary ml-1">*</span>}
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
        />
        {helper}
      </div>
    );
  }

  /* ── select ── */
  if (field.type === "select") {
    return (
      <div>
        {label}
        <select
          className={cn(INPUT_BASE, "cursor-pointer")}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">— Select —</option>
          {(field.options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        {helper}
      </div>
    );
  }

  /* ── multi_select — checkbox pills ── */
  if (field.type === "multi_select") {
    const selected: string[] = Array.isArray(value) ? (value as string[]) : [];
    return (
      <div>
        {label}
        <div className="flex flex-wrap gap-2">
          {(field.options ?? []).map((opt) => {
            const isSelected = selected.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange(
                    isSelected ? selected.filter((v) => v !== opt) : [...selected, opt],
                  );
                }}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all",
                  isSelected
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border/40 bg-card/30 text-muted-foreground hover:bg-muted/30",
                )}
              >
                {opt}
              </button>
            );
          })}
        </div>
        {helper}
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
              onClick={() => onChange(current === val ? "" : val)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-[11px] font-medium transition-all",
                current === val
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/40 bg-card/30 text-muted-foreground hover:bg-muted/30",
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
