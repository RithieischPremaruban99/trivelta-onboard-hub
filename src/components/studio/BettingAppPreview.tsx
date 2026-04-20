/**
 * BettingAppPreview
 *
 * Faithful reproduction of the standard Trivelta platform layout (as seen
 * on BetCorrect today), used inside Studio so clients can preview how their
 * brand colors look in production. Two modes:
 *
 *  - Mobile (375px iPhone frame): top balance bar, quick-access row, big
 *    Welcome Bonus card, sport tabs + match cards, bottom nav.
 *  - Web (full desktop layout): left sport sidebar, center match feed with
 *    sport/league/bet-type tabs and a Welcome Bonus banner, right "My Bets"
 *    panel.
 *
 * All accent colors are driven by CSS variables (`--p-*`) injected on the
 * outer wrapper from StudioContext.themeColors, so changing tokens in the
 * Studio panel updates the preview live.
 *
 * Static placeholder data only - neutral "BetNova" branding, no BetCorrect
 * references.
 */
import { useState } from "react";
import { useStudio } from "@/contexts/StudioContext";
import {
  Bell,
  Search,
  Plus,
  EyeOff,
  MessageCircle,
  Home,
  Compass,
  Gamepad2,
  User,
  Trophy,
  ChevronRight,
  ChevronDown,
  Radio,
  Code2,
  Clapperboard,
  Swords,
  Joystick,
  Flame,
  ArrowLeftRight,
} from "lucide-react";

/* ─── Static placeholder data ─────────────────────────────────────────── */

const SPORTS_SIDEBAR = [
  { name: "Football", count: 253, flag: "⚽" },
  { name: "Basketball", count: 66, flag: "🏀" },
  { name: "Tennis", count: 11, flag: "🎾" },
  { name: "Volleyball", count: 19, flag: "🏐" },
  { name: "Table Tennis", count: 3, flag: "🏓" },
  { name: "Ice Hockey", count: 21, flag: "🏒" },
  { name: "American Football", count: 5, flag: "🏈" },
  { name: "Rugby", count: 13, flag: "🏉" },
  { name: "Golf", count: 8, flag: "⛳" },
  { name: "Darts", count: 4, flag: "🎯" },
  { name: "Boxing", count: 1, flag: "🥊" },
  { name: "Cricket", count: 12, flag: "🏏" },
  { name: "Baseball", count: 8, flag: "⚾" },
];

const QUICK_TILES = [
  { icon: Radio, label: "Live Sports" },
  { icon: Code2, label: "Load Code" },
  { icon: Clapperboard, label: "Virtuals" },
  { icon: ArrowLeftRight, label: "Peer to Peer" },
  { icon: Joystick, label: "Gamers Paradise", active: true },
];

const MOBILE_TILES = [
  { icon: Trophy, label: "All Sports" },
  { icon: Radio, label: "Live Spo." },
  { icon: Code2, label: "Load Co." },
  { icon: Clapperboard, label: "Virtuals" },
  { icon: Joystick, label: "Gamers...", active: true },
];

const SPORT_TABS = ["Soccer", "Basketball", "Tennis", "TT Elite Series"];
const LEAGUE_TABS = [
  "Premier League - England",
  "LaLiga - Spain",
  "Bundesliga - Germany",
  "Serie A - Italy",
  "Ligue 1 - France",
];
const BET_TYPE_TABS = [
  "1X2",
  "Over/Under",
  "Double chance",
  "GG/NG",
  "1st half O/U",
  "Handicap",
  "Anytime goalscorer",
];

const LIVE_UPCOMING = [
  { live: true, code: "Scottish C…", home: "CEL", away: "MIR", odds: null },
  { live: true, code: "U19 National", home: "ORL", away: "RAC", odds: null },
  { live: true, code: "U20 Parana…", home: "ARA", away: "CIT", odds: null },
  { live: true, code: "1. Liga", home: "HRK", away: "SLA", odds: null },
  { live: true, code: "Bundesliga", home: "SCF", away: "FCH", odds: "14.50" },
  { live: true, code: "Regionallig…", home: "KUC", away: "REI", odds: "7.25" },
];

type Match = {
  date: string;
  home: string;
  away: string;
  odds: [string, string, string];
  live?: boolean;
};

const MATCHES: Match[] = [
  { date: "LIVE · Not started", home: "Manchester City", away: "Arsenal FC", odds: ["1.85", "3.55", "4.15"], live: true },
  { date: "TOMORROW · 9:00 PM", home: "Crystal Palace", away: "West Ham United", odds: ["2.46", "3.35", "3.10"] },
  { date: "21 APR · 9:00 PM", home: "Brighton & Hove Albion", away: "Chelsea FC", odds: ["2.50", "3.75", "2.75"] },
  { date: "22 APR · 9:00 PM", home: "AFC Bournemouth", away: "Leeds United", odds: ["2.10", "3.65", "3.60"] },
  { date: "22 APR · 9:00 PM", home: "Burnley FC", away: "Manchester City", odds: ["12.00", "7.20", "1.24"] },
  { date: "24 APR · 9:00 PM", home: "Sunderland AFC", away: "Nottingham Forest", odds: ["2.90", "3.35", "2.60"] },
  { date: "25 APR · 1:30 PM", home: "Fulham FC", away: "Aston Villa", odds: ["2.70", "3.65", "2.60"] },
  { date: "25 APR · 4:00 PM", home: "Wolverhampton Wanderers", away: "Tottenham Hotspur", odds: ["4.10", "3.85", "1.90"] },
];

const BET_SLIPS = [
  { team: "Brentford FC", odds: "2.16", status: "LOST", stake: "100", payout: "0" },
  { team: "Tottenham Hotspur", odds: "2.85", status: "LOST", stake: "10", payout: "0" },
  { team: "Brighton & Hove Albion", odds: "1.64", status: "WON", stake: "55", payout: "243.71" },
];

/* ─── Tiny shared atoms ───────────────────────────────────────────────── */

const TeamDot = ({ label }: { label: string }) => (
  <div
    className="h-4 w-4 rounded-full grid place-items-center text-[7px] font-bold flex-shrink-0"
    style={{ background: "var(--p-inactive)", color: "var(--p-text)" }}
  >
    {label.slice(0, 1)}
  </div>
);

const LiveDot = () => (
  <span
    className="inline-flex items-center gap-1 px-1.5 py-[1px] rounded-full text-[8px] font-bold"
    style={{ background: "rgba(239,68,68,0.15)", color: "var(--p-live)" }}
  >
    <span className="h-1 w-1 rounded-full" style={{ background: "var(--p-live)" }} />
    LIVE
  </span>
);

/* ─── WEB VERSION ─────────────────────────────────────────────────────── */

function WebPreview({ appName, logoUrl }: { appName: string; logoUrl?: string | null }) {
  const [activeNav, setActiveNav] = useState(1); // Sports
  const [activeSport, setActiveSport] = useState(0);
  const [activeLeague, setActiveLeague] = useState(0);
  const [activeBetType, setActiveBetType] = useState(0);

  const NAV = [
    { icon: Home, label: "Feed" },
    { icon: Trophy, label: "Sports" },
    { icon: Compass, label: "Discovery" },
    { icon: Gamepad2, label: "Casino" },
    { icon: Swords, label: "Peer-to-peer" },
  ];

  return (
    <div
      className="w-full h-full flex flex-col text-[11px]"
      style={{ background: "var(--p-bg)", color: "var(--p-text)" }}
    >
      {/* Top nav */}
      <div
        className="flex items-center justify-between px-4 h-11 border-b flex-shrink-0"
        style={{ borderColor: "var(--p-divider)", background: "var(--p-nav)" }}
      >
        <div className="flex items-center gap-1">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-6 mr-2 object-contain max-w-[100px]" />
          ) : (
            <div
              className="h-6 w-6 rounded-full grid place-items-center mr-2 text-[9px] font-black"
              style={{ background: "var(--p-primary)", color: "var(--p-text)" }}
            >
              {appName.slice(0, 1)}
            </div>
          )}
          {NAV.map((n, i) => {
            const Icon = n.icon;
            const active = activeNav === i;
            return (
              <button
                key={n.label}
                onClick={() => setActiveNav(i)}
                className="flex items-center gap-1.5 px-2.5 h-7 rounded-md transition-colors"
                style={{
                  color: active ? "var(--p-primary)" : "var(--p-muted)",
                }}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="text-[10px] font-semibold">{n.label}</span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium" style={{ color: "var(--p-text)" }}>
            Sign in
          </span>
          <button
            className="h-7 px-3 rounded-md text-[10px] font-bold"
            style={{
              background: "linear-gradient(135deg, var(--p-btn), var(--p-btn-grad))",
              color: "var(--p-text)",
            }}
          >
            Create an account
          </button>
        </div>
      </div>

      {/* Main 3-column layout */}
      <div className="flex-1 min-h-0 flex">
        {/* Left sidebar */}
        <aside
          className="w-[170px] border-r flex flex-col flex-shrink-0"
          style={{ borderColor: "var(--p-divider)", background: "var(--p-nav)" }}
        >
          <div className="px-2.5 py-2">
            <div
              className="flex items-center gap-1.5 px-2 h-6 rounded-md"
              style={{ background: "var(--p-input-bg)", border: "1px solid var(--p-input-border)" }}
            >
              <Search className="h-3 w-3" style={{ color: "var(--p-muted)" }} />
              <span className="text-[9px]" style={{ color: "var(--p-muted)" }}>
                Search
              </span>
            </div>
          </div>
          <div className="px-3 pb-1 text-[9px] font-semibold" style={{ color: "var(--p-muted)" }}>
            All Sports
          </div>
          <div className="flex-1 overflow-auto px-1.5">
            {SPORTS_SIDEBAR.map((s, i) => {
              const active = i === 0;
              return (
                <button
                  key={s.name}
                  className="w-full flex items-center gap-1.5 px-1.5 h-7 rounded-md mb-0.5 text-left"
                  style={{
                    background: active ? "var(--p-odds-active)" : "transparent",
                    border: active ? "1px solid var(--p-primary)" : "1px solid transparent",
                  }}
                >
                  <span
                    className="h-3 w-3 rounded border"
                    style={{ borderColor: "var(--p-input-border)" }}
                  />
                  <span className="text-[10px]">{s.flag}</span>
                  <span
                    className="flex-1 text-[10px] font-medium"
                    style={{ color: active ? "var(--p-primary)" : "var(--p-text)" }}
                  >
                    {s.name}
                  </span>
                  <span
                    className="text-[9px] font-semibold"
                    style={{ color: "var(--p-muted)" }}
                  >
                    {s.count}
                  </span>
                  <ChevronDown className="h-2.5 w-2.5" style={{ color: "var(--p-muted)" }} />
                </button>
              );
            })}
          </div>
        </aside>

        {/* Center content */}
        <main className="flex-1 min-w-0 overflow-auto">
          <div className="px-3 py-2">
            {/* Quick tiles */}
            <div className="flex gap-1.5 mb-2">
              {QUICK_TILES.map((t) => {
                const Icon = t.icon;
                return (
                  <div
                    key={t.label}
                    className="flex flex-col items-center justify-center gap-0.5 w-14 h-14 rounded-md flex-shrink-0"
                    style={{
                      background: "var(--p-card)",
                      border: t.active
                        ? "1px solid var(--p-primary)"
                        : "1px solid var(--p-divider)",
                    }}
                  >
                    <Icon
                      className="h-3.5 w-3.5"
                      style={{ color: t.active ? "var(--p-primary)" : "var(--p-text)" }}
                    />
                    <span
                      className="text-[7.5px] font-medium text-center leading-tight px-0.5"
                      style={{ color: t.active ? "var(--p-primary)" : "var(--p-muted)" }}
                    >
                      {t.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* BetBuilder / P2P */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                className="h-8 rounded-md flex items-center justify-center gap-1.5 text-[10px] font-bold"
                style={{
                  background: "var(--p-odds-active)",
                  border: "1px solid var(--p-primary)",
                  color: "var(--p-primary)",
                }}
              >
                <Flame className="h-3 w-3" /> BetBuilder
              </button>
              <button
                className="h-8 rounded-md flex items-center justify-center gap-1.5 text-[10px] font-bold"
                style={{
                  background: "var(--p-odds-active)",
                  border: "1px solid var(--p-primary)",
                  color: "var(--p-primary)",
                }}
              >
                <ArrowLeftRight className="h-3 w-3" /> Peer-to-Peer
              </button>
            </div>

            {/* Welcome Bonus */}
            <div
              className="rounded-lg p-3 mb-3 relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, var(--p-btn), var(--p-btn-grad))",
              }}
            >
              <div className="text-[9px] font-bold tracking-wider opacity-90" style={{ color: "var(--p-text)" }}>
                GET A 100% BONUS ON YOUR FIRST DEPOSIT
              </div>
              <div className="text-[9px] mt-1 opacity-80" style={{ color: "var(--p-text)" }}>
                Enjoy 100% welcome bonus on your first deposit and double your starting stake.
              </div>
            </div>

            {/* Live & upcoming */}
            <div className="text-[12px] font-bold mb-1.5" style={{ color: "var(--p-text)" }}>
              Live & Upcoming Games
            </div>
            <div className="flex gap-2 mb-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {SPORT_TABS.map((s, i) => (
                <button
                  key={s}
                  onClick={() => setActiveSport(i)}
                  className="px-2.5 h-6 rounded-md text-[9px] font-semibold flex-shrink-0"
                  style={{
                    background: activeSport === i ? "var(--p-odds-active)" : "transparent",
                    border:
                      activeSport === i
                        ? "1px solid var(--p-primary)"
                        : "1px solid var(--p-divider)",
                    color: activeSport === i ? "var(--p-primary)" : "var(--p-muted)",
                  }}
                >
                  {s} {i < 3 ? "⚽" : ""}
                </button>
              ))}
            </div>

            {/* Live row */}
            <div className="grid grid-cols-6 gap-1.5 mb-3">
              {LIVE_UPCOMING.map((m, i) => (
                <div
                  key={i}
                  className="rounded-md p-1.5"
                  style={{ background: "var(--p-card)", border: "1px solid var(--p-divider)" }}
                >
                  <LiveDot />
                  <div className="text-[8px] mt-1 truncate" style={{ color: "var(--p-muted)" }}>
                    {m.code}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[9px] font-bold" style={{ color: "var(--p-text)" }}>
                      {m.home}
                    </span>
                    {m.odds && (
                      <span className="text-[8px]" style={{ color: "var(--p-muted)" }}>
                        {m.odds}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold" style={{ color: "var(--p-text)" }}>
                      {m.away}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Soccer tabs */}
            <div className="flex items-center justify-between border-b mb-2" style={{ borderColor: "var(--p-divider)" }}>
              <div className="flex">
                {["Soccer", "Basketball", "Tennis", "TT Elite Series"].map((t, i) => (
                  <button
                    key={t}
                    className="px-3 h-7 text-[10px] font-semibold relative"
                    style={{ color: i === 0 ? "var(--p-text)" : "var(--p-muted)" }}
                  >
                    {t}
                    {i === 0 && (
                      <span
                        className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full"
                        style={{ background: "var(--p-primary)" }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Trophy className="h-3 w-3" style={{ color: "var(--p-text)" }} />
                <span className="text-[11px] font-bold" style={{ color: "var(--p-text)" }}>
                  Soccer
                </span>
              </div>
              <button className="text-[9px] font-semibold flex items-center gap-0.5" style={{ color: "var(--p-primary)" }}>
                SEE MORE <ChevronRight className="h-2.5 w-2.5" />
              </button>
            </div>

            {/* League pills */}
            <div className="flex gap-1.5 mb-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {LEAGUE_TABS.map((l, i) => (
                <button
                  key={l}
                  onClick={() => setActiveLeague(i)}
                  className="px-2.5 h-6 rounded-full text-[9px] font-semibold flex-shrink-0"
                  style={{
                    background: activeLeague === i ? "var(--p-odds-active)" : "transparent",
                    border:
                      activeLeague === i
                        ? "1px solid var(--p-primary)"
                        : "1px solid var(--p-divider)",
                    color: activeLeague === i ? "var(--p-primary)" : "var(--p-muted)",
                  }}
                >
                  ⚽ {l}
                </button>
              ))}
            </div>

            {/* Bet type pills */}
            <div className="flex gap-1.5 mb-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {BET_TYPE_TABS.map((b, i) => (
                <button
                  key={b}
                  onClick={() => setActiveBetType(i)}
                  className="px-2.5 h-6 rounded-md text-[9px] font-semibold flex-shrink-0"
                  style={{
                    background: activeBetType === i ? "var(--p-odds-active)" : "transparent",
                    border:
                      activeBetType === i
                        ? "1px solid var(--p-primary)"
                        : "1px solid var(--p-divider)",
                    color: activeBetType === i ? "var(--p-primary)" : "var(--p-muted)",
                  }}
                >
                  {b}
                </button>
              ))}
            </div>

            {/* Match cards (2-column grid) */}
            <div className="grid grid-cols-2 gap-2">
              {MATCHES.map((m, i) => (
                <div
                  key={i}
                  className="rounded-md p-2"
                  style={{ background: "var(--p-card)", border: "1px solid var(--p-divider)" }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className="text-[8px] font-semibold"
                      style={{ color: m.live ? "var(--p-live)" : "var(--p-primary)" }}
                    >
                      {m.date}
                    </span>
                    <div className="flex gap-3 text-[8px] font-bold" style={{ color: "var(--p-muted)" }}>
                      <span>1</span>
                      <span>X</span>
                      <span>2</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <TeamDot label={m.home} />
                        <span className="text-[9.5px] font-medium truncate" style={{ color: "var(--p-text)" }}>
                          {m.home}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <TeamDot label={m.away} />
                        <span className="text-[9.5px] font-medium truncate" style={{ color: "var(--p-text)" }}>
                          {m.away}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {m.odds.map((o, j) => (
                        <button
                          key={j}
                          className="w-9 h-9 rounded-md text-[10px] font-bold"
                          style={{
                            background: "var(--p-odds-active)",
                            border: "1px solid var(--p-primary)",
                            color: "var(--p-primary)",
                          }}
                        >
                          {o}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-[8px]" style={{ color: "var(--p-muted)" }}>
                      STATS
                    </span>
                    <span className="text-[8px] font-semibold flex items-center gap-0.5" style={{ color: "var(--p-primary)" }}>
                      MORE BETS <ChevronRight className="h-2 w-2" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Right bet panel */}
        <aside
          className="w-[200px] border-l flex flex-col flex-shrink-0"
          style={{ borderColor: "var(--p-divider)", background: "var(--p-nav)" }}
        >
          <div className="text-center py-2 text-[10px] font-bold" style={{ color: "var(--p-text)" }}>
            My Bets Panel
          </div>
          <div
            className="flex border-b text-[9px] font-semibold"
            style={{ borderColor: "var(--p-divider)" }}
          >
            {["All", "PENDING", "Settled", "P2P Bets"].map((t, i) => (
              <button
                key={t}
                className="flex-1 h-7 relative"
                style={{ color: i === 0 ? "var(--p-text)" : "var(--p-muted)" }}
              >
                {t}
                {i === 0 && (
                  <span
                    className="absolute bottom-0 left-1/4 right-1/4 h-[2px] rounded-full"
                    style={{ background: "var(--p-primary)" }}
                  />
                )}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-auto p-2 space-y-2">
            {BET_SLIPS.map((b, i) => {
              const isWon = b.status === "WON";
              return (
                <div
                  key={i}
                  className="rounded-md p-2"
                  style={{ background: "var(--p-card)", border: "1px solid var(--p-divider)" }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1">
                      <TeamDot label={b.team} />
                      <span className="text-[9px] font-bold" style={{ color: "var(--p-text)" }}>
                        {b.team.slice(0, 12)}…
                      </span>
                    </div>
                    <span
                      className="text-[8px] font-bold px-1.5 py-[1px] rounded"
                      style={{
                        background: isWon
                          ? "linear-gradient(135deg, var(--p-won1), var(--p-won2))"
                          : "rgba(239,68,68,0.15)",
                        color: isWon ? "var(--p-text)" : "var(--p-live)",
                      }}
                    >
                      {b.status}
                    </span>
                  </div>
                  <div className="text-[8px]" style={{ color: "var(--p-muted)" }}>
                    1x2 · odds {b.odds}
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[9px]">
                    <span style={{ color: "var(--p-muted)" }}>STAKE</span>
                    <span className="font-bold" style={{ color: "var(--p-text)" }}>
                      ₦{b.stake}
                    </span>
                    <span style={{ color: "var(--p-muted)" }}>PAYOUT</span>
                    <span className="font-bold" style={{ color: isWon ? "var(--p-success)" : "var(--p-text)" }}>
                      ₦{b.payout}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ─── MOBILE VERSION ──────────────────────────────────────────────────── */

type MobileView = "sports" | "allsports" | "social" | "betdetail";

const MOBILE_VIEW_TABS: { id: MobileView; label: string }[] = [
  { id: "sports", label: "Sports" },
  { id: "allsports", label: "All Sports" },
  { id: "social", label: "Social" },
  { id: "betdetail", label: "Bet Detail" },
];

const ALL_SPORTS_LIST = [
  { name: "Soccer", count: 183, icon: "⚽" },
  { name: "Basketball", count: 57, icon: "🏀" },
  { name: "Tennis", count: 15, icon: "🎾" },
  { name: "Volleyball", count: 16, icon: "🏐" },
  { name: "Table Tennis", count: 5, icon: "🏓" },
  { name: "Ice Hockey", count: 22, icon: "🏒" },
  { name: "American Football", count: 6, icon: "🏈" },
  { name: "Rugby", count: 15, icon: "🏉" },
];

type SocialBetLeg = { sport: string; market: string; selection: string; vs: string; odds: string };
type SocialPost = {
  user: string;
  initial: string;
  boost: string;
  league?: string;
  status?: "PENDING" | "LOST" | "WON" | "LIVE";
  title: string;
  stake: string;
  payout: string;
  match?: { home: string; away: string; date: string; score?: string };
  pick?: { market: string; selection: string; odds: string };
  legs?: SocialBetLeg[];
};

const FRIENDS_POSTS: SocialPost[] = [
  {
    user: "Akinwale1",
    initial: "A",
    boost: "75% PROFIT BOOST",
    league: "ATP Madrid, Spain Men Singles",
    status: "PENDING",
    title: "17 Selection Multi",
    stake: "15119.89",
    payout: "26459.06",
    legs: [
      { sport: "🎾", market: "Total", selection: "under 22.5", vs: "Rocha, Henrique vs Choinski, Jan", odds: "1.75" },
      { sport: "🎾", market: "Handicap", selection: "Tomova, Viktoriya -2.5", vs: "Tomova, Viktoriya vs Pavlyuchenkova, Anastasia", odds: "1.83" },
      { sport: "🎾", market: "Total", selection: "under 22.5", vs: "Vallejo, Adolfo Daniel vs Martinez, Pedro", odds: "1.77" },
      { sport: "🎾", market: "Handicap", selection: "Halys, Quentin -0.5", vs: "Halys, Quentin vs Faria, Jaime", odds: "1.85" },
    ],
  },
];

const EXPLORE_POSTS: SocialPost[] = [
  {
    user: "rammers",
    initial: "R",
    boost: "",
    league: "Premier League",
    status: "LOST",
    title: "Manchester City vs Arsenal FC",
    match: { home: "Manchester City", away: "Arsenal FC", date: "19 APR, 5:30 PM", score: "2 : 1" },
    pick: { market: "Match Winner", selection: "Arsenal FC", odds: "4.60" },
    stake: "200000.00",
    payout: "920000.00",
  },
  {
    user: "Akinwale1",
    initial: "A",
    boost: "45% PROFIT BOOST",
    league: "NBA, WTA Rouen, France Women Singles",
    status: "LOST",
    title: "12 Selection Multi",
    stake: "1528.64",
    payout: "2216.08",
    legs: [
      { sport: "🏀", market: "Handicap", selection: "Toronto Raptors +8.5", vs: "Toronto Raptors vs Cleveland Cavaliers", odds: "1.85" },
    ],
  },
  {
    user: "Keleya",
    initial: "K",
    boost: "",
    league: "FA Cup",
    status: "LIVE",
    title: "Xiamen Chengyi vs Shenzhen 2028 FC",
    match: { home: "Xiamen Chengyi", away: "Shenzhen 2028 FC", date: "20 APR, 9:00 AM" },
    pick: { market: "Match Winner", selection: "Shenzhen 2028 FC", odds: "1.18" },
    stake: "900.00",
    payout: "1062.00",
  },
];

function MobilePreview({ appName, currencySymbol, logoUrl }: { appName: string; currencySymbol: string; logoUrl?: string | null }) {
  const [activeNav, setActiveNav] = useState(0);
  const [activeSport, setActiveSport] = useState(0);
  const [activeLeague, setActiveLeague] = useState(0);
  const [activeBetType, setActiveBetType] = useState(0);
  const [view, setView] = useState<MobileView>("sports");
  const [socialTab, setSocialTab] = useState<"friends" | "explore">("friends");

  const NAV: { icon: typeof Home; label: string; view: MobileView | "home" }[] = [
    { icon: Home, label: "home", view: "sports" },
    { icon: Trophy, label: "Sports", view: "allsports" },
    { icon: Compass, label: "Discovery", view: "betdetail" },
    { icon: Gamepad2, label: "Casino", view: "betdetail" },
    { icon: User, label: "Social", view: "social" },
  ];

  const handleNavClick = (i: number) => {
    setActiveNav(i);
    setView(NAV[i].view as MobileView);
  };

  return (
    <div
      className="w-full h-full flex flex-col text-[11px] overflow-hidden"
      style={{ background: "var(--p-bg)", color: "var(--p-text)" }}
    >
      {/* Animated content area */}
      <div key={view} className="flex-1 min-h-0 flex flex-col" style={{ animation: "fadeIn 220ms ease" }}>
        {view === "sports" && (
          <SportsView
            appName={appName}
            currencySymbol={currencySymbol}
            logoUrl={logoUrl}
            activeSport={activeSport}
            setActiveSport={setActiveSport}
            activeLeague={activeLeague}
            setActiveLeague={setActiveLeague}
            activeBetType={activeBetType}
            setActiveBetType={setActiveBetType}
            onOpenAllSports={() => { setView("allsports"); setActiveNav(1); }}
            onOpenBetDetail={() => { setView("betdetail"); }}
          />
        )}
        {view === "allsports" && <AllSportsView />}
        {view === "social" && <SocialView socialTab={socialTab} setSocialTab={setSocialTab} currencySymbol={currencySymbol} />}
        {view === "betdetail" && <BetDetailView currencySymbol={currencySymbol} />}
      </div>

      {/* Bottom nav */}
      <div
        className="grid grid-cols-5 border-t flex-shrink-0"
        style={{
          borderColor: "var(--p-divider)",
          background: "var(--p-bottom-nav)",
        }}
      >
        {NAV.map((n, i) => {
          const Icon = n.icon;
          const active = activeNav === i;
          const isProfile = n.label === "Profile";
          return (
            <button
              key={n.label}
              onClick={() => setActiveNav(i)}
              className="flex flex-col items-center justify-center gap-0.5 h-12 relative"
            >
              {active && !isProfile && (
                <span
                  className="absolute top-0 left-3 right-3 h-[2px] rounded-full"
                  style={{ background: "var(--p-primary)" }}
                />
              )}
              {isProfile ? (
                <div
                  className="h-5 w-5 rounded-full grid place-items-center text-[8px] font-black"
                  style={{
                    background: "linear-gradient(135deg, var(--p-btn), var(--p-btn-grad))",
                    color: "var(--p-text)",
                  }}
                >
                  TN
                </div>
              ) : (
                <Icon
                  className="h-4 w-4"
                  style={{ color: active ? "var(--p-primary)" : "var(--p-muted)" }}
                />
              )}
              <span
                className="text-[9px] font-medium"
                style={{ color: active || isProfile ? "var(--p-primary)" : "var(--p-muted)" }}
              >
                {n.label}
              </span>
            </button>
          );
        })}
      </div>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}

/* ─── Sub-views ───────────────────────────────────────────────────────── */

function SportsView({
  appName, currencySymbol, logoUrl,
  activeSport, setActiveSport, activeLeague, setActiveLeague, activeBetType, setActiveBetType,
  onOpenAllSports,
}: {
  appName: string; currencySymbol: string; logoUrl?: string | null;
  activeSport: number; setActiveSport: (n: number) => void;
  activeLeague: number; setActiveLeague: (n: number) => void;
  activeBetType: number; setActiveBetType: (n: number) => void;
  onOpenAllSports: () => void;
  onOpenBetDetail: () => void;
}) {
      {/* Quick tile row */}
      <div className="grid grid-cols-5 gap-1.5 px-3 mb-2 flex-shrink-0">
        {MOBILE_TILES.map((t) => {
          const Icon = t.icon;
          const isAllSports = t.label === "All Sports";
          return (
            <button
              key={t.label}
              onClick={isAllSports ? onOpenAllSports : undefined}
              className="flex flex-col items-center justify-center gap-0.5 h-14 rounded-md"
              style={{
                background: "var(--p-card)",
                border: t.active ? "1px solid var(--p-primary)" : "1px solid var(--p-divider)",
              }}
            >
              <Icon className="h-4 w-4" style={{ color: t.active ? "var(--p-primary)" : "var(--p-text)" }} />
              <span className="text-[8px] font-medium" style={{ color: t.active ? "var(--p-primary)" : "var(--p-muted)" }}>{t.label}</span>
            </div>
          );
        })}
      </div>

      <div className="flex-1 min-h-0 overflow-auto px-3 pb-2">
        <div className="grid grid-cols-2 gap-2 mb-2">
          <button className="h-9 rounded-md flex items-center justify-center gap-1.5 text-[11px] font-bold"
            style={{ background: "var(--p-odds-active)", border: "1px solid var(--p-primary)", color: "var(--p-primary)" }}>
            <Flame className="h-3.5 w-3.5" /> BetBuilder
          </button>
          <button className="h-9 rounded-md flex items-center justify-center gap-1.5 text-[11px] font-bold"
            style={{ background: "var(--p-odds-active)", border: "1px solid var(--p-primary)", color: "var(--p-primary)" }}>
            <ArrowLeftRight className="h-3.5 w-3.5" /> Peer-to-Peer
          </button>
        </div>

        <div className="rounded-lg p-3 mb-3 relative"
          style={{ background: "linear-gradient(135deg, var(--p-btn), var(--p-btn-grad))", border: "1px solid var(--p-primary)" }}>
          <div className="text-[12px] font-black" style={{ color: "var(--p-text)" }}>WELCOME BONUS</div>
          <div className="text-[9.5px] mt-1 leading-tight" style={{ color: "var(--p-text)" }}>
            Get a Free Sportsbook Pick or Enjoy 50% More Casino Cash For Casino Games
          </div>
        </div>

        <div className="text-[12px] font-bold mb-1.5" style={{ color: "var(--p-text)" }}>Live & Upcoming</div>
        <div className="flex gap-2 mb-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {SPORT_TABS.map((s, i) => (
            <button key={s} onClick={() => setActiveSport(i)}
              className="px-2.5 h-6 rounded-md text-[10px] font-semibold flex-shrink-0"
              style={{
                background: activeSport === i ? "var(--p-odds-active)" : "transparent",
                border: activeSport === i ? "1px solid var(--p-primary)" : "1px solid var(--p-divider)",
                color: activeSport === i ? "var(--p-primary)" : "var(--p-muted)",
              }}>{s}</button>
          ))}
        </div>

        <div className="flex gap-1.5 mb-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {LEAGUE_TABS.slice(0, 3).map((l, i) => (
            <button key={l} onClick={() => setActiveLeague(i)}
              className="px-2.5 h-6 rounded-full text-[9.5px] font-semibold flex-shrink-0"
              style={{
                background: activeLeague === i ? "var(--p-odds-active)" : "transparent",
                border: activeLeague === i ? "1px solid var(--p-primary)" : "1px solid var(--p-divider)",
                color: activeLeague === i ? "var(--p-primary)" : "var(--p-muted)",
              }}>⚽ {l.split(" - ")[0]}</button>
          ))}
        </div>

        <div className="flex gap-1.5 mb-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {BET_TYPE_TABS.slice(0, 5).map((b, i) => (
            <button key={b} onClick={() => setActiveBetType(i)}
              className="px-2.5 h-6 rounded-md text-[9.5px] font-semibold flex-shrink-0"
              style={{
                background: activeBetType === i ? "var(--p-odds-active)" : "transparent",
                border: activeBetType === i ? "1px solid var(--p-primary)" : "1px solid var(--p-divider)",
                color: activeBetType === i ? "var(--p-primary)" : "var(--p-muted)",
              }}>{b}</button>
          ))}
        </div>

        <div className="space-y-2">
          {MATCHES.slice(0, 4).map((m, i) => (
            <div key={i} className="rounded-md p-2.5"
              style={{ background: "var(--p-card)", border: "1px solid var(--p-divider)" }}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] font-semibold" style={{ color: m.live ? "var(--p-live)" : "var(--p-primary)" }}>{m.date}</span>
                <div className="flex gap-5 text-[9px] font-bold" style={{ color: "var(--p-muted)" }}>
                  <span>1</span><span>X</span><span>2</span>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <TeamDot label={m.home} />
                    <span className="text-[10.5px] font-medium truncate" style={{ color: "var(--p-text)" }}>{m.home}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <TeamDot label={m.away} />
                    <span className="text-[10.5px] font-medium truncate" style={{ color: "var(--p-text)" }}>{m.away}</span>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {m.odds.map((o, j) => (
                    <button key={j} className="w-10 h-10 rounded-md text-[11px] font-bold"
                      style={{ background: "var(--p-odds-active)", border: "1px solid var(--p-primary)", color: "var(--p-primary)" }}>{o}</button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function AllSportsView() {
  return (
    <div className="flex-1 min-h-0 overflow-auto">
      {/* Search bar */}
      <div className="px-3 pt-3 pb-2 flex items-center gap-2">
        <ChevronRight className="h-4 w-4 rotate-180" style={{ color: "var(--p-text)" }} />
        <div className="flex-1 flex items-center gap-2 px-3 h-9 rounded-full"
          style={{ background: "var(--p-card)", border: "1px solid var(--p-divider)" }}>
          <Search className="h-3.5 w-3.5" style={{ color: "var(--p-muted)" }} />
          <span className="text-[10.5px]" style={{ color: "var(--p-muted)" }}>Search teams, players and events</span>
        </div>
      </div>

      {/* Popular */}
      <div className="px-3 pt-2 pb-3">
        <div className="text-[11px] font-semibold mb-2" style={{ color: "var(--p-muted)" }}>Popular</div>
        <div className="flex flex-col items-start gap-1">
          <div className="h-12 w-12 rounded-xl grid place-items-center"
            style={{ background: "var(--p-card)", border: "1px solid var(--p-divider)" }}>
            <span className="text-[18px] font-black" style={{ color: "var(--p-text)" }}>V</span>
          </div>
          <span className="text-[10px]" style={{ color: "var(--p-muted)" }}>Virtuals</span>
        </div>
      </div>

      {/* All Sports */}
      <div className="px-3">
        <div className="text-[14px] font-bold mb-2" style={{ color: "var(--p-text)" }}>All Sports</div>
        <div className="space-y-2 pb-3">
          {ALL_SPORTS_LIST.map((s) => (
            <div key={s.name}
              className="flex items-center gap-2.5 px-3 h-11 rounded-xl"
              style={{ background: "var(--p-card)", border: "1px solid var(--p-divider)" }}>
              <div className="h-6 w-6 rounded-full grid place-items-center text-[12px]"
                style={{ background: "var(--p-odds-active)", border: "1px solid var(--p-primary)" }}>
                <span style={{ color: "var(--p-primary)" }}>{s.icon}</span>
              </div>
              <span className="flex-1 text-[11.5px] font-semibold" style={{ color: "var(--p-text)" }}>{s.name}</span>
              <span className="text-[11px] font-medium" style={{ color: "var(--p-muted)" }}>{s.count}</span>
              <ChevronDown className="h-3.5 w-3.5" style={{ color: "var(--p-primary)" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SocialPostCard({ post, currencySymbol }: { post: SocialPost; currencySymbol: string }) {
  const statusBg =
    post.status === "PENDING" ? "rgba(0,0,0,0.5)" :
    post.status === "LIVE" ? "linear-gradient(135deg, var(--p-btn), var(--p-btn-grad))" :
    post.status === "WON" ? "linear-gradient(135deg, var(--p-won1), var(--p-won2))" :
    post.status === "LOST" ? "var(--p-secondary)" :
    "transparent";

  return (
    <div className="rounded-xl p-3 mb-2"
      style={{ background: "var(--p-card)", border: "1px solid var(--p-divider)" }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="h-7 w-7 rounded-full grid place-items-center text-[11px] font-black"
          style={{ background: "linear-gradient(135deg, var(--p-btn), var(--p-btn-grad))", color: "var(--p-text)" }}>
          {post.initial}
        </div>
        <span className="text-[12px] font-bold flex-1" style={{ color: "var(--p-text)" }}>{post.user}</span>
        {post.boost && (
          <span className="text-[8.5px] font-bold px-2 py-1 rounded-md"
            style={{ background: "rgba(0,0,0,0.4)", color: "var(--p-primary)" }}>
            {post.boost}
          </span>
        )}
      </div>

      {/* League + status */}
      {(post.league || post.status) && (
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Trophy className="h-3 w-3 flex-shrink-0" style={{ color: "var(--p-muted)" }} />
            <span className="text-[10px] truncate" style={{ color: "var(--p-muted)" }}>{post.league}</span>
          </div>
          {post.status && (
            <span className="text-[8.5px] font-black px-2 py-0.5 rounded-full flex items-center gap-1"
              style={{ background: statusBg, color: "var(--p-text)" }}>
              {post.status === "LIVE" && <span className="h-1 w-1 rounded-full bg-white" />}
              {post.status}
            </span>
          )}
        </div>
      )}

      {/* Title */}
      <div className="text-[14px] font-bold mb-2" style={{ color: "var(--p-text)" }}>{post.title}</div>

      {/* Match w/ pick */}
      {post.match && (
        <div className="rounded-lg p-2 mb-2" style={{ background: "rgba(0,0,0,0.25)" }}>
          <div className="flex items-center justify-between text-[10px] mb-1" style={{ color: "var(--p-muted)" }}>
            <div className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-full" style={{ background: "var(--p-inactive)" }} />
              <span style={{ color: "var(--p-text)" }}>{post.match.home}</span>
            </div>
            <span style={{ color: "var(--p-primary)" }}>{post.match.date}</span>
            <div className="flex items-center gap-1">
              <span style={{ color: "var(--p-text)" }}>{post.match.away}</span>
              <span className="h-3 w-3 rounded-full" style={{ background: "var(--p-inactive)" }} />
            </div>
          </div>
          {post.match.score && (
            <div className="text-center text-[11px] font-bold" style={{ color: "var(--p-text)" }}>{post.match.score}</div>
          )}
          {post.pick && (
            <div className="mt-2 flex items-center justify-between rounded-md px-2 py-1.5"
              style={{ background: "var(--p-bg)", border: "1px solid var(--p-primary)" }}>
              <div className="min-w-0">
                <div className="text-[8.5px] font-bold" style={{ color: "var(--p-primary)" }}>{post.pick.market}</div>
                <div className="text-[11px] font-bold truncate" style={{ color: "var(--p-text)" }}>{post.pick.selection}</div>
              </div>
              <span className="text-[12px] font-black ml-2" style={{ color: "var(--p-primary)" }}>{post.pick.odds}</span>
            </div>
          )}
        </div>
      )}

      {/* Legs */}
      {post.legs && post.legs.length > 0 && (
        <div className="space-y-1.5 mb-2">
          {post.legs.map((leg, i) => (
            <div key={i} className="rounded-md p-2" style={{ background: "rgba(0,0,0,0.25)" }}>
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="text-[8.5px] font-bold mb-0.5" style={{ color: "var(--p-primary)" }}>{leg.market}</div>
                  <div className="text-[11px] font-bold truncate" style={{ color: "var(--p-text)" }}>{leg.selection}</div>
                  <div className="text-[8.5px] mt-0.5 truncate" style={{ color: "var(--p-muted)" }}>
                    <span style={{ color: "var(--p-secondary)" }}>vs</span> {leg.vs.split(" vs ")[1] ?? leg.vs}
                  </div>
                </div>
                <span className="text-[12px] font-black ml-2" style={{ color: "var(--p-primary)" }}>{leg.odds}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stake/payout */}
      <div className="flex items-center justify-between text-[9px] pt-2 border-t" style={{ borderColor: "var(--p-divider)" }}>
        <span style={{ color: "var(--p-muted)" }}>STAKE</span>
        <span className="font-bold" style={{ color: "var(--p-text)" }}>{currencySymbol} {post.stake}</span>
        <span className="font-bold" style={{ color: "var(--p-primary)" }}>{currencySymbol} {post.payout}</span>
        <span style={{ color: "var(--p-muted)" }}>PAYOUT</span>
      </div>

      {/* Reactions */}
      <div className="flex items-center gap-3 mt-2 pt-2 text-[10px]" style={{ color: "var(--p-muted)" }}>
        <span>♡ 0</span>
        <span>💬 0</span>
        <span style={{ color: "var(--p-primary)" }}>⚡ 0 Rebets</span>
        <span className="ml-auto">⤴</span>
      </div>
    </div>
  );
}

function SocialView({ socialTab, setSocialTab, currencySymbol }: { socialTab: "friends" | "explore"; setSocialTab: (t: "friends" | "explore") => void; currencySymbol: string }) {
  const posts = socialTab === "friends" ? FRIENDS_POSTS : EXPLORE_POSTS;
  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2 flex-shrink-0">
        <div className="h-7 w-7 rounded-full grid place-items-center text-[10px] font-black"
          style={{ background: "var(--p-primary)", color: "var(--p-text)" }}>✓</div>
        <div className="flex items-center gap-1.5 px-2.5 h-6 rounded-full" style={{ background: "var(--p-card)" }}>
          <span className="text-[10px] font-bold" style={{ color: "var(--p-text)" }}>{currencySymbol}</span>
          <span className="text-[10px] tracking-wider" style={{ color: "var(--p-text)" }}>****</span>
          <Plus className="h-3 w-3" style={{ color: "var(--p-primary)" }} />
          <EyeOff className="h-3 w-3" style={{ color: "var(--p-muted)" }} />
        </div>
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4" style={{ color: "var(--p-text)" }} />
          <MessageCircle className="h-4 w-4" style={{ color: "var(--p-text)" }} />
        </div>
      </div>

      {/* Friends/Explore tabs */}
      <div className="flex border-b flex-shrink-0" style={{ borderColor: "var(--p-divider)" }}>
        {(["friends", "explore"] as const).map((t) => {
          const active = socialTab === t;
          return (
            <button key={t} onClick={() => setSocialTab(t)}
              className="flex-1 h-9 text-[12px] font-bold relative"
              style={{ color: active ? "var(--p-text)" : "var(--p-muted)" }}>
              {t === "friends" ? "Friends" : "Explore"}
              {active && (
                <span className="absolute bottom-0 left-6 right-6 h-[2px] rounded-full"
                  style={{ background: "var(--p-primary)" }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Posts */}
      <div className="flex-1 min-h-0 overflow-auto px-3 pt-2 pb-2">
        {posts.map((p, i) => <SocialPostCard key={i} post={p} currencySymbol={currencySymbol} />)}
      </div>
    </div>
  );
}

function BetDetailView({ currencySymbol }: { currencySymbol: string }) {
  return (
    <div className="flex-1 min-h-0 overflow-auto px-3 pt-3 pb-2">
      <div className="rounded-xl p-3 mb-2"
        style={{ background: "var(--p-card)", border: "1px solid var(--p-divider)" }}>
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Trophy className="h-3 w-3" style={{ color: "var(--p-muted)" }} />
            <span className="text-[10px] truncate" style={{ color: "var(--p-muted)" }}>Premier League, Serie A</span>
          </div>
          <span className="text-[8.5px] font-black px-2 py-0.5 rounded-full"
            style={{ background: "rgba(0,0,0,0.5)", color: "var(--p-primary)" }}>PENDING</span>
        </div>

        <div className="flex items-baseline justify-between mb-2">
          <div className="text-[14px] font-black" style={{ color: "var(--p-text)" }}>13 Selection Flex Multi</div>
          <div className="text-[12px] font-bold" style={{ color: "var(--p-primary)" }}>214.22 ~ 27.46</div>
        </div>

        {/* Match */}
        <div className="rounded-lg p-2 mb-2" style={{ background: "rgba(0,0,0,0.25)" }}>
          <div className="flex items-center justify-between text-[10px] mb-1">
            <div className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-full" style={{ background: "var(--p-inactive)" }} />
              <span style={{ color: "var(--p-text)" }}>Crystal Palace</span>
            </div>
            <div className="text-center">
              <div className="text-[8.5px] font-bold" style={{ color: "var(--p-primary)" }}>20 APR</div>
              <div className="text-[8.5px]" style={{ color: "var(--p-muted)" }}>9:00 PM</div>
            </div>
            <div className="flex items-center gap-1">
              <span style={{ color: "var(--p-text)" }}>West Ham United</span>
              <span className="h-3 w-3 rounded-full" style={{ background: "var(--p-inactive)" }} />
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between rounded-md px-2 py-1.5"
            style={{ background: "var(--p-bg)", border: "1px solid var(--p-primary)" }}>
            <div>
              <div className="text-[8.5px] font-bold" style={{ color: "var(--p-primary)" }}>Total</div>
              <div className="text-[12px] font-black" style={{ color: "var(--p-text)" }}>over 2.5</div>
            </div>
            <span className="text-[13px] font-black" style={{ color: "var(--p-primary)" }}>1.92</span>
          </div>
        </div>

        {/* Pagination dots */}
        <div className="flex items-center justify-center gap-1 mb-2">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--p-primary)" }} />
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} className="h-1 w-1 rounded-full" style={{ background: "var(--p-inactive)" }} />
          ))}
        </div>

        {/* Flex Cuts */}
        <div className="rounded-lg p-2 mb-2" style={{ background: "rgba(0,0,0,0.25)", border: "1px solid var(--p-primary)" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold flex items-center gap-1" style={{ color: "var(--p-primary)" }}>
              <Flame className="h-3 w-3" /> FLEX CUTS
            </span>
            <span className="text-[10px] font-bold" style={{ color: "var(--p-primary)" }}>1.27 - 3.14</span>
          </div>
          <div className="grid grid-cols-3 text-[8.5px] font-bold pb-1 border-b" style={{ color: "var(--p-muted)", borderColor: "var(--p-divider)" }}>
            <span>OUTCOME</span><span>ODDS</span><span className="text-right">PAYOUT</span>
          </div>
          <div className="grid grid-cols-3 text-[10px] py-1.5" style={{ color: "var(--p-text)" }}>
            <span>12 of 13 correct</span><span>1.27</span><span className="text-right">{currencySymbol} 155.53</span>
          </div>
          <div className="grid grid-cols-3 text-[10px]" style={{ color: "var(--p-text)" }}>
            <span>13 of 13 correct</span><span>3.14</span><span className="text-right">{currencySymbol} 383.35</span>
          </div>
        </div>

        {/* Stake */}
        <div className="flex items-center justify-between text-[9px] pt-1 border-t" style={{ borderColor: "var(--p-divider)" }}>
          <span style={{ color: "var(--p-muted)" }}>STAKE</span>
          <span className="font-bold" style={{ color: "var(--p-text)" }}>{currencySymbol} 122.00</span>
          <span className="font-bold" style={{ color: "var(--p-primary)" }}>{currencySymbol} 26135.44</span>
          <span style={{ color: "var(--p-muted)" }}>PAYOUT</span>
        </div>
        <div className="flex items-center gap-3 mt-2 text-[10px]" style={{ color: "var(--p-muted)" }}>
          <span>♡ 0</span><span>💬 0</span>
          <span style={{ color: "var(--p-primary)" }}>⚡ 0 Rebets</span>
          <span className="ml-auto">⤴</span>
        </div>
        <div className="text-[8.5px] mt-1" style={{ color: "var(--p-muted)" }}>an hour ago</div>
      </div>

      {/* Second card */}
      <SocialPostCard
        post={{
          user: "Bosseysa", initial: "B", boost: "20% PROFIT BOOST",
          league: "FA Cup, U21 Professional Development Lea…", status: "PENDING",
          title: "9 Selection Multi", stake: "36.85", payout: "44.03",
        }}
        currencySymbol={currencySymbol}
      />
    </div>
  );
}

/* ─── Main exported component ─────────────────────────────────────────── */

const BettingAppPreview = () => {
  const { themeColors, appLabels, appIcons, previewMode, headingFont } = useStudio();
  const isMobile = previewMode === "mobile";

  const previewVars = {
    "--p-bg": themeColors.primaryBg,
    "--p-primary": themeColors.primary,
    "--p-secondary": themeColors.secondary,
    "--p-text": themeColors.lightText,
    "--p-muted": themeColors.placeholder,
    "--p-btn": themeColors.primaryButton,
    "--p-btn-grad": themeColors.primaryButtonGradient,
    "--p-inactive": themeColors.inactiveButton,
    "--p-won1": themeColors.wonGradient1,
    "--p-won2": themeColors.wonGradient2,
    "--p-card": themeColors.cardBackground,
    "--p-nav": themeColors.navBarBackground,
    "--p-bottom-nav": themeColors.bottomNavBackground,
    "--p-odds-active": themeColors.oddsButtonActive,
    "--p-odds-inactive": themeColors.oddsButtonInactive,
    "--p-live": themeColors.liveBadge,
    "--p-success": themeColors.successColor,
    "--p-input-bg": themeColors.inputBackground,
    "--p-input-border": themeColors.inputBorder,
    "--p-divider": themeColors.dividerColor,
    fontFamily: headingFont + ", sans-serif",
  } as React.CSSProperties;

  return (
    <div
      className="flex items-center justify-center w-full h-full p-4"
      style={previewVars}
    >
      {isMobile ? (
        <div
          className="relative overflow-hidden rounded-[36px] shadow-2xl"
          style={{
            width: 340,
            height: 700,
            border: "3px solid #1a1a1a",
            background: "var(--p-bg)",
          }}
        >
          <MobilePreview appName={appLabels.appName} currencySymbol={appLabels.currencySymbol} logoUrl={appIcons.appNameLogo} />
        </div>
      ) : (
        <div
          className="relative overflow-hidden rounded-xl shadow-2xl w-full"
          style={{
            maxWidth: 1100,
            height: "min(680px, calc(100vh - 220px))",
            border: "1px solid rgba(255,255,255,0.08)",
            background: "var(--p-bg)",
          }}
        >
          <WebPreview appName={appLabels.appName} logoUrl={appIcons.appNameLogo} />
        </div>
      )}
    </div>
  );
};

export default BettingAppPreview;
