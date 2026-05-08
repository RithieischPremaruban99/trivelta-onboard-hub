import React, { useState } from "react";
import { ChevronRight, Filter } from "lucide-react";
import type { TCMPalette } from "@/lib/tcm-palette";
import type { TCMStrings } from "@/lib/tcm-strings";
import {
  NBA_SCHEDULE,
  FOOTBALL_LEAGUES,
  NBA_BET_TYPES,
  FOOTBALL_BET_TYPES,
  NBA_TOP_TABS,
  TENNIS_TOURNAMENTS,
  TENNIS_BET_TYPES,
  TENNIS_TOURNAMENT_TABS,
} from "./sports-data";

/* ── Helpers ─────────────────────────────────────────────────────────────── */

const FOOTBALL_TOP_TABS = ["Schedule", "Players", "Futures"];

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

function LeagueIcon({ name, size = 36 }: { name: string; size?: number }) {
  const config: Record<string, { bg: string; ch: string }> = {
    "Premier League - England": { bg: "linear-gradient(135deg, #38003c, #00ff85)", ch: "PL" },
    "LaLiga - Spain": { bg: "linear-gradient(135deg, #ee8707, #c12126)", ch: "LL" },
    "Bundesliga - Germany": { bg: "linear-gradient(135deg, #d20515, #000000)", ch: "B" },
    "Serie A - Italy": { bg: "linear-gradient(135deg, #0066cc, #003366)", ch: "SA" },
    "Ligue 1 - France": { bg: "linear-gradient(135deg, #091c3e, #dae025)", ch: "L1" },
    "Liga Portugal - Portugal": { bg: "linear-gradient(135deg, #006600, #ff0000)", ch: "LP" },
    "Eredivisie - Netherlands": { bg: "linear-gradient(135deg, #ff6600, #003399)", ch: "E" },
  };
  const cfg =
    config[name] ?? { bg: "var(--p-modal-background)", ch: name.slice(0, 2).toUpperCase() };
  return (
    <div
      className="rounded-full grid place-items-center font-black flex-shrink-0 text-white"
      style={{
        height: size,
        width: size,
        background: cfg.bg,
        fontSize: Math.max(9, Math.floor(size * 0.38)),
        boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
      }}
    >
      {cfg.ch}
    </div>
  );
}

/* Hover/lift card style – shared */
const cardHoverHandlers = {
  onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.borderColor = "var(--p-primary)";
    e.currentTarget.style.transform = "translateY(-1px)";
    e.currentTarget.style.boxShadow =
      "0 4px 12px -4px color-mix(in oklab, var(--p-primary) 35%, transparent)";
  },
  onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.borderColor = "var(--p-border-and-gradient-bg)";
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.boxShadow = "none";
  },
};

const cardBaseStyle: React.CSSProperties = {
  background: "var(--p-dark)",
  border: "1px solid var(--p-border-and-gradient-bg)",
  transition: "border-color 150ms ease, transform 150ms ease, box-shadow 150ms ease",
};

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
  palette,
  strings,
  pickContrastText,
  TeamDot,
}: Props) {
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
        {/* ATP / WTA top tabs */}
        <div
          className="flex border-b flex-shrink-0 px-3 pt-3"
          style={{ borderColor: "var(--p-border-and-gradient-bg)" }}
        >
          {TENNIS_TOURNAMENT_TABS.map((t, i) => {
            const active = activeTournamentTab === i;
            return (
              <button
                key={t}
                onClick={() => setActiveTournamentTab(i)}
                className="flex-1 h-9 text-[11px] font-semibold relative px-2 truncate flex items-center justify-center gap-1.5"
                style={{
                  background: active
                    ? "color-mix(in oklab, var(--p-primary) 12%, transparent)"
                    : "transparent",
                  color: active ? "var(--p-light-text-color)" : "var(--p-text-secondary-color)",
                  borderRadius: active ? "8px 8px 0 0" : "0",
                }}
              >
                <span className="text-[12px]">🎾</span>
                <span className="truncate">{t}</span>
                {active && (
                  <span
                    className="absolute -bottom-[1px] left-3 right-3 h-[2px] rounded-full"
                    style={{ background: "var(--p-primary)" }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Bet type pills */}
        <div
          className="flex gap-1.5 px-3 py-2.5 overflow-x-auto flex-shrink-0"
          style={{ scrollbarWidth: "none" }}
        >
          {TENNIS_BET_TYPES.map((b, i) => {
            const active = activeTennisBetType === i;
            return (
              <button
                key={b}
                onClick={() => setActiveTennisBetType(i)}
                className="px-3 h-7 rounded-md text-[10px] font-bold flex-shrink-0 whitespace-nowrap transition-colors"
                style={{
                  background: active ? "var(--p-active-secondary-gradient-color)" : "transparent",
                  border: active
                    ? "1px solid var(--p-primary)"
                    : "1px solid var(--p-border-and-gradient-bg)",
                  color: active
                    ? pickContrastText(palette.activeSecondaryGradientColor)
                    : "var(--p-text-secondary-color)",
                }}
              >
                {b}
              </button>
            );
          })}
        </div>

        {/* Match cards — single column, full width */}
        <div className="flex-1 min-h-0 overflow-auto px-3 pb-3 space-y-2">
          {tournament.matches.map((m) => (
            <div
              key={m.id}
              onClick={() => onMatchClick(m.id)}
              className="rounded-lg p-3 cursor-pointer"
              style={cardBaseStyle}
              {...cardHoverHandlers}
            >
              {/* Players row */}
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-[16px]">{countryCodeToFlag(m.playerA.countryCode)}</span>
                  <span
                    className="text-[12px] font-bold truncate"
                    style={{ color: "var(--p-light-text-color)" }}
                  >
                    {m.playerA.name}
                  </span>
                </div>
                <span
                  className="text-[10px] font-bold mx-3 flex-shrink-0 uppercase tracking-wider"
                  style={{ color: "var(--p-primary)" }}
                >
                  vs
                </span>
                <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
                  <span
                    className="text-[12px] font-bold truncate text-right"
                    style={{ color: "var(--p-light-text-color)" }}
                  >
                    {m.playerB.name}
                  </span>
                  <span className="text-[16px]">{countryCodeToFlag(m.playerB.countryCode)}</span>
                </div>
              </div>

              {/* Odds buttons */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: m.playerA.name, odds: m.oddsA },
                  { name: m.playerB.name, odds: m.oddsB },
                ].map((p, idx) => (
                  <button
                    key={idx}
                    className="h-11 rounded-md text-[12px] font-extrabold flex items-center justify-center gap-2 transition-transform active:scale-95"
                    style={{
                      background: "var(--p-active-secondary-gradient-color)",
                      border:
                        "1px solid color-mix(in oklab, var(--p-primary) 60%, transparent)",
                      color: pickContrastText(palette.activeSecondaryGradientColor),
                    }}
                  >
                    <span
                      className="text-[9px] font-semibold opacity-70 truncate max-w-[60%]"
                    >
                      {p.name.split(",")[0]}
                    </span>
                    <span>{p.odds}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── NBA / Football shared ─────────────────────────────────────────────── */
  const topTabs = sport === "nba" ? NBA_TOP_TABS : FOOTBALL_TOP_TABS;
  const betTypes = sport === "nba" ? NBA_BET_TYPES : FOOTBALL_BET_TYPES;

  return (
    <div
      className="flex-1 min-w-0 flex flex-col min-h-0"
      style={{ background: "var(--p-primary-background-color)" }}
    >
      {/* Top tabs (Schedule | Players | Futures) */}
      <div
        className="flex border-b flex-shrink-0 px-4 pt-3"
        style={{ borderColor: "var(--p-border-and-gradient-bg)" }}
      >
        {topTabs.map((tab, i) => {
          const active = activeTopTab === i;
          return (
            <button
              key={tab}
              onClick={() => setActiveTopTab(i)}
              className="flex-1 h-9 text-[12px] font-semibold relative"
              style={{
                color: active ? "var(--p-light-text-color)" : "var(--p-text-secondary-color)",
              }}
            >
              {tab}
              {active && (
                <span
                  className="absolute -bottom-[1px] left-1/4 right-1/4 h-[2px] rounded-full"
                  style={{ background: "var(--p-primary)" }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Bet-type pills */}
      <div
        className="flex gap-1.5 px-4 py-2.5 overflow-x-auto flex-shrink-0"
        style={{ scrollbarWidth: "none" }}
      >
        {betTypes.map((b, i) => {
          const active = activeBetType === i;
          return (
            <button
              key={b}
              onClick={() => setActiveBetType(i)}
              className="px-3 h-7 rounded-md text-[10px] font-bold flex-shrink-0 whitespace-nowrap transition-colors"
              style={{
                background: active ? "var(--p-active-secondary-gradient-color)" : "transparent",
                border: active
                  ? "1px solid var(--p-primary)"
                  : "1px solid var(--p-border-and-gradient-bg)",
                color: active
                  ? pickContrastText(palette.activeSecondaryGradientColor)
                  : "var(--p-text-secondary-color)",
              }}
            >
              {b}
            </button>
          );
        })}
      </div>

      {/* Match list */}
      <div className="flex-1 min-h-0 overflow-auto px-4 pb-4">
        {sport === "nba" ? (
          /* ── NBA ── */
          <>
            {/* Section header: Basketball + Filter */}
            <div className="flex items-center justify-between mb-3 mt-1">
              <div className="flex items-center gap-2">
                <span className="text-[18px]">🏀</span>
                <h2
                  className="text-[15px] font-black uppercase tracking-wide"
                  style={{ color: "var(--p-light-text-color)" }}
                >
                  Basketball
                </h2>
              </div>
              <button
                className="flex items-center gap-1.5 px-3 h-7 rounded-md text-[10px] font-semibold"
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
            <div className="grid grid-cols-2 gap-2.5">
              {NBA_SCHEDULE.map((m) => (
                <div
                  key={m.id}
                  className="rounded-lg p-3 cursor-pointer"
                  style={cardBaseStyle}
                  {...cardHoverHandlers}
                  onClick={() => onMatchClick(m.id)}
                >
                  {/* Date + league */}
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: "var(--p-primary)" }}
                    >
                      {m.date}
                    </span>
                    <span
                      className="text-[9px] font-semibold"
                      style={{ color: "var(--p-text-secondary-color)" }}
                    >
                      {m.league}
                    </span>
                  </div>

                  {/* Column headers */}
                  <div
                    className="grid mb-1.5"
                    style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 4 }}
                  >
                    <div />
                    {["Spread", "Moneyline", "Total"].map((h) => (
                      <div
                        key={h}
                        className="text-center text-[9px] font-bold"
                        style={{ color: "var(--p-text-secondary-color)" }}
                      >
                        {h}
                      </div>
                    ))}
                  </div>

                  <NbaTeamRow
                    label={m.home}
                    spread={m.spread.home}
                    ml={m.moneyline.home}
                    total={m.total.over}
                    palette={palette}
                    pickContrastText={pickContrastText}
                    TeamDot={TeamDot}
                  />
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
                  <div
                    className="flex items-center justify-between mt-2.5 pt-2"
                    style={{ borderTop: "1px solid var(--p-border-and-gradient-bg)" }}
                  >
                    <span
                      className="text-[9px] font-bold flex items-center gap-1"
                      style={{ color: "var(--p-text-secondary-color)" }}
                    >
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-sm"
                        style={{
                          background:
                            "color-mix(in oklab, var(--p-primary) 40%, transparent)",
                        }}
                      />
                      {strings.STATS}
                    </span>
                    <span
                      className="text-[9px] font-bold flex items-center gap-1"
                      style={{ color: "var(--p-primary)" }}
                    >
                      <span
                        className="text-[7px] font-extrabold px-1 py-[1px] rounded"
                        style={{
                          background: "var(--p-primary)",
                          color: pickContrastText(palette.primary),
                        }}
                      >
                        SGP
                      </span>
                      {strings.MORE_BETS}
                      <ChevronRight className="h-2.5 w-2.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* ── Football: per-league sections ── */
          <div className="space-y-5 mt-1">
            {FOOTBALL_LEAGUES.map((league) => (
              <div key={league.name}>
                {/* League header */}
                <div className="flex items-center gap-3 mb-3">
                  <LeagueIcon name={league.name} size={36} />
                  <h2
                    className="text-[20px] font-black tracking-wide uppercase flex-1"
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
                <div className="grid grid-cols-2 gap-2.5">
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

function NbaTeamRow({
  label,
  spread,
  ml,
  total,
  palette,
  pickContrastText,
  TeamDot,
}: NbaTeamRowProps) {
  return (
    <div
      className="grid items-center mb-1.5"
      style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 4 }}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <TeamDot label={label} size={16} />
        <span
          className="text-[10px] font-bold truncate"
          style={{ color: "var(--p-light-text-color)" }}
        >
          {label}
        </span>
      </div>
      {[spread, ml, total].map((val, i) => (
        <button
          key={i}
          className="h-10 rounded-md text-[9.5px] font-bold text-center leading-tight px-0.5 transition-transform active:scale-95"
          style={{
            background: "var(--p-active-secondary-gradient-color)",
            border: "1px solid color-mix(in oklab, var(--p-primary) 60%, transparent)",
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
      className="rounded-lg p-3 cursor-pointer"
      style={cardBaseStyle}
      {...cardHoverHandlers}
      onClick={() => onMatchClick(match.id)}
    >
      {/* Date + 1/X/2 header */}
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-[10px] font-bold uppercase tracking-wider"
          style={{ color: "var(--p-primary)" }}
        >
          {match.date}
        </span>
        <div
          className="grid gap-1 text-[10px] font-bold"
          style={{
            gridTemplateColumns: "44px 44px 44px",
            color: "var(--p-text-secondary-color)",
            textAlign: "center",
          }}
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
            <TeamDot label={match.home} size={18} />
            <span
              className="text-[11px] font-bold truncate"
              style={{ color: "var(--p-light-text-color)" }}
            >
              {match.home}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <TeamDot label={match.away} size={18} />
            <span
              className="text-[11px] font-bold truncate"
              style={{ color: "var(--p-light-text-color)" }}
            >
              {match.away}
            </span>
          </div>
        </div>
        <div
          className="grid gap-1 flex-shrink-0"
          style={{ gridTemplateColumns: "44px 44px 44px" }}
        >
          {match.odds.map((o, j) => (
            <button
              key={j}
              className="h-[68px] rounded text-[11px] font-extrabold transition-transform active:scale-95"
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

      {/* Footer */}
      <div
        className="flex items-center justify-between mt-2.5 pt-2"
        style={{ borderTop: "1px solid var(--p-border-and-gradient-bg)" }}
      >
        <span
          className="text-[9px] font-bold"
          style={{ color: "var(--p-text-secondary-color)" }}
        >
          {strings.STATS}
        </span>
        <span
          className="text-[9px] font-bold flex items-center gap-1"
          style={{ color: "var(--p-primary)" }}
        >
          <span
            className="text-[7px] font-extrabold px-1 py-[1px] rounded"
            style={{
              background: "var(--p-primary)",
              color: pickContrastText(palette.primary),
            }}
          >
            SGP
          </span>
          {strings.MORE_BETS}
          <ChevronRight className="h-2.5 w-2.5" />
        </span>
      </div>
    </div>
  );
}
