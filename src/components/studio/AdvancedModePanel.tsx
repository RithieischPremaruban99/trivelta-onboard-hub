import { useState } from "react";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { useStudio } from "@/contexts/StudioContext";
import { ADVANCED_FIELD_GROUPS, FIELD_LABELS } from "@/lib/tcm-palette";
import { StudioColorField } from "./StudioColorField";
import { cn } from "@/lib/utils";

export function AdvancedModePanel() {
  const { locked } = useStudio();
  const [search, setSearch] = useState("");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (g: string) =>
    setOpenGroups((prev) => ({ ...prev, [g]: !prev[g] }));

  const query = search.toLowerCase().trim();
  const groupEntries = Object.entries(ADVANCED_FIELD_GROUPS);

  return (
    <div>
      {/* Search */}
      <div className="px-4 py-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search 344 fields…"
            className="w-full rounded-lg border border-border bg-background py-1.5 pl-8 pr-3 text-[11px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
      </div>

      {/* Groups */}
      {groupEntries.map(([groupName, fields]) => {
        const filteredFields = query
          ? fields.filter(
              (f) =>
                FIELD_LABELS[f].toLowerCase().includes(query) ||
                f.toLowerCase().includes(query),
            )
          : fields;

        if (query && filteredFields.length === 0) return null;

        const isOpen = query ? true : !!openGroups[groupName];

        return (
          <div key={groupName} className="border-b border-border last:border-0">
            <button
              type="button"
              onClick={() => !query && toggleGroup(groupName)}
              className={cn(
                "flex w-full items-center justify-between px-4 py-2 text-left hover:bg-secondary/30 transition-colors",
                query && "cursor-default",
              )}
            >
              <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">
                {groupName}
                {query && ` (${filteredFields.length})`}
              </span>
              {!query &&
                (isOpen ? (
                  <ChevronUp className="h-3 w-3 text-muted-foreground/50" />
                ) : (
                  <ChevronDown className="h-3 w-3 text-muted-foreground/50" />
                ))}
            </button>

            {isOpen && (
              <div className="px-4 pb-3 space-y-2">
                {filteredFields.map((fieldName) => (
                  <StudioColorField
                    key={fieldName}
                    fieldName={fieldName}
                    label={FIELD_LABELS[fieldName]}
                    readOnly={locked}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
