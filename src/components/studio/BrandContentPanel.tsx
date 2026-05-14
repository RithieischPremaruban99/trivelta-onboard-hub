import React from "react";
import { useStudio } from "@/contexts/StudioContext";
import { Lock } from "lucide-react";

const CURRENCIES = [
  { symbol: "₦",   label: "₦  Nigerian Naira" },
  { symbol: "GH₵", label: "GH₵  Ghanaian Cedi" },
  { symbol: "KES", label: "KES  Kenyan Shilling" },
  { symbol: "MXN", label: "MXN  Mexican Peso" },
  { symbol: "BRL", label: "BRL  Brazilian Real" },
  { symbol: "EUR", label: "EUR  Euro" },
  { symbol: "USD", label: "USD  US Dollar" },
  { symbol: "ZAR", label: "ZAR  South African Rand" },
];

export function BrandContentPanel() {
  const { appLabels, setAppLabels, strings, setLanguage, language, locked } = useStudio();

  const currencyValue = appLabels.currencySymbol ?? "₦";
  const isCustom = !CURRENCIES.some((c) => c.symbol === currencyValue);

  const setWelcomeHeadline = (val: string) => {
    // Update via language strings override in appLabels
    setAppLabels((prev) => ({
      ...prev,
      // We store it in a custom key that BettingAppPreview reads via strings
      welcomeBonusHeadline: val,
    } as typeof prev));
  };

  const setWelcomeBody = (val: string) => {
    setAppLabels((prev) => ({
      ...prev,
      welcomeBonusBody: val,
    } as typeof prev));
  };

  return (
    <div className="py-2 px-4 space-y-4">

      {/* Currency */}
      <div className="space-y-1">
        <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">
          Currency
        </label>
        {locked ? (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
            <Lock className="h-3 w-3" />
            <span>{currencyValue}</span>
          </div>
        ) : (
          <>
            <select
              value={isCustom ? "__custom__" : currencyValue}
              onChange={(e) => {
                if (e.target.value !== "__custom__") {
                  setAppLabels((prev) => ({ ...prev, currencySymbol: e.target.value }));
                }
              }}
              className="w-full bg-muted/30 border border-border rounded px-2 py-1.5 text-[11px] text-foreground focus:outline-none focus:border-primary/40"
            >
              {CURRENCIES.map((c) => (
                <option key={c.symbol} value={c.symbol}>
                  {c.label}
                </option>
              ))}
              <option value="__custom__">Custom...</option>
            </select>
            {isCustom && (
              <input
                type="text"
                value={currencyValue}
                maxLength={6}
                placeholder="e.g. Fr, CHF, ден"
                onChange={(e) =>
                  setAppLabels((prev) => ({ ...prev, currencySymbol: e.target.value }))
                }
                className="w-full bg-muted/30 border border-border rounded px-2 py-1 text-[11px] text-foreground focus:outline-none focus:border-primary/40"
              />
            )}
          </>
        )}
      </div>

      {/* Welcome Banner Headline */}
      <div className="space-y-1">
        <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">
          Welcome Offer
        </label>
        <input
          type="text"
          disabled={locked}
          maxLength={60}
          placeholder="GET A 100% BONUS ON YOUR FIRST DEPOSIT"
          defaultValue={(appLabels as unknown as Record<string, string>).welcomeBonusHeadline ?? ""}
          onChange={(e) => setWelcomeHeadline(e.target.value)}
          className="w-full bg-muted/30 border border-border rounded px-2 py-1.5 text-[11px] text-foreground focus:outline-none focus:border-primary/40 disabled:opacity-50"
        />
        <p className="text-[9px] text-muted-foreground/50">Max 60 chars · shows on Sports banner</p>
      </div>

      {/* Welcome Banner Body */}
      <div className="space-y-1">
        <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">
          Offer Description
        </label>
        <textarea
          disabled={locked}
          maxLength={80}
          rows={2}
          placeholder="Enjoy 100% on your first deposit and double your starting stake."
          defaultValue={(appLabels as unknown as Record<string, string>).welcomeBonusBody ?? ""}
          onChange={(e) => setWelcomeBody(e.target.value)}
          className="w-full bg-muted/30 border border-border rounded px-2 py-1.5 text-[11px] text-foreground focus:outline-none focus:border-primary/40 disabled:opacity-50 resize-none"
        />
        <p className="text-[9px] text-muted-foreground/50">Max 80 chars</p>
      </div>

    </div>
  );
}
