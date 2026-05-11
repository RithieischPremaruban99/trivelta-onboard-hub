import { useState } from "react";
import { ChevronLeft, ChevronDown, ChevronUp } from "lucide-react";
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
  const [scoreboardTab, setScoreboardTab] = useState<"scoreboard" | "action">("action");

  let match: (FootballMatch & { league?: string }) | NbaMatch | null = null;
  if (isFootball) {
    for (const league of FOOTBALL_LEAGUES) {
      const found = league.matches.find((m) => m.id === matchId);
      if (found) { match = { ...found, league: league.name }; break; }
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

  const initialExpanded = new Set(markets.filter((m) => m.defaultExpanded).map((m) => m.id));
  const [expandedIds, setExpandedIds] = useState<Set<string>>(initialExpanded);
  const [selectedOddsIdx, setSelectedOddsIdx] = useState<number | null>(null);

  const toggleSection = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const footballOdds = isFootball && match && "odds" in match
    ? (match as FootballMatch).odds
    : ["1.83", "3.90", "4.40"];

  const primaryText = pickContrastText(palette.primary);

  return (
    <main className="flex-1 min-w-0 flex flex-col overflow-hidden" style={{ background: "var(--p-primary-background-color)" }}>

      {/* Header: < back + centered league title */}
      <div className="flex items-center px-4 h-12 flex-shrink-0 relative" style={{ borderBottom: "1px solid var(--p-border-and-gradient-bg)" }}>
        <button onClick={onBack} className="h-8 w-8 grid place-items-center rounded-full flex-shrink-0" style={{ color: "var(--p-light-text-color)" }}>
          <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
        </button>
        <div className="absolute inset-x-0 flex justify-center pointer-events-none">
          <span className="text-[15px] font-bold" style={{ color: "var(--p-light-text-color)" }}>{heroLeague}</span>
        </div>
      </div>

      {/* Scoreboard / Action Tracker toggle */}
      <div className="flex items-center justify-end px-4 py-2 flex-shrink-0" style={{ borderBottom: "1px solid var(--p-border-and-gradient-bg)" }}>
        <div className="flex rounded-full overflow-hidden" style={{ background: "var(--p-dark-container-background)" }}>
          {(["scoreboard", "action"] as const).map((t) => {
            const active = scoreboardTab === t;
            return (
              <button key={t} onClick={() => setScoreboardTab(t)} className="px-3.5 py-1.5 text-[10px] font-bold rounded-full transition-all" style={{ background: active ? "linear-gradient(135deg, var(--p-primary-button), var(--p-primary-button-gradient, var(--p-primary)))" : "transparent", color: active ? primaryText : "var(--p-text-secondary-color)" }}>
                {t === "scoreboard" ? "Scoreboard" : "Action Tracker"}
              </button>
            );
          })}
        </div>
      </div>

      {/* Match header row */}
      <div className="flex items-center px-4 py-3 flex-shrink-0" style={{ background: "var(--p-dark)", borderBottom: "1px solid var(--p-border-and-gradient-bg)" }}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <TeamDot label={heroHomeName} size={28} />
          <span className="text-[12px] font-bold leading-tight" style={{ color: "var(--p-light-text-color)" }}>{heroHomeName}</span>
        </div>
        <div className="flex flex-col items-center flex-shrink-0 px-3">
          <span className="text-[11px] font-bold whitespace-nowrap" style={{ color: "var(--p-primary)" }}>{heroDate}</span>
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <span className="text-[12px] font-bold leading-tight text-right" style={{ color: "var(--p-light-text-color)" }}>{heroAwayName}</span>
          <TeamDot label={heroAwayName} size={28} />
        </div>
      </div>

      {/* Market tabs — first tab orange filled pill */}
      <div className="flex overflow-x-auto flex-shrink-0 px-3 py-2 gap-2" style={{ borderBottom: "1px solid var(--p-border-and-gradient-bg)", scrollbarWidth: "none" }}>
        {tabs.map((t, i) => {
          const active = activeTab === i;
          return (
            <button key={t} onClick={() => setActiveTab(i)} className="flex-shrink-0 px-4 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all" style={{ background: active ? "linear-gradient(135deg, var(--p-primary-button), var(--p-primary-button-gradient, var(--p-primary)))" : "transparent", color: active ? primaryText : "var(--p-text-secondary-color)", border: active ? "none" : "1px solid transparent" }}>
              {t}
            </button>
          );
        })}
      </div>

      {/* Markets accordion */}
      <div className="flex-1 overflow-auto px-4 py-3 space-y-2">
        {markets.map((market) => {
          const isExpanded = expandedIds.has(market.id);
          return (
            <div key={market.id} className="rounded-xl overflow-hidden" style={{ background: "var(--p-dark)", border: "1px solid var(--p-border-and-gradient-bg)" }}>
              <button onClick={() => toggleSection(market.id)} className="w-full flex items-center justify-between px-4 py-3.5">
                <span className="text-[13px] font-bold" style={{ color: "var(--p-light-text-color)" }}>{market.title}</span>
                <div className="flex items-center gap-2">
                  {market.hasSGP && (
                    <span className="text-[8px] font-extrabold px-1.5 py-[3px] rounded leading-none tracking-wider" style={{ background: "var(--p-primary)", color: primaryText }}>SGP</span>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" style={{ color: "var(--p-text-secondary-color)" }} strokeWidth={2} />
                  ) : (
                    <ChevronDown className="h-4 w-4" style={{ color: "var(--p-text-secondary-color)" }} strokeWidth={2} />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4" style={{ borderTop: "1px solid var(--p-border-and-gradient-bg)" }}>

                  {/* match-line: BetCorrect exact layout — per-team rows */}
                  {market.content.type === "match-line" && (
                    <div className="pt-3">
                      <div className="grid mb-2.5" style={{ gridTemplateColumns: "1fr 60px 60px 60px" }}>
                        <span />
                        {["1", "X", "2"].map((h) => (
                          <span key={h} className="text-center text-[11px] font-bold" style={{ color: "var(--p-text-secondary-color)" }}>{h}</span>
                        ))}
                      </div>

                      {/* Home team row */}
                      <div className="grid items-center gap-2 mb-2" style={{ gridTemplateColumns: "1fr 60px 60px 60px" }}>
                        <div className="flex items-center gap-2 min-w-0">
                          <TeamDot label={heroHomeName} size={22} />
                          <span className="text-[11px] font-semibold truncate" style={{ color: "var(--p-light-text-color)" }}>{heroHomeName}</span>
                        </div>
                        {footballOdds.map((o, j) => {
                          const sel = selectedOddsIdx === j;
                          return (
                            <button key={j} onClick={() => setSelectedOddsIdx(sel ? null : j)} className="h-11 rounded-lg text-[12px] font-bold transition-all" style={{ background: sel ? "linear-gradient(135deg, var(--p-primary-button), var(--p-primary-button-gradient, var(--p-primary)))" : "var(--p-dark-container-background)", border: sel ? "none" : "1px solid var(--p-border-and-gradient-bg)", color: sel ? primaryText : "var(--p-primary)" }}>
                              {o}
                            </button>
                          );
                        })}
                      </div>

                      {/* Away team row */}
                      <div className="grid items-center gap-2" style={{ gridTemplateColumns: "1fr 60px 60px 60px" }}>
                        <div className="flex items-center gap-2 min-w-0">
                          <TeamDot label={heroAwayName} size={22} />
                          <span className="text-[11px] font-semibold truncate" style={{ color: "var(--p-light-text-color)" }}>{heroAwayName}</span>
                        </div>
                        <span /><span /><span />
                      </div>
                    </div>
                  )}

                  {/* table: NBA-style */}
                  {market.content.type === "table" && (
                    <div className="pt-3 space-y-2">
                      {market.content.leagueLabel && (
                        <div className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--p-primary)" }}>{market.content.leagueLabel}</div>
                      )}
                      <div className="grid gap-1.5 pb-1" style={{ gridTemplateColumns: `1fr repeat(${market.content.columns.length}, 1fr)` }}>
                        <span />
                        {market.content.columns.map((c) => (
                          <span key={c} className="text-center text-[10px] font-bold" style={{ color: "var(--p-text-secondary-color)" }}>{c}</span>
                        ))}
                      </div>
                      {market.content.rows.map((row, ri) => (
                        <div key={ri} className="grid gap-1.5 items-center" style={{ gridTemplateColumns: `1fr repeat(${market.content.type === "table" ? market.content.columns.length : 0}, 1fr)` }}>
                          <div className="flex items-center gap-2 min-w-0">
                            <TeamDot label={row.team} size={18} />
                            <span className="text-[11px] font-bold truncate" style={{ color: "var(--p-light-text-color)" }}>{row.team}</span>
                          </div>
                          {row.values.map((v, vi) => (
                            <button key={vi} className="h-9 rounded-lg text-[11px] font-bold" style={{ background: "var(--p-dark-container-background)", border: "1px solid var(--p-border-and-gradient-bg)", color: "var(--p-primary)" }}>{v}</button>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}

                  {market.content.type === "placeholder" && (
                    <div className="text-[10px] py-3 text-center" style={{ color: "var(--p-text-secondary-color)" }}>
                      Markets shown when expanded in production app
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bet Slip bar — appears when any odds selected */}
      {selectedOddsIdx !== null && (
        <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3" style={{ background: "var(--p-dark-container-background)", borderTop: "1px solid var(--p-border-and-gradient-bg)" }}>
          <div className="h-8 w-8 rounded-full grid place-items-center text-[12px] font-black flex-shrink-0" style={{ background: "var(--p-primary)", color: primaryText }}>1</div>
          <span className="text-[13px] font-bold flex-1" style={{ color: "var(--p-light-text-color)" }}>Bet slip</span>
          <div className="text-right">
            <div className="text-[10px]" style={{ color: "var(--p-text-secondary-color)" }}>
              1 Leg{" "}
              <span className="font-bold" style={{ color: "var(--p-primary)" }}>{footballOdds[selectedOddsIdx]}</span>
            </div>
            <div className="text-[9px]" style={{ color: "var(--p-text-secondary-color)" }}>
              ₦ 10.00 pays{" "}
              <span className="font-bold" style={{ color: "var(--p-light-text-color)" }}>₦ {(10 * parseFloat(footballOdds[selectedOddsIdx])).toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
