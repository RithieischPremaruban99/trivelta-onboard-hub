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

  // hasSelection derived purely from props — survives remounts
  const hasSelection = !!selectedIso || isMultiMarket;

  // Auto-show selected country name in Other header if it's a non-top-10 pick
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
        <h2 className="text-xl font-semibold text-zinc-100 mb-1">
          Where will you launch?
        </h2>
        <p className="text-sm text-zinc-400">
          Select your primary target market. This shapes the palette, market positioning, and brand context.
        </p>
      </div>

      {/* Top 10 grid — 5 columns × 2 rows */}
      <div className="grid grid-cols-5 gap-3">
        {TOP_COUNTRIES.map((c) => {
          const selected = selectedIso === c.iso;
          return (
            <button
              key={c.iso}
              onClick={() => handleCardClick(c.iso)}
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-xl border p-4 transition-all cursor-pointer",
                "bg-zinc-900 border-zinc-700 hover:border-blue-500/50 hover:bg-zinc-800",
                selected && "ring-2 ring-blue-500 bg-blue-500/10 border-blue-500"
              )}
            >
              <span className="text-3xl leading-none">{c.flag}</span>
              <span className="text-xs font-medium text-zinc-200 text-center leading-tight">
                {c.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Other country expandable */}
      <div className="rounded-xl border border-zinc-700 bg-zinc-900 overflow-hidden">
        <button
          onClick={() => setOtherOpen((o) => !o)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
        >
          <span className="font-medium">
            Other Country
            {isOtherSelected && (
              <span className="ml-2 text-blue-400">
                — {ALL_COUNTRIES.find((c) => c.iso === selectedIso)?.name}
              </span>
            )}
          </span>
          {otherOpen ? (
            <ChevronUp className="h-4 w-4 text-zinc-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-zinc-500" />
          )}
        </button>

        {otherOpen && (
          <div className="border-t border-zinc-700 p-4 flex flex-col gap-3 bg-zinc-900/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country…"
                className="pl-9 bg-zinc-800 border-zinc-600 text-zinc-100 placeholder:text-zinc-500"
                autoFocus
              />
            </div>
            <div className="max-h-52 overflow-y-auto flex flex-col gap-1">
              {filteredOther.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-3">No countries found</p>
              ) : (
                filteredOther.map((c) => {
                  const selected = selectedIso === c.iso;
                  return (
                    <button
                      key={c.iso}
                      onClick={() => handleOtherSelect(c)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-200 transition-colors text-left",
                        "hover:bg-zinc-700",
                        selected && "bg-blue-500/10 text-blue-300"
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
          "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-all",
          "bg-zinc-900 border-zinc-700 hover:border-blue-500/50 hover:bg-zinc-800 text-zinc-300",
          isMultiMarket && "ring-2 ring-blue-500 bg-blue-500/10 border-blue-500 text-blue-300"
        )}
      >
        <Globe className="h-5 w-5 shrink-0" />
        <div className="text-left">
          <div className="font-medium">Multi-Market / Global</div>
          <div className="text-xs text-zinc-500 mt-0.5">
            No single market — generate a globally-neutral brand palette
          </div>
        </div>
      </button>

      {/* Footer */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={onNext}
          disabled={!hasSelection}
          className="min-w-[120px] bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40"
        >
          Next →
        </Button>
      </div>
    </div>
  );
}
