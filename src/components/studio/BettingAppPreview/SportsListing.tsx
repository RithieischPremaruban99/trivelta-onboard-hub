import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Filter, Trophy } from "lucide-react";
import type { TCMPalette } from "@/lib/tcm-palette";
import type { TCMStrings } from "@/lib/tcm-strings";
import {
  NBA_SCHEDULE,
  FOOTBALL_LEAGUES,
  NBA_BET_TYPES,
  FOOTBALL_BET_TYPES,
  NBA_TOP_TABS,
  FOOTBALL_TOP_TABS,
  TENNIS_TOURNAMENTS,
  TENNIS_BET_TYPES,
  TENNIS_TOURNAMENT_TABS,
} from "./sports-data";

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function countryCodeToFlag(code: string): string {
  if (!code || code.length !== 2) return "🏳";
  const A = 127397;
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => c.charCodeAt(0) + A));
}

function getLeagueShortName(fullName: string): string {
  const map: Record<string, string> = {
    "Premier League - England": "PREMIER LEAGUE",
    "LaLiga - Spain": "LALIGA",
    "Bundesliga - Germany": "BUNDESLIGA",
    "Serie A - Italy": "SERIE A",
    "Ligue 1 - France": "LIGUE 1",
    "Liga Portugal - Portugal": "LIGA PORTUGAL",
    "Eredivisie - Netherlands": "EREDIVISIE",
    "MSFL - Czechia": "MSFL",
    "Parva Liga - Bulgaria": "PARVA LIGA",
    "Virsliga - Latvia": "VIRSLIGA",
    "2. Liga - Slovakia": "2. LIGA",
    "MLS Next Pro - USA": "MLS NEXT PRO",
  };
  return map[fullName] ?? fullName.split(" - ")[0].toUpperCase();
}

function LeagueIcon({ name, size = 32 }: { name: string; size?: number }) {
  const config: Record<string, { bg: string; ch: string }> = {
    "Premier League - England": { bg: "linear-gradient(135deg, #38003c, #00ff85)", ch: "PL" },
    "LaLiga - Spain": { bg: "linear-gradient(135deg, #ee8707, #c12126)", ch: "L" },
    "Bundesliga - Germany": { bg: "linear-gradient(135deg, #d20515, #000000)", ch: "B" },
    "Serie A - Italy": { bg: "linear-gradient(135deg, #0066cc, #003366)", ch: "SA" },
    "Ligue 1 - France": { bg: "linear-gradient(135deg, #091c3e, #dae025)", ch: "L1" },
    "Liga Portugal - Portugal": { bg: "linear-gradient(135deg, #006600, #ff0000)", ch: "LP" },
    "Eredivisie - Netherlands": { bg: "linear-gradient(135deg, #ff6600, #003399)", ch: "E" },
  };
  const cfg = config[name] ?? { bg: "var(--p-modal-background)", ch: name.slice(0, 2).toUpperCase() };
  return (
    <div
      className="rounded-full grid place-items-center font-black flex-shrink-0 text-white"
      style={{
        height: size,
        width: size,
        background: cfg.bg,
        fontSize: Math.max(8, Math.floor(size * 0.4)),
      }}
    >
      {cfg.ch}
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────────────── */

type Props = {
  sport: "nba" | "football" | "tennis";
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
  // All state declared at top level (hooks rules)
  const [activeTopTab, setActiveTopTab] = useState(0);
  const [activeBetType, setActiveBetType] = useState(0);
  const [activeTournamentTab, setActiveTournamentTab] = useState(0);
  const [activeTennisBetType, setActiveTennisBetType] = useState(0);

  /* ── Tennis branch ─────────────────────────────────────────────────────── */
  if (sport === "tennis") {
    const tournament = TENNIS_TOURNAMENTS[activeTournamentTab] ?? TENNIS_TOURNAMENTS[0];

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
            <span className="text-[14px]">🎾</span>
            <span className="text-[13px] font-bold" style={{ color: "var(--p-light-text-color)" }}>
              {strings.TENNIS}
            </span>
          </div>
          <button style={{ color: "var(--p-text-secondary-color)" }}>
            <Filter className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* ATP / WTA top tabs */}
        <div
          className="flex border-b flex-shrink-0"
          style={{ borderColor: "var(--p-border-and-gradient-bg)", background: "var(--p-dark)" }}
        >
          {TENNIS_TOURNAMENT_TABS.map((t, i) => (
            <button
              key={t}
              onClick={() => setActiveTournamentTab(i)}
              className="flex-1 h-9 text-[10px] font-semibold relative px-2 truncate"
              style={{
                color: activeTournamentTab === i ? "var(--p-primary)" : "var(--p-text-secondary-color)",
              }}
            >
              {t}
              {activeTournamentTab === i && (
                <span
                  className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full"
                  style={{ background: "var(--p-primary)" }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Bet type pills */}
        <div
          className="flex gap-1.5 px-3 py-2 overflow-x-auto flex-shrink-0"
          style={{ scrollbarWidth: "none", background: "var(--p-dark)" }}
        >
          {TENNIS_BET_TYPES.map((b, i) => (
            <button
              key={b}
              onClick={() => setActiveTennisBetType(i)}
              className="px-2.5 h-6 rounded-md text-[9px] font-semibold flex-shrink-0 whitespace-nowrap"
              style={{
                background: activeTennisBetType === i ? "var(--p-active-secondary-gradient-color)" : "transparent",
                border: activeTennisBetType === i ? "1px solid var(--p-primary)" : "1px solid var(--p-border-and-gradient-bg)",
                color: activeTennisBetType === i ? pickContrastText(palette.activeSecondaryGradientColor) : "var(--p-text-secondary-color)",
              }}
            >
              {b}
            </button>
          ))}
        </div>

        {/* Match cards */}
        <div className="flex-1 min-h-0 overflow-auto px-3 pb-3">
          <div className="space-y-2 mt-2">
            {tournament.matches.map((m) => (
              <div
                key={m.id}
                onClick={() => onMatchClick(m.id)}
                className="rounded-md p-3 cursor-pointer transition-all"
                style={{
                  background: "var(--p-dark)",
                  border: "1px solid var(--p-border-and-gradient-bg)",
                  transition: "border-color 150ms ease, transform 150ms ease, box-shadow 150ms ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--p-primary)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 2px 8px color-mix(in oklab, var(--p-primary) 25%, transparent)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--p-border-and-gradient-bg)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {/* Players row */}
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span className="text-[14px]">{countryCodeToFlag(m.playerA.countryCode)}</span>
                    <span className="text-[11px] font-bold truncate" style={{ color: "var(--p-light-text-color)" }}>
                      {m.playerA.name}
                    </span>
                  </div>
                  <span className="text-[9px] font-semibold mx-2 flex-shrink-0" style={{ color: "var(--p-text-secondary-color)" }}>
                    vs
                  </span>
                  <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-end">
                    <span className="text-[11px] font-bold truncate text-right" style={{ color: "var(--p-light-text-color)" }}>
                      {m.playerB.name}
                    </span>
                    <span className="text-[14px]">{countryCodeToFlag(m.playerB.countryCode)}</span>
                  </div>
                </div>

                {/* Odds buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    className="h-10 rounded text-[10px] font-bold flex flex-col items-center justify-center gap-0.5"
                    style={{
                      background: "var(--p-active-secondary-gradient-color)",
                      border: "1px solid var(--p-primary)",
                      color: pickContrastText(palette.activeSecondaryGradientColor),
                    }}
                  >
                    <span className="text-[8px] opacity-70 truncate max-w-full px-1">
                      {m.playerA.name.split(",")[0]}
                    </span>
                    <span>{m.oddsA}</span>
                  </button>
                  <button
                    className="h-10 rounded text-[10px] font-bold flex flex-col items-center justify-center gap-0.5"
                    style={{
                      background: "var(--p-active-secondary-gradient-color)",
                      border: "1px solid var(--p-primary)",
                      color: pickContrastText(palette.activeSecondaryGradientColor),
                    }}
                  >
                    <span className="text-[8px] opacity-70 truncate max-w-full px-1">
                      {m.playerB.name.split(",")[0]}
                    </span>
                    <span>{m.oddsB}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── NBA / Football shared header + tabs ───────────────────────────────── */
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
            style={{ color: activeTopTab === i ? "var(--p-primary)" : "var(--p-text-secondary-color)" }}
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
              background: activeBetType === i ? "var(--p-active-secondary-gradient-color)" : "transparent",
              border: activeBetType === i ? "1px solid var(--p-primary)" : "1px solid var(--p-border-and-gradient-bg)",
              color: activeBetType === i ? pickContrastText(palette.activeSecondaryGradientColor) : "var(--p-text-secondary-color)",
            }}
          >
            {b}
          </button>
        ))}
      </div>

      {/* Match list */}
      <div className="flex-1 min-h-0 overflow-auto px-3 pb-3">
        {sport === "nba" ? (
          /* ── NBA ── */
          <div className="grid grid-cols-2 gap-2 mt-2">
            {NBA_SCHEDULE.map((m) => (
              <div
                key={m.id}
                className="rounded-md p-3 cursor-pointer transition-all"
                style={{
                  background: "var(--p-dark)",
                  border: "1px solid var(--p-border-and-gradient-bg)",
                  transition: "border-color 150ms ease, transform 150ms ease, box-shadow 150ms ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--p-primary)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 2px 8px color-mix(in oklab, var(--p-primary) 25%, transparent)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--p-border-and-gradient-bg)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
                onClick={() => onMatchClick(m.id)}
              >
                {/* Date + league */}
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold" style={{ color: "var(--p-primary)" }}>
                    {m.date}
                  </span>
                  <span className="text-[7.5px]" style={{ color: "var(--p-text-secondary-color)" }}>
                    {m.league}
                  </span>
                </div>

                {/* Column headers */}
                <div className="grid mb-1" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 3 }}>
                  <div />
                  {["SPREAD", "ML", "TOTAL"].map((h) => (
                    <div
                      key={h}
                      className="text-center text-[8.5px] font-semibold uppercase"
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
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[9px] font-semibold" style={{ color: "var(--p-text-secondary-color)" }}>
                    {strings.STATS}
                  </span>
                  <span
                    className="text-[9px] font-semibold flex items-center gap-0.5"
                    style={{ color: "var(--p-primary)" }}
                  >
                    SGP {strings.MORE_BETS} <ChevronRight className="h-2.5 w-2.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ── Football ── */
          <div className="space-y-5 mt-2">
            {FOOTBALL_LEAGUES.map((league) => (
              <div key={league.name}>
                {/* League header */}
                <div className="flex items-center gap-3 mb-3">
                  <LeagueIcon name={league.name} size={32} />
                  <h2
                    className="text-[16px] font-black tracking-wide uppercase flex-1"
                    style={{ color: "var(--p-light-text-color)" }}
                  >
                    {getLeagueShortName(league.name)}
                  </h2>
                  <button
                    className="flex items-center gap-1.5 px-3 h-7 rounded-md text-[10px] font-semibold flex-shrink-0"
                    style={{
                      background: "var(--p-modal-background)",
                      border: "1px solid var(--p-border-and-gradient-bg)",
                      color: "var(--p-light-text-color)",
                    }}
                  >
                    <Filter className="h-3 w-3" />
                    Filter
                  </button>
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
    <div className="grid items-center mb-1.5" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 3 }}>
      <div className="flex items-center gap-1 min-w-0">
        <TeamDot label={label} size={14} />
        <span className="text-[9px] font-medium truncate" style={{ color: "var(--p-light-text-color)" }}>
          {label}
        </span>
      </div>
      {[spread, ml, total].map((val, i) => (
        <button
          key={i}
          className="h-10 rounded-md text-[9px] font-bold text-center leading-tight px-0.5"
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
      className="rounded-md p-3 cursor-pointer transition-all"
      style={{
        background: "var(--p-dark)",
        border: "1px solid var(--p-border-and-gradient-bg)",
        transition: "border-color 150ms ease, transform 150ms ease, box-shadow 150ms ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--p-primary)";
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.boxShadow = "0 2px 8px color-mix(in oklab, var(--p-primary) 25%, transparent)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--p-border-and-gradient-bg)";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
      onClick={() => onMatchClick(match.id)}
    >
      {/* Date + 1/X/2 header */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-bold" style={{ color: "var(--p-primary)" }}>
          {match.date}
        </span>
        <div
          className="grid gap-3 text-[9px] font-semibold uppercase"
          style={{ gridTemplateColumns: "50px 50px 50px", color: "var(--p-text-secondary-color)", textAlign: "center" }}
        >
          <span>1</span>
          <span>X</span>
          <span>2</span>
        </div>
      </div>

      {/* Teams + odds */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <TeamDot label={match.home} size={16} />
            <span className="text-[10px] font-medium truncate" style={{ color: "var(--p-light-text-color)" }}>
              {match.home}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <TeamDot label={match.away} size={16} />
            <span className="text-[10px] font-medium truncate" style={{ color: "var(--p-light-text-color)" }}>
              {match.away}
            </span>
          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          {match.odds.map((o, j) => (
            <button
              key={j}
              className="w-[50px] h-9 rounded text-[10px] font-bold"
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

      {/* Footer */}
      <div className="flex items-center justify-between mt-2">
        <span className="text-[9px] font-semibold" style={{ color: "var(--p-text-secondary-color)" }}>
          {strings.STATS}
        </span>
        <span
          className="text-[9px] font-semibold flex items-center gap-0.5"
          style={{ color: "var(--p-primary)" }}
        >
          SGP {strings.MORE_BETS} <ChevronRight className="h-2.5 w-2.5" />
        </span>
      </div>
    </div>
  );
}
