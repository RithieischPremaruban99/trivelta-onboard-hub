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
import type { TCMStrings } from "@/lib/tcm-strings";
import {
  Bell,
  Search,
  Plus,
  EyeOff,
  Eye,
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

function getSportsSidebar(strings: TCMStrings) {
  return [
    { name: strings.SOCCER, count: 253, flag: "⚽" },
    { name: strings.BASKETBALL, count: 66, flag: "🏀" },
    { name: strings.TENNIS, count: 11, flag: "🎾" },
    { name: strings.VOLLEYBALL, count: 19, flag: "🏐" },
    { name: strings.TABLE_TENNIS, count: 3, flag: "🏓" },
    { name: strings.ICE_HOCKEY, count: 21, flag: "🏒" },
    { name: strings.AMERICAN_FOOTBALL, count: 5, flag: "🏈" },
    { name: strings.RUGBY, count: 13, flag: "🏉" },
    { name: "Golf", count: 8, flag: "⛳" },
    { name: "Darts", count: 4, flag: "🎯" },
    { name: "Boxing", count: 1, flag: "🥊" },
    { name: "Cricket", count: 12, flag: "🏏" },
    { name: "Baseball", count: 8, flag: "⚾" },
  ];
}

// These are computed inside components using strings — kept as icon-only config here
const QUICK_TILE_ICONS = [
  { icon: Radio, strKey: "TILE_LIVE_SPORTS" as const, nav: 1 },
  { icon: Code2, strKey: "TILE_LOAD_CODE" as const, nav: 2 },
  { icon: Clapperboard, strKey: "TILE_VIRTUALS" as const, nav: 3 },
  { icon: ArrowLeftRight, strKey: "TILE_PEER_TO_PEER" as const, nav: 4 },
  { icon: Joystick, strKey: "TILE_GAMERS_PARADISE" as const, nav: 3 },
];

const MOBILE_TILE_ICONS = [
  { icon: Trophy, strKey: "MOBILE_TILE_ALL_SPORTS" as const, nav: 1 },
  { icon: Radio, strKey: "MOBILE_TILE_LIVE_SPO" as const, nav: 1 },
  { icon: Code2, strKey: "MOBILE_TILE_LOAD_CO" as const, nav: 2 },
  { icon: Clapperboard, strKey: "TILE_VIRTUALS" as const, nav: 3 },
  { icon: Joystick, strKey: "MOBILE_TILE_GAMERS" as const, nav: 3 },
];

const SPORT_TABS_KEYS = ["SOCCER", "BASKETBALL", "TENNIS"] as const;
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

const LiveDot = () => {
  const { strings } = useStudio();
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-[1px] rounded-full text-[8px] font-bold"
      style={{ background: "rgba(239,68,68,0.15)", color: "var(--p-live)" }}
    >
      <span className="h-1 w-1 rounded-full" style={{ background: "var(--p-live)" }} />
      {strings.LIVE_BADGE}
    </span>
  );
};

/* ─── WEB VERSION ─────────────────────────────────────────────────────── */

function WebPreview({ appName, logoUrl }: { appName: string; logoUrl?: string | null }) {
  const { strings } = useStudio();
  const [activeNav, setActiveNav] = useState(1); // 0=Feed, 1=Sports, 2=Discovery, 3=Casino, 4=P2P
  const [activeSportSidebar, setActiveSportSidebar] = useState(0);
  const [activeSoccerTab, setActiveSoccerTab] = useState(0);
  const [activeLeague, setActiveLeague] = useState(0);
  const [activeBetType, setActiveBetType] = useState(0);
  const [activeSportRow, setActiveSportRow] = useState(0);
  const [webMyBetsMainTab, setWebMyBetsMainTab] = useState(0); // 0=My Bets, 1=My Feed
  const [webMyBetsFilter, setWebMyBetsFilter] = useState(0); // 0=All, 1=Pending, 2=Settled, 3=P2P
  const [webFeedTab, setWebFeedTab] = useState(0); // 0=Friends, 1=Explore

  const statusLabel = (s: string) =>
    s === "WON" ? strings.STATUS_WON :
    s === "LOST" ? strings.STATUS_LOST :
    s === "LIVE" ? strings.STATUS_LIVE :
    strings.STATUS_PENDING;

  const NAV = [
    { icon: Home, label: strings.FEED },
    { icon: Trophy, label: strings.SPORTSBOOK },
    { icon: Compass, label: strings.DISCOVERY },
    { icon: Gamepad2, label: strings.CASINO },
    { icon: Swords, label: strings.PEER_TO_PEER_NAV },
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
        {[strings.TAB_MY_BETS, strings.TAB_MY_FEED].map((t, i) => (
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
            {[strings.FILTER_ALL, strings.FILTER_PENDING, strings.FILTER_SETTLED, strings.FILTER_P2P].map((t, i) => (
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
                      {statusLabel(b.status)}
                    </span>
                  </div>
                  <div className="text-[8px]" style={{ color: "var(--p-muted)" }}>
                    1x2 · odds {b.odds}
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[9px]">
                    <span style={{ color: "var(--p-muted)" }}>{strings.STAKE}</span>
                    <span className="font-bold" style={{ color: "var(--p-text)" }}>
                      ₦{b.stake}
                    </span>
                    <span style={{ color: "var(--p-muted)" }}>{strings.PAYOUT}</span>
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
                {strings.NO_P2P_BETS}
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
          {([strings.TAB_FRIENDS, strings.TAB_EXPLORE] as const).map((t, i) => (
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
                      {strings.STATUS_WON}
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
                    @ {p.odds} · {strings.STAKE} ₦{p.stake}
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
                    <Share2 className="h-3 w-3" /> {strings.SHARE}
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
                  {strings.VIEW_TIPS}
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
              {strings.SEARCH}
            </span>
          </div>
        </div>
        <div className="px-3 pb-1 text-[9px] font-semibold" style={{ color: "var(--p-muted)" }}>
          {strings.ALL_SPORTS}
        </div>
        <div className="flex-1 overflow-auto px-1.5">
          {getSportsSidebar(strings).map((s, i) => {
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
            {QUICK_TILE_ICONS.map((t) => {
              const Icon = t.icon;
              const active = activeNav === t.nav;
              return (
                <button
                  key={t.strKey}
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
                    {strings[t.strKey]}
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
              <Flame className="h-3 w-3" /> {strings.BET_BUILDER}
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
              <ArrowLeftRight className="h-3 w-3" /> {strings.PEER_TO_PEER_BTN}
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
              {strings.WELCOME_BONUS_PROMO}
            </div>
            <div className="text-[9px] mt-1 opacity-80" style={{ color: "var(--p-text)" }}>
              {strings.WELCOME_BONUS_BODY_WEB}
            </div>
          </div>

          {/* Live & upcoming */}
          <div className="text-[12px] font-bold mb-1.5" style={{ color: "var(--p-text)" }}>
            {strings.LIVE_AND_UPCOMING_GAMES}
          </div>
          <div className="flex gap-2 mb-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {SPORT_TABS_KEYS.map((k, i) => (
              <button
                key={k}
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
                {strings[k]} ⚽
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
              {[strings.SOCCER, strings.BASKETBALL, strings.TENNIS, "TT Elite Series"].map((t, i) => (
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
                {strings.SOCCER}
              </span>
            </div>
            <button
              className="text-[9px] font-semibold flex items-center gap-0.5"
              style={{ color: "var(--p-primary)" }}
            >
              {strings.SEE_MORE} <ChevronRight className="h-2.5 w-2.5" />
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
                    {strings.STATS}
                  </span>
                  <span
                    className="text-[8px] font-semibold flex items-center gap-0.5"
                    style={{ color: "var(--p-primary)" }}
                  >
                    {strings.MORE_BETS} <ChevronRight className="h-2 w-2" />
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
          <div className="text-[10px]">{strings.COMING_SOON}</div>
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
                className="flex items-center gap-1.5 px-2.5 h-7 rounded-md transition-colors relative"
                style={{ color: active ? "var(--p-primary)" : "var(--p-muted)" }}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="text-[10px] font-semibold">{n.label}</span>
                {active && (
                  <span
                    className="absolute -bottom-[6px] left-2 right-2 h-[2px] rounded-full"
                    style={{ background: "var(--p-primary)" }}
                  />
                )}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium" style={{ color: "var(--p-text)" }}>
            {strings.SIGN_IN}
          </span>
          <button
            className="h-7 px-3 rounded-md text-[10px] font-bold"
            style={{
              background: "linear-gradient(135deg, var(--p-btn), var(--p-btn-grad))",
              color: "var(--p-text)",
            }}
          >
            {strings.CREATE_ACCOUNT}
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

  const { strings } = useStudio();
  const statusLabel = (s: string) =>
    s === "WON" ? strings.STATUS_WON :
    s === "LOST" ? strings.STATUS_LOST :
    s === "PENDING" ? strings.STATUS_PENDING :
    s === "LIVE" ? strings.STATUS_LIVE : s;

  const NAV = [
    { icon: Home, label: strings.HOME },
    { icon: Trophy, label: strings.SPORTSBOOK },
    { icon: Compass, label: strings.DISCOVERY },
    { icon: Gamepad2, label: strings.CASINO },
    { icon: User, label: strings.PROFILE },
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
        {MOBILE_TILE_ICONS.map((t) => {
          const Icon = t.icon;
          const active = activeNav === t.nav;
          return (
            <button
              key={t.strKey}
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
                {strings[t.strKey]}
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
            <Flame className="h-3.5 w-3.5" /> {strings.BET_BUILDER}
          </button>
          <button
            className="h-9 rounded-md flex items-center justify-center gap-1.5 text-[11px] font-bold"
            style={{
              background: "var(--p-odds-active)",
              border: "1px solid var(--p-primary)",
              color: "var(--p-primary)",
            }}
          >
            <ArrowLeftRight className="h-3.5 w-3.5" /> {strings.PEER_TO_PEER_BTN}
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
            {strings.WELCOME_BONUS_PROMO}
          </div>
          <div className="text-[9.5px] mt-1 leading-tight" style={{ color: "var(--p-text)" }}>
            {strings.WELCOME_BONUS_BODY_MOBILE}
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
          {strings.LIVE_AND_UPCOMING}
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
        {[strings.TAB_SPORTS, strings.TAB_ALL_SPORTS].map((t, i) => (
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
              <Flame className="h-3.5 w-3.5" /> {strings.BET_BUILDER}
            </button>
            <button
              className="h-9 rounded-md flex items-center justify-center gap-1.5 text-[11px] font-bold"
              style={{
                background: "var(--p-odds-active)",
                border: "1px solid var(--p-primary)",
                color: "var(--p-primary)",
              }}
            >
              <ArrowLeftRight className="h-3.5 w-3.5" /> {strings.PEER_TO_PEER_BTN}
            </button>
          </div>

          <div className="text-[12px] font-bold mb-1.5" style={{ color: "var(--p-text)" }}>
            {strings.LIVE_AND_UPCOMING}
          </div>

          {/* Sport tabs */}
          <div className="flex gap-2 mb-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {SPORT_TABS_KEYS.map((k, i) => (
              <button
                key={k}
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
                {strings[k]}
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
            <ChevronLeft className="h-3.5 w-3.5" /> {strings.BACK_TO_SPORTS}
          </button>
          <div className="px-3 pb-1 text-[9px] font-semibold" style={{ color: "var(--p-muted)" }}>
            {strings.ALL_SPORTS} ({getSportsSidebar(strings).length})
          </div>
          <div className="px-2">
            {getSportsSidebar(strings).map((s, i) => (
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
          {strings.DISCOVER}
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
                {strings.VIEW_TIPS}
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
          {strings.CASINO_HEADING}
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
        {[strings.TAB_MY_BETS, strings.TAB_MY_FEED].map((t, i) => (
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
            {[strings.FILTER_ALL, strings.FILTER_PENDING, strings.FILTER_SETTLED, strings.FILTER_P2P].map((t, i) => (
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
                      {statusLabel(b.status)}
                    </span>
                  </div>
                  <div className="text-[9px]" style={{ color: "var(--p-muted)" }}>
                    1x2 · odds {b.odds}
                  </div>
                  <div className="flex items-center justify-between mt-1.5 text-[9px]">
                    <span style={{ color: "var(--p-muted)" }}>{strings.STAKE}</span>
                    <span className="font-bold" style={{ color: "var(--p-text)" }}>
                      ₦{b.stake}
                    </span>
                    <span style={{ color: "var(--p-muted)" }}>{strings.PAYOUT}</span>
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
                  <span style={{ color: "var(--p-muted)" }}>{strings.STAKE}</span>
                  <span className="font-bold" style={{ color: "var(--p-text)" }}>
                    ₦1,000
                  </span>
                  <span style={{ color: "var(--p-muted)" }}>{strings.POTENTIAL}</span>
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
                {strings.NO_P2P_BETS}
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
            {[strings.TAB_FRIENDS, strings.TAB_EXPLORE].map((t, i) => (
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
                          {strings.STATUS_WON}
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
                        <Share2 className="h-3 w-3" /> {strings.SHARE}
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
  const { strings } = useStudio();
  return (
    <>
      {/* Top bar */}
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
        <div className="flex items-center gap-1.5 px-2.5 h-6 rounded-full" style={{ background: "var(--p-card)" }}>
          <span className="text-[10px] font-bold" style={{ color: "var(--p-text)" }}>{currencySymbol}</span>
          <span className="text-[10px] tracking-wider" style={{ color: "var(--p-text)" }}>****</span>
          <Plus className="h-3 w-3" style={{ color: "var(--p-primary)" }} />
          <EyeOff className="h-3 w-3" style={{ color: "var(--p-muted)" }} />
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bell className="h-4 w-4" style={{ color: "var(--p-text)" }} />
            <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full" style={{ background: "var(--p-primary)" }} />
          </div>
          <MessageCircle className="h-4 w-4" style={{ color: "var(--p-text)" }} />
        </div>
      </div>

      {/* Quick tile row */}
      <div className="grid grid-cols-5 gap-1.5 px-3 mb-2 flex-shrink-0">
        {MOBILE_TILE_ICONS.map((t) => {
          const Icon = t.icon;
          const isAllSports = t.strKey === "MOBILE_TILE_ALL_SPORTS";
          return (
            <button
              key={t.strKey}
              onClick={isAllSports ? onOpenAllSports : undefined}
              className="flex flex-col items-center justify-center gap-0.5 h-14 rounded-md"
              style={{
                background: "var(--p-card)",
                border: "1px solid var(--p-divider)",
              }}
            >
              <Icon className="h-4 w-4" style={{ color: "var(--p-text)" }} />
              <span className="text-[8px] font-medium" style={{ color: "var(--p-muted)" }}>{strings[t.strKey]}</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 min-h-0 overflow-auto px-3 pb-2">
        <div className="grid grid-cols-2 gap-2 mb-2">
          <button className="h-9 rounded-md flex items-center justify-center gap-1.5 text-[11px] font-bold"
            style={{ background: "var(--p-odds-active)", border: "1px solid var(--p-primary)", color: "var(--p-primary)" }}>
            <Flame className="h-3.5 w-3.5" /> {strings.BET_BUILDER}
          </button>
          <button className="h-9 rounded-md flex items-center justify-center gap-1.5 text-[11px] font-bold"
            style={{ background: "var(--p-odds-active)", border: "1px solid var(--p-primary)", color: "var(--p-primary)" }}>
            <ArrowLeftRight className="h-3.5 w-3.5" /> {strings.PEER_TO_PEER_BTN}
          </button>
        </div>

        <div className="rounded-lg p-3 mb-3 relative"
          style={{ background: "linear-gradient(135deg, var(--p-btn), var(--p-btn-grad))", border: "1px solid var(--p-primary)" }}>
          <div className="text-[12px] font-black" style={{ color: "var(--p-text)" }}>{strings.WELCOME_BONUS_PROMO}</div>
          <div className="text-[9.5px] mt-1 leading-tight" style={{ color: "var(--p-text)" }}>
            {strings.WELCOME_BONUS_BODY_MOBILE}
          </div>
        </div>

        <div className="text-[12px] font-bold mb-1.5" style={{ color: "var(--p-text)" }}>{strings.LIVE_AND_UPCOMING}</div>
        <div className="flex gap-2 mb-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {SPORT_TABS_KEYS.map((k, i) => (
            <button key={k} onClick={() => setActiveSport(i)}
              className="px-2.5 h-6 rounded-md text-[10px] font-semibold flex-shrink-0"
              style={{
                background: activeSport === i ? "var(--p-odds-active)" : "transparent",
                border: activeSport === i ? "1px solid var(--p-primary)" : "1px solid var(--p-divider)",
                color: activeSport === i ? "var(--p-primary)" : "var(--p-muted)",
              }}>{strings[k]}</button>
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

/* ─── Types and data for remote-added view components ─────────────────── */

interface SocialPost {
  user: string;
  initial: string;
  boost?: string;
  league?: string;
  status?: "PENDING" | "LIVE" | "WON" | "LOST";
  title: string;
  match?: { home: string; away: string; date: string; score?: string };
  pick?: { market: string; selection: string; odds: string };
  legs?: Array<{ market: string; selection: string; vs: string; odds: string }>;
  stake: string;
  payout: string;
}


const FRIENDS_POSTS: SocialPost[] = [
  {
    user: "Alex M.", initial: "A",
    league: "Premier League", status: "PENDING",
    title: "4 Selection Multi", stake: "500", payout: "8,450",
    pick: { market: "1X2", selection: "Man City Win", odds: "1.85" },
  },
  {
    user: "Jordan K.", initial: "J", boost: "20% PROFIT BOOST",
    league: "Champions League", status: "WON",
    title: "3 Selection Accumulator", stake: "100", payout: "1,750",
    legs: [
      { market: "1X2", selection: "Arsenal Win", vs: "Arsenal vs Chelsea", odds: "2.10" },
      { market: "O/U", selection: "Over 2.5", vs: "Spurs vs Wolves", odds: "1.65" },
      { market: "1X2", selection: "Liverpool Win", vs: "Liverpool vs Everton", odds: "1.55" },
    ],
  },
  {
    user: "Sam T.", initial: "S",
    league: "Bundesliga", status: "LIVE",
    title: "Single Bet", stake: "200", payout: "420",
    match: { home: "Bayern", away: "Dortmund", date: "LIVE", score: "1 - 1" },
    pick: { market: "BTTS", selection: "Yes", odds: "1.75" },
  },
];

function AllSportsView() {
  const { strings } = useStudio();
  const ALL_SPORTS_LIST = getSportsSidebar(strings).map((s) => ({ ...s, icon: s.flag }));
  return (
    <div className="flex-1 min-h-0 overflow-auto">
      {/* Search bar */}
      <div className="px-3 pt-3 pb-2 flex items-center gap-2">
        <ChevronRight className="h-4 w-4 rotate-180" style={{ color: "var(--p-text)" }} />
        <div className="flex-1 flex items-center gap-2 px-3 h-9 rounded-full"
          style={{ background: "var(--p-card)", border: "1px solid var(--p-divider)" }}>
          <Search className="h-3.5 w-3.5" style={{ color: "var(--p-muted)" }} />
          <span className="text-[10.5px]" style={{ color: "var(--p-muted)" }}>{strings.SEARCH}</span>
        </div>
      </div>

      {/* Popular */}
      <div className="px-3 pt-2 pb-3">
        <div className="text-[11px] font-semibold mb-2" style={{ color: "var(--p-muted)" }}>{strings.POPULAR}</div>
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
        <div className="text-[14px] font-bold mb-2" style={{ color: "var(--p-text)" }}>{strings.ALL_SPORTS}</div>
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
  const { strings } = useStudio();
  const statusLabel = (s: string) =>
    s === "WON" ? strings.STATUS_WON :
    s === "LOST" ? strings.STATUS_LOST :
    s === "PENDING" ? strings.STATUS_PENDING :
    s === "LIVE" ? strings.STATUS_LIVE : s;
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
              {statusLabel(post.status)}
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
        <span style={{ color: "var(--p-muted)" }}>{strings.STAKE}</span>
        <span className="font-bold" style={{ color: "var(--p-text)" }}>{currencySymbol} {post.stake}</span>
        <span className="font-bold" style={{ color: "var(--p-primary)" }}>{currencySymbol} {post.payout}</span>
        <span style={{ color: "var(--p-muted)" }}>{strings.PAYOUT}</span>
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
  const { strings } = useStudio();
  const posts: SocialPost[] = FRIENDS_POSTS;
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
              {t === "friends" ? strings.TAB_FRIENDS : strings.TAB_EXPLORE}
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
  const { strings } = useStudio();
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
            style={{ background: "rgba(0,0,0,0.5)", color: "var(--p-primary)" }}>{strings.STATUS_PENDING}</span>
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
              <Flame className="h-3 w-3" /> {strings.FLEX_CUTS}
            </span>
            <span className="text-[10px] font-bold" style={{ color: "var(--p-primary)" }}>1.27 - 3.14</span>
          </div>
          <div className="grid grid-cols-3 text-[8.5px] font-bold pb-1 border-b" style={{ color: "var(--p-muted)", borderColor: "var(--p-divider)" }}>
            <span>{strings.OUTCOME}</span><span>{strings.ODDS_LABEL}</span><span className="text-right">{strings.PAYOUT}</span>
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
          <span style={{ color: "var(--p-muted)" }}>{strings.STAKE}</span>
          <span className="font-bold" style={{ color: "var(--p-text)" }}>{currencySymbol} 122.00</span>
          <span className="font-bold" style={{ color: "var(--p-primary)" }}>{currencySymbol} 26135.44</span>
          <span style={{ color: "var(--p-muted)" }}>{strings.PAYOUT}</span>
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
  const { themeColors, appIcons, previewMode, headingFont, strings } = useStudio();
  const isMobile = previewMode === "mobile";

  const previewVars = {
    "--p-bg": themeColors.primaryBg,
    "--p-primary": themeColors.primary,
    "--p-secondary": themeColors.secondary,
    "--p-text": themeColors.lightText,
    "--p-muted": themeColors.placeholderText,
    "--p-btn": themeColors.primaryButton,
    "--p-btn-grad": themeColors.primaryButtonGradient,
    "--p-inactive": themeColors.inactiveButtonBg,
    "--p-won1": themeColors.wonGradient1,
    "--p-won2": themeColors.wonGradient2,
    "--p-card": themeColors.dark,
    "--p-nav": themeColors.dark,
    "--p-bottom-nav": themeColors.dark,
    "--p-header1": themeColors.headerGradient1,
    "--p-header2": themeColors.headerGradient2,
    "--p-box-grad1": themeColors.boxGradient1,
    "--p-box-grad2": themeColors.boxGradient2,
    "--p-odds-active": themeColors.activeSecondaryGradient,
    "--p-odds-inactive": themeColors.inactiveButtonBg,
    "--p-live": themeColors.lostColor,
    "--p-success": themeColors.wonColor,
    "--p-input-bg": themeColors.darkContainer,
    "--p-input-border": themeColors.borderAndGradientBg,
    "--p-divider": themeColors.borderAndGradientBg,
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
            appName={strings.APP_NAME}
            currencySymbol={strings.CURRENCY_SYMBOL}
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
          <WebPreview appName={strings.APP_NAME} logoUrl={appIcons.appNameLogo} />
        </div>
      )}
    </div>
  );
};

export default BettingAppPreview;
