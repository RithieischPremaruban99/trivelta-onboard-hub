import { useState } from "react";
import { ChevronDown, ChevronUp, Globe, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { TOP_COUNTRIES, ALL_COUNTRIES, type CountryEntry } from "./wizard-types";

interface Props {
  selectedIso: string | undefined;
  isMultiMarket: boolean;
  onSelect: (iso: string | undefined, isMulti: boolean) => void;
  onNext: () => void;
}

export function Step1CountryPicker({ selectedIso, isMultiMarket, onSelect, onNext }: Props) {
  const [otherOpen, setOtherOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredOther = ALL_COUNTRIES.filter(
    (c) =>
      !TOP_COUNTRIES.some((t) => t.iso === c.iso) &&
      c.name.toLowerCase().includes(search.toLowerCase())
  );

  const hasSelection = !!selectedIso || isMultiMarket;
  const isOtherSelected = !!selectedIso && !TOP_COUNTRIES.some((t) => t.iso === selectedIso);

  function handleCardClick(iso: string) {
    onSelect(iso, false);
  }

  function handleMultiMarket() {
    onSelect(undefined, true);
  }

  function handleOtherSelect(c: CountryEntry) {
    onSelect(c.iso, false);
    setOtherOpen(false);
    setSearch("");
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground mb-1">
          Where will you launch?
        </h2>
        <p className="text-sm text-muted-foreground">
          Select your primary target market. This shapes the palette, market positioning, and brand context.
        </p>
      </div>

      {/* Top 10 grid */}
      <div className="grid grid-cols-5 gap-3">
        {TOP_COUNTRIES.map((c) => {
          const selected = selectedIso === c.iso;
          return (
            <button
              key={c.iso}
              onClick={() => handleCardClick(c.iso)}
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-xl border p-5 transition-all duration-200 cursor-pointer",
                "bg-card border-border hover:border-primary/40 hover:bg-muted",
                selected && "ring-2 ring-primary border-primary bg-primary/5"
              )}
            >
              <span className="text-3xl leading-none">{c.flag}</span>
              <span className="text-xs font-medium text-foreground text-center leading-tight">
                {c.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Other country expandable */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <button
          onClick={() => setOtherOpen((o) => !o)}
          className="w-full flex items-center justify-between px-5 py-3 text-sm text-foreground hover:bg-muted transition-colors"
        >
          <span className="font-medium">
            Other Country
            {isOtherSelected && (
              <span className="ml-2 text-primary">
                — {ALL_COUNTRIES.find((c) => c.iso === selectedIso)?.name}
              </span>
            )}
          </span>
          {otherOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {otherOpen && (
          <div className="border-t border-border p-5 flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country…"
                className="pl-9 bg-background border-border text-foreground placeholder:text-muted-foreground/60"
                autoFocus
              />
            </div>
            <div className="max-h-52 overflow-y-auto flex flex-col gap-1">
              {filteredOther.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">No countries found</p>
              ) : (
                filteredOther.map((c) => {
                  const selected = selectedIso === c.iso;
                  return (
                    <button
                      key={c.iso}
                      onClick={() => handleOtherSelect(c)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground transition-colors text-left",
                        "hover:bg-muted",
                        selected && "bg-primary/10 text-primary"
                      )}
                    >
                      <span className="text-lg leading-none">{c.flag}</span>
                      <span>{c.name}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Multi-market button */}
      <button
        onClick={handleMultiMarket}
        className={cn(
          "flex items-center gap-3 rounded-xl border px-5 py-4 text-sm transition-all duration-200",
          "bg-card border-border hover:border-primary/40 hover:bg-muted text-foreground",
          isMultiMarket && "ring-2 ring-primary bg-primary/10 border-primary"
        )}
      >
        <Globe className="h-5 w-5 shrink-0" />
        <div className="text-left">
          <div className="font-medium">Multi-Market / Global</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            No single market — generate a globally-neutral brand palette
          </div>
        </div>
      </button>

      {/* Footer */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={onNext}
          disabled={!hasSelection}
          className="btn-premium h-11 px-6 min-w-[120px] disabled:opacity-40"
        >
          Next →
        </Button>
      </div>
    </div>
  );
}
