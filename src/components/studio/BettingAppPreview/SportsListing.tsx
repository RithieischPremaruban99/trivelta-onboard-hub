import React, { useState } from "react";
import { ChevronLeft, Filter, ChevronRight, Trophy, Volleyball } from "lucide-react";
import type { TCMPalette } from "@/lib/tcm-palette";
import type { TCMStrings } from "@/lib/tcm-strings";
import {
  NBA_SCHEDULE,
  FOOTBALL_LEAGUES,
  NBA_BET_TYPES,
  FOOTBALL_BET_TYPES,
  NBA_TOP_TABS,
  FOOTBALL_TOP_TABS,
} from "./sports-data";

type Props = {
  sport: "nba" | "football";
  onMatchClick: (matchId: string) => void;
  onBack: () => void;
  palette: TCMPalette;
  strings: TCMStrings;
  pickContrastText: (rgba: string) => string;
  TeamDot: React.ComponentType<{ label: string; size?: number }>;
};

export function SportsListing({
  sport,
  onMatchClick,
  onBack,
  palette,
  strings,
  pickContrastText,
  TeamDot,
}: Props) {
  const [activeTopTab, setActiveTopTab] = useState(0);
  const [activeBetType, setActiveBetType] = useState(0);

  const topTabs = sport === "nba" ? NBA_TOP_TABS : FOOTBALL_TOP_TABS;
  const betTypes = sport === "nba" ? NBA_BET_TYPES : FOOTBALL_BET_TYPES;
  const sportLabel = sport === "nba" ? "Basketball" : strings.SOCCER;
  const sportIcon = sport === "nba" ? "🏀" : "⚽";

  return (
    <div
      className="flex-1 min-w-0 flex flex-col min-h-0"
      style={{ background: "var(--p-primary-background-color)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b flex-shrink-0"
        style={{ borderColor: "var(--p-border-and-gradient-bg)", background: "var(--p-dark)" }}
      >
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-[10px] font-semibold"
          style={{ color: "var(--p-primary)" }}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          {strings.BACK_TO_SPORTS}
        </button>
        <div className="flex items-center gap-1.5">
          <span className="text-[14px]">{sportIcon}</span>
          <span className="text-[13px] font-bold" style={{ color: "var(--p-light-text-color)" }}>
            {sportLabel}
          </span>
        </div>
        <button style={{ color: "var(--p-text-secondary-color)" }}>
          <Filter className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Top tabs */}
      <div
        className="flex border-b flex-shrink-0"
        style={{ borderColor: "var(--p-border-and-gradient-bg)", background: "var(--p-dark)" }}
      >
        {topTabs.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTopTab(i)}
            className="px-3 h-8 text-[10px] font-semibold relative"
            style={{
              color: activeTopTab === i ? "var(--p-primary)" : "var(--p-text-secondary-color)",
            }}
          >
            {tab}
            {activeTopTab === i && (
              <span
                className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full"
                style={{ background: "var(--p-primary)" }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Bet-type pills */}
      <div
        className="flex gap-1.5 px-3 py-2 overflow-x-auto flex-shrink-0"
        style={{ scrollbarWidth: "none", background: "var(--p-dark)" }}
      >
        {betTypes.map((b, i) => (
          <button
            key={b}
            onClick={() => setActiveBetType(i)}
            className="px-2.5 h-6 rounded-md text-[9px] font-semibold flex-shrink-0 whitespace-nowrap"
            style={{
              background:
                activeBetType === i ? "var(--p-active-secondary-gradient-color)" : "transparent",
              border:
                activeBetType === i
                  ? "1px solid var(--p-primary)"
                  : "1px solid var(--p-border-and-gradient-bg)",
              color:
                activeBetType === i
                  ? pickContrastText(palette.activeSecondaryGradientColor)
                  : "var(--p-text-secondary-color)",
            }}
          >
            {b}
          </button>
        ))}
      </div>

      {/* Match list */}
      <div className="flex-1 min-h-0 overflow-auto px-3 pb-3">
        {sport === "nba" ? (
          <div className="grid grid-cols-2 gap-2 mt-2">
            {NBA_SCHEDULE.map((m) => (
              <div
                key={m.id}
                className="rounded-md p-2 cursor-pointer"
                style={{
                  background: "var(--p-dark)",
                  border: "1px solid var(--p-border-and-gradient-bg)",
                }}
                onClick={() => onMatchClick(m.id)}
              >
                {/* Date + league label */}
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[8px] font-semibold" style={{ color: "var(--p-primary)" }}>
                    {m.date}
                  </span>
                  <span className="text-[7px]" style={{ color: "var(--p-text-secondary-color)" }}>
                    {m.league}
                  </span>
                </div>

                {/* Column headers */}
                <div
                  className="grid mb-1"
                  style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 2 }}
                >
                  <div />
                  {["Spread", "ML", "Total"].map((h) => (
                    <div
                      key={h}
                      className="text-center text-[7px] font-bold"
                      style={{ color: "var(--p-text-secondary-color)" }}
                    >
                      {h}
                    </div>
                  ))}
                </div>

                {/* Home row */}
                <NbaTeamRow
                  label={m.home}
                  spread={m.spread.home}
                  ml={m.moneyline.home}
                  total={m.total.over}
                  palette={palette}
                  pickContrastText={pickContrastText}
                  TeamDot={TeamDot}
                />
                {/* Away row */}
                <NbaTeamRow
                  label={m.away}
                  spread={m.spread.away}
                  ml={m.moneyline.away}
                  total={m.total.under}
                  palette={palette}
                  pickContrastText={pickContrastText}
                  TeamDot={TeamDot}
                />

                {/* Footer */}
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[8px]" style={{ color: "var(--p-text-secondary-color)" }}>
                    {strings.STATS}
                  </span>
                  <span
                    className="text-[8px] font-semibold flex items-center gap-0.5"
                    style={{ color: "var(--p-primary)" }}
                  >
                    SGP {strings.MORE_BETS} <ChevronRight className="h-2 w-2" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Football: grouped by league */
          <div className="space-y-3 mt-2">
            {FOOTBALL_LEAGUES.map((league) => (
              <div key={league.name}>
                {/* League header */}
                <div
                  className="flex items-center gap-1.5 px-1 py-1 mb-1.5"
                  style={{ borderBottom: "1px solid var(--p-border-and-gradient-bg)" }}
                >
                  <Trophy className="h-3 w-3" style={{ color: "var(--p-primary)" }} />
                  <span
                    className="text-[9px] font-bold"
                    style={{ color: "var(--p-light-text-color)" }}
                  >
                    {league.name}
                  </span>
                </div>

                {/* Match cards */}
                <div className="grid grid-cols-2 gap-2">
                  {league.matches.map((m) => (
                    <FootballMatchCard
                      key={m.id}
                      match={m}
                      onMatchClick={onMatchClick}
                      palette={palette}
                      strings={strings}
                      pickContrastText={pickContrastText}
                      TeamDot={TeamDot}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────────── */

type NbaTeamRowProps = {
  label: string;
  spread: string;
  ml: string;
  total: string;
  palette: TCMPalette;
  pickContrastText: (rgba: string) => string;
  TeamDot: React.ComponentType<{ label: string; size?: number }>;
};

function NbaTeamRow({ label, spread, ml, total, palette, pickContrastText, TeamDot }: NbaTeamRowProps) {
  return (
    <div className="grid items-center mb-1" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 2 }}>
      <div className="flex items-center gap-1 min-w-0">
        <TeamDot label={label} size={12} />
        <span
          className="text-[8px] font-medium truncate"
          style={{ color: "var(--p-light-text-color)" }}
        >
          {label}
        </span>
      </div>
      {[spread, ml, total].map((val, i) => (
        <button
          key={i}
          className="h-7 rounded text-[7.5px] font-bold text-center leading-tight px-0.5"
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
  );
}

type FootballMatchCardProps = {
  match: { id: string; date: string; home: string; away: string; odds: [string, string, string] };
  onMatchClick: (id: string) => void;
  palette: TCMPalette;
  strings: TCMStrings;
  pickContrastText: (rgba: string) => string;
  TeamDot: React.ComponentType<{ label: string; size?: number }>;
};

function FootballMatchCard({
  match,
  onMatchClick,
  palette,
  strings,
  pickContrastText,
  TeamDot,
}: FootballMatchCardProps) {
  return (
    <div
      className="rounded-md p-2 cursor-pointer"
      style={{
        background: "var(--p-dark)",
        border: "1px solid var(--p-border-and-gradient-bg)",
      }}
      onClick={() => onMatchClick(match.id)}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[8px] font-semibold" style={{ color: "var(--p-primary)" }}>
          {match.date}
        </span>
        <div
          className="flex gap-3 text-[8px] font-bold"
          style={{ color: "var(--p-text-secondary-color)" }}
        >
          <span>1</span>
          <span>X</span>
          <span>2</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-1">
            <TeamDot label={match.home} size={12} />
            <span
              className="text-[8.5px] font-medium truncate"
              style={{ color: "var(--p-light-text-color)" }}
            >
              {match.home}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <TeamDot label={match.away} size={12} />
            <span
              className="text-[8.5px] font-medium truncate"
              style={{ color: "var(--p-light-text-color)" }}
            >
              {match.away}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-1 flex-shrink-0">
          {/* Home odds row */}
          <div className="flex gap-1">
            {match.odds.map((o, j) => (
              <button
                key={j}
                className="w-8 h-6 rounded text-[8px] font-bold"
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
        </div>
      </div>

      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[8px]" style={{ color: "var(--p-text-secondary-color)" }}>
          {strings.STATS}
        </span>
        <span
          className="text-[8px] font-semibold flex items-center gap-0.5"
          style={{ color: "var(--p-primary)" }}
        >
          SGP {strings.MORE_BETS} <ChevronRight className="h-2 w-2" />
        </span>
      </div>
    </div>
  );
}
