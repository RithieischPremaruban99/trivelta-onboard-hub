import { useState } from "react";
import { ChevronDown, ChevronLeft } from "lucide-react";
import type { TCMPalette } from "@/lib/tcm-palette";
import type { TCMStrings } from "@/lib/tcm-strings";
import {
  NBA_SCHEDULE,
  FOOTBALL_LEAGUES,
  NBA_GAME_DETAIL_MARKETS,
  FOOTBALL_GAME_DETAIL_MARKETS,
  FOOTBALL_DETAIL_TABS,
  NBA_DETAIL_TABS,
} from "./sports-data";
import type { NbaMatch, FootballMatch, BetMarket } from "./sports-data";

interface GameDetailProps {
  matchId: string;
  sport: "nba" | "football";
  onBack: () => void;
  palette: TCMPalette;
  strings: TCMStrings;
  pickContrastText: (rgba: string) => string;
  TeamDot: React.ComponentType<{ label: string; size?: number }>;
}

export function GameDetail({
  matchId,
  sport,
  onBack,
  palette,
  strings: _strings,
  pickContrastText,
  TeamDot,
}: GameDetailProps) {
  const isFootball = sport === "football";
  const tabs = isFootball ? FOOTBALL_DETAIL_TABS : NBA_DETAIL_TABS;
  const markets: BetMarket[] = isFootball
    ? FOOTBALL_GAME_DETAIL_MARKETS
    : NBA_GAME_DETAIL_MARKETS;

  const [activeTab, setActiveTab] = useState(0);

  // Lookup match data
  let match: (FootballMatch & { league?: string }) | NbaMatch | null = null;
  if (isFootball) {
    for (const league of FOOTBALL_LEAGUES) {
      const found = league.matches.find((m) => m.id === matchId);
      if (found) {
        match = { ...found, league: league.name };
        break;
      }
    }
  } else {
    match = NBA_SCHEDULE.find((m) => m.id === matchId) ?? null;
  }

  const heroHomeName = match?.home ?? "Home";
  const heroAwayName = match?.away ?? "Away";
  const heroDate = match?.date ?? (isFootball ? "TOMORROW 1:30 PM" : "TOMORROW 1:00 AM");
  const heroLeague = isFootball
    ? (match as (FootballMatch & { league?: string }) | null)?.league ?? "Premier League"
    : (match as NbaMatch | null)?.league ?? "NBA";

  // Track expanded sections — multi-expand allowed
  const initialExpanded = new Set(
    markets.filter((m) => m.defaultExpanded).map((m) => m.id),
  );
  const [expandedIds, setExpandedIds] = useState<Set<string>>(initialExpanded);

  const toggleSection = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <main
      className="flex-1 min-w-0 overflow-auto"
      style={{ background: "var(--p-primary-background-color)" }}
    >
      {/* Back button */}
      <div className="px-5 pt-3 pb-1">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-[11px] font-semibold transition-opacity hover:opacity-80"
          style={{ color: "var(--p-primary)" }}
        >
          <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
          Back
        </button>
      </div>

      {/* Hero */}
      <div
        className="px-6 pt-5 pb-6"
        style={{
          background:
            "linear-gradient(180deg, color-mix(in oklab, var(--p-primary) 10%, transparent) 0%, transparent 100%)",
          borderBottom: "1px solid var(--p-border-and-gradient-bg)",
        }}
      >
        {/* Top: date pill */}
        <div className="flex justify-center mb-3">
          <span
            className="text-[9px] font-bold uppercase tracking-[0.14em] px-2 py-[3px] rounded-full"
            style={{
              background: "color-mix(in oklab, var(--p-primary) 18%, transparent)",
              color: "var(--p-primary)",
              border: "1px solid color-mix(in oklab, var(--p-primary) 35%, transparent)",
            }}
          >
            {heroDate}
          </span>
        </div>
        <div className="grid grid-cols-3 items-center gap-3">
          {/* Home team */}
          <div className="flex flex-col items-center gap-2.5 text-center min-w-0">
            <div
              className="rounded-xl grid place-items-center"
              style={{
                width: 68,
                height: 68,
                background: "var(--p-dark-container-background)",
                boxShadow:
                  "0 4px 12px -4px color-mix(in oklab, var(--p-primary) 30%, transparent)",
              }}
            >
              <TeamDot label={heroHomeName} size={48} />
            </div>
            <span
              className="text-[12px] font-bold leading-tight truncate max-w-full"
              style={{ color: "var(--p-light-text-color)" }}
            >
              {heroHomeName}
            </span>
          </div>

          {/* Center: vs · league */}
          <div className="flex flex-col items-center gap-1.5 px-1">
            <span
              className="text-[18px] font-black leading-none"
              style={{ color: "var(--p-light-text-color)" }}
            >
              vs
            </span>
            <span
              className="text-[10px] font-semibold text-center leading-tight"
              style={{ color: "var(--p-text-secondary-color)" }}
            >
              {heroLeague}
            </span>
          </div>

          {/* Away team */}
          <div className="flex flex-col items-center gap-2.5 text-center min-w-0">
            <div
              className="rounded-xl grid place-items-center"
              style={{
                width: 68,
                height: 68,
                background: "var(--p-dark-container-background)",
                boxShadow:
                  "0 4px 12px -4px color-mix(in oklab, var(--p-primary) 30%, transparent)",
              }}
            >
              <TeamDot label={heroAwayName} size={48} />
            </div>
            <span
              className="text-[12px] font-bold leading-tight truncate max-w-full"
              style={{ color: "var(--p-light-text-color)" }}
            >
              {heroAwayName}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs — evenly distributed */}
      <div
        className="flex border-b overflow-x-auto"
        style={{ borderColor: "var(--p-border-and-gradient-bg)", scrollbarWidth: "none" }}
      >
        {tabs.map((t, i) => {
          const active = activeTab === i;
          return (
            <button
              key={t}
              onClick={() => setActiveTab(i)}
              className="flex-1 min-w-[78px] h-11 text-[12px] font-semibold relative whitespace-nowrap px-2 transition-colors"
              style={{
                color: active ? "var(--p-light-text-color)" : "var(--p-text-secondary-color)",
              }}
            >
              {t}
              {active && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-[2px]"
                  style={{ background: "var(--p-primary)" }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Markets accordion */}
      <div className="px-4 py-4 space-y-2">
        {markets.map((market) => {
          const isExpanded = expandedIds.has(market.id);
          return (
            <div
              key={market.id}
              className="rounded-lg overflow-hidden transition-colors group"
              style={{
                background: "var(--p-dark)",
                border: `1px solid ${isExpanded ? "color-mix(in oklab, var(--p-primary) 40%, transparent)" : "var(--p-border-and-gradient-bg)"}`,
              }}
            >
              {/* Accordion header */}
              <button
                onClick={() => toggleSection(market.id)}
                className="w-full flex items-center justify-between px-3.5 py-3 cursor-pointer transition-colors"
                style={{
                  background: isExpanded
                    ? "linear-gradient(180deg, color-mix(in oklab, var(--p-primary) 8%, transparent) 0%, transparent 100%)"
                    : "transparent",
                }}
              >
                <span
                  className="text-[12px] font-bold"
                  style={{ color: "var(--p-light-text-color)" }}
                >
                  {market.title}
                </span>
                <div className="flex items-center gap-2">
                  {market.hasSGP && (
                    <span
                      className="text-[8px] font-extrabold px-1.5 py-[3px] rounded leading-none tracking-wider"
                      style={{
                        background: "var(--p-primary)",
                        color: pickContrastText(palette.primary),
                      }}
                    >
                      SGP
                    </span>
                  )}
                  <ChevronDown
                    className="h-3.5 w-3.5 transition-transform"
                    strokeWidth={2.5}
                    style={{
                      color: "var(--p-text-secondary-color)",
                      transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  />
                </div>
              </button>

              {/* Accordion body */}
              {isExpanded && (
                <div
                  className="px-3.5 pb-3.5 pt-3"
                  style={{ borderTop: "1px solid var(--p-border-and-gradient-bg)" }}
                >
                  {/* match-line: home/away rows with 1/X/2 buttons */}
                  {market.content.type === "match-line" && match && "odds" in match && (
                    <div className="space-y-2.5">
                      <div className="space-y-0.5">
                        <div
                          className="text-[9px] font-bold uppercase tracking-wider"
                          style={{ color: "var(--p-primary)" }}
                        >
                          {heroLeague}
                        </div>
                        <div
                          className="text-[10px] font-semibold"
                          style={{ color: "var(--p-text-secondary-color)" }}
                        >
                          {heroDate}
                        </div>
                      </div>
                      {/* Column header row */}
                      <div
                        className="grid gap-1.5"
                        style={{ gridTemplateColumns: "1fr 56px 56px 56px" }}
                      >
                        <span />
                        {["1", "X", "2"].map((h) => (
                          <span
                            key={h}
                            className="text-center text-[10px] font-bold"
                            style={{ color: "var(--p-text-secondary-color)" }}
                          >
                            {h}
                          </span>
                        ))}
                      </div>
                      {/* Single match row: Home — Away with 3 odds */}
                      <div
                        className="grid gap-1.5 items-center"
                        style={{ gridTemplateColumns: "1fr 56px 56px 56px" }}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="flex -space-x-1.5 flex-shrink-0">
                            <TeamDot label={heroHomeName} size={20} />
                            <TeamDot label={heroAwayName} size={20} />
                          </div>
                          <span
                            className="text-[11px] font-bold truncate"
                            style={{ color: "var(--p-light-text-color)" }}
                          >
                            {heroHomeName.split(" ")[0]} – {heroAwayName.split(" ")[0]}
                          </span>
                        </div>
                        {(match as FootballMatch).odds.map((o, j) => (
                          <button
                            key={j}
                            className="h-9 rounded text-[11px] font-bold transition-transform active:scale-95"
                            style={{
                              background: "var(--p-active-secondary-gradient-color)",
                              border: "1px solid color-mix(in oklab, var(--p-primary) 60%, transparent)",
                              color: pickContrastText(palette.activeSecondaryGradientColor),
                            }}
                          >
                            {o}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* table: NBA-style Spread/ML/Total */}
                  {market.content.type === "table" && (
                    <div className="space-y-2">
                      {market.content.leagueLabel && (
                        <div
                          className="text-[9px] font-bold uppercase tracking-wider mb-1"
                          style={{ color: "var(--p-primary)" }}
                        >
                          {market.content.leagueLabel}
                        </div>
                      )}
                      <div
                        className="grid gap-1.5 pb-1"
                        style={{
                          gridTemplateColumns: `1fr repeat(${market.content.columns.length}, 1fr)`,
                        }}
                      >
                        <span />
                        {market.content.columns.map((c) => (
                          <span
                            key={c}
                            className="text-center text-[10px] font-bold"
                            style={{ color: "var(--p-text-secondary-color)" }}
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                      {market.content.rows.map((row, ri) => (
                        <div
                          key={ri}
                          className="grid gap-1.5 items-center"
                          style={{
                            gridTemplateColumns: `1fr repeat(${market.content.type === "table" ? market.content.columns.length : 0}, 1fr)`,
                          }}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <TeamDot label={row.team} size={18} />
                            <span
                              className="text-[11px] font-bold truncate"
                              style={{ color: "var(--p-light-text-color)" }}
                            >
                              {row.team}
                            </span>
                          </div>
                          {row.values.map((v, vi) => (
                            <button
                              key={vi}
                              className="h-9 rounded text-[11px] font-bold transition-transform active:scale-95"
                              style={{
                                background: "var(--p-active-secondary-gradient-color)",
                                border: "1px solid color-mix(in oklab, var(--p-primary) 60%, transparent)",
                                color: pickContrastText(palette.activeSecondaryGradientColor),
                              }}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* placeholder */}
                  {market.content.type === "placeholder" && (
                    <div
                      className="text-[10px] py-3 text-center"
                      style={{ color: "var(--p-text-secondary-color)" }}
                    >
                      Markets shown when expanded in production app
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
