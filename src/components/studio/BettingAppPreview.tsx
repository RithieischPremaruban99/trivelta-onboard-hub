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
  ChevronLeft,
  Radio,
  Code2,
  Clapperboard,
  Swords,
  Joystick,
  Flame,
  ArrowLeftRight,
  Heart,
  Share2,
  Users,
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
  { icon: Radio, label: "Live Sports", nav: 1 },
  { icon: Code2, label: "Load Code", nav: 2 },
  { icon: Clapperboard, label: "Virtuals", nav: 3 },
  { icon: ArrowLeftRight, label: "Peer to Peer", nav: 4 },
  { icon: Joystick, label: "Gamers Paradise", nav: 3 },
];

const MOBILE_TILES = [
  { icon: Trophy, label: "All Sports", nav: 1 },
  { icon: Radio, label: "Live Spo.", nav: 1 },
  { icon: Code2, label: "Load Co.", nav: 2 },
  { icon: Clapperboard, label: "Virtuals", nav: 3 },
  { icon: Joystick, label: "Gamers...", nav: 3 },
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
  { team: "Tottenham Hotspur", odds: "2.85", status: "PENDING", stake: "10", payout: "28.50" },
  { team: "Brighton & Hove Albion", odds: "1.64", status: "WON", stake: "55", payout: "243.71" },
];

const SOCIAL_POSTS = [
  { user: "Alex M.", avatar: "A", action: "placed a 3-leg parlay", bet: "Man City, Arsenal, Chelsea", time: "2m ago", likes: 12, stake: "500", odds: "8.45" },
  { user: "Jordan K.", avatar: "J", action: "won big!", bet: "Brighton Over 2.5", time: "15m ago", likes: 34, stake: "100", odds: "1.75", won: true },
  { user: "Sam T.", avatar: "S", action: "is live betting", bet: "Arsenal vs Chelsea", time: "1h ago", likes: 8, stake: "200", odds: "2.10" },
  { user: "Morgan R.", avatar: "M", action: "placed a bet", bet: "Tottenham Win", time: "2h ago", likes: 5, stake: "50", odds: "3.20" },
];

const EXPLORE_POSTS = [
  { title: "🔥 Top Picks Today", desc: "24 tips from top predictors", badge: "TRENDING" },
  { title: "⚽ Premier League Special", desc: "18 expert match predictions", badge: "POPULAR" },
  { title: "🏆 Weekend Accumulator", desc: "8-leg parlay, 45.6x potential", badge: "FEATURED" },
  { title: "🌍 Champions League Tips", desc: "12 UCL predictions", badge: "NEW" },
];

const PARLAY_LEGS = [
  { match: "Man City vs Arsenal", pick: "Man City Win", odds: "1.85" },
  { match: "Chelsea vs Brighton", pick: "Over 2.5", odds: "1.65" },
  { match: "Liverpool vs Everton", pick: "Liverpool Win", odds: "1.55" },
  { match: "Spurs vs Newcastle", pick: "BTTS Yes", odds: "1.72" },
  { match: "West Ham vs Wolves", pick: "West Ham Win", odds: "2.10" },
  { match: "Brentford vs Fulham", pick: "Draw", odds: "3.20" },
  { match: "Crystal Palace vs Burnley", pick: "Crystal Palace Win", odds: "1.90" },
  { match: "Nottingham vs Sunderland", pick: "Under 2.5", odds: "1.80" },
  { match: "Leeds vs Bournemouth", pick: "Leeds Win", odds: "2.35" },
  { match: "Aston Villa vs Fulham", pick: "Aston Villa Win", odds: "1.70" },
  { match: "Real Madrid vs Barcelona", pick: "Real Madrid Win", odds: "2.00" },
  { match: "Bayern vs Dortmund", pick: "Over 3.5", odds: "1.85" },
  { match: "PSG vs Lyon", pick: "PSG Win", odds: "1.60" },
  { match: "Juventus vs Inter", pick: "BTTS Yes", odds: "1.75" },
  { match: "Ajax vs PSV", pick: "Ajax Win", odds: "1.95" },
  { match: "Porto vs Benfica", pick: "Over 2.5", odds: "1.68" },
  { match: "Celtic vs Rangers", pick: "Celtic Win", odds: "2.15" },
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
  const [activeNav, setActiveNav] = useState(1); // 0=Feed, 1=Sports, 2=Discovery, 3=Casino, 4=P2P
  const [activeSportSidebar, setActiveSportSidebar] = useState(0);
  const [activeSoccerTab, setActiveSoccerTab] = useState(0);
  const [activeLeague, setActiveLeague] = useState(0);
  const [activeBetType, setActiveBetType] = useState(0);
  const [activeSportRow, setActiveSportRow] = useState(0);
  const [webMyBetsMainTab, setWebMyBetsMainTab] = useState(0); // 0=My Bets, 1=My Feed
  const [webMyBetsFilter, setWebMyBetsFilter] = useState(0); // 0=All, 1=Pending, 2=Settled, 3=P2P
  const [webFeedTab, setWebFeedTab] = useState(0); // 0=Friends, 1=Explore

  const NAV = [
    { icon: Home, label: "Feed" },
    { icon: Trophy, label: "Sports" },
    { icon: Compass, label: "Discovery" },
    { icon: Gamepad2, label: "Casino" },
    { icon: Swords, label: "Peer-to-peer" },
  ];

  /* Right panel — always visible */
  const renderRightPanel = () => (
    <aside
      className="w-[200px] border-l flex flex-col flex-shrink-0"
      style={{ borderColor: "var(--p-divider)", background: "var(--p-nav)" }}
    >
      {/* My Bets / My Feed top tabs */}
      <div
        className="flex border-b text-[9px] font-semibold"
        style={{ borderColor: "var(--p-divider)" }}
      >
        {["My Bets", "My Feed"].map((t, i) => (
          <button
            key={t}
            onClick={() => setWebMyBetsMainTab(i)}
            className="flex-1 h-7 relative"
            style={{ color: webMyBetsMainTab === i ? "var(--p-text)" : "var(--p-muted)" }}
          >
            {t}
            {webMyBetsMainTab === i && (
              <span
                className="absolute bottom-0 left-1/4 right-1/4 h-[2px] rounded-full"
                style={{ background: "var(--p-primary)" }}
              />
            )}
          </button>
        ))}
      </div>

      {webMyBetsMainTab === 0 ? (
        <>
          {/* All / Pending / Settled / P2P filters */}
          <div
            className="flex border-b text-[8px] font-semibold"
            style={{ borderColor: "var(--p-divider)" }}
          >
            {["All", "Pending", "Settled", "P2P"].map((t, i) => (
              <button
                key={t}
                onClick={() => setWebMyBetsFilter(i)}
                className="flex-1 h-6 relative"
                style={{ color: webMyBetsFilter === i ? "var(--p-primary)" : "var(--p-muted)" }}
              >
                {t}
                {webMyBetsFilter === i && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-[2px]"
                    style={{ background: "var(--p-primary)" }}
                  />
                )}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-auto p-2 space-y-2">
            {BET_SLIPS.filter((b) => {
              if (webMyBetsFilter === 0) return true;
              if (webMyBetsFilter === 1) return b.status === "PENDING";
              if (webMyBetsFilter === 2) return b.status === "WON" || b.status === "LOST";
              return false; // P2P — no P2P bets in sample
            }).map((b, i) => {
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
                          : b.status === "PENDING"
                          ? "rgba(234,179,8,0.15)"
                          : "rgba(239,68,68,0.15)",
                        color: isWon ? "var(--p-text)" : b.status === "PENDING" ? "#eab308" : "var(--p-live)",
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
                    <span
                      className="font-bold"
                      style={{ color: isWon ? "var(--p-success)" : "var(--p-text)" }}
                    >
                      ₦{b.payout}
                    </span>
                  </div>
                </div>
              );
            })}
            {webMyBetsFilter === 3 && (
              <div className="text-center py-4 text-[9px]" style={{ color: "var(--p-muted)" }}>
                No P2P bets yet
              </div>
            )}
          </div>
        </>
      ) : (
        /* My Feed panel */
        <div className="flex-1 overflow-auto p-2 space-y-2">
          {SOCIAL_POSTS.slice(0, 3).map((p, i) => (
            <div
              key={i}
              className="rounded-md p-2"
              style={{ background: "var(--p-card)", border: "1px solid var(--p-divider)" }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <div
                  className="h-5 w-5 rounded-full grid place-items-center text-[8px] font-bold flex-shrink-0"
                  style={{ background: "var(--p-primary)", color: "var(--p-text)" }}
                >
                  {p.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[8px] font-bold truncate" style={{ color: "var(--p-text)" }}>
                    {p.user}
                  </div>
                  <div className="text-[7px]" style={{ color: "var(--p-muted)" }}>
                    {p.action}
                  </div>
                </div>
              </div>
              <div className="text-[8px] truncate" style={{ color: "var(--p-primary)" }}>
                {p.bet}
              </div>
              <div
                className="flex justify-between mt-1 text-[7px]"
                style={{ color: "var(--p-muted)" }}
              >
                <span>@{p.odds} · {p.time}</span>
                <span>♥ {p.likes}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </aside>
  );

  /* Feed view (nav index 0) */
  const renderFeedView = () => (
    <div className="flex-1 min-h-0 flex">
      <main className="flex-1 min-w-0 overflow-auto px-3 py-2">
        {/* Friends / Explore tabs */}
        <div className="flex gap-2 mb-3">
          {(["Friends", "Explore"] as const).map((t, i) => (
            <button
              key={t}
              onClick={() => setWebFeedTab(i)}
              className="flex items-center gap-1 px-4 h-7 rounded-full text-[10px] font-semibold"
              style={{
                background: webFeedTab === i ? "var(--p-primary)" : "var(--p-card)",
                color: webFeedTab === i ? "var(--p-text)" : "var(--p-muted)",
                border: webFeedTab === i ? "none" : "1px solid var(--p-divider)",
              }}
            >
              {i === 0 ? <Users className="h-3 w-3" /> : <Compass className="h-3 w-3" />}
              {t}
            </button>
          ))}
        </div>

        {webFeedTab === 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {SOCIAL_POSTS.map((p, i) => (
              <div
                key={i}
                className="rounded-md p-3"
                style={{ background: "var(--p-card)", border: "1px solid var(--p-divider)" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="h-7 w-7 rounded-full grid place-items-center text-[10px] font-bold flex-shrink-0"
                    style={{ background: "var(--p-primary)", color: "var(--p-text)" }}
                  >
                    {p.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold" style={{ color: "var(--p-text)" }}>
                      {p.user}
                    </div>
                    <div className="text-[9px]" style={{ color: "var(--p-muted)" }}>
                      {p.action} · {p.time}
                    </div>
                  </div>
                  {p.won && (
                    <span
                      className="text-[8px] font-bold px-1.5 py-[1px] rounded"
                      style={{
                        background: "linear-gradient(135deg, var(--p-won1), var(--p-won2))",
                        color: "var(--p-text)",
                      }}
                    >
                      WON
                    </span>
                  )}
                </div>
                <div
                  className="rounded p-2 mb-2"
                  style={{ background: "var(--p-odds-active)", border: "1px solid var(--p-primary)" }}
                >
                  <div className="text-[9.5px] font-semibold" style={{ color: "var(--p-primary)" }}>
                    {p.bet}
                  </div>
                  <div className="text-[8px] mt-0.5" style={{ color: "var(--p-muted)" }}>
                    @ {p.odds} · Stake ₦{p.stake}
                  </div>
                </div>
                <div
                  className="flex items-center gap-3 text-[9px]"
                  style={{ color: "var(--p-muted)" }}
                >
                  <button className="flex items-center gap-1">
                    <Heart className="h-3 w-3" /> {p.likes}
                  </button>
                  <button className="flex items-center gap-1">
                    <Share2 className="h-3 w-3" /> Share
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {EXPLORE_POSTS.map((p, i) => (
              <div
                key={i}
                className="rounded-md p-3"
                style={{ background: "var(--p-card)", border: "1px solid var(--p-divider)" }}
              >
                <span
                  className="text-[9px] font-bold px-1.5 py-[1px] rounded"
                  style={{ background: "var(--p-odds-active)", color: "var(--p-primary)" }}
                >
                  {p.badge}
                </span>
                <div
                  className="text-[11px] font-bold mt-1.5"
                  style={{ color: "var(--p-text)" }}
                >
                  {p.title}
                </div>
                <div className="text-[9px] mt-1" style={{ color: "var(--p-muted)" }}>
                  {p.desc}
                </div>
                <button
                  className="mt-2 w-full h-6 rounded text-[9px] font-semibold"
                  style={{ background: "var(--p-primary)", color: "var(--p-text)" }}
                >
                  View Tips
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
      {renderRightPanel()}
    </div>
  );

  /* Sports view (nav index 1) — 3-column layout */
  const renderSportsView = () => (
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
            const active = activeSportSidebar === i;
            return (
              <button
                key={s.name}
                onClick={() => setActiveSportSidebar(i)}
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
                <span className="text-[9px] font-semibold" style={{ color: "var(--p-muted)" }}>
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
              const active = activeNav === t.nav;
              return (
                <button
                  key={t.label}
                  onClick={() => setActiveNav(t.nav)}
                  className="flex flex-col items-center justify-center gap-0.5 w-14 h-14 rounded-md flex-shrink-0"
                  style={{
                    background: "var(--p-card)",
                    border: active
                      ? "1px solid var(--p-primary)"
                      : "1px solid var(--p-divider)",
                  }}
                >
                  <Icon
                    className="h-3.5 w-3.5"
                    style={{ color: active ? "var(--p-primary)" : "var(--p-text)" }}
                  />
                  <span
                    className="text-[7.5px] font-medium text-center leading-tight px-0.5"
                    style={{ color: active ? "var(--p-primary)" : "var(--p-muted)" }}
                  >
                    {t.label}
                  </span>
                </button>
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
              onClick={() => setActiveNav(4)}
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
            <div
              className="text-[9px] font-bold tracking-wider opacity-90"
              style={{ color: "var(--p-text)" }}
            >
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
                onClick={() => setActiveSportRow(i)}
                className="px-2.5 h-6 rounded-md text-[9px] font-semibold flex-shrink-0"
                style={{
                  background: activeSportRow === i ? "var(--p-odds-active)" : "transparent",
                  border:
                    activeSportRow === i
                      ? "1px solid var(--p-primary)"
                      : "1px solid var(--p-divider)",
                  color: activeSportRow === i ? "var(--p-primary)" : "var(--p-muted)",
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

          {/* Soccer tabs — now stateful */}
          <div
            className="flex items-center justify-between border-b mb-2"
            style={{ borderColor: "var(--p-divider)" }}
          >
            <div className="flex">
              {["Soccer", "Basketball", "Tennis", "TT Elite Series"].map((t, i) => (
                <button
                  key={t}
                  onClick={() => setActiveSoccerTab(i)}
                  className="px-3 h-7 text-[10px] font-semibold relative"
                  style={{
                    color: activeSoccerTab === i ? "var(--p-text)" : "var(--p-muted)",
                  }}
                >
                  {t}
                  {activeSoccerTab === i && (
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
            <button
              className="text-[9px] font-semibold flex items-center gap-0.5"
              style={{ color: "var(--p-primary)" }}
            >
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
                      <span
                        className="text-[9.5px] font-medium truncate"
                        style={{ color: "var(--p-text)" }}
                      >
                        {m.home}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <TeamDot label={m.away} />
                      <span
                        className="text-[9.5px] font-medium truncate"
                        style={{ color: "var(--p-text)" }}
                      >
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
                  <span
                    className="text-[8px] font-semibold flex items-center gap-0.5"
                    style={{ color: "var(--p-primary)" }}
                  >
                    MORE BETS <ChevronRight className="h-2 w-2" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {renderRightPanel()}
    </div>
  );

  /* Placeholder for Discovery / Casino / P2P */
  const renderPlaceholder = (title: string, Icon: React.ElementType) => (
    <div className="flex-1 min-h-0 flex">
      <main className="flex-1 min-w-0 overflow-auto px-3 py-2">
        <div
          className="flex flex-col items-center justify-center h-full gap-3"
          style={{ color: "var(--p-muted)" }}
        >
          <Icon className="h-10 w-10" />
          <div className="text-[14px] font-bold" style={{ color: "var(--p-text)" }}>
            {title}
          </div>
          <div className="text-[10px]">Coming soon</div>
        </div>
      </main>
      {renderRightPanel()}
    </div>
  );

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

      {/* View switcher */}
      {activeNav === 0 && renderFeedView()}
      {activeNav === 1 && renderSportsView()}
      {activeNav === 2 && renderPlaceholder("Discovery", Compass)}
      {activeNav === 3 && renderPlaceholder("Casino", Gamepad2)}
      {activeNav === 4 && renderPlaceholder("Peer-to-Peer", Swords)}
    </div>
  );
}

/* ─── MOBILE VERSION ──────────────────────────────────────────────────── */

function MobilePreview({
  appName,
  currencySymbol,
  logoUrl,
}: {
  appName: string;
  currencySymbol: string;
  logoUrl?: string | null;
}) {
  const [activeNav, setActiveNav] = useState(1); // 0=Home, 1=Sports, 2=Discovery, 3=Casino, 4=Profile
  const [mobileSportsTab, setMobileSportsTab] = useState(0); // 0=Sports, 1=All Sports
  const [activeSport, setActiveSport] = useState(0);
  const [activeLeague, setActiveLeague] = useState(0);
  const [activeBetType, setActiveBetType] = useState(0);
  const [mobileProfileTab, setMobileProfileTab] = useState(0); // 0=My Bets, 1=My Feed
  const [mobileFeedTab, setMobileFeedTab] = useState(0); // 0=Friends, 1=Explore
  const [mobileMyBetsFilter, setMobileMyBetsFilter] = useState(0); // 0=All, 1=Pending, 2=Settled, 3=P2P
  const [expandedBetCard, setExpandedBetCard] = useState(false);
  const [selectedOdds, setSelectedOdds] = useState<Set<string>>(new Set());

  const NAV = [
    { icon: Home, label: "home" },
    { icon: Trophy, label: "Sports" },
    { icon: Compass, label: "Discovery" },
    { icon: Gamepad2, label: "Casino" },
    { icon: User, label: "Profile" },
  ];

  const toggleOdd = (key: string) => {
    setSelectedOdds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  /* Shared top bar */
  const renderTopBar = () => (
    <div className="flex items-center justify-between px-3 pt-3 pb-2 flex-shrink-0">
      {logoUrl ? (
        <img src={logoUrl} alt="Logo" className="h-7 object-contain max-w-[80px]" />
      ) : (
        <div
          className="h-7 w-7 rounded-full grid place-items-center text-[10px] font-black"
          style={{ background: "var(--p-primary)", color: "var(--p-text)" }}
        >
          {appName.slice(0, 1)}
        </div>
      )}
      <div
        className="flex items-center gap-1.5 px-2.5 h-6 rounded-full"
        style={{ background: "var(--p-card)" }}
      >
        <span className="text-[10px] font-bold" style={{ color: "var(--p-text)" }}>
          {currencySymbol}
        </span>
        <span className="text-[10px] tracking-wider" style={{ color: "var(--p-text)" }}>
          ****
        </span>
        <Plus className="h-3 w-3" style={{ color: "var(--p-primary)" }} />
        <EyeOff className="h-3 w-3" style={{ color: "var(--p-muted)" }} />
      </div>
      <div className="flex items-center gap-2">
        <div className="relative">
          <Bell className="h-4 w-4" style={{ color: "var(--p-text)" }} />
          <span
            className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full"
            style={{ background: "var(--p-primary)" }}
          />
        </div>
        <MessageCircle className="h-4 w-4" style={{ color: "var(--p-text)" }} />
      </div>
    </div>
  );

  /* Home view (nav 0) */
  const renderHomeView = () => (
    <>
      {renderTopBar()}
      {/* Quick tiles */}
      <div className="grid grid-cols-5 gap-1.5 px-3 mb-2 flex-shrink-0">
        {MOBILE_TILES.map((t) => {
          const Icon = t.icon;
          const active = activeNav === t.nav;
          return (
            <button
              key={t.label}
              onClick={() => setActiveNav(t.nav)}
              className="flex flex-col items-center justify-center gap-0.5 h-14 rounded-md"
              style={{
                background: "var(--p-card)",
                border: active ? "1px solid var(--p-primary)" : "1px solid var(--p-divider)",
              }}
            >
              <Icon
                className="h-4 w-4"
                style={{ color: active ? "var(--p-primary)" : "var(--p-text)" }}
              />
              <span
                className="text-[8px] font-medium"
                style={{ color: active ? "var(--p-primary)" : "var(--p-muted)" }}
              >
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex-1 min-h-0 overflow-auto px-3 pb-2">
        {/* BetBuilder / P2P */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          <button
            className="h-9 rounded-md flex items-center justify-center gap-1.5 text-[11px] font-bold"
            style={{
              background: "var(--p-odds-active)",
              border: "1px solid var(--p-primary)",
              color: "var(--p-primary)",
            }}
          >
            <Flame className="h-3.5 w-3.5" /> BetBuilder
          </button>
          <button
            className="h-9 rounded-md flex items-center justify-center gap-1.5 text-[11px] font-bold"
            style={{
              background: "var(--p-odds-active)",
              border: "1px solid var(--p-primary)",
              color: "var(--p-primary)",
            }}
          >
            <ArrowLeftRight className="h-3.5 w-3.5" /> Peer-to-Peer
          </button>
        </div>
        {/* Welcome Bonus */}
        <div
          className="rounded-lg p-3 mb-3 relative"
          style={{
            background: "linear-gradient(135deg, var(--p-btn), var(--p-btn-grad))",
            border: "1px solid var(--p-primary)",
          }}
        >
          <div className="text-[12px] font-black" style={{ color: "var(--p-text)" }}>
            WELCOME BONUS
          </div>
          <div className="text-[9.5px] mt-1 leading-tight" style={{ color: "var(--p-text)" }}>
            Get a Free Sportsbook Pick or Enjoy 50% More Casino Cash For Casino Games
          </div>
          <div
            className="mt-2 h-5 w-5 rounded-full grid place-items-center"
            style={{ background: "rgba(0,0,0,0.3)" }}
          >
            <ChevronDown className="h-3 w-3" style={{ color: "var(--p-text)" }} />
          </div>
        </div>
        {/* Featured matches */}
        <div className="text-[12px] font-bold mb-1.5" style={{ color: "var(--p-text)" }}>
          Live & Upcoming
        </div>
        <div className="space-y-2">
          {MATCHES.slice(0, 3).map((m, i) => {
            const k0 = `home-${i}-0`;
            const k1 = `home-${i}-1`;
            const k2 = `home-${i}-2`;
            return (
              <div
                key={i}
                className="rounded-md p-2.5"
                style={{ background: "var(--p-card)", border: "1px solid var(--p-divider)" }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className="text-[9px] font-semibold"
                    style={{ color: m.live ? "var(--p-live)" : "var(--p-primary)" }}
                  >
                    {m.date}
                  </span>
                  <div
                    className="flex gap-5 text-[9px] font-bold"
                    style={{ color: "var(--p-muted)" }}
                  >
                    <span>1</span>
                    <span>X</span>
                    <span>2</span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <TeamDot label={m.home} />
                      <span
                        className="text-[10.5px] font-medium truncate"
                        style={{ color: "var(--p-text)" }}
                      >
                        {m.home}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <TeamDot label={m.away} />
                      <span
                        className="text-[10.5px] font-medium truncate"
                        style={{ color: "var(--p-text)" }}
                      >
                        {m.away}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {([k0, k1, k2] as const).map((key, j) => {
                      const sel = selectedOdds.has(key);
                      return (
                        <button
                          key={j}
                          onClick={() => toggleOdd(key)}
                          className="w-10 h-10 rounded-md text-[11px] font-bold transition-colors"
                          style={{
                            background: sel ? "var(--p-primary)" : "var(--p-odds-active)",
                            border: "1px solid var(--p-primary)",
                            color: sel ? "var(--p-text)" : "var(--p-primary)",
                          }}
                        >
                          {m.odds[j]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );

  /* Sports view (nav 1) */
  const renderSportsView = () => (
    <>
      {renderTopBar()}
      {/* Sports / All Sports sub-tab bar */}
      <div
        className="flex border-b flex-shrink-0"
        style={{ borderColor: "var(--p-divider)", background: "var(--p-nav)" }}
      >
        {["Sports", "All Sports"].map((t, i) => (
          <button
            key={t}
            onClick={() => setMobileSportsTab(i)}
            className="flex-1 h-8 text-[10px] font-semibold relative"
            style={{ color: mobileSportsTab === i ? "var(--p-primary)" : "var(--p-muted)" }}
          >
            {t}
            {mobileSportsTab === i && (
              <span
                className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full"
                style={{ background: "var(--p-primary)" }}
              />
            )}
          </button>
        ))}
      </div>

      {mobileSportsTab === 0 ? (
        /* Sports sub-tab */
        <div className="flex-1 min-h-0 overflow-auto px-3 pb-2">
          <div className="grid grid-cols-2 gap-2 my-2">
            <button
              className="h-9 rounded-md flex items-center justify-center gap-1.5 text-[11px] font-bold"
              style={{
                background: "var(--p-odds-active)",
                border: "1px solid var(--p-primary)",
                color: "var(--p-primary)",
              }}
            >
              <Flame className="h-3.5 w-3.5" /> BetBuilder
            </button>
            <button
              className="h-9 rounded-md flex items-center justify-center gap-1.5 text-[11px] font-bold"
              style={{
                background: "var(--p-odds-active)",
                border: "1px solid var(--p-primary)",
                color: "var(--p-primary)",
              }}
            >
              <ArrowLeftRight className="h-3.5 w-3.5" /> Peer-to-Peer
            </button>
          </div>

          <div className="text-[12px] font-bold mb-1.5" style={{ color: "var(--p-text)" }}>
            Live & Upcoming
          </div>

          {/* Sport tabs */}
          <div className="flex gap-2 mb-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {SPORT_TABS.map((s, i) => (
              <button
                key={s}
                onClick={() => setActiveSport(i)}
                className="px-2.5 h-6 rounded-md text-[10px] font-semibold flex-shrink-0"
                style={{
                  background: activeSport === i ? "var(--p-odds-active)" : "transparent",
                  border:
                    activeSport === i
                      ? "1px solid var(--p-primary)"
                      : "1px solid var(--p-divider)",
                  color: activeSport === i ? "var(--p-primary)" : "var(--p-muted)",
                }}
              >
                {s}
              </button>
            ))}
          </div>

          {/* League pills */}
          <div className="flex gap-1.5 mb-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {LEAGUE_TABS.slice(0, 3).map((l, i) => (
              <button
                key={l}
                onClick={() => setActiveLeague(i)}
                className="px-2.5 h-6 rounded-full text-[9.5px] font-semibold flex-shrink-0"
                style={{
                  background: activeLeague === i ? "var(--p-odds-active)" : "transparent",
                  border:
                    activeLeague === i
                      ? "1px solid var(--p-primary)"
                      : "1px solid var(--p-divider)",
                  color: activeLeague === i ? "var(--p-primary)" : "var(--p-muted)",
                }}
              >
                ⚽ {l.split(" - ")[0]}
              </button>
            ))}
          </div>

          {/* Bet type pills */}
          <div className="flex gap-1.5 mb-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {BET_TYPE_TABS.slice(0, 5).map((b, i) => (
              <button
                key={b}
                onClick={() => setActiveBetType(i)}
                className="px-2.5 h-6 rounded-md text-[9.5px] font-semibold flex-shrink-0"
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

          {/* Match cards */}
          <div className="space-y-2">
            {MATCHES.slice(0, 4).map((m, i) => {
              const k0 = `sports-${i}-0`;
              const k1 = `sports-${i}-1`;
              const k2 = `sports-${i}-2`;
              return (
                <div
                  key={i}
                  className="rounded-md p-2.5"
                  style={{ background: "var(--p-card)", border: "1px solid var(--p-divider)" }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className="text-[9px] font-semibold"
                      style={{ color: m.live ? "var(--p-live)" : "var(--p-primary)" }}
                    >
                      {m.date}
                    </span>
                    <div
                      className="flex gap-5 text-[9px] font-bold"
                      style={{ color: "var(--p-muted)" }}
                    >
                      <span>1</span>
                      <span>X</span>
                      <span>2</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <TeamDot label={m.home} />
                        <span
                          className="text-[10.5px] font-medium truncate"
                          style={{ color: "var(--p-text)" }}
                        >
                          {m.home}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <TeamDot label={m.away} />
                        <span
                          className="text-[10.5px] font-medium truncate"
                          style={{ color: "var(--p-text)" }}
                        >
                          {m.away}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {([k0, k1, k2] as const).map((key, j) => {
                        const sel = selectedOdds.has(key);
                        return (
                          <button
                            key={j}
                            onClick={() => toggleOdd(key)}
                            className="w-10 h-10 rounded-md text-[11px] font-bold transition-colors"
                            style={{
                              background: sel ? "var(--p-primary)" : "var(--p-odds-active)",
                              border: "1px solid var(--p-primary)",
                              color: sel ? "var(--p-text)" : "var(--p-primary)",
                            }}
                          >
                            {m.odds[j]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* All Sports sub-tab */
        <div className="flex-1 min-h-0 overflow-auto pb-2">
          {/* Back to Sports */}
          <button
            onClick={() => setMobileSportsTab(0)}
            className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-semibold"
            style={{ color: "var(--p-primary)" }}
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Back to Sports
          </button>
          <div className="px-3 pb-1 text-[9px] font-semibold" style={{ color: "var(--p-muted)" }}>
            All Sports ({SPORTS_SIDEBAR.length})
          </div>
          <div className="px-2">
            {SPORTS_SIDEBAR.map((s, i) => (
              <button
                key={s.name}
                onClick={() => setMobileSportsTab(0)}
                className="w-full flex items-center gap-2 px-2 h-10 rounded-md mb-0.5 text-left"
                style={{ background: "var(--p-card)", border: "1px solid var(--p-divider)" }}
              >
                <span className="text-[14px]">{s.flag}</span>
                <span
                  className="flex-1 text-[11px] font-medium"
                  style={{ color: "var(--p-text)" }}
                >
                  {s.name}
                </span>
                <span
                  className="text-[9px] font-bold px-1.5 py-[1px] rounded-full"
                  style={{ background: "var(--p-odds-active)", color: "var(--p-primary)" }}
                >
                  {s.count}
                </span>
                <ChevronRight className="h-3.5 w-3.5" style={{ color: "var(--p-muted)" }} />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );

  /* Discovery view (nav 2) */
  const renderDiscoveryView = () => (
    <>
      {renderTopBar()}
      <div className="flex-1 min-h-0 overflow-auto px-3 pb-2">
        <div className="text-[12px] font-bold my-2" style={{ color: "var(--p-text)" }}>
          Discover
        </div>
        <div className="grid grid-cols-2 gap-2">
          {EXPLORE_POSTS.map((p, i) => (
            <div
              key={i}
              className="rounded-md p-3"
              style={{ background: "var(--p-card)", border: "1px solid var(--p-divider)" }}
            >
              <span
                className="text-[8px] font-bold px-1.5 py-[1px] rounded"
                style={{ background: "var(--p-odds-active)", color: "var(--p-primary)" }}
              >
                {p.badge}
              </span>
              <div className="text-[11px] font-bold mt-1.5" style={{ color: "var(--p-text)" }}>
                {p.title}
              </div>
              <div className="text-[9px] mt-1" style={{ color: "var(--p-muted)" }}>
                {p.desc}
              </div>
              <button
                className="mt-2 w-full h-7 rounded text-[9px] font-semibold"
                style={{ background: "var(--p-primary)", color: "var(--p-text)" }}
              >
                View Tips
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  /* Casino view (nav 3) */
  const renderCasinoView = () => (
    <>
      {renderTopBar()}
      <div className="flex-1 min-h-0 overflow-auto px-3 pb-2">
        <div className="text-[12px] font-bold my-2" style={{ color: "var(--p-text)" }}>
          Casino
        </div>
        <div className="grid grid-cols-3 gap-2">
          {["🎰 Slots", "🃏 Poker", "🎲 Roulette", "🂡 Blackjack", "🎳 Bingo", "🎮 Live"].map(
            (g) => (
              <button
                key={g}
                className="h-16 rounded-md flex flex-col items-center justify-center gap-1 text-[9px] font-semibold"
                style={{ background: "var(--p-card)", border: "1px solid var(--p-divider)", color: "var(--p-text)" }}
              >
                <span className="text-[20px]">{g.slice(0, 2)}</span>
                <span style={{ color: "var(--p-muted)" }}>{g.slice(3)}</span>
              </button>
            )
          )}
        </div>
      </div>
    </>
  );

  /* Profile view (nav 4) */
  const renderProfileView = () => (
    <>
      {renderTopBar()}
      {/* My Bets / My Feed tabs */}
      <div
        className="flex border-b flex-shrink-0"
        style={{ borderColor: "var(--p-divider)", background: "var(--p-nav)" }}
      >
        {["My Bets", "My Feed"].map((t, i) => (
          <button
            key={t}
            onClick={() => setMobileProfileTab(i)}
            className="flex-1 h-8 text-[10px] font-semibold relative"
            style={{ color: mobileProfileTab === i ? "var(--p-primary)" : "var(--p-muted)" }}
          >
            {t}
            {mobileProfileTab === i && (
              <span
                className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full"
                style={{ background: "var(--p-primary)" }}
              />
            )}
          </button>
        ))}
      </div>

      {mobileProfileTab === 0 ? (
        /* My Bets */
        <div className="flex flex-col flex-1 min-h-0">
          {/* All / Pending / Settled / P2P filters */}
          <div
            className="flex border-b flex-shrink-0"
            style={{ borderColor: "var(--p-divider)" }}
          >
            {["All", "Pending", "Settled", "P2P"].map((t, i) => (
              <button
                key={t}
                onClick={() => setMobileMyBetsFilter(i)}
                className="flex-1 h-7 text-[9px] font-semibold relative"
                style={{
                  color: mobileMyBetsFilter === i ? "var(--p-primary)" : "var(--p-muted)",
                }}
              >
                {t}
                {mobileMyBetsFilter === i && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-[2px]"
                    style={{ background: "var(--p-primary)" }}
                  />
                )}
              </button>
            ))}
          </div>
          <div className="flex-1 min-h-0 overflow-auto px-3 py-2 space-y-2">
            {/* Regular bet slips */}
            {BET_SLIPS.filter((b) => {
              if (mobileMyBetsFilter === 0) return true;
              if (mobileMyBetsFilter === 1) return b.status === "PENDING";
              if (mobileMyBetsFilter === 2) return b.status === "WON" || b.status === "LOST";
              return false;
            }).map((b, i) => {
              const isWon = b.status === "WON";
              return (
                <div
                  key={i}
                  className="rounded-md p-2.5"
                  style={{ background: "var(--p-card)", border: "1px solid var(--p-divider)" }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <TeamDot label={b.team} />
                      <span className="text-[10px] font-bold" style={{ color: "var(--p-text)" }}>
                        {b.team.slice(0, 16)}
                      </span>
                    </div>
                    <span
                      className="text-[8px] font-bold px-1.5 py-[1px] rounded"
                      style={{
                        background: isWon
                          ? "linear-gradient(135deg, var(--p-won1), var(--p-won2))"
                          : b.status === "PENDING"
                          ? "rgba(234,179,8,0.15)"
                          : "rgba(239,68,68,0.15)",
                        color: isWon
                          ? "var(--p-text)"
                          : b.status === "PENDING"
                          ? "#eab308"
                          : "var(--p-live)",
                      }}
                    >
                      {b.status}
                    </span>
                  </div>
                  <div className="text-[9px]" style={{ color: "var(--p-muted)" }}>
                    1x2 · odds {b.odds}
                  </div>
                  <div className="flex items-center justify-between mt-1.5 text-[9px]">
                    <span style={{ color: "var(--p-muted)" }}>STAKE</span>
                    <span className="font-bold" style={{ color: "var(--p-text)" }}>
                      ₦{b.stake}
                    </span>
                    <span style={{ color: "var(--p-muted)" }}>PAYOUT</span>
                    <span
                      className="font-bold"
                      style={{ color: isWon ? "var(--p-success)" : "var(--p-text)" }}
                    >
                      ₦{b.payout}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Expandable 17-leg parlay card */}
            {(mobileMyBetsFilter === 0 || mobileMyBetsFilter === 1) && (
              <div
                className="rounded-md p-2.5"
                style={{ background: "var(--p-card)", border: "1px solid var(--p-divider)" }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold" style={{ color: "var(--p-text)" }}>
                    17-Leg Accumulator
                  </span>
                  <span
                    className="text-[8px] font-bold px-1.5 py-[1px] rounded"
                    style={{ background: "rgba(234,179,8,0.15)", color: "#eab308" }}
                  >
                    PENDING
                  </span>
                </div>
                <div className="text-[9px] mb-1.5" style={{ color: "var(--p-muted)" }}>
                  Accumulator · Total odds 1,284.5x
                </div>
                {/* First 3 legs always visible */}
                {PARLAY_LEGS.slice(0, 3).map((leg, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-1 border-b"
                    style={{ borderColor: "var(--p-divider)" }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-[8.5px] truncate" style={{ color: "var(--p-text)" }}>
                        {leg.match}
                      </div>
                      <div className="text-[8px]" style={{ color: "var(--p-muted)" }}>
                        {leg.pick}
                      </div>
                    </div>
                    <span
                      className="text-[9px] font-bold ml-2"
                      style={{ color: "var(--p-primary)" }}
                    >
                      {leg.odds}
                    </span>
                  </div>
                ))}
                {/* Expanded legs */}
                {expandedBetCard &&
                  PARLAY_LEGS.slice(3).map((leg, i) => (
                    <div
                      key={i + 3}
                      className="flex items-center justify-between py-1 border-b"
                      style={{ borderColor: "var(--p-divider)" }}
                    >
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-[8.5px] truncate"
                          style={{ color: "var(--p-text)" }}
                        >
                          {leg.match}
                        </div>
                        <div className="text-[8px]" style={{ color: "var(--p-muted)" }}>
                          {leg.pick}
                        </div>
                      </div>
                      <span
                        className="text-[9px] font-bold ml-2"
                        style={{ color: "var(--p-primary)" }}
                      >
                        {leg.odds}
                      </span>
                    </div>
                  ))}
                {/* Show all / collapse */}
                <button
                  onClick={() => setExpandedBetCard((v) => !v)}
                  className="mt-1.5 w-full text-[9px] font-semibold flex items-center justify-center gap-1"
                  style={{ color: "var(--p-primary)" }}
                >
                  {expandedBetCard ? (
                    <>
                      Collapse <ChevronDown className="h-3 w-3 rotate-180" />
                    </>
                  ) : (
                    <>
                      Show all {PARLAY_LEGS.length} legs{" "}
                      <ChevronDown className="h-3 w-3" />
                    </>
                  )}
                </button>
                <div className="flex items-center justify-between mt-2 text-[9px]">
                  <span style={{ color: "var(--p-muted)" }}>STAKE</span>
                  <span className="font-bold" style={{ color: "var(--p-text)" }}>
                    ₦1,000
                  </span>
                  <span style={{ color: "var(--p-muted)" }}>POTENTIAL</span>
                  <span className="font-bold" style={{ color: "var(--p-success)" }}>
                    ₦1,284,500
                  </span>
                </div>
              </div>
            )}

            {mobileMyBetsFilter === 3 && (
              <div
                className="text-center py-6 text-[9px]"
                style={{ color: "var(--p-muted)" }}
              >
                No P2P bets yet
              </div>
            )}
          </div>
        </div>
      ) : (
        /* My Feed */
        <div className="flex flex-col flex-1 min-h-0">
          {/* Friends / Explore tabs */}
          <div
            className="flex gap-2 px-3 py-2 border-b flex-shrink-0"
            style={{ borderColor: "var(--p-divider)" }}
          >
            {(["Friends", "Explore"] as const).map((t, i) => (
              <button
                key={t}
                onClick={() => setMobileFeedTab(i)}
                className="flex items-center gap-1 px-3 h-6 rounded-full text-[9.5px] font-semibold"
                style={{
                  background: mobileFeedTab === i ? "var(--p-primary)" : "var(--p-card)",
                  color: mobileFeedTab === i ? "var(--p-text)" : "var(--p-muted)",
                  border: mobileFeedTab === i ? "none" : "1px solid var(--p-divider)",
                }}
              >
                {i === 0 ? <Users className="h-3 w-3" /> : <Compass className="h-3 w-3" />}
                {t}
              </button>
            ))}
          </div>
          <div className="flex-1 min-h-0 overflow-auto px-3 py-2 space-y-2">
            {mobileFeedTab === 0
              ? SOCIAL_POSTS.map((p, i) => (
                  <div
                    key={i}
                    className="rounded-md p-2.5"
                    style={{ background: "var(--p-card)", border: "1px solid var(--p-divider)" }}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div
                        className="h-6 w-6 rounded-full grid place-items-center text-[9px] font-bold flex-shrink-0"
                        style={{ background: "var(--p-primary)", color: "var(--p-text)" }}
                      >
                        {p.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-[10px] font-bold"
                          style={{ color: "var(--p-text)" }}
                        >
                          {p.user}
                        </div>
                        <div className="text-[8px]" style={{ color: "var(--p-muted)" }}>
                          {p.action} · {p.time}
                        </div>
                      </div>
                      {p.won && (
                        <span
                          className="text-[8px] font-bold px-1.5 py-[1px] rounded"
                          style={{
                            background: "linear-gradient(135deg, var(--p-won1), var(--p-won2))",
                            color: "var(--p-text)",
                          }}
                        >
                          WON
                        </span>
                      )}
                    </div>
                    <div
                      className="rounded p-2 mb-1.5"
                      style={{
                        background: "var(--p-odds-active)",
                        border: "1px solid var(--p-primary)",
                      }}
                    >
                      <div
                        className="text-[9.5px] font-semibold"
                        style={{ color: "var(--p-primary)" }}
                      >
                        {p.bet}
                      </div>
                      <div className="text-[8px] mt-0.5" style={{ color: "var(--p-muted)" }}>
                        @ {p.odds} · Stake ₦{p.stake}
                      </div>
                    </div>
                    <div
                      className="flex items-center gap-3 text-[9px]"
                      style={{ color: "var(--p-muted)" }}
                    >
                      <button className="flex items-center gap-1">
                        <Heart className="h-3 w-3" /> {p.likes}
                      </button>
                      <button className="flex items-center gap-1">
                        <Share2 className="h-3 w-3" /> Share
                      </button>
                    </div>
                  </div>
                ))
              : EXPLORE_POSTS.map((p, i) => (
                  <div
                    key={i}
                    className="rounded-md p-2.5"
                    style={{ background: "var(--p-card)", border: "1px solid var(--p-divider)" }}
                  >
                    <span
                      className="text-[8px] font-bold px-1.5 py-[1px] rounded"
                      style={{ background: "var(--p-odds-active)", color: "var(--p-primary)" }}
                    >
                      {p.badge}
                    </span>
                    <div
                      className="text-[11px] font-bold mt-1"
                      style={{ color: "var(--p-text)" }}
                    >
                      {p.title}
                    </div>
                    <div className="text-[9px] mt-0.5" style={{ color: "var(--p-muted)" }}>
                      {p.desc}
                    </div>
                  </div>
                ))}
          </div>
        </div>
      )}
    </>
  );

  return (
    <div
      className="w-full h-full flex flex-col text-[11px] overflow-hidden"
      style={{ background: "var(--p-bg)", color: "var(--p-text)" }}
    >
      {/* View switcher */}
      {activeNav === 0 && renderHomeView()}
      {activeNav === 1 && renderSportsView()}
      {activeNav === 2 && renderDiscoveryView()}
      {activeNav === 3 && renderCasinoView()}
      {activeNav === 4 && renderProfileView()}

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
          return (
            <button
              key={n.label}
              onClick={() => setActiveNav(i)}
              className="flex flex-col items-center justify-center gap-0.5 h-12 relative"
            >
              {active && (
                <span
                  className="absolute top-0 left-3 right-3 h-[2px] rounded-full"
                  style={{ background: "var(--p-primary)" }}
                />
              )}
              <Icon
                className="h-4 w-4"
                style={{ color: active ? "var(--p-primary)" : "var(--p-muted)" }}
              />
              <span
                className="text-[9px] font-medium"
                style={{ color: active ? "var(--p-primary)" : "var(--p-muted)" }}
              >
                {n.label}
              </span>
            </button>
          );
        })}
      </div>
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
          <MobilePreview
            appName={appLabels.appName}
            currencySymbol={appLabels.currencySymbol}
            logoUrl={appIcons.appNameLogo}
          />
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
