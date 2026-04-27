import { useState } from "react";
import { X } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  PSP_CATEGORIES,
  CATEGORY_LABELS,
  getSuggestedPSPs,
  getCountryLabel,
} from "@/lib/payment-providers";

interface PaymentProviderSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  otherValue?: string;
  onOtherChange?: (value: string) => void;
  country?: string;
  hasError?: boolean;
}

const INPUT_BASE =
  "w-full rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none transition-colors";

export function PaymentProviderSelect({
  value,
  onChange,
  otherValue,
  onOtherChange,
  country,
  hasError,
}: PaymentProviderSelectProps) {
  const [search, setSearch] = useState("");
  const [otherChecked, setOtherChecked] = useState(
    value.includes("Other (please specify)"),
  );

  const suggested = country ? getSuggestedPSPs(country) : [];
  const countryLabel = country ? getCountryLabel(country) : "";

  const toggle = (provider: string) => {
    if (value.includes(provider)) {
      onChange(value.filter((v) => v !== provider));
    } else {
      onChange([...value, provider]);
    }
  };

  const toggleOther = (checked: boolean) => {
    setOtherChecked(checked);
    if (checked) {
      if (!value.includes("Other (please specify)")) {
        onChange([...value, "Other (please specify)"]);
      }
    } else {
      onChange(value.filter((v) => v !== "Other (please specify)"));
      onOtherChange?.("");
    }
  };

  const removeSelected = (provider: string) => {
    if (provider === "Other (please specify)") {
      toggleOther(false);
    } else {
      toggle(provider);
    }
  };

  // All named (non-Other) selected values
  const namedSelected = value.filter((v) => v !== "Other (please specify)");

  // Build filtered view when search is active
  const query = search.trim().toLowerCase();
  const isSearching = query.length > 0;

  const categoryKeys = Object.keys(PSP_CATEGORIES) as Array<keyof typeof PSP_CATEGORIES>;

  // Filtered groups for search mode
  const filteredGroups = isSearching
    ? categoryKeys
        .map((cat) => ({
          cat,
          label: CATEGORY_LABELS[cat],
          matches: PSP_CATEGORIES[cat].filter((p) =>
            p.toLowerCase().includes(query),
          ),
        }))
        .filter((g) => g.matches.length > 0)
    : [];

  // Default open values for accordion
  const defaultOpen = suggested.length > 0 ? ["suggested"] : [];

  return (
    <div className="space-y-3">
      {/* Search input */}
      <input
        type="text"
        className={cn(INPUT_BASE, hasError && "border-destructive")}
        placeholder="Search payment providers..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Selected pills */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((provider) => (
            <Badge
              key={provider}
              variant="secondary"
              className="flex items-center gap-1 pl-2.5 pr-1.5 py-1 text-[11px] font-medium"
            >
              {provider}
              <button
                type="button"
                onClick={() => removeSelected(provider)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
                aria-label={`Remove ${provider}`}
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Scrollable accordion body */}
      <div
        className={cn(
          "max-h-[400px] overflow-y-auto border rounded-md bg-background",
          hasError && "border-destructive",
        )}
      >
        {isSearching ? (
          /* ── Search results (flat, grouped by category) ── */
          <div className="p-1">
            {filteredGroups.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No providers found.
              </p>
            ) : (
              filteredGroups.map(({ cat, label, matches }) => (
                <div key={cat} className="mb-2">
                  <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                    {label}
                  </div>
                  {matches.map((provider) => (
                    <ProviderRow
                      key={provider}
                      provider={provider}
                      selected={value.includes(provider)}
                      onToggle={() => toggle(provider)}
                    />
                  ))}
                </div>
              ))
            )}
          </div>
        ) : (
          /* ── Default accordion view ── */
          <Accordion
            type="multiple"
            defaultValue={defaultOpen}
            className="divide-y divide-border/50"
          >
            {/* Suggested section (country-aware) */}
            {suggested.length > 0 && (
              <AccordionItem value="suggested" className="border-0">
                <AccordionTrigger className="px-3 py-2.5 text-sm font-semibold hover:no-underline hover:bg-accent/50 transition-colors">
                  <span className="flex items-center gap-1.5">
                    <span>✨</span>
                    <span>Suggested for {countryLabel}</span>
                    <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                      {suggested.length}
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-1 pt-0">
                  <div className="px-1">
                    {suggested.map((provider) => (
                      <ProviderRow
                        key={provider}
                        provider={provider}
                        selected={value.includes(provider)}
                        onToggle={() => toggle(provider)}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Standard category sections */}
            {categoryKeys.map((cat) => {
              const providers = PSP_CATEGORIES[cat] as readonly string[];
              const selectedCount = providers.filter((p) => value.includes(p)).length;
              return (
                <AccordionItem key={cat} value={cat} className="border-0">
                  <AccordionTrigger className="px-3 py-2.5 text-sm font-semibold hover:no-underline hover:bg-accent/50 transition-colors">
                    <span className="flex items-center gap-1.5">
                      <span>{CATEGORY_LABELS[cat]}</span>
                      {selectedCount > 0 && (
                        <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                          {selectedCount}
                        </span>
                      )}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-1 pt-0">
                    <div className="px-1">
                      {providers.map((provider) => (
                        <ProviderRow
                          key={provider}
                          provider={provider}
                          selected={value.includes(provider)}
                          onToggle={() => toggle(provider)}
                        />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}

        {/* Other section — always at the bottom */}
        <div className="border-t border-border/50 px-3 py-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-sm px-1 py-1.5 hover:bg-accent transition-colors">
            <Checkbox
              checked={otherChecked}
              onCheckedChange={(checked) => toggleOther(!!checked)}
              className="h-4 w-4"
            />
            <span className="text-sm text-foreground/80">Other (please specify)</span>
          </label>
          {otherChecked && (
            <div className="mt-2 px-1">
              <input
                type="text"
                className={INPUT_BASE}
                placeholder="Provider name..."
                value={otherValue ?? ""}
                onChange={(e) => onOtherChange?.(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Provider row ── */

function ProviderRow({
  provider,
  selected,
  onToggle,
}: {
  provider: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-sm px-3 py-1.5 transition-colors",
        selected ? "bg-accent text-accent-foreground" : "hover:bg-accent/60",
      )}
    >
      <Checkbox
        checked={selected}
        onCheckedChange={onToggle}
        className="h-4 w-4 shrink-0"
      />
      <span className="text-sm">{provider}</span>
    </label>
  );
}
