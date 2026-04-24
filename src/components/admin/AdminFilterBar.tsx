import { useEffect, useRef, useState } from "react";
import { Search, ArrowUpDown, X, FilterX } from "lucide-react";
import { Users, Activity, Sparkles, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DropdownFilter, type FilterOption } from "./DropdownFilter";

/* ── Static option sets ──────────────────────────────────────────────────── */

const CLIENT_STATUS_OPTIONS: FilterOption[] = [
  { value: "onboarding", label: "Onboarding" },
  { value: "active", label: "Active" },
  { value: "churned", label: "Churned" },
];

const PROSPECT_STATUS_OPTIONS: FilterOption[] = [
  { value: "in_discussion", label: "In discussion" },
  { value: "term_sheet", label: "Term sheet" },
  { value: "contract_sent", label: "Contract sent" },
  { value: "under_legal_review", label: "Legal review" },
  { value: "ready_to_sign", label: "Ready to sign" },
  { value: "signed", label: "Signed ✓" },
];

const STUDIO_OPTIONS: FilterOption[] = [
  { value: "any", label: "Has any Studio access" },
  { value: "none", label: "No Studio access" },
  { value: "landing_page_generator", label: "Landing Pages" },
  { value: "ai_chat", label: "AI Chat" },
  { value: "color_editor", label: "Color Editor" },
  { value: "animation_tools", label: "Animations" },
];

const SORT_OPTIONS = [
  { value: "created_desc", label: "Newest first" },
  { value: "created_asc", label: "Oldest first" },
  { value: "name_asc", label: "Name A–Z" },
  { value: "name_desc", label: "Name Z–A" },
];

/* ── FilterPill ──────────────────────────────────────────────────────────── */

function FilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/8 px-2.5 py-0.5 text-[11px] font-medium text-primary">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 rounded-full transition-opacity hover:opacity-60"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

/* ── Props ───────────────────────────────────────────────────────────────── */

export interface AdminFilters {
  q: string;
  am: string[];
  status: string[];
  studio: string[];
  pStatus: string[];
  sort: string;
}

export const DEFAULT_ADMIN_FILTERS: AdminFilters = {
  q: "",
  am: [],
  status: [],
  studio: [],
  pStatus: [],
  sort: "created_desc",
};

interface AdminFilterBarProps {
  filters: AdminFilters;
  onFiltersChange: (f: AdminFilters) => void;
  amOptions: FilterOption[];
  clientCount: number;
  totalClients: number;
  prospectCount: number;
  totalProspects: number;
}

/* ── AdminFilterBar ──────────────────────────────────────────────────────── */

export function AdminFilterBar({
  filters,
  onFiltersChange,
  amOptions,
  clientCount,
  totalClients,
  prospectCount,
  totalProspects,
}: AdminFilterBarProps) {
  // Local controlled value for search (debounced sync to URL state)
  const [localQ, setLocalQ] = useState(filters.q);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync external q changes back to local (browser back/forward)
  useEffect(() => {
    setLocalQ(filters.q);
  }, [filters.q]);

  function handleQChange(val: string) {
    setLocalQ(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onFiltersChange({ ...filters, q: val });
    }, 220);
  }

  function set<K extends keyof AdminFilters>(key: K, val: AdminFilters[K]) {
    onFiltersChange({ ...filters, [key]: val });
  }

  function removeFilter<K extends "am" | "status" | "studio" | "pStatus">(
    key: K,
    value: string,
  ) {
    set(key, (filters[key] as string[]).filter((v) => v !== value));
  }

  function clearAll() {
    setLocalQ("");
    onFiltersChange({ q: "", am: [], status: [], studio: [], pStatus: [], sort: filters.sort });
  }

  const hasActiveFilters =
    filters.q ||
    filters.am.length > 0 ||
    filters.status.length > 0 ||
    filters.studio.length > 0 ||
    filters.pStatus.length > 0;

  const amLabelById = (val: string) =>
    amOptions.find((o) => o.value === val)?.label ?? val;

  const statusLabel = (val: string) =>
    CLIENT_STATUS_OPTIONS.find((o) => o.value === val)?.label ?? val;

  const prospectStatusLabel = (val: string) =>
    PROSPECT_STATUS_OPTIONS.find((o) => o.value === val)?.label ?? val;

  const studioLabel = (val: string) =>
    STUDIO_OPTIONS.find((o) => o.value === val)?.label ?? val;

  return (
    <div className="space-y-2">
      {/* ── Filter row ── */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/40 bg-card/40 p-3 backdrop-blur-sm">
        {/* Search */}
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, domain…"
            value={localQ}
            onChange={(e) => handleQChange(e.target.value)}
            className="h-9 bg-background/50 pl-9 text-xs"
          />
        </div>

        {/* AM filter */}
        {amOptions.length > 0 && (
          <DropdownFilter
            label="Account Manager"
            icon={<Users className="h-3.5 w-3.5" />}
            options={amOptions}
            selected={filters.am}
            onChange={(v) => set("am", v)}
          />
        )}

        {/* Client status */}
        <DropdownFilter
          label="Client Status"
          icon={<Activity className="h-3.5 w-3.5" />}
          options={CLIENT_STATUS_OPTIONS}
          selected={filters.status}
          onChange={(v) => set("status", v)}
        />

        {/* Prospect status */}
        <DropdownFilter
          label="Prospect Status"
          icon={<FileText className="h-3.5 w-3.5" />}
          options={PROSPECT_STATUS_OPTIONS}
          selected={filters.pStatus}
          onChange={(v) => set("pStatus", v)}
        />

        {/* Studio */}
        <DropdownFilter
          label="Studio Access"
          icon={<Sparkles className="h-3.5 w-3.5" />}
          options={STUDIO_OPTIONS}
          selected={filters.studio}
          onChange={(v) => set("studio", v)}
        />

        <div className="flex-1" />

        {/* Sort */}
        <Select value={filters.sort} onValueChange={(v) => set("sort", v)}>
          <SelectTrigger className="h-9 w-[160px] text-xs">
            <ArrowUpDown className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value} className="text-xs">
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear all */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" className="h-9 px-2.5 text-xs" onClick={clearAll}>
            <X className="mr-1 h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>

      {/* ── Active filter pills ── */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 px-1 py-0.5">
          <span className="text-[11px] text-muted-foreground">
            {clientCount} of {totalClients}{" "}
            {totalClients === 1 ? "client" : "clients"}
            {" · "}
            {prospectCount} of {totalProspects}{" "}
            {totalProspects === 1 ? "prospect" : "prospects"}
          </span>

          {filters.q && (
            <FilterPill
              label={`"${filters.q}"`}
              onRemove={() => {
                setLocalQ("");
                set("q", "");
              }}
            />
          )}
          {filters.am.map((v) => (
            <FilterPill
              key={v}
              label={`AM: ${amLabelById(v)}`}
              onRemove={() => removeFilter("am", v)}
            />
          ))}
          {filters.status.map((v) => (
            <FilterPill
              key={v}
              label={statusLabel(v)}
              onRemove={() => removeFilter("status", v)}
            />
          ))}
          {filters.pStatus.map((v) => (
            <FilterPill
              key={v}
              label={`Prospect: ${prospectStatusLabel(v)}`}
              onRemove={() => removeFilter("pStatus", v)}
            />
          ))}
          {filters.studio.map((v) => (
            <FilterPill
              key={v}
              label={`Studio: ${studioLabel(v)}`}
              onRemove={() => removeFilter("studio", v)}
            />
          ))}
        </div>
      )}

      {/* ── Empty state ── */}
      {hasActiveFilters && clientCount === 0 && prospectCount === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border/40 py-14 text-center">
          <FilterX className="mb-4 h-9 w-9 text-muted-foreground/40" />
          <h3 className="text-sm font-semibold text-foreground">No results</h3>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground">
            No clients or prospects match your current filters.
          </p>
          <Button variant="outline" size="sm" onClick={clearAll} className="mt-4">
            Clear all filters
          </Button>
        </div>
      )}
    </div>
  );
}
