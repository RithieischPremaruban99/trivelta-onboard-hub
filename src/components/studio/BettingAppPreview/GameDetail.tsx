import { useState } from "react";
import { ChevronDown, ChevronUp, ChevronLeft } from "lucide-react";
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
  const heroDate = match?.date ?? (isFootball ? "TODAY" : "TOMORROW 1:00 AM");
  const heroLeague = isFootball
    ? (match as (FootballMatch & { league?: string }) | null)?.league ?? "Football"
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
      <div className="px-4 pt-3 pb-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-[10px] font-semibold"
          style={{ color: "var(--p-primary)" }}
        >
          <ChevronLeft className="h-3 w-3" />
          Back
        </button>
      </div>

      {/* Hero */}
      <div
        className="px-6 py-5"
        style={{
          background:
            "linear-gradient(180deg, color-mix(in oklab, var(--p-primary) 8%, transparent) 0%, transparent 100%)",
          borderBottom: "1px solid var(--p-border-and-gradient-bg)",
        }}
      >
        <div className="grid grid-cols-3 items-center gap-4">
          {/* Home team */}
          <div className="flex flex-col items-center gap-2 text-center">
            <TeamDot label={heroHomeName} size={56} />
            <span
              className="text-[12px] font-bold leading-tight"
              style={{ color: "var(--p-light-text-color)" }}
            >
              {heroHomeName}
            </span>
          </div>

          {/* Center: date · vs · league */}
          <div className="flex flex-col items-center gap-1.5">
            <span
              className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: "var(--p-primary)" }}
            >
              {heroDate}
            </span>
            <span
              className="text-[11px] font-bold"
              style={{ color: "var(--p-text-secondary-color)" }}
            >
              vs
            </span>
            <span
              className="text-[10px] font-semibold"
              style={{ color: "var(--p-text-secondary-color)" }}
            >
              {heroLeague}
            </span>
          </div>

          {/* Away team */}
          <div className="flex flex-col items-center gap-2 text-center">
            <TeamDot label={heroAwayName} size={56} />
            <span
              className="text-[12px] font-bold leading-tight"
              style={{ color: "var(--p-light-text-color)" }}
            >
              {heroAwayName}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex border-b overflow-x-auto px-4"
        style={{ borderColor: "var(--p-border-and-gradient-bg)", scrollbarWidth: "none" }}
      >
        {tabs.map((t, i) => {
          const active = activeTab === i;
          return (
            <button
              key={t}
              onClick={() => setActiveTab(i)}
              className="px-4 h-9 text-[11px] font-semibold relative flex-shrink-0"
              style={{
                color: active ? "var(--p-light-text-color)" : "var(--p-text-secondary-color)",
              }}
            >
              {t}
              {active && (
                <span
                  className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full"
                  style={{ background: "var(--p-primary)" }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Markets accordion */}
      <div className="px-4 py-3 space-y-2">
        {markets.map((market) => {
          const isExpanded = expandedIds.has(market.id);
          return (
            <div
              key={market.id}
              className="rounded-md overflow-hidden"
              style={{
                background: "var(--p-dark)",
                border: "1px solid var(--p-border-and-gradient-bg)",
              }}
            >
              {/* Accordion header */}
              <button
                onClick={() => toggleSection(market.id)}
                className="w-full flex items-center justify-between px-3 py-2.5"
              >
                <span
                  className="text-[11px] font-bold"
                  style={{ color: "var(--p-light-text-color)" }}
                >
                  {market.title}
                </span>
                <div className="flex items-center gap-2">
                  {market.hasSGP && (
                    <span
                      className="text-[8px] font-bold px-1.5 py-[2px] rounded"
                      style={{
                        background: "var(--p-primary)",
                        color: pickContrastText(palette.primary),
                      }}
                    >
                      SGP
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="h-3 w-3" style={{ color: "var(--p-text-secondary-color)" }} />
                  ) : (
                    <ChevronDown className="h-3 w-3" style={{ color: "var(--p-text-secondary-color)" }} />
                  )}
                </div>
              </button>

              {/* Accordion body */}
              {isExpanded && (
                <div
                  className="px-3 pb-3 pt-2"
                  style={{ borderTop: "1px solid var(--p-border-and-gradient-bg)" }}
                >
                  {/* match-line: home/away rows with 1/X/2 buttons */}
                  {market.content.type === "match-line" && match && "odds" in match && (
                    <div className="space-y-2">
                      <div
                        className="text-[9px] font-semibold uppercase tracking-wider mb-1"
                        style={{ color: "var(--p-primary)" }}
                      >
                        {heroLeague} · {heroDate}
                      </div>
                      {/* Column header row */}
                      <div
                        className="grid gap-1.5"
                        style={{ gridTemplateColumns: "1fr 60px 60px 60px" }}
                      >
                        <span />
                        {["1", "X", "2"].map((h) => (
                          <span
                            key={h}
                            className="text-center text-[9px] font-semibold"
                            style={{ color: "var(--p-text-secondary-color)" }}
                          >
                            {h}
                          </span>
                        ))}
                      </div>
                      {/* Home row */}
                      <div
                        className="grid gap-1.5 items-center"
                        style={{ gridTemplateColumns: "1fr 60px 60px 60px" }}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <TeamDot label={heroHomeName} size={16} />
                          <span
                            className="text-[10px] font-medium truncate"
                            style={{ color: "var(--p-light-text-color)" }}
                          >
                            {heroHomeName}
                          </span>
                        </div>
                        {(match as FootballMatch).odds.map((o, j) => (
                          <button
                            key={j}
                            className="h-9 rounded text-[10px] font-bold"
                            style={{
                              background: "var(--p-active-secondary-gradient-color)",
                              border: "1px solid var(--p-primary)",
                              color: pickContrastText(palette.activeSecondaryGradientColor),
                            }}
                          >
                            {o}
                          </button>
                        ))}
                      </div>
                      {/* Away row (team label only, same odds buttons) */}
                      <div
                        className="grid gap-1.5 items-center"
                        style={{ gridTemplateColumns: "1fr 60px 60px 60px" }}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <TeamDot label={heroAwayName} size={16} />
                          <span
                            className="text-[10px] font-medium truncate"
                            style={{ color: "var(--p-light-text-color)" }}
                          >
                            {heroAwayName}
                          </span>
                        </div>
                        {/* empty cells to preserve grid alignment */}
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                  )}

                  {/* table: NBA-style Spread/ML/Total */}
                  {market.content.type === "table" && (
                    <div className="space-y-1.5">
                      {market.content.leagueLabel && (
                        <div
                          className="text-[9px] font-semibold uppercase tracking-wider mb-1"
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
                            className="text-center text-[9px] font-semibold"
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
                          <div className="flex items-center gap-1.5 min-w-0">
                            <TeamDot label={row.team} size={16} />
                            <span
                              className="text-[10px] font-medium truncate"
                              style={{ color: "var(--p-light-text-color)" }}
                            >
                              {row.team}
                            </span>
                          </div>
                          {row.values.map((v, vi) => (
                            <button
                              key={vi}
                              className="h-9 rounded text-[10px] font-bold"
                              style={{
                                background: "var(--p-active-secondary-gradient-color)",
                                border: "1px solid var(--p-primary)",
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
                      className="text-[9px] py-3 text-center"
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
