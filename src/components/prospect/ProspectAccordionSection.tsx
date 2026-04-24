import {
  Building2,
  CreditCard,
  ShieldCheck,
  Megaphone,
  Wrench,
  Sparkles,
  ChevronDown,
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
  values: Record<string, unknown>;
  onChange: (fieldKey: string, value: unknown) => void;
  isOpen: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function ProspectAccordionSection({
  section,
  values,
  onChange,
  isOpen,
  onToggle,
  disabled,
}: Props) {
  const Icon = ICON_MAP[section.icon] ?? Building2;

  // Count filled fields for the header badge
  const filledCount = section.fields.filter((f) => {
    const v = values[f.key];
    if (v === undefined || v === null) return false;
    if (typeof v === "string" && v.trim() === "") return false;
    if (Array.isArray(v) && v.length === 0) return false;
    return true;
  }).length;

  return (
    <div className="mb-3 overflow-hidden rounded-xl border border-border/40 bg-card/30">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex w-full items-center gap-3 px-5 py-3.5 transition-colors",
          isOpen ? "bg-gradient-to-r from-primary/5 to-transparent" : "hover:bg-muted/40",
        )}
      >
        <div
          className={cn(
            "grid h-7 w-7 shrink-0 place-items-center rounded-lg transition-colors",
            isOpen ? "bg-primary/10" : "bg-muted/30",
          )}
        >
          <Icon className={cn("h-4 w-4", isOpen ? "text-primary" : "text-muted-foreground")} />
        </div>

        <div className="flex-1 text-left">
          <div className="text-sm font-semibold tracking-tight text-foreground">
            {section.title}
          </div>
          <div className="mt-0.5 text-[11px] font-medium text-muted-foreground">
            {section.subtitle}
          </div>
        </div>

        <div className="text-[10px] font-bold uppercase tracking-wide text-foreground/60">
          {filledCount}/{section.fields.length}
        </div>

        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen && (
        <div className="space-y-4 border-t border-border/20 px-5 py-5">
          {section.fields.map((field) => (
            <ProspectField
              key={field.key}
              field={field}
              value={values[field.key]}
              onChange={(v) => onChange(field.key, v)}
              otherValue={values[`${field.key}_other`] as string | undefined}
              onOtherChange={(v) => onChange(`${field.key}_other`, v)}
              disabled={disabled}
            />
          ))}
        </div>
      )}
    </div>
  );
}
