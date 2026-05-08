import React, { useState } from "react";
import { ChevronLeft, ChevronDown, ChevronUp } from "lucide-react";
import type { TCMPalette } from "@/lib/tcm-palette";
import type { TCMStrings } from "@/lib/tcm-strings";
import {
  NBA_SCHEDULE,
  FOOTBALL_LEAGUES,
  NBA_GAME_DETAIL_MARKETS,
  GAME_DETAIL_TABS,
} from "./sports-data";
import type { BetMarket } from "./sports-data";

type Props = {
  matchId: string;
  sport: "nba" | "football";
  onBack: () => void;
  palette: TCMPalette;
  strings: TCMStrings;
  pickContrastText: (rgba: string) => string;
  TeamDot: React.ComponentType<{ label: string; size?: number }>;
};

export function GameDetail({
  matchId,
  sport,
  onBack,
  palette,
  strings,
  pickContrastText,
  TeamDot,
}: Props) {
  const [activeDetailTab, setActiveDetailTab] = useState(0);
  const [expandedMarket, setExpandedMarket] = useState<string>("game-line");

  const match = (() => {
    if (sport === "nba") {
      return NBA_SCHEDULE.find((m) => m.id === matchId) ?? NBA_SCHEDULE[0];
    }
    for (const league of FOOTBALL_LEAGUES) {
      const found = league.matches.find((m) => m.id === matchId);
      if (found) return { ...found, league: league.name };
    }
    return null;
  })();

  const home = match ? ("home" in match ? match.home : "") : "Home";
  const away = match ? ("away" in match ? match.away : "") : "Away";
  const dateLabel =
    match && "date" in match
      ? match.date
      : sport === "nba"
        ? "TOMORROW 1:00 AM"
        : "TODAY";
  const leagueLabel =
    match && "league" in match
      ? match.league
      : sport === "nba"
        ? "NBA - USA"
        : "Football";

  const markets: BetMarket[] = NBA_GAME_DETAIL_MARKETS;

  return (
    <div
      className="flex-1 min-w-0 flex flex-col min-h-0"
      style={{ background: "var(--p-primary-background-color)" }}
    >
      {/* Back button */}
      <div
        className="flex items-center px-3 py-2 border-b flex-shrink-0"
        style={{ borderColor: "var(--p-border-and-gradient-bg)", background: "var(--p-dark)" }}
      >
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-[10px] font-semibold"
          style={{ color: "var(--p-primary)" }}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back
        </button>
      </div>

      {/* Hero section */}
      <div
        className="px-4 py-3 flex-shrink-0"
        style={{
          background: `linear-gradient(135deg, color-mix(in oklab, var(--p-primary) 8%, transparent) 0%, transparent 100%)`,
          borderBottom: "1px solid var(--p-border-and-gradient-bg)",
        }}
      >
        {/* Date */}
        <div
          className="text-center text-[9px] font-bold mb-2"
          style={{ color: "var(--p-primary)" }}
        >
          {dateLabel}
        </div>

        {/* Teams */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col items-center gap-1.5 flex-1">
            <TeamDot label={home} size={32} />
            <span
              className="text-[10px] font-bold text-center leading-tight"
              style={{ color: "var(--p-light-text-color)" }}
            >
              {home}
            </span>
          </div>

          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <span
              className="text-[13px] font-black"
              style={{ color: "var(--p-text-secondary-color)" }}
            >
              VS
            </span>
            <span
              className="text-[8px] font-semibold px-2 py-[2px] rounded-full"
              style={{
                background: "var(--p-active-secondary-gradient-color)",
                color: pickContrastText(palette.activeSecondaryGradientColor),
                border: "1px solid var(--p-primary)",
              }}
            >
              {leagueLabel}
            </span>
          </div>

          <div className="flex flex-col items-center gap-1.5 flex-1">
            <TeamDot label={away} size={32} />
            <span
              className="text-[10px] font-bold text-center leading-tight"
              style={{ color: "var(--p-light-text-color)" }}
            >
              {away}
            </span>
          </div>
        </div>
      </div>

      {/* Detail tabs */}
      <div
        className="flex gap-1.5 px-3 py-2 border-b flex-shrink-0 overflow-x-auto"
        style={{ borderColor: "var(--p-border-and-gradient-bg)", scrollbarWidth: "none" }}
      >
        {GAME_DETAIL_TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveDetailTab(i)}
            className="px-3 h-7 rounded-md text-[9px] font-semibold flex-shrink-0 whitespace-nowrap"
            style={{
              background:
                activeDetailTab === i ? "var(--p-primary)" : "transparent",
              border:
                activeDetailTab === i
                  ? "1px solid var(--p-primary)"
                  : "1px solid var(--p-border-and-gradient-bg)",
              color:
                activeDetailTab === i
                  ? pickContrastText(palette.primary)
                  : "var(--p-text-secondary-color)",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Accordion markets */}
      <div className="flex-1 min-h-0 overflow-auto">
        {markets.map((market) => {
          const isExpanded = expandedMarket === market.id;
          return (
            <div
              key={market.id}
              style={{ borderBottom: "1px solid var(--p-border-and-gradient-bg)" }}
            >
              {/* Section header */}
              <button
                className="w-full flex items-center justify-between px-3 py-2.5"
                onClick={() =>
                  setExpandedMarket(isExpanded ? "" : market.id)
                }
              >
                <span
                  className="text-[10px] font-bold"
                  style={{ color: "var(--p-light-text-color)" }}
                >
                  {market.title}
                </span>
                <div className="flex items-center gap-2">
                  {market.hasSGP && (
                    <span
                      className="text-[8px] font-bold px-1.5 py-[2px] rounded-full"
                      style={{
                        background: "var(--p-primary)",
                        color: pickContrastText(palette.primary),
                      }}
                    >
                      SGP
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronUp
                      className="h-3.5 w-3.5"
                      style={{ color: "var(--p-text-secondary-color)" }}
                    />
                  ) : (
                    <ChevronDown
                      className="h-3.5 w-3.5"
                      style={{ color: "var(--p-text-secondary-color)" }}
                    />
                  )}
                </div>
              </button>

              {/* Section content */}
              {isExpanded && market.content.type === "table" && (
                <div className="px-3 pb-3">
                  {market.content.leagueLabel && (
                    <div
                      className="text-[8px] font-semibold mb-1.5"
                      style={{ color: "var(--p-primary)" }}
                    >
                      {market.content.leagueLabel}
                    </div>
                  )}
                  {/* Column headers */}
                  <div
                    className="grid mb-1.5"
                    style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 4 }}
                  >
                    <div />
                    {market.content.columns.map((col) => (
                      <div
                        key={col}
                        className="text-center text-[8px] font-bold"
                        style={{ color: "var(--p-text-secondary-color)" }}
                      >
                        {col}
                      </div>
                    ))}
                  </div>
                  {/* Team rows */}
                  {market.content.rows.map((row) => (
                    <div
                      key={row.team}
                      className="grid items-center mb-1.5"
                      style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 4 }}
                    >
                      <div className="flex items-center gap-1 min-w-0">
                        <TeamDot label={row.team} size={14} />
                        <span
                          className="text-[8.5px] font-medium truncate"
                          style={{ color: "var(--p-light-text-color)" }}
                        >
                          {row.team}
                        </span>
                      </div>
                      {row.values.map((val, j) => (
                        <button
                          key={j}
                          className="h-8 rounded text-[7.5px] font-bold text-center px-0.5 leading-tight"
                          style={{
                            background: "var(--p-active-secondary-gradient-color)",
                            border: "1px solid var(--p-primary)",
                            color: pickContrastText(palette.activeSecondaryGradientColor),
                          }}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {isExpanded && market.content.type === "placeholder" && (
                <div className="h-2" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
