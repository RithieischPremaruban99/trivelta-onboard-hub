/**
 * BettingAppPreview - renders Sportsbook UI surfaces only.
 *
 * Consumes TCMPalette via deterministic CSS variables injected on the root element.
 * Every palette field maps to: fieldNameToCssVar(fieldName) → --p-{kebab-case}
 *
 * The following TCMPalette feature groups are set as CSS variables but NOT rendered
 * in this preview component. They apply at runtime in the actual TCM deployment
 * once the client's features are activated:
 *
 * - Poker (~44 fields)
 * - Pikkem (~16 fields)
 * - Gamepass (~54 fields)
 * - Casino (~9 fields)
 * - PAM Admin Panel (~15 fields - admin-only, not visible to end users)
 *
 * Client can still edit these fields in Advanced Mode; they will be stored in
 * studio_config.palette and applied when the TCM runtime renders those features.
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
  Zap,
  Rocket,
  Dice5,
  Ticket,
  MoreHorizontal,
  LayoutGrid,
  Volleyball,
  TableProperties,
  Snowflake,
  Bike,
  Shield,
  Target,
  CircleDot,
  Mountain,
  Sparkles,
  Star,
  Filter,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import imgAviator from "@/assets/casino/aviator.jpg";
import imgFortuneSpin from "@/assets/casino/fortune-spin.jpg";
import imgWildTiger from "@/assets/casino/wild-tiger.jpg";
import imgAviaMasters from "@/assets/casino/avia-masters.jpg";
import imgBalloonMania from "@/assets/casino/balloon-mania.jpg";
import imgDanfoCrash from "@/assets/casino/danfo-crash.jpg";
import imgDollars from "@/assets/casino/dollars.jpg";
import imgFortuneMines from "@/assets/casino/fortune-mines.jpg";
import imgCoinToss from "@/assets/casino/coin-toss.jpg";
import imgMines from "@/assets/casino/mines.jpg";
import imgPinkyPlinko from "@/assets/casino/pinky-plinko.jpg";
import imgPenaltyDuelo from "@/assets/casino/penalty-duelo.jpg";
import imgMinesweeper from "@/assets/casino/minesweeper.jpg";
import imgRocketLaunch from "@/assets/casino/rocket-launch.jpg";
import imgBoomBall from "@/assets/casino/boom-ball.jpg";
import imgTopEagle from "@/assets/casino/top-eagle.jpg";
import imgFireCrash from "@/assets/casino/fire-crash.jpg";
import imgMeteoroid from "@/assets/casino/meteoroid.jpg";
import imgOlympus from "@/assets/casino/olympus.jpg";
import imgVegasBonus from "@/assets/casino/vegas-bonus.jpg";
import imgLayBonus from "@/assets/casino/lay-bonus.jpg";
import imgJungleQuest from "@/assets/casino/jungle-quest.jpg";
import imgIceQueen from "@/assets/casino/ice-queen.jpg";
import imgRoyalRiches from "@/assets/casino/royal-riches.jpg";
import imgTreasureVault from "@/assets/casino/treasure-vault.jpg";

/* ─── Casino content (shared by web + mobile) ─────────────────────────── */

const CASINO_CATEGORIES = [
  { key: "all", label: "All Games", icon: Search },
  { key: "virtuals", label: "Virtuals", icon: Clapperboard },
  { key: "live", label: "Live", icon: Radio },
  { key: "instant", label: "Instant Win", icon: Zap },
  { key: "crash", label: "Crash", icon: Rocket },
  { key: "slots", label: "Slots", icon: LayoutGrid },
  { key: "scratch", label: "Scratch", icon: Ticket },
  { key: "other", label: "Other", icon: MoreHorizontal },
];

type GameTile = { name: string; image: string };

const CASINO_SECTIONS: { title: string; games: GameTile[] }[] = [
  {
    title: "Top Games",
    games: [
      { name: "Aviator", image: imgAviator },
      { name: "Fortune Spin", image: imgFortuneSpin },
      { name: "Wild Tiger 2", image: imgWildTiger },
      { name: "Avia Masters", image: imgAviaMasters },
      { name: "Balloon Mania", image: imgBalloonMania },
      { name: "Danfo Crash", image: imgDanfoCrash },
      { name: "Snoop Dogg Dollars", image: imgDollars },
    ],
  },
  {
    title: "Instant Win",
    games: [
      { name: "Fortune Mines", image: imgFortuneMines },
      { name: "Coin Toss", image: imgCoinToss },
      { name: "Fortune Spin", image: imgFortuneSpin },
      { name: "Mines", image: imgMines },
      { name: "Pinky Plinko", image: imgPinkyPlinko },
      { name: "Penalty Duelo", image: imgPenaltyDuelo },
      { name: "Minesweeper XY", image: imgMinesweeper },
    ],
  },
  {
    title: "Crash",
    games: [
      { name: "Aviator", image: imgAviator },
      { name: "Rocket Launch", image: imgRocketLaunch },
      { name: "Danfo Crash", image: imgDanfoCrash },
      { name: "Boom Ball", image: imgBoomBall },
      { name: "Top Eagle", image: imgTopEagle },
      { name: "Avia Masters", image: imgAviaMasters },
      { name: "Fire Crash", image: imgFireCrash },
      { name: "Meteoroid Deluxe", image: imgMeteoroid },
    ],
  },
  {
    title: "Slots",
    games: [
      { name: "Secrets of Olympus", image: imgOlympus },
      { name: "Vegas Bonus", image: imgVegasBonus },
      { name: "Lay A Bonus", image: imgLayBonus },
      { name: "Jungle Quest", image: imgJungleQuest },
      { name: "Ice Queen", image: imgIceQueen },
      { name: "Royal Riches", image: imgRoyalRiches },
      { name: "Treasure Vault", image: imgTreasureVault },
    ],
  },
];

function CasinoContent({ variant }: { variant: "web" | "mobile" }) {
  const [activeCat, setActiveCat] = useState("all");
  const isMobile = variant === "mobile";
  const tileSize = isMobile ? "h-[100px]" : "h-[140px]";
  const gridCols = isMobile ? "grid grid-cols-2 gap-2" : "flex gap-2 overflow-x-auto";

  return (
    <div
      className="flex-1 min-h-0 overflow-auto"
      style={{ background: "var(--p-primary-background-color)" }}
    >
      {/* Filter bar */}
      <div
        className="flex gap-3 overflow-x-auto px-3 py-3 border-b"
        style={{ borderColor: "var(--p-border-color)" }}
      >
        {CASINO_CATEGORIES.map((c) => {
          const Icon = c.icon;
          const active = activeCat === c.key;
          return (
            <button
              key={c.key}
              onClick={() => setActiveCat(c.key)}
              className="flex flex-col items-center gap-1 flex-shrink-0 group"
            >
              <span
                className="grid place-items-center rounded-full transition-all"
                style={{
                  width: isMobile ? 40 : 48,
                  height: isMobile ? 40 : 48,
                  background: active
                    ? "var(--p-active-secondary-gradient-color, var(--p-primary))"
                    : "var(--p-modal-background)",
                  border: `1px solid ${active ? "var(--p-primary)" : "var(--p-border-color)"}`,
                  color: "var(--p-light-text-color)",
                }}
              >
                <Icon className={isMobile ? "h-4 w-4" : "h-5 w-5"} />
              </span>
              <span
                className="text-[9px] font-medium whitespace-nowrap"
                style={{
                  color: active ? "var(--p-primary)" : "var(--p-text-secondary-color)",
                  borderBottom: active ? "1.5px solid var(--p-primary)" : "1.5px solid transparent",
                  paddingBottom: 1,
                }}
              >
                {c.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Sections */}
      <div className="px-3 py-2 space-y-4">
        {CASINO_SECTIONS.map((section) => (
          <div key={section.title} className="space-y-2">
            <div className="flex items-center justify-between">
              <div
                className="text-[12px] font-bold"
                style={{ color: "var(--p-light-text-color)" }}
              >
                {section.title}
              </div>
              <button
                className="text-[9px] font-semibold flex items-center gap-0.5"
                style={{ color: "var(--p-primary)" }}
              >
                All games <ChevronRight className="h-2.5 w-2.5" />
              </button>
            </div>
            <div className={gridCols}>
              {section.games.map((g, idx) => (
                <div
                  key={`${g.name}-${idx}`}
                  className={`${tileSize} ${isMobile ? "" : "w-[140px] flex-shrink-0"} relative rounded-xl overflow-hidden cursor-pointer transition-transform hover:scale-105`}
                  style={{
                    border: "1px solid var(--p-border-color)",
                    color: "var(--p-light-text-color)",
                  }}
                >
                  <img
                    src={g.image}
                    alt={g.name}
                    loading="lazy"
                    width={512}
                    height={512}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div
                    className="absolute inset-x-0 bottom-0 px-2 py-1.5"
                    style={{
                      background:
                        "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)",
                    }}
                  >
                    <span
                      className={`${isMobile ? "text-[9px]" : "text-[10px]"} font-bold leading-tight text-white drop-shadow`}
                    >
                      {g.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


function pickContrastText(rgbaStr: string): string {
  const m = rgbaStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return "var(--p-light-text-color)";
  const lum = (0.2126 * +m[1] + 0.7152 * +m[2] + 0.0722 * +m[3]) / 255;
  return lum > 0.4 ? "rgba(0,0,0,0.85)" : "var(--p-light-text-color)";
}

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

// These are computed inside components using strings - kept as icon-only config here
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
  {
    date: "LIVE · Not started",
    home: "Manchester City",
    away: "Arsenal FC",
    odds: ["1.85", "3.55", "4.15"],
    live: true,
  },
  {
    date: "TOMORROW · 9:00 PM",
    home: "Crystal Palace",
    away: "West Ham United",
    odds: ["2.46", "3.35", "3.10"],
  },
  {
    date: "21 APR · 9:00 PM",
    home: "Brighton & Hove Albion",
    away: "Chelsea FC",
    odds: ["2.50", "3.75", "2.75"],
  },
  {
    date: "22 APR · 9:00 PM",
    home: "AFC Bournemouth",
    away: "Leeds United",
    odds: ["2.10", "3.65", "3.60"],
  },
  {
    date: "22 APR · 9:00 PM",
    home: "Burnley FC",
    away: "Manchester City",
    odds: ["12.00", "7.20", "1.24"],
  },
  {
    date: "24 APR · 9:00 PM",
    home: "Sunderland AFC",
    away: "Nottingham Forest",
    odds: ["2.90", "3.35", "2.60"],
  },
  {
    date: "25 APR · 1:30 PM",
    home: "Fulham FC",
    away: "Aston Villa",
    odds: ["2.70", "3.65", "2.60"],
  },
  {
    date: "25 APR · 4:00 PM",
    home: "Wolverhampton Wanderers",
    away: "Tottenham Hotspur",
    odds: ["4.10", "3.85", "1.90"],
  },
];

const BET_SLIPS = [
  { team: "Brentford FC", odds: "2.16", status: "LOST", stake: "100", payout: "0" },
  { team: "Tottenham Hotspur", odds: "2.85", status: "PENDING", stake: "10", payout: "28.50" },
  { team: "Brighton & Hove Albion", odds: "1.64", status: "WON", stake: "55", payout: "243.71" },
];

const SOCIAL_POSTS = [
  {
    user: "Alex M.",
    avatar: "A",
    action: "placed a 3-leg parlay",
    bet: "Man City, Arsenal, Chelsea",
    time: "2m ago",
    likes: 12,
    stake: "500",
    odds: "8.45",
  },
  {
    user: "Jordan K.",
    avatar: "J",
    action: "won big!",
    bet: "Brighton Over 2.5",
    time: "15m ago",
    likes: 34,
    stake: "100",
    odds: "1.75",
    won: true,
  },
  {
    user: "Sam T.",
    avatar: "S",
    action: "is live betting",
    bet: "Arsenal vs Chelsea",
    time: "1h ago",
    likes: 8,
    stake: "200",
    odds: "2.10",
  },
  {
    user: "Morgan R.",
    avatar: "M",
    action: "placed a bet",
    bet: "Tottenham Win",
    time: "2h ago",
    likes: 5,
    stake: "50",
    odds: "3.20",
  },
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

const TEAM_LOGO_IDS: Record<string, number> = {
  // Premier League
  "Manchester City": 50, "Arsenal FC": 42, "Chelsea FC": 49, "Liverpool": 40,
  "Manchester United": 33, "Tottenham Hotspur": 47, "Brighton & Hove Albion": 51,
  "Brighton": 51, "Crystal Palace": 52, "West Ham United": 48, "Aston Villa": 66,
  "Fulham FC": 36, "Wolverhampton Wanderers": 39, "Burnley FC": 44,
  "AFC Bournemouth": 35, "Leeds United": 63, "Sunderland AFC": 746,
  "Nottingham Forest": 65, "Everton": 45,
  // Serie A
  "AC Milan": 489, "Juventus": 496, "Juventus Turin": 496, "Inter Milano": 505,
  "AS Roma": 497, "Lazio Rome": 487, "ACF Fiorentina": 502, "Torino FC": 503,
  "Sassuolo Calcio": 488, "Cagliari Calcio": 490, "Udinese Calcio": 494,
  "US Cremonese": 520, "Hellas Verona": 504, "Parma Calcio": 521,
  // LaLiga
  "Real Madrid": 541, "Atletico Madrid": 530, "Sevilla FC": 536,
  "Real Sociedad": 548, "Real Betis": 543, "Real Betis Seville": 543,
  "Espanyol Barcelona": 540, "RC Celta de Vigo": 538, "CA Osasuna": 727,
  "Levante UD": 539, "Elche CF": 797, "Deportivo Alaves": 542,
  "Rayo Vallecano": 728, "Real Oviedo": 718,
  // Bundesliga
  "Bayern": 157, "Borussia Dortmund": 165, "Dortmund": 165, "RB Leipzig": 173,
  "Bayer Leverkusen": 168, "Eintracht Frankfurt": 169, "VfB Stuttgart": 172,
  "FC Augsburg": 170, "Bor. M'gladbach": 163, "TSG Hoffenheim": 167,
  "Werder Bremen": 162, "FC St. Pauli": 186,
  // Ligue 1
  "Olympique Marseille": 81, "Olympique Lyon": 80, "AS Monaco": 91,
  "Lille OSC": 79, "FC Nantes": 83, "Strasbourg": 95, "Toulouse FC": 96,
  "Le Havre AC": 111, "SCO Angers": 77, "Racing Club": 116,
};

const teamLogoUrl = (name: string): string | null => {
  const id = TEAM_LOGO_IDS[name];
  return id ? `https://media.api-sports.io/football/teams/${id}.png` : null;
};

const TeamDot = ({ label, size = 16 }: { label: string; size?: number }) => {
  const url = teamLogoUrl(label);
  if (url) {
    return (
      <img
        src={url}
        alt={label}
        className="rounded-full flex-shrink-0 object-contain"
        style={{ height: size, width: size, background: "var(--p-inactive-button-bg)" }}
      />
    );
  }
  return (
    <div
      className="rounded-full grid place-items-center font-bold flex-shrink-0"
      style={{
        height: size, width: size,
        background: "var(--p-inactive-button-bg)",
        color: "var(--p-light-text-color)",
        fontSize: Math.max(7, Math.floor(size * 0.45)),
      }}
    >
      {label.slice(0, 1)}
    </div>
  );
};

const LiveDot = () => {
  const { strings } = useStudio();
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-[1px] rounded-full text-[8px] font-bold"
      style={{ background: "rgba(239,68,68,0.15)", color: "var(--p-lost-color)" }}
    >
      <span className="h-1 w-1 rounded-full" style={{ background: "var(--p-lost-color)" }} />
      {strings.LIVE_BADGE}
    </span>
  );
};

/* ─── WEB VERSION ─────────────────────────────────────────────────────── */

function WebPreview({ appName, logoUrl }: { appName: string; logoUrl?: string | null }) {
  const { strings, palette } = useStudio();
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
    s === "WON"
      ? strings.STATUS_WON
      : s === "LOST"
        ? strings.STATUS_LOST
        : s === "LIVE"
          ? strings.STATUS_LIVE
          : strings.STATUS_PENDING;

  const NAV = [
    { icon: Home, label: strings.FEED },
    { icon: Trophy, label: strings.SPORTSBOOK },
    { icon: Compass, label: strings.DISCOVERY },
    { icon: Gamepad2, label: strings.CASINO },
    { icon: Swords, label: strings.PEER_TO_PEER_NAV },
  ];

  /* Right panel - always visible */
  const renderRightPanel = () => (
    <aside
      className="w-[200px] border-l flex flex-col flex-shrink-0"
      style={{ borderColor: "var(--p-border-and-gradient-bg)", background: "var(--p-dark)" }}
    >
      {/* My Bets / My Feed top tabs */}
      <div
        className="flex border-b text-[9px] font-semibold"
        style={{ borderColor: "var(--p-border-and-gradient-bg)" }}
      >
        {[strings.TAB_MY_BETS, strings.TAB_MY_FEED].map((t, i) => (
          <button
            key={t}
            onClick={() => setWebMyBetsMainTab(i)}
            className="flex-1 h-7 relative"
            style={{ color: webMyBetsMainTab === i ? "var(--p-light-text-color)" : "var(--p-text-secondary-color)" }}
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
            style={{ borderColor: "var(--p-border-and-gradient-bg)" }}
          >
            {[
              strings.FILTER_ALL,
              strings.FILTER_PENDING,
              strings.FILTER_SETTLED,
              strings.FILTER_P2P,
            ].map((t, i) => (
              <button
                key={t}
                onClick={() => setWebMyBetsFilter(i)}
                className="flex-1 h-6 relative"
                style={{ color: webMyBetsFilter === i ? "var(--p-primary)" : "var(--p-text-secondary-color)" }}
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
              return false; // P2P - no P2P bets in sample
            }).map((b, i) => {
              const isWon = b.status === "WON";
              return (
                <div
                  key={i}
                  className="rounded-md p-2"
                  style={{ background: "var(--p-dark)", border: "1px solid var(--p-border-and-gradient-bg)" }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1">
                      <TeamDot label={b.team} />
                      <span className="text-[9px] font-bold" style={{ color: "var(--p-light-text-color)" }}>
                        {b.team.slice(0, 12)}…
                      </span>
                    </div>
                    <span
                      className="text-[8px] font-bold px-1.5 py-[1px] rounded"
                      style={{
                        background: isWon
                          ? "linear-gradient(135deg, var(--p-won-gradient-1), var(--p-won-gradient-2))"
                          : b.status === "PENDING"
                            ? "rgba(234,179,8,0.15)"
                            : "rgba(239,68,68,0.15)",
                        color: isWon
                          ? "var(--p-light-text-color)"
                          : b.status === "PENDING"
                            ? "#eab308"
                            : "var(--p-lost-color)",
                      }}
                    >
                      {statusLabel(b.status)}
                    </span>
                  </div>
                  <div className="text-[8px]" style={{ color: "var(--p-text-secondary-color)" }}>
                    1x2 · odds {b.odds}
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[9px]">
                    <span style={{ color: "var(--p-text-secondary-color)" }}>{strings.STAKE}</span>
                    <span className="font-bold" style={{ color: "var(--p-light-text-color)" }}>
                      ₦{b.stake}
                    </span>
                    <span style={{ color: "var(--p-text-secondary-color)" }}>{strings.PAYOUT}</span>
                    <span
                      className="font-bold"
                      style={{ color: isWon ? "var(--p-won-color)" : "var(--p-light-text-color)" }}
                    >
                      ₦{b.payout}
                    </span>
                  </div>
                </div>
              );
            })}
            {webMyBetsFilter === 3 && (
              <div className="text-center py-4 text-[9px]" style={{ color: "var(--p-text-secondary-color)" }}>
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
              style={{ background: "var(--p-dark)", border: "1px solid var(--p-border-and-gradient-bg)" }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <div
                  className="h-5 w-5 rounded-full grid place-items-center text-[8px] font-bold flex-shrink-0"
                  style={{ background: "var(--p-primary)", color: "var(--p-light-text-color)" }}
                >
                  {p.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[8px] font-bold truncate" style={{ color: "var(--p-light-text-color)" }}>
                    {p.user}
                  </div>
                  <div className="text-[7px]" style={{ color: "var(--p-text-secondary-color)" }}>
                    {p.action}
                  </div>
                </div>
              </div>
              <div className="text-[8px] truncate" style={{ color: "var(--p-primary)" }}>
                {p.bet}
              </div>
              <div
                className="flex justify-between mt-1 text-[7px]"
                style={{ color: "var(--p-text-secondary-color)" }}
              >
                <span>
                  @{p.odds} · {p.time}
                </span>
                <span>♥ {p.likes}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </aside>
  );

  /* Feed view (nav index 0) */
  const followersList = [
    { name: "Patecowin", handle: "patecowin" },
    { name: "NgozikaOguine", handle: "ngozika" },
    { name: "Zizu", handle: "zizu" },
    { name: "Efe Benson", handle: "benson" },
    { name: "AlexTIPS", handle: "alextips" },
    { name: "Ismail Muhammad", handle: "ismael53b" },
    { name: "Oscar", handle: "oscar" },
    { name: "Ebaloghemen", handle: "ebal" },
    { name: "Adriano", handle: "adriano" },
    { name: "Akinwale", handle: "akinwale1" },
  ];

  const renderFriendsSidebar = () => {
    const primaryText = pickContrastText(palette.primary);
    return (
      <aside
        className="w-[230px] border-r flex flex-col flex-shrink-0 overflow-auto"
        style={{
          borderColor: "var(--p-border-and-gradient-bg)",
          background: "var(--p-dark)",
        }}
      >
        <div className="px-3 py-3 space-y-3">
          <div className="text-[11px] font-bold" style={{ color: "var(--p-light-text-color)" }}>
            {strings.TAB_FRIENDS}
          </div>
          <div
            className="flex items-center gap-2 h-7 rounded-md px-2"
            style={{
              background: "var(--p-modal-background)",
              border: "1px solid var(--p-border-and-gradient-bg)",
            }}
          >
            <Search className="h-3 w-3" style={{ color: "var(--p-text-secondary-color)" }} />
            <span className="text-[9px]" style={{ color: "var(--p-text-secondary-color)" }}>
              Search
            </span>
          </div>
          <div
            className="rounded-lg p-3 text-center"
            style={{
              border: "1px solid color-mix(in oklab, var(--p-primary) 35%, transparent)",
              background:
                "linear-gradient(135deg, color-mix(in oklab, var(--p-primary) 8%, transparent) 0%, transparent 100%)",
            }}
          >
            <div
              className="h-8 w-8 mx-auto rounded-full grid place-items-center mb-2"
              style={{
                background: "color-mix(in oklab, var(--p-primary) 20%, transparent)",
                color: "var(--p-primary)",
              }}
            >
              <Users className="h-4 w-4" />
            </div>
            <div
              className="text-[9px] font-semibold leading-tight mb-2"
              style={{ color: "var(--p-primary)" }}
            >
              Refer your friends and build your network
              <div style={{ color: "var(--p-text-secondary-color)" }}>1 friend at a time!</div>
            </div>
            <button
              className="w-full h-6 rounded text-[9px] font-bold"
              style={{ background: "var(--p-primary)", color: primaryText }}
            >
              {strings.REFER_FRIENDS}
            </button>
          </div>
          <div
            className="flex border-b text-[9px] font-semibold"
            style={{ borderColor: "var(--p-border-and-gradient-bg)" }}
          >
            {[`23 ${strings.FOLLOWING}`, `47 ${strings.FOLLOWERS}`].map((t, i) => {
              const active = i === 0;
              return (
                <button
                  key={t}
                  className="flex-1 h-6 relative"
                  style={{
                    color: active ? "var(--p-light-text-color)" : "var(--p-text-secondary-color)",
                  }}
                >
                  {t}
                  {active && (
                    <span
                      className="absolute bottom-0 left-2 right-2 h-[2px]"
                      style={{ background: "var(--p-primary)" }}
                    />
                  )}
                </button>
              );
            })}
          </div>
          <div className="space-y-1.5">
            {followersList.map((u) => (
              <div key={u.handle} className="flex items-center gap-2">
                <div
                  className="h-7 w-7 rounded-full grid place-items-center text-[9px] font-bold flex-shrink-0"
                  style={{
                    background: "var(--p-modal-background)",
                    color: "var(--p-light-text-color)",
                  }}
                >
                  {u.name.slice(0, 1)}
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className="text-[9px] font-semibold truncate"
                    style={{ color: "var(--p-light-text-color)" }}
                  >
                    {u.name}
                  </div>
                  <div
                    className="text-[8px] truncate"
                    style={{ color: "var(--p-text-secondary-color)" }}
                  >
                    {u.handle}
                  </div>
                </div>
                <button
                  className="h-5 px-2 rounded text-[8px] font-semibold"
                  style={{
                    border: "1px solid var(--p-border-and-gradient-bg)",
                    color: "var(--p-light-text-color)",
                    background: "transparent",
                  }}
                >
                  {strings.FOLLOWING}
                </button>
              </div>
            ))}
          </div>
        </div>
      </aside>
    );
  };

  const renderFeedView = () => {
    const feedPosts = [
      {
        user: "Geewine",
        handle: "Veron",
        league: "LaLiga, Serie A",
        legCount: 8,
        boost: 3,
        oldOdds: "4.02",
        newOdds: "4.11",
        status: "PENDING" as const,
        boostExtra: 3,
        legs: [
          { type: "Total", pick: "under 3.5", odds: "1.17", home: "AC Milan", away: "Rayo Vallecano" },
          { type: "1x2", pick: "Juventus Turin", odds: "1.22", home: "Juventus", away: "Hellas Verona" },
          { type: "1x2", pick: "Inter Milano", odds: "1.24", home: "Inter Milano", away: "Parma Calcio" },
          { type: "Double chance", pick: "Lille OSC or draw", odds: "1.11", home: "Lille OSC", away: "Le Havre AC" },
        ],
        stake: "400",
        payout: "1643.01",
        time: "9 hours ago",
      },
      {
        user: "Geewine",
        handle: "Xtian1986",
        league: "LaLiga, Serie A",
        legCount: 13,
        boost: 45,
        oldOdds: "94.58",
        newOdds: "136.69",
        status: "PENDING" as const,
        boostExtra: 4,
        legs: [
          { type: "1x2", pick: "Real Madrid", odds: "1.77", home: "Espanyol Barcelona", away: "Real Madrid" },
          { type: "1x2", pick: "Real Betis Seville", odds: "1.60", home: "Real Betis", away: "Real Oviedo" },
          { type: "Double chance", pick: "draw or AC Milan", odds: "1.21", home: "Sassuolo Calcio", away: "AC Milan" },
        ],
        stake: "120",
        payout: "16402.80",
        time: "2 hours ago",
      },
      {
        user: "AlexTIPS",
        handle: "alextips",
        league: "Premier League",
        legCount: 4,
        boost: 5,
        oldOdds: "8.20",
        newOdds: "8.61",
        status: "WON" as const,
        boostExtra: 0,
        legs: [
          { type: "1x2", pick: "Manchester City", odds: "1.85", home: "Manchester City", away: "Arsenal FC" },
          { type: "Over/Under", pick: "Over 2.5", odds: "1.65", home: "Chelsea FC", away: "Brighton" },
          { type: "GG", pick: "Both teams to score", odds: "1.72", home: "Liverpool", away: "Everton" },
        ],
        stake: "50",
        payout: "430.50",
        time: "1 day ago",
      },
    ];

    const statusStyle = (status: "PENDING" | "WON" | "LOST") => {
      if (status === "WON")
        return { bg: "color-mix(in oklab, var(--p-won-color) 18%, transparent)", color: "var(--p-won-color)" };
      if (status === "LOST")
        return { bg: "color-mix(in oklab, var(--p-lost-color) 18%, transparent)", color: "var(--p-lost-color)" };
      return { bg: "color-mix(in oklab, var(--p-secondary) 18%, transparent)", color: "var(--p-secondary)" };
    };

    const statusLabelText = (s: "PENDING" | "WON" | "LOST") =>
      s === "WON" ? strings.STATUS_WON : s === "LOST" ? strings.STATUS_LOST : strings.STATUS_PENDING;

    const primaryText = pickContrastText(palette.primary);

    return (
      <div className="flex-1 min-h-0 flex">
        {renderFriendsSidebar()}

        {/* CENTER: Feed */}
        <main className="flex-1 min-w-0 overflow-auto">
          {/* Friends / Explore tabs */}
          <div
            className="flex border-b sticky top-0 z-10"
            style={{
              borderColor: "var(--p-border-and-gradient-bg)",
              background: "var(--p-primary-background-color)",
            }}
          >
            {([strings.TAB_FRIENDS, strings.TAB_EXPLORE] as const).map((t, i) => (
              <button
                key={t}
                onClick={() => setWebFeedTab(i)}
                className="flex-1 h-9 text-[11px] font-semibold relative"
                style={{
                  color:
                    webFeedTab === i ? "var(--p-light-text-color)" : "var(--p-text-secondary-color)",
                }}
              >
                {t}
                {webFeedTab === i && (
                  <span
                    className="absolute bottom-0 left-1/4 right-1/4 h-[2px] rounded-full"
                    style={{ background: "var(--p-primary)" }}
                  />
                )}
              </button>
            ))}
          </div>

          {webFeedTab === 0 ? (
            <div className="px-3 py-3 space-y-3">
              {feedPosts.map((post, pi) => {
                const sStyle = statusStyle(post.status);
                return (
                  <div
                    key={pi}
                    className="rounded-lg p-3"
                    style={{
                      background: "var(--p-dark)",
                      border: "1px solid var(--p-border-and-gradient-bg)",
                    }}
                  >
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="h-7 w-7 rounded-full grid place-items-center text-[10px] font-bold flex-shrink-0"
                        style={{ background: "var(--p-primary)", color: primaryText }}
                      >
                        {post.user.slice(0, 1)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-[10px] font-bold"
                          style={{ color: "var(--p-light-text-color)" }}
                        >
                          {post.user}
                        </div>
                        <div
                          className="text-[8.5px] flex items-center gap-1"
                          style={{ color: "var(--p-text-secondary-color)" }}
                        >
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ background: "var(--p-primary)" }}
                          />
                          {post.handle}
                        </div>
                      </div>
                      {post.boostExtra > 0 && (
                        <span
                          className="text-[8px] font-bold px-1.5 py-[1px] rounded"
                          style={{
                            background: "var(--p-modal-background)",
                            color: "var(--p-text-secondary-color)",
                          }}
                        >
                          +{post.boostExtra}
                        </span>
                      )}
                      <span
                        className="text-[8px] font-bold px-1.5 py-[2px] rounded inline-flex items-center gap-0.5"
                        style={{ background: "var(--p-primary)", color: primaryText }}
                      >
                        <Zap className="h-2 w-2" />
                        {post.boost}% BOOST
                      </span>
                      <span
                        className="text-[8px] font-bold px-1.5 py-[2px] rounded"
                        style={{ background: sStyle.bg, color: sStyle.color }}
                      >
                        {statusLabelText(post.status)}
                      </span>
                    </div>

                    {/* League row */}
                    <div
                      className="text-[8.5px] mb-1 flex items-center gap-1.5"
                      style={{ color: "var(--p-text-secondary-color)" }}
                    >
                      <Trophy className="h-2.5 w-2.5" />
                      {post.league}
                    </div>

                    {/* Title row */}
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className="text-[12px] font-bold"
                        style={{ color: "var(--p-light-text-color)" }}
                      >
                        {post.legCount} {strings.LEG_PARLAY}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="text-[10px] line-through"
                          style={{ color: "var(--p-text-secondary-color)" }}
                        >
                          {post.oldOdds}
                        </span>
                        <span
                          className="text-[12px] font-bold"
                          style={{ color: "var(--p-light-text-color)" }}
                        >
                          {post.newOdds}
                        </span>
                        <Zap className="h-3 w-3" style={{ color: "var(--p-primary)" }} />
                      </div>
                    </div>

                    {/* Legs */}
                    <div className="space-y-1.5">
                      {post.legs.slice(0, 3).map((leg, li) => (
                        <div
                          key={li}
                          className="rounded-md p-2"
                          style={{ background: "var(--p-modal-background)" }}
                        >
                          <div className="flex items-start justify-between mb-1">
                            <div className="min-w-0">
                              <div
                                className="text-[8px] uppercase tracking-wide"
                                style={{ color: "var(--p-text-secondary-color)" }}
                              >
                                {leg.type}
                              </div>
                              <div
                                className="text-[10px] font-bold"
                                style={{ color: "var(--p-light-text-color)" }}
                              >
                                {leg.pick}
                              </div>
                            </div>
                            <div
                              className="text-[10px] font-bold"
                              style={{ color: "var(--p-won-color)" }}
                            >
                              {leg.odds}
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 min-w-0">
                              <TeamDot label={leg.home} />
                              <span
                                className="text-[8.5px] truncate"
                                style={{ color: "var(--p-text-secondary-color)" }}
                              >
                                {leg.home}
                              </span>
                            </div>
                            <span
                              className="text-[8px] font-bold px-1"
                              style={{ color: "var(--p-text-secondary-color)" }}
                            >
                              VS
                            </span>
                            <div className="flex items-center gap-1 min-w-0 justify-end">
                              <span
                                className="text-[8.5px] truncate"
                                style={{ color: "var(--p-text-secondary-color)" }}
                              >
                                {leg.away}
                              </span>
                              <TeamDot label={leg.away} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Show all legs */}
                    {post.legCount > 3 && (
                      <button
                        className="w-full mt-2 text-[10px] font-semibold flex items-center justify-center gap-1"
                        style={{ color: "var(--p-primary)" }}
                      >
                        Show all {post.legCount} legs <ChevronDown className="h-3 w-3" />
                      </button>
                    )}

                    {/* Footer */}
                    <div
                      className="flex items-center justify-between mt-2 pt-2 border-t"
                      style={{ borderColor: "var(--p-border-and-gradient-bg)" }}
                    >
                      <div className="text-[8.5px]">
                        <span style={{ color: "var(--p-text-secondary-color)" }}>{strings.STAKE} </span>
                        <span className="font-bold" style={{ color: "var(--p-light-text-color)" }}>
                          ₦{post.stake}
                        </span>
                      </div>
                      <div className="text-[8.5px]">
                        <span style={{ color: "var(--p-text-secondary-color)" }}>{strings.PAYOUT} </span>
                        <span className="font-bold" style={{ color: "var(--p-light-text-color)" }}>
                          ₦{post.payout}
                        </span>
                      </div>
                    </div>

                    {/* Action row */}
                    <div className="flex items-center gap-3 mt-2">
                      <button>
                        <Heart className="h-3.5 w-3.5" style={{ color: "var(--p-text-secondary-color)" }} />
                      </button>
                      <button>
                        <MessageCircle className="h-3.5 w-3.5" style={{ color: "var(--p-text-secondary-color)" }} />
                      </button>
                      <span className="text-[8.5px]" style={{ color: "var(--p-text-secondary-color)" }}>
                        {post.time}
                      </span>
                      <button className="ml-auto">
                        <Share2 className="h-3.5 w-3.5" style={{ color: "var(--p-text-secondary-color)" }} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 p-3">
              {EXPLORE_POSTS.map((p, i) => (
                <div
                  key={i}
                  className="rounded-md p-3"
                  style={{
                    background: "var(--p-dark)",
                    border: "1px solid var(--p-border-and-gradient-bg)",
                  }}
                >
                  <span
                    className="text-[9px] font-bold px-1.5 py-[1px] rounded"
                    style={{
                      background: "var(--p-primary)",
                      color: primaryText,
                    }}
                  >
                    {p.badge}
                  </span>
                  <div
                    className="text-[11px] font-bold mt-1.5"
                    style={{ color: "var(--p-light-text-color)" }}
                  >
                    {p.title}
                  </div>
                  <div
                    className="text-[9px] mt-1"
                    style={{ color: "var(--p-text-secondary-color)" }}
                  >
                    {p.desc}
                  </div>
                  <button
                    className="mt-2 w-full h-6 rounded text-[9px] font-semibold"
                    style={{ background: "var(--p-primary)", color: primaryText }}
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
  };


  /* Sports view (nav index 1) - 3-column layout */
  const renderSportsView = () => (
    <div className="flex-1 min-h-0 flex">
      {/* Left sidebar */}
      <aside
        className="w-[170px] border-r flex flex-col flex-shrink-0"
        style={{ borderColor: "var(--p-border-and-gradient-bg)", background: "var(--p-dark)" }}
      >
        <div className="px-2.5 py-2">
          <div
            className="flex items-center gap-1.5 px-2 h-6 rounded-md"
            style={{ background: "var(--p-dark-container-background)", border: "1px solid var(--p-border-and-gradient-bg)" }}
          >
            <Search className="h-3 w-3" style={{ color: "var(--p-text-secondary-color)" }} />
            <span className="text-[9px]" style={{ color: "var(--p-text-secondary-color)" }}>
              {strings.SEARCH}
            </span>
          </div>
        </div>
        <div className="px-3 pb-1 text-[9px] font-semibold" style={{ color: "var(--p-text-secondary-color)" }}>
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
                  background: active ? "var(--p-active-secondary-gradient-color)" : "transparent",
                  border: active ? "1px solid var(--p-primary)" : "1px solid transparent",
                }}
              >
                <span
                  className="h-3 w-3 rounded border"
                  style={{ borderColor: "var(--p-border-and-gradient-bg)" }}
                />
                <span className="text-[10px]">{s.flag}</span>
                <span
                  className="flex-1 text-[10px] font-medium"
                  style={{ color: active ? pickContrastText(palette.activeSecondaryGradientColor) : "var(--p-light-text-color)" }}
                >
                  {s.name}
                </span>
                <span className="text-[9px] font-semibold" style={{ color: "var(--p-text-secondary-color)" }}>
                  {s.count}
                </span>
                <ChevronDown className="h-2.5 w-2.5" style={{ color: "var(--p-text-secondary-color)" }} />
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
                    background: "var(--p-dark)",
                    border: active ? "1px solid var(--p-primary)" : "1px solid var(--p-border-and-gradient-bg)",
                  }}
                >
                  <Icon
                    className="h-3.5 w-3.5"
                    style={{ color: active ? "var(--p-primary)" : "var(--p-light-text-color)" }}
                  />
                  <span
                    className="text-[7.5px] font-medium text-center leading-tight px-0.5"
                    style={{ color: active ? "var(--p-primary)" : "var(--p-text-secondary-color)" }}
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
                background: "var(--p-active-secondary-gradient-color)",
                border: "1px solid var(--p-primary)",
                color: pickContrastText(palette.activeSecondaryGradientColor),
              }}
            >
              <Flame className="h-3 w-3" /> {strings.BET_BUILDER}
            </button>
            <button
              onClick={() => setActiveNav(4)}
              className="h-8 rounded-md flex items-center justify-center gap-1.5 text-[10px] font-bold"
              style={{
                background: "var(--p-active-secondary-gradient-color)",
                border: "1px solid var(--p-primary)",
                color: pickContrastText(palette.activeSecondaryGradientColor),
              }}
            >
              <ArrowLeftRight className="h-3 w-3" /> {strings.PEER_TO_PEER_BTN}
            </button>
          </div>

          {/* Welcome Bonus */}
          <div
            className="rounded-lg p-3 mb-3 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, var(--p-primary-button), var(--p-primary-button-gradient))",
            }}
          >
            <div
              className="text-[9px] font-bold tracking-wider opacity-90"
              style={{ color: "var(--p-light-text-color)" }}
            >
              {strings.WELCOME_BONUS_PROMO}
            </div>
            <div className="text-[9px] mt-1 opacity-80" style={{ color: "var(--p-light-text-color)" }}>
              {strings.WELCOME_BONUS_BODY_WEB}
            </div>
          </div>

          {/* Live & upcoming */}
          <div className="text-[12px] font-bold mb-1.5" style={{ color: "var(--p-light-text-color)" }}>
            {strings.LIVE_AND_UPCOMING_GAMES}
          </div>
          <div className="flex gap-2 mb-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {SPORT_TABS_KEYS.map((k, i) => (
              <button
                key={k}
                onClick={() => setActiveSportRow(i)}
                className="px-2.5 h-6 rounded-md text-[9px] font-semibold flex-shrink-0"
                style={{
                  background: activeSportRow === i ? "var(--p-active-secondary-gradient-color)" : "transparent",
                  border:
                    activeSportRow === i
                      ? "1px solid var(--p-primary)"
                      : "1px solid var(--p-border-and-gradient-bg)",
                  color: activeSportRow === i ? pickContrastText(palette.activeSecondaryGradientColor) : "var(--p-text-secondary-color)",
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
                style={{ background: "var(--p-dark)", border: "1px solid var(--p-border-and-gradient-bg)" }}
              >
                <LiveDot />
                <div className="text-[8px] mt-1 truncate" style={{ color: "var(--p-text-secondary-color)" }}>
                  {m.code}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[9px] font-bold" style={{ color: "var(--p-light-text-color)" }}>
                    {m.home}
                  </span>
                  {m.odds && (
                    <span className="text-[8px]" style={{ color: "var(--p-text-secondary-color)" }}>
                      {m.odds}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold" style={{ color: "var(--p-light-text-color)" }}>
                    {m.away}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Soccer tabs - now stateful */}
          <div
            className="flex items-center justify-between border-b mb-2"
            style={{ borderColor: "var(--p-border-and-gradient-bg)" }}
          >
            <div className="flex">
              {[strings.SOCCER, strings.BASKETBALL, strings.TENNIS, "TT Elite Series"].map(
                (t, i) => (
                  <button
                    key={t}
                    onClick={() => setActiveSoccerTab(i)}
                    className="px-3 h-7 text-[10px] font-semibold relative"
                    style={{
                      color: activeSoccerTab === i ? "var(--p-light-text-color)" : "var(--p-text-secondary-color)",
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
                ),
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Trophy className="h-3 w-3" style={{ color: "var(--p-light-text-color)" }} />
              <span className="text-[11px] font-bold" style={{ color: "var(--p-light-text-color)" }}>
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
                  background: activeLeague === i ? "var(--p-active-secondary-gradient-color)" : "transparent",
                  border:
                    activeLeague === i
                      ? "1px solid var(--p-primary)"
                      : "1px solid var(--p-border-and-gradient-bg)",
                  color: activeLeague === i ? pickContrastText(palette.activeSecondaryGradientColor) : "var(--p-text-secondary-color)",
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
                  background: activeBetType === i ? "var(--p-active-secondary-gradient-color)" : "transparent",
                  border:
                    activeBetType === i
                      ? "1px solid var(--p-primary)"
                      : "1px solid var(--p-border-and-gradient-bg)",
                  color: activeBetType === i ? pickContrastText(palette.activeSecondaryGradientColor) : "var(--p-text-secondary-color)",
                }}
              >
                {b}
              </button>
            ))}
          </div>

          {/* Free Bet Promo Banner */}
          <div style={{
            margin: "8px 8px 4px",
            borderRadius: 8,
            padding: "10px 12px",
            background: `linear-gradient(135deg, var(--p-free-bet-background), var(--p-primary))`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div>
              <div style={{ color: "var(--p-light-text-color)", fontSize: 11, fontWeight: 700 }}>
                🎁 Free Bet Available
              </div>
              <div style={{ color: "var(--p-text-secondary-color)", fontSize: 9, marginTop: 2 }}>
                Claim your $25 welcome bet
              </div>
            </div>
            <div style={{
              background: "var(--p-primary-button)",
              color: "var(--p-primary-text-color)",
              fontSize: 9,
              fontWeight: 700,
              padding: "4px 8px",
              borderRadius: 4,
            }}>Claim</div>
          </div>

          {/* Match cards (2-column grid) */}
          <div className="grid grid-cols-2 gap-2">
            {MATCHES.map((m, i) => (
              <div
                key={i}
                className="rounded-md p-2"
                style={{ background: "var(--p-dark)", border: "1px solid var(--p-border-and-gradient-bg)" }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className="text-[8px] font-semibold"
                    style={{ color: m.live ? "var(--p-lost-color)" : "var(--p-primary)" }}
                  >
                    {m.date}
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
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <TeamDot label={m.home} />
                      <span
                        className="text-[9.5px] font-medium truncate"
                        style={{ color: "var(--p-light-text-color)" }}
                      >
                        {m.home}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <TeamDot label={m.away} />
                      <span
                        className="text-[9.5px] font-medium truncate"
                        style={{ color: "var(--p-light-text-color)" }}
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
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-[8px]" style={{ color: "var(--p-text-secondary-color)" }}>
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
          style={{ color: "var(--p-text-secondary-color)" }}
        >
          <Icon className="h-10 w-10" />
          <div className="text-[14px] font-bold" style={{ color: "var(--p-light-text-color)" }}>
            {title}
          </div>
          <div className="text-[10px]">{strings.COMING_SOON}</div>
        </div>
      </main>
      {renderRightPanel()}
    </div>
  );

  const renderWebDiscoveryView = () => {
    const primaryText = pickContrastText(palette.primary);
    const leagues = [
      { code: "MLB", icon: "⚾" },
      { code: "NHL", icon: "🏒" },
      { code: "NBA", icon: "🏀" },
      { code: "MMA", icon: "🥊" },
      { code: "Soccer", icon: "⚽" },
      { code: "MLS", icon: "🥅" },
      { code: "TT Cup", icon: "🏓" },
    ];
    const activeLeagueIdx = 0;

    type DiscPost = {
      user: string;
      league: string;
      legCount: number;
      odds: string;
      status: "PENDING" | "WON" | "LOST";
      legs: { type: string; pick: string; odds: string; home: string; away: string }[];
      stake: string;
      payout: string;
      time: string;
    };

    const posts: DiscPost[] = [
      {
        user: "sskit8905",
        league: "MLB",
        legCount: 8,
        odds: "+14954",
        status: "PENDING",
        legs: [
          { type: "Winner (incl. extra innings)", pick: "Los Angeles Angels", odds: "-143", home: "New York Mets", away: "Los Angeles Angels" },
          { type: "Winner (incl. extra innings)", pick: "Detroit Tigers", odds: "-120", home: "Texas Rangers", away: "Detroit Tigers" },
          { type: "Handicap (incl. extra innings)", pick: "Philadelphia Phillies (-1)", odds: "+109", home: "Philadelphia Phillies", away: "Miami Marlins" },
          { type: "Handicap (incl. extra innings)", pick: "New York Yankees (-1.5)", odds: "+100", home: "Baltimore Orioles", away: "New York Yankees" },
        ],
        stake: "0.5",
        payout: "75.27",
        time: "14 seconds ago",
      },
      {
        user: "ChampagnePogi",
        league: "NBA",
        legCount: 2,
        odds: "+210",
        status: "PENDING",
        legs: [
          { type: "Handicap (incl. overtime)", pick: "Toronto Raptors (+10.5)", odds: "-159", home: "Toronto Raptors", away: "Cleveland Cavaliers" },
          { type: "Handicap (incl. overtime)", pick: "Boston Celtics (-4.5)", odds: "-110", home: "Boston Celtics", away: "Miami Heat" },
        ],
        stake: "5",
        payout: "15.50",
        time: "3 minutes ago",
      },
      {
        user: "WillyBet",
        league: "Soccer",
        legCount: 4,
        odds: "+850",
        status: "WON",
        legs: [
          { type: "1x2", pick: "Real Madrid", odds: "+105", home: "Real Madrid", away: "Atletico Madrid" },
          { type: "Over/Under", pick: "Over 2.5", odds: "-130", home: "Manchester City", away: "Liverpool" },
          { type: "1x2", pick: "Bayern Munich", odds: "-180", home: "Bayern Munich", away: "Borussia Dortmund" },
          { type: "GG", pick: "Both teams to score", odds: "+115", home: "PSG", away: "Marseille" },
        ],
        stake: "10",
        payout: "95.00",
        time: "2 hours ago",
      },
    ];

    const statusStyle = (s: "PENDING" | "WON" | "LOST") => {
      if (s === "WON") return { bg: "color-mix(in oklab, var(--p-won-color) 18%, transparent)", color: "var(--p-won-color)" };
      if (s === "LOST") return { bg: "color-mix(in oklab, var(--p-lost-color) 18%, transparent)", color: "var(--p-lost-color)" };
      return { bg: "color-mix(in oklab, var(--p-secondary) 18%, transparent)", color: "var(--p-secondary)" };
    };
    const statusLabelText = (s: "PENDING" | "WON" | "LOST") =>
      s === "WON" ? strings.STATUS_WON : s === "LOST" ? strings.STATUS_LOST : strings.STATUS_PENDING;

    const oddsColor = (o: string) =>
      o.startsWith("+") ? "var(--p-won-color)" : "var(--p-light-text-color)";

    return (
      <div className="flex-1 min-h-0 flex">
        {renderFriendsSidebar()}

        {/* CENTER */}
        <main className="flex-1 min-w-0 overflow-auto px-4 py-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4" style={{ color: "var(--p-primary)" }} />
              <span className="text-[12px] font-bold" style={{ color: "var(--p-light-text-color)" }}>
                For you
              </span>
            </div>
            <Filter className="h-3.5 w-3.5" style={{ color: "var(--p-text-secondary-color)" }} />
          </div>

          {/* League filter tiles */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
            {leagues.map((l, i) => {
              const active = i === activeLeagueIdx;
              return (
                <div
                  key={l.code}
                  className="flex flex-col items-center justify-center flex-shrink-0 rounded-xl"
                  style={{
                    width: 64,
                    height: 64,
                    background: "var(--p-modal-background)",
                    border: `1px solid ${active ? "var(--p-primary)" : "var(--p-border-and-gradient-bg)"}`,
                  }}
                >
                  <span className="text-[18px] leading-none">{l.icon}</span>
                  <span className="text-[9px] mt-1" style={{ color: "var(--p-text-secondary-color)" }}>
                    {l.code}
                  </span>
                </div>
              );
            })}
          </div>

          {/* More filters */}
          <div
            className="flex items-center justify-between rounded-lg px-3 py-2.5 mb-3"
            style={{ background: "var(--p-modal-background)" }}
          >
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5" style={{ color: "var(--p-light-text-color)" }} />
              <span className="text-[11px] font-semibold" style={{ color: "var(--p-light-text-color)" }}>
                More filters
              </span>
            </div>
            <ChevronDown className="h-3.5 w-3.5" style={{ color: "var(--p-text-secondary-color)" }} />
          </div>

          {/* Posts */}
          <div className="space-y-3">
            {posts.map((p, idx) => {
              const ss = statusStyle(p.status);
              return (
                <div
                  key={idx}
                  className="rounded-xl overflow-hidden"
                  style={{
                    background: "var(--p-modal-background)",
                    border: "1px solid var(--p-border-and-gradient-bg)",
                  }}
                >
                  {/* User header */}
                  <div
                    className="flex items-center justify-between px-3 py-2"
                    style={{ borderBottom: "1px solid var(--p-border-and-gradient-bg)" }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="h-6 w-6 rounded-full grid place-items-center text-[9px] font-bold"
                        style={{ background: "var(--p-primary)", color: primaryText }}
                      >
                        {p.user.slice(0, 1).toUpperCase()}
                      </div>
                      <span className="text-[11px] font-semibold" style={{ color: "var(--p-light-text-color)" }}>
                        {p.user}
                      </span>
                    </div>
                    <span
                      className="text-[8px] font-bold px-2 py-0.5 rounded italic"
                      style={{ background: ss.bg, color: ss.color }}
                    >
                      {statusLabelText(p.status)}
                    </span>
                  </div>

                  {/* League + Parlay title */}
                  <div className="px-3 pt-2.5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Trophy className="h-3 w-3" style={{ color: "var(--p-text-secondary-color)" }} />
                      <span className="text-[9px]" style={{ color: "var(--p-text-secondary-color)" }}>
                        {p.league}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[12px] font-bold" style={{ color: "var(--p-light-text-color)" }}>
                        {p.legCount} Leg Parlay
                      </span>
                      <span className="text-[12px] font-bold" style={{ color: oddsColor(p.odds) }}>
                        {p.odds}
                      </span>
                    </div>
                  </div>

                  {/* Legs */}
                  <div className="px-3 space-y-1.5">
                    {p.legs.slice(0, 4).map((leg, li) => (
                      <div
                        key={li}
                        className="rounded-md px-2.5 py-2"
                        style={{
                          background: "var(--p-dark)",
                          border: "1px solid var(--p-border-and-gradient-bg)",
                        }}
                      >
                        <div className="flex items-start justify-between mb-1.5">
                          <div className="min-w-0">
                            <div
                              className="text-[8px] font-semibold mb-0.5"
                              style={{ color: "var(--p-primary)" }}
                            >
                              {leg.type}
                            </div>
                            <div className="text-[10px] font-bold" style={{ color: "var(--p-light-text-color)" }}>
                              {leg.pick}
                            </div>
                          </div>
                          <span
                            className="text-[10px] font-bold ml-2 flex-shrink-0"
                            style={{ color: oddsColor(leg.odds) }}
                          >
                            {leg.odds}
                          </span>
                        </div>
                        <div
                          className="flex items-center justify-between text-[8px]"
                          style={{ color: "var(--p-text-secondary-color)" }}
                        >
                          <div className="flex items-center gap-1 min-w-0 flex-1">
                            <TeamDot label={leg.home} />
                            <span className="truncate">{leg.home}</span>
                          </div>
                          <span className="px-2" style={{ color: "var(--p-vs-color)" }}>VS</span>
                          <div className="flex items-center gap-1 min-w-0 flex-1 justify-end">
                            <span className="truncate text-right">{leg.away}</span>
                            <TeamDot label={leg.away} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Show all */}
                  {p.legCount > 4 && (
                    <div className="px-3 py-2 text-center">
                      <span className="text-[10px] font-semibold" style={{ color: "var(--p-primary)" }}>
                        Show all {p.legCount} legs ›
                      </span>
                    </div>
                  )}

                  {/* Pick amount / payout */}
                  <div
                    className="flex items-center justify-between px-3 py-2"
                    style={{ borderTop: "1px solid var(--p-border-and-gradient-bg)" }}
                  >
                    <div>
                      <div className="text-[8px] font-bold" style={{ color: "var(--p-text-secondary-color)" }}>
                        PICK AMOUNT
                      </div>
                      <div className="flex items-center gap-1">
                        <Flame className="h-2.5 w-2.5" style={{ color: "var(--p-primary)" }} />
                        <span className="text-[10px] font-bold" style={{ color: "var(--p-light-text-color)" }}>
                          {p.stake}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[8px] font-bold" style={{ color: "var(--p-text-secondary-color)" }}>
                        PAYOUT
                      </div>
                      <div className="flex items-center gap-1 justify-end">
                        <Flame className="h-2.5 w-2.5" style={{ color: "var(--p-primary)" }} />
                        <span className="text-[10px] font-bold" style={{ color: "var(--p-light-text-color)" }}>
                          {p.payout}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div
                    className="flex items-center justify-between px-3 py-2"
                    style={{ borderTop: "1px solid var(--p-border-and-gradient-bg)" }}
                  >
                    <div className="flex items-center gap-3" style={{ color: "var(--p-text-secondary-color)" }}>
                      <Heart className="h-3.5 w-3.5" />
                      <MessageCircle className="h-3.5 w-3.5" />
                      <ArrowLeftRight className="h-3.5 w-3.5" />
                      <span className="text-[9px] ml-1">{p.time}</span>
                    </div>
                    <Share2 className="h-3.5 w-3.5" style={{ color: "var(--p-text-secondary-color)" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        {/* RIGHT: Pick slip */}
        <aside
          className="w-[230px] border-l flex flex-col flex-shrink-0"
          style={{ borderColor: "var(--p-border-and-gradient-bg)", background: "var(--p-dark)" }}
        >
          <div className="p-4 flex flex-col items-center">
            <div
              className="h-9 w-9 rounded-full grid place-items-center mb-2"
              style={{
                background: "color-mix(in oklab, var(--p-primary) 15%, transparent)",
                color: "var(--p-primary)",
              }}
            >
              <Zap className="h-4 w-4" />
            </div>
            <div className="text-[11px] font-semibold mb-3" style={{ color: "var(--p-light-text-color)" }}>
              Pick slip is empty
            </div>
            <button
              className="w-full rounded-lg py-3 text-[11px] font-bold"
              style={{
                background: "linear-gradient(135deg, var(--p-primary), var(--p-secondary))",
                color: primaryText,
              }}
            >
              Make Picks
            </button>
          </div>
        </aside>
      </div>
    );
  };

  const renderP2PView = () => {
    const sports: { name: string; Icon: LucideIcon }[] = [
      { name: "Football", Icon: Trophy },
      { name: "Basketball", Icon: Dice5 },
      { name: "Tennis", Icon: CircleDot },
      { name: "Volleyball", Icon: Volleyball },
      { name: "Table Tennis", Icon: TableProperties },
      { name: "Ice Hockey", Icon: Snowflake },
      { name: "American Football", Icon: Shield },
      { name: "Cycling", Icon: Bike },
      { name: "Rugby", Icon: Shield },
      { name: "Golf", Icon: Target },
      { name: "Darts", Icon: Target },
      { name: "Boxing", Icon: Swords },
      { name: "Cricket", Icon: CircleDot },
      { name: "Baseball", Icon: CircleDot },
      { name: "Waterpolo", Icon: CircleDot },
      { name: "Alpine Skiing", Icon: Mountain },
      { name: "ESport Call of Duty", Icon: Gamepad2 },
      { name: "Specials", Icon: Sparkles },
    ];
    const leagues: { name: string; matches: { home: string; away: string; date: string }[] }[] = [
      {
        name: "Serie A",
        matches: [
          { home: "US Cremonese", away: "Lazio Rome", date: "TOMORROW 6:30 PM" },
          { home: "AS Roma", away: "ACF Fiorentina", date: "TOMORROW 8:45 PM" },
          { home: "Torino FC", away: "Sassuolo Calcio", date: "8 MAY 8:45 PM" },
          { home: "Cagliari Calcio", away: "Udinese Calcio", date: "9 MAY 3:00 PM" },
          { home: "Lazio Rome", away: "Inter Milano", date: "9 MAY 6:00 PM" },
        ],
      },
      {
        name: "LaLiga",
        matches: [
          { home: "Sevilla FC", away: "Real Sociedad", date: "TOMORROW 9:00 PM" },
          { home: "Levante UD", away: "CA Osasuna", date: "8 MAY 9:00 PM" },
          { home: "Elche CF", away: "Deportivo Alaves", date: "9 MAY 2:00 PM" },
          { home: "Sevilla FC", away: "Espanyol Barcelona", date: "9 MAY 4:15 PM" },
          { home: "Atletico Madrid", away: "RC Celta de Vigo", date: "9 MAY 6:30 PM" },
        ],
      },
      {
        name: "Bundesliga",
        matches: [
          { home: "Borussia Dortmund", away: "Eintracht Frankfurt", date: "8 MAY 8:30 PM" },
          { home: "FC Augsburg", away: "Bor. M'gladbach", date: "9 MAY 3:30 PM" },
          { home: "VfB Stuttgart", away: "Bayer Leverkusen", date: "9 MAY 3:30 PM" },
          { home: "TSG Hoffenheim", away: "Werder Bremen", date: "9 MAY 3:30 PM" },
          { home: "RB Leipzig", away: "FC St. Pauli", date: "9 MAY 3:30 PM" },
        ],
      },
      {
        name: "Ligue 1",
        matches: [
          { home: "Racing Club", away: "FC Nantes", date: "8 MAY 8:45 PM" },
          { home: "SCO Angers", away: "Strasbourg", date: "9 MAY 9:00 PM" },
          { home: "Toulouse FC", away: "Olympique Lyon", date: "10 MAY 9:00 PM" },
          { home: "AS Monaco", away: "Lille OSC", date: "10 MAY 9:00 PM" },
          { home: "Le Havre AC", away: "Olympique Marseille", date: "10 MAY 9:00 PM" },
        ],
      },
    ];
    const primaryText = pickContrastText(palette.primary);
    const betPills = ["DRAW NO BET", "Over/Under", "Both Team To Score"];

    return (
      <div className="flex-1 min-h-0 flex">
        {/* LEFT sidebar */}
        <aside
          className="w-[230px] border-r flex flex-col flex-shrink-0 overflow-auto"
          style={{ borderColor: "var(--p-border-and-gradient-bg)", background: "var(--p-dark)" }}
        >
          <div className="p-2.5">
            <div
              className="flex items-center gap-1.5 h-7 px-2 rounded-md"
              style={{ background: "var(--p-modal-background)", border: "1px solid var(--p-border-color)" }}
            >
              <Search className="h-3 w-3" style={{ color: "var(--p-text-secondary-color)" }} />
              <span className="text-[10px]" style={{ color: "var(--p-text-secondary-color)" }}>Search</span>
            </div>
          </div>
          <div className="px-2.5 pb-2 text-[10px] font-bold" style={{ color: "var(--p-light-text-color)" }}>
            All Sports
          </div>
          <div className="px-2 flex flex-col gap-1.5 pb-3">
            {sports.map(({ name, Icon }) => (
              <div
                key={name}
                className="flex items-center justify-between px-2 py-2 rounded-md"
                style={{ border: "1px solid var(--p-border-color)" }}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-5 w-5 rounded-full grid place-items-center"
                    style={{ background: "color-mix(in oklab, var(--p-primary) 20%, transparent)", color: "var(--p-primary)" }}
                  >
                    <Icon className="h-3 w-3" />
                  </span>
                  <span className="text-[10px]" style={{ color: "var(--p-light-text-color)" }}>{name}</span>
                </div>
                <ChevronDown className="h-3 w-3" style={{ color: "var(--p-text-secondary-color)" }} />
              </div>
            ))}
          </div>
        </aside>

        {/* CENTER */}
        <main className="flex-1 min-w-0 overflow-auto px-3 py-2.5">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] font-bold" style={{ color: "var(--p-light-text-color)" }}>
              My peer-to-peer bets
            </div>
            <div className="text-[10px] font-semibold" style={{ color: "var(--p-primary)" }}>
              History ⓘ
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-2.5 mb-3">
            <div
              className="rounded-lg p-3 flex flex-col items-center justify-center min-h-[80px]"
              style={{
                background: "linear-gradient(135deg, var(--p-primary), color-mix(in oklab, var(--p-primary) 60%, white))",
                color: primaryText,
              }}
            >
              <div className="text-[10px] font-semibold opacity-90">Pending invites</div>
              <div className="text-[22px] font-black mt-1">0</div>
            </div>
            <div
              className="rounded-lg p-3 flex flex-col items-center justify-center min-h-[80px]"
              style={{ background: "var(--p-modal-background)", border: "1px solid var(--p-primary)" }}
            >
              <div className="text-[10px] font-semibold" style={{ color: "var(--p-light-text-color)" }}>Current bets</div>
              <div className="text-[22px] font-black mt-1" style={{ color: "var(--p-light-text-color)" }}>0</div>
            </div>
            <div
              className="rounded-lg p-3 flex flex-col items-center justify-center min-h-[80px]"
              style={{ background: "var(--p-modal-background)", border: "1px solid var(--p-primary)" }}
            >
              <div className="text-[10px] font-semibold" style={{ color: "var(--p-light-text-color)" }}>Past bets</div>
              <div className="text-[22px] font-black mt-1" style={{ color: "var(--p-light-text-color)" }}>15</div>
            </div>
          </div>

          {/* Filter chips */}
          <div className="flex gap-2 overflow-x-auto mb-3">
            <div
              className="flex flex-col items-center justify-center px-3 py-1.5 rounded-md flex-shrink-0 min-w-[60px]"
              style={{ background: "var(--p-modal-background)", border: "1px solid var(--p-primary)" }}
            >
              <span className="text-[12px] font-black" style={{ color: "var(--p-primary)" }}>V</span>
              <span className="text-[9px]" style={{ color: "var(--p-light-text-color)" }}>Virtuals</span>
            </div>
          </div>

          {/* Leagues */}
          <div className="flex flex-col gap-3">
            {leagues.map((lg) => (
              <div key={lg.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-3 w-3 rounded-full grid place-items-center text-[7px] font-black"
                      style={{ background: "color-mix(in oklab, var(--p-primary) 25%, transparent)", color: "var(--p-primary)" }}
                    >
                      ⚽
                    </span>
                    <span className="text-[10px] font-bold" style={{ color: "var(--p-light-text-color)" }}>
                      {lg.name}
                    </span>
                  </div>
                  <span className="text-[9px]" style={{ color: "var(--p-primary)" }}>All games &gt;</span>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
                  {lg.matches.map((m, mi) => (
                    <div
                      key={mi}
                      className="rounded-md p-2 flex flex-col gap-1.5"
                      style={{ background: "var(--p-modal-background)", border: "1px solid var(--p-primary)" }}
                    >
                      <div className="flex items-center justify-between">
                        <TeamDot label={m.home} size={24} />
                        <span className="text-[8px] font-bold" style={{ color: "var(--p-text-secondary-color)" }}>VS</span>
                        <TeamDot label={m.away} size={24} />
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[8px] font-semibold truncate" style={{ color: "var(--p-light-text-color)" }}>
                          {m.home}
                        </span>
                        <span className="text-[7px] text-center flex-shrink-0" style={{ color: "var(--p-text-secondary-color)" }}>
                          {m.date}
                        </span>
                        <span className="text-[8px] font-semibold truncate text-right" style={{ color: "var(--p-light-text-color)" }}>
                          {m.away}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {betPills.map((p) => (
                          <div
                            key={p}
                            className="flex-1 text-center px-1 py-1 rounded-full text-[7px] font-semibold truncate"
                            style={{ border: "1px solid var(--p-primary)", color: "var(--p-primary)" }}
                          >
                            {p}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </main>

        {renderRightPanel()}
      </div>
    );
  };

  return (
    <div
      className="w-full h-full flex flex-col text-[11px]"
      style={{ background: "var(--p-primary-background-color)", color: "var(--p-light-text-color)" }}
    >
      {/* Top nav */}
      <div
        className="flex items-center justify-between px-4 h-11 border-b flex-shrink-0"
        style={{ borderColor: "var(--p-border-and-gradient-bg)", background: "var(--p-dark)" }}
      >
        <div className="flex items-center gap-1">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-6 mr-2 object-contain max-w-[100px]" />
          ) : (
            <div
              className="h-6 w-6 rounded-full grid place-items-center mr-2 text-[9px] font-black"
              style={{ background: "var(--p-primary)", color: "var(--p-light-text-color)" }}
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
                style={{ color: active ? "var(--p-primary)" : "var(--p-text-secondary-color)" }}
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
          <span className="text-[10px] font-medium" style={{ color: "var(--p-light-text-color)" }}>
            {strings.SIGN_IN}
          </span>
          <button
            className="h-7 px-3 rounded-md text-[10px] font-bold"
            style={{
              background: "linear-gradient(135deg, var(--p-primary-button), var(--p-primary-button-gradient))",
              color: "var(--p-light-text-color)",
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
      {activeNav === 3 && (
        <div className="flex-1 min-h-0 flex">
          <CasinoContent variant="web" />
          {renderRightPanel()}
        </div>
      )}
      {activeNav === 4 && renderP2PView()}
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

  const { strings, palette } = useStudio();
  const statusLabel = (s: string) =>
    s === "WON"
      ? strings.STATUS_WON
      : s === "LOST"
        ? strings.STATUS_LOST
        : s === "PENDING"
          ? strings.STATUS_PENDING
          : s === "LIVE"
            ? strings.STATUS_LIVE
            : s;

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
          style={{ background: "var(--p-primary)", color: "var(--p-light-text-color)" }}
        >
          {appName.slice(0, 1)}
        </div>
      )}
      <div
        className="flex items-center gap-1.5 px-2.5 h-6 rounded-full"
        style={{ background: "var(--p-dark)" }}
      >
        <span className="text-[10px] font-bold" style={{ color: "var(--p-light-text-color)" }}>
          {currencySymbol}
        </span>
        <span className="text-[10px] tracking-wider" style={{ color: "var(--p-light-text-color)" }}>
          ****
        </span>
        <Plus className="h-3 w-3" style={{ color: "var(--p-primary)" }} />
        <EyeOff className="h-3 w-3" style={{ color: "var(--p-text-secondary-color)" }} />
      </div>
      <div className="flex items-center gap-2">
        <div className="relative">
          <Bell className="h-4 w-4" style={{ color: "var(--p-light-text-color)" }} />
          <span
            className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full"
            style={{ background: "var(--p-primary)" }}
          />
        </div>
        <MessageCircle className="h-4 w-4" style={{ color: "var(--p-light-text-color)" }} />
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
                background: "var(--p-dark)",
                border: active ? "1px solid var(--p-primary)" : "1px solid var(--p-border-and-gradient-bg)",
              }}
            >
              <Icon
                className="h-4 w-4"
                style={{ color: active ? "var(--p-primary)" : "var(--p-light-text-color)" }}
              />
              <span
                className="text-[8px] font-medium"
                style={{ color: active ? "var(--p-primary)" : "var(--p-text-secondary-color)" }}
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
              background: "var(--p-active-secondary-gradient-color)",
              border: "1px solid var(--p-primary)",
              color: pickContrastText(palette.activeSecondaryGradientColor),
            }}
          >
            <Flame className="h-3.5 w-3.5" /> {strings.BET_BUILDER}
          </button>
          <button
            className="h-9 rounded-md flex items-center justify-center gap-1.5 text-[11px] font-bold"
            style={{
              background: "var(--p-active-secondary-gradient-color)",
              border: "1px solid var(--p-primary)",
              color: pickContrastText(palette.activeSecondaryGradientColor),
            }}
          >
            <ArrowLeftRight className="h-3.5 w-3.5" /> {strings.PEER_TO_PEER_BTN}
          </button>
        </div>
        {/* Welcome Bonus */}
        <div
          className="rounded-lg p-3 mb-3 relative"
          style={{
            background: "linear-gradient(135deg, var(--p-primary-button), var(--p-primary-button-gradient))",
            border: "1px solid var(--p-primary)",
          }}
        >
          <div className="text-[12px] font-black" style={{ color: "var(--p-light-text-color)" }}>
            {strings.WELCOME_BONUS_PROMO}
          </div>
          <div className="text-[9.5px] mt-1 leading-tight" style={{ color: "var(--p-light-text-color)" }}>
            {strings.WELCOME_BONUS_BODY_MOBILE}
          </div>
          <div
            className="mt-2 h-5 w-5 rounded-full grid place-items-center"
            style={{ background: "rgba(0,0,0,0.3)" }}
          >
            <ChevronDown className="h-3 w-3" style={{ color: "var(--p-light-text-color)" }} />
          </div>
        </div>
        {/* Featured matches */}
        <div className="text-[12px] font-bold mb-1.5" style={{ color: "var(--p-light-text-color)" }}>
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
                style={{ background: "var(--p-dark)", border: "1px solid var(--p-border-and-gradient-bg)" }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className="text-[9px] font-semibold"
                    style={{ color: m.live ? "var(--p-lost-color)" : "var(--p-primary)" }}
                  >
                    {m.date}
                  </span>
                  <div
                    className="flex gap-5 text-[9px] font-bold"
                    style={{ color: "var(--p-text-secondary-color)" }}
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
                        style={{ color: "var(--p-light-text-color)" }}
                      >
                        {m.home}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <TeamDot label={m.away} />
                      <span
                        className="text-[10.5px] font-medium truncate"
                        style={{ color: "var(--p-light-text-color)" }}
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
                            background: sel ? "var(--p-primary)" : "var(--p-active-secondary-gradient-color)",
                            border: "1px solid var(--p-primary)",
                            color: sel ? "var(--p-light-text-color)" : pickContrastText(palette.activeSecondaryGradientColor),
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
        style={{ borderColor: "var(--p-border-and-gradient-bg)", background: "var(--p-dark)" }}
      >
        {[strings.TAB_SPORTS, strings.TAB_ALL_SPORTS].map((t, i) => (
          <button
            key={t}
            onClick={() => setMobileSportsTab(i)}
            className="flex-1 h-8 text-[10px] font-semibold relative"
            style={{ color: mobileSportsTab === i ? "var(--p-primary)" : "var(--p-text-secondary-color)" }}
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
                background: "var(--p-active-secondary-gradient-color)",
                border: "1px solid var(--p-primary)",
                color: pickContrastText(palette.activeSecondaryGradientColor),
              }}
            >
              <Flame className="h-3.5 w-3.5" /> {strings.BET_BUILDER}
            </button>
            <button
              className="h-9 rounded-md flex items-center justify-center gap-1.5 text-[11px] font-bold"
              style={{
                background: "var(--p-active-secondary-gradient-color)",
                border: "1px solid var(--p-primary)",
                color: pickContrastText(palette.activeSecondaryGradientColor),
              }}
            >
              <ArrowLeftRight className="h-3.5 w-3.5" /> {strings.PEER_TO_PEER_BTN}
            </button>
          </div>

          <div className="text-[12px] font-bold mb-1.5" style={{ color: "var(--p-light-text-color)" }}>
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
                  background: activeSport === i ? "var(--p-active-secondary-gradient-color)" : "transparent",
                  border:
                    activeSport === i ? "1px solid var(--p-primary)" : "1px solid var(--p-border-and-gradient-bg)",
                  color: activeSport === i ? pickContrastText(palette.activeSecondaryGradientColor) : "var(--p-text-secondary-color)",
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
                  background: activeLeague === i ? "var(--p-active-secondary-gradient-color)" : "transparent",
                  border:
                    activeLeague === i
                      ? "1px solid var(--p-primary)"
                      : "1px solid var(--p-border-and-gradient-bg)",
                  color: activeLeague === i ? pickContrastText(palette.activeSecondaryGradientColor) : "var(--p-text-secondary-color)",
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
                  background: activeBetType === i ? "var(--p-active-secondary-gradient-color)" : "transparent",
                  border:
                    activeBetType === i
                      ? "1px solid var(--p-primary)"
                      : "1px solid var(--p-border-and-gradient-bg)",
                  color: activeBetType === i ? pickContrastText(palette.activeSecondaryGradientColor) : "var(--p-text-secondary-color)",
                }}
              >
                {b}
              </button>
            ))}
          </div>

          {/* Free Bet Promo Banner */}
          <div style={{
            margin: "8px 8px 4px",
            borderRadius: 8,
            padding: "10px 12px",
            background: `linear-gradient(135deg, var(--p-free-bet-background), var(--p-primary))`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div>
              <div style={{ color: "var(--p-light-text-color)", fontSize: 11, fontWeight: 700 }}>
                🎁 Free Bet Available
              </div>
              <div style={{ color: "var(--p-text-secondary-color)", fontSize: 9, marginTop: 2 }}>
                Claim your $25 welcome bet
              </div>
            </div>
            <div style={{
              background: "var(--p-primary-button)",
              color: "var(--p-primary-text-color)",
              fontSize: 9,
              fontWeight: 700,
              padding: "4px 8px",
              borderRadius: 4,
            }}>Claim</div>
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
                  style={{ background: "var(--p-dark)", border: "1px solid var(--p-border-and-gradient-bg)" }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className="text-[9px] font-semibold"
                      style={{ color: m.live ? "var(--p-lost-color)" : "var(--p-primary)" }}
                    >
                      {m.date}
                    </span>
                    <div
                      className="flex gap-5 text-[9px] font-bold"
                      style={{ color: "var(--p-text-secondary-color)" }}
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
                          style={{ color: "var(--p-light-text-color)" }}
                        >
                          {m.home}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <TeamDot label={m.away} />
                        <span
                          className="text-[10.5px] font-medium truncate"
                          style={{ color: "var(--p-light-text-color)" }}
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
                              background: sel ? "var(--p-primary)" : "var(--p-active-secondary-gradient-color)",
                              border: "1px solid var(--p-primary)",
                              color: sel ? "var(--p-light-text-color)" : pickContrastText(palette.activeSecondaryGradientColor),
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
          <div className="px-3 pb-1 text-[9px] font-semibold" style={{ color: "var(--p-text-secondary-color)" }}>
            {strings.ALL_SPORTS} ({getSportsSidebar(strings).length})
          </div>
          <div className="px-2">
            {getSportsSidebar(strings).map((s, i) => (
              <button
                key={s.name}
                onClick={() => setMobileSportsTab(0)}
                className="w-full flex items-center gap-2 px-2 h-10 rounded-md mb-0.5 text-left"
                style={{ background: "var(--p-dark)", border: "1px solid var(--p-border-and-gradient-bg)" }}
              >
                <span className="text-[14px]">{s.flag}</span>
                <span className="flex-1 text-[11px] font-medium" style={{ color: "var(--p-light-text-color)" }}>
                  {s.name}
                </span>
                <span
                  className="text-[9px] font-bold px-1.5 py-[1px] rounded-full"
                  style={{ background: "var(--p-active-secondary-gradient-color)", color: pickContrastText(palette.activeSecondaryGradientColor) }}
                >
                  {s.count}
                </span>
                <ChevronRight className="h-3.5 w-3.5" style={{ color: "var(--p-text-secondary-color)" }} />
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
        <div className="text-[12px] font-bold my-2" style={{ color: "var(--p-light-text-color)" }}>
          {strings.DISCOVER}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {EXPLORE_POSTS.map((p, i) => (
            <div
              key={i}
              className="rounded-md p-3"
              style={{ background: "var(--p-dark)", border: "1px solid var(--p-border-and-gradient-bg)" }}
            >
              <span
                className="text-[8px] font-bold px-1.5 py-[1px] rounded"
                style={{ background: "var(--p-active-secondary-gradient-color)", color: pickContrastText(palette.activeSecondaryGradientColor) }}
              >
                {p.badge}
              </span>
              <div className="text-[11px] font-bold mt-1.5" style={{ color: "var(--p-light-text-color)" }}>
                {p.title}
              </div>
              <div className="text-[9px] mt-1" style={{ color: "var(--p-text-secondary-color)" }}>
                {p.desc}
              </div>
              <button
                className="mt-2 w-full h-7 rounded text-[9px] font-semibold"
                style={{ background: "var(--p-primary)", color: "var(--p-light-text-color)" }}
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
      <CasinoContent variant="mobile" />
    </>
  );

  /* Profile view (nav 4) */
  const renderProfileView = () => (
    <>
      {renderTopBar()}
      {/* My Bets / My Feed tabs */}
      <div
        className="flex border-b flex-shrink-0"
        style={{ borderColor: "var(--p-border-and-gradient-bg)", background: "var(--p-dark)" }}
      >
        {[strings.TAB_MY_BETS, strings.TAB_MY_FEED].map((t, i) => (
          <button
            key={t}
            onClick={() => setMobileProfileTab(i)}
            className="flex-1 h-8 text-[10px] font-semibold relative"
            style={{ color: mobileProfileTab === i ? "var(--p-primary)" : "var(--p-text-secondary-color)" }}
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
          <div className="flex border-b flex-shrink-0" style={{ borderColor: "var(--p-border-and-gradient-bg)" }}>
            {[
              strings.FILTER_ALL,
              strings.FILTER_PENDING,
              strings.FILTER_SETTLED,
              strings.FILTER_P2P,
            ].map((t, i) => (
              <button
                key={t}
                onClick={() => setMobileMyBetsFilter(i)}
                className="flex-1 h-7 text-[9px] font-semibold relative"
                style={{
                  color: mobileMyBetsFilter === i ? "var(--p-primary)" : "var(--p-text-secondary-color)",
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
            {/* Flex Bet / Parlay Card */}
            <div style={{
              margin: "8px 8px 4px",
              borderRadius: 8,
              overflow: "hidden",
              border: `1px solid var(--p-win-status-border-gradient-1)`,
            }}>
              {/* Header */}
              <div style={{
                background: "var(--p-flex-bet-header-bg)",
                padding: "8px 12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                <span style={{ color: "var(--p-light-text-color)", fontSize: 11, fontWeight: 700 }}>
                  3-Leg Parlay
                </span>
                <span style={{ color: "var(--p-won-color)", fontSize: 10, fontWeight: 600 }}>
                  ✓ 3/3 Won
                </span>
              </div>
              {/* Legs */}
              {["Man Utd - Win", "Over 2.5 Goals", "Both Teams Score"].map((leg, i) => (
                <div key={i} style={{
                  background: `linear-gradient(90deg, var(--p-win-status-gradient-1), var(--p-win-status-gradient-2))`,
                  padding: "6px 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  borderTop: i > 0 ? `1px solid var(--p-border-and-gradient-bg)` : undefined,
                }}>
                  <span style={{ color: "var(--p-won-color)", fontSize: 9 }}>✓</span>
                  <span style={{ color: "var(--p-light-text-color)", fontSize: 10 }}>{leg}</span>
                </div>
              ))}
              {/* Footer */}
              <div style={{
                background: "var(--p-flex-bet-footer-bg)",
                padding: "8px 12px",
                display: "flex",
                justifyContent: "space-between",
              }}>
                <span style={{ color: "var(--p-text-secondary-color)", fontSize: 10 }}>Payout</span>
                <span style={{ color: "var(--p-payout-won-color)", fontSize: 11, fontWeight: 700 }}>+$150.00</span>
              </div>
            </div>

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
                  style={{ background: "var(--p-dark)", border: "1px solid var(--p-border-and-gradient-bg)" }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <TeamDot label={b.team} />
                      <span className="text-[10px] font-bold" style={{ color: "var(--p-light-text-color)" }}>
                        {b.team.slice(0, 16)}
                      </span>
                    </div>
                    <span
                      className="text-[8px] font-bold px-1.5 py-[1px] rounded"
                      style={{
                        background: isWon
                          ? "linear-gradient(135deg, var(--p-won-gradient-1), var(--p-won-gradient-2))"
                          : b.status === "PENDING"
                            ? "rgba(234,179,8,0.15)"
                            : "rgba(239,68,68,0.15)",
                        color: isWon
                          ? "var(--p-light-text-color)"
                          : b.status === "PENDING"
                            ? "#eab308"
                            : "var(--p-lost-color)",
                      }}
                    >
                      {statusLabel(b.status)}
                    </span>
                  </div>
                  <div className="text-[9px]" style={{ color: "var(--p-text-secondary-color)" }}>
                    1x2 · odds {b.odds}
                  </div>
                  <div className="flex items-center justify-between mt-1.5 text-[9px]">
                    <span style={{ color: "var(--p-text-secondary-color)" }}>{strings.STAKE}</span>
                    <span className="font-bold" style={{ color: "var(--p-light-text-color)" }}>
                      ₦{b.stake}
                    </span>
                    <span style={{ color: "var(--p-text-secondary-color)" }}>{strings.PAYOUT}</span>
                    <span
                      className="font-bold"
                      style={{ color: isWon ? "var(--p-won-color)" : "var(--p-light-text-color)" }}
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
                style={{ background: "var(--p-dark)", border: "1px solid var(--p-border-and-gradient-bg)" }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold" style={{ color: "var(--p-light-text-color)" }}>
                    17-Leg Accumulator
                  </span>
                  <span
                    className="text-[8px] font-bold px-1.5 py-[1px] rounded"
                    style={{ background: "rgba(234,179,8,0.15)", color: "#eab308" }}
                  >
                    PENDING
                  </span>
                </div>
                <div className="text-[9px] mb-1.5" style={{ color: "var(--p-text-secondary-color)" }}>
                  Accumulator · Total odds 1,284.5x
                </div>
                {/* First 3 legs always visible */}
                {PARLAY_LEGS.slice(0, 3).map((leg, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-1 border-b"
                    style={{ borderColor: "var(--p-border-and-gradient-bg)" }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-[8.5px] truncate" style={{ color: "var(--p-light-text-color)" }}>
                        {leg.match}
                      </div>
                      <div className="text-[8px]" style={{ color: "var(--p-text-secondary-color)" }}>
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
                      style={{ borderColor: "var(--p-border-and-gradient-bg)" }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-[8.5px] truncate" style={{ color: "var(--p-light-text-color)" }}>
                          {leg.match}
                        </div>
                        <div className="text-[8px]" style={{ color: "var(--p-text-secondary-color)" }}>
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
                      Show all {PARLAY_LEGS.length} legs <ChevronDown className="h-3 w-3" />
                    </>
                  )}
                </button>
                <div className="flex items-center justify-between mt-2 text-[9px]">
                  <span style={{ color: "var(--p-text-secondary-color)" }}>{strings.STAKE}</span>
                  <span className="font-bold" style={{ color: "var(--p-light-text-color)" }}>
                    ₦1,000
                  </span>
                  <span style={{ color: "var(--p-text-secondary-color)" }}>{strings.POTENTIAL}</span>
                  <span className="font-bold" style={{ color: "var(--p-won-color)" }}>
                    ₦1,284,500
                  </span>
                </div>
              </div>
            )}

            {mobileMyBetsFilter === 3 && (
              <div className="text-center py-6 text-[9px]" style={{ color: "var(--p-text-secondary-color)" }}>
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
            style={{ borderColor: "var(--p-border-and-gradient-bg)" }}
          >
            {[strings.TAB_FRIENDS, strings.TAB_EXPLORE].map((t, i) => (
              <button
                key={t}
                onClick={() => setMobileFeedTab(i)}
                className="flex items-center gap-1 px-3 h-6 rounded-full text-[9.5px] font-semibold"
                style={{
                  background: mobileFeedTab === i ? "var(--p-primary)" : "var(--p-dark)",
                  color: mobileFeedTab === i ? "var(--p-light-text-color)" : "var(--p-text-secondary-color)",
                  border: mobileFeedTab === i ? "none" : "1px solid var(--p-border-and-gradient-bg)",
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
                    style={{ background: "var(--p-dark)", border: "1px solid var(--p-border-and-gradient-bg)" }}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div
                        className="h-6 w-6 rounded-full grid place-items-center text-[9px] font-bold flex-shrink-0"
                        style={{ background: "var(--p-primary)", color: "var(--p-light-text-color)" }}
                      >
                        {p.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-bold" style={{ color: "var(--p-light-text-color)" }}>
                          {p.user}
                        </div>
                        <div className="text-[8px]" style={{ color: "var(--p-text-secondary-color)" }}>
                          {p.action} · {p.time}
                        </div>
                      </div>
                      {p.won && (
                        <span
                          className="text-[8px] font-bold px-1.5 py-[1px] rounded"
                          style={{
                            background: "linear-gradient(135deg, var(--p-won-gradient-1), var(--p-won-gradient-2))",
                            color: "var(--p-light-text-color)",
                          }}
                        >
                          {strings.STATUS_WON}
                        </span>
                      )}
                    </div>
                    <div
                      className="rounded p-2 mb-1.5"
                      style={{
                        background: "var(--p-active-secondary-gradient-color)",
                        border: "1px solid var(--p-primary)",
                      }}
                    >
                      <div
                        className="text-[9.5px] font-semibold"
                        style={{ color: pickContrastText(palette.activeSecondaryGradientColor) }}
                      >
                        {p.bet}
                      </div>
                      <div className="text-[8px] mt-0.5" style={{ color: "var(--p-text-secondary-color)" }}>
                        @ {p.odds} · Stake ₦{p.stake}
                      </div>
                    </div>
                    <div
                      className="flex items-center gap-3 text-[9px]"
                      style={{ color: "var(--p-text-secondary-color)" }}
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
                    style={{ background: "var(--p-dark)", border: "1px solid var(--p-border-and-gradient-bg)" }}
                  >
                    <span
                      className="text-[8px] font-bold px-1.5 py-[1px] rounded"
                      style={{ background: "var(--p-active-secondary-gradient-color)", color: pickContrastText(palette.activeSecondaryGradientColor) }}
                    >
                      {p.badge}
                    </span>
                    <div className="text-[11px] font-bold mt-1" style={{ color: "var(--p-light-text-color)" }}>
                      {p.title}
                    </div>
                    <div className="text-[9px] mt-0.5" style={{ color: "var(--p-text-secondary-color)" }}>
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
      style={{ background: "var(--p-primary-background-color)", color: "var(--p-light-text-color)" }}
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
          borderColor: "var(--p-border-and-gradient-bg)",
          background: "var(--p-dark)",
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
                    background: "linear-gradient(135deg, var(--p-primary-button), var(--p-primary-button-gradient))",
                    color: "var(--p-light-text-color)",
                  }}
                >
                  TN
                </div>
              ) : (
                <Icon
                  className="h-4 w-4"
                  style={{ color: active ? "var(--p-primary)" : "var(--p-text-secondary-color)" }}
                />
              )}
              <span
                className="text-[9px] font-medium"
                style={{ color: active || isProfile ? "var(--p-primary)" : "var(--p-text-secondary-color)" }}
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
  appName,
  currencySymbol,
  logoUrl,
  activeSport,
  setActiveSport,
  activeLeague,
  setActiveLeague,
  activeBetType,
  setActiveBetType,
  onOpenAllSports,
}: {
  appName: string;
  currencySymbol: string;
  logoUrl?: string | null;
  activeSport: number;
  setActiveSport: (n: number) => void;
  activeLeague: number;
  setActiveLeague: (n: number) => void;
  activeBetType: number;
  setActiveBetType: (n: number) => void;
  onOpenAllSports: () => void;
  onOpenBetDetail: () => void;
}) {
  const { strings, palette } = useStudio();
  return (
    <>
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2 flex-shrink-0">
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="h-7 object-contain max-w-[80px]" />
        ) : (
          <div
            className="h-7 w-7 rounded-full grid place-items-center text-[10px] font-black"
            style={{ background: "var(--p-primary)", color: "var(--p-light-text-color)" }}
          >
            {appName.slice(0, 1)}
          </div>
        )}
        <div
          className="flex items-center gap-1.5 px-2.5 h-6 rounded-full"
          style={{ background: "var(--p-dark)" }}
        >
          <span className="text-[10px] font-bold" style={{ color: "var(--p-light-text-color)" }}>
            {currencySymbol}
          </span>
          <span className="text-[10px] tracking-wider" style={{ color: "var(--p-light-text-color)" }}>
            ****
          </span>
          <Plus className="h-3 w-3" style={{ color: "var(--p-primary)" }} />
          <EyeOff className="h-3 w-3" style={{ color: "var(--p-text-secondary-color)" }} />
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bell className="h-4 w-4" style={{ color: "var(--p-light-text-color)" }} />
            <span
              className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full"
              style={{ background: "var(--p-primary)" }}
            />
          </div>
          <MessageCircle className="h-4 w-4" style={{ color: "var(--p-light-text-color)" }} />
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
                background: "var(--p-dark)",
                border: "1px solid var(--p-border-and-gradient-bg)",
              }}
            >
              <Icon className="h-4 w-4" style={{ color: "var(--p-light-text-color)" }} />
              <span className="text-[8px] font-medium" style={{ color: "var(--p-text-secondary-color)" }}>
                {strings[t.strKey]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 min-h-0 overflow-auto px-3 pb-2">
        <div className="grid grid-cols-2 gap-2 mb-2">
          <button
            className="h-9 rounded-md flex items-center justify-center gap-1.5 text-[11px] font-bold"
            style={{
              background: "var(--p-active-secondary-gradient-color)",
              border: "1px solid var(--p-primary)",
              color: pickContrastText(palette.activeSecondaryGradientColor),
            }}
          >
            <Flame className="h-3.5 w-3.5" /> {strings.BET_BUILDER}
          </button>
          <button
            className="h-9 rounded-md flex items-center justify-center gap-1.5 text-[11px] font-bold"
            style={{
              background: "var(--p-active-secondary-gradient-color)",
              border: "1px solid var(--p-primary)",
              color: pickContrastText(palette.activeSecondaryGradientColor),
            }}
          >
            <ArrowLeftRight className="h-3.5 w-3.5" /> {strings.PEER_TO_PEER_BTN}
          </button>
        </div>

        <div
          className="rounded-lg p-3 mb-3 relative"
          style={{
            background: "linear-gradient(135deg, var(--p-primary-button), var(--p-primary-button-gradient))",
            border: "1px solid var(--p-primary)",
          }}
        >
          <div className="text-[12px] font-black" style={{ color: "var(--p-light-text-color)" }}>
            {strings.WELCOME_BONUS_PROMO}
          </div>
          <div className="text-[9.5px] mt-1 leading-tight" style={{ color: "var(--p-light-text-color)" }}>
            {strings.WELCOME_BONUS_BODY_MOBILE}
          </div>
        </div>

        <div className="text-[12px] font-bold mb-1.5" style={{ color: "var(--p-light-text-color)" }}>
          {strings.LIVE_AND_UPCOMING}
        </div>
        <div className="flex gap-2 mb-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {SPORT_TABS_KEYS.map((k, i) => (
            <button
              key={k}
              onClick={() => setActiveSport(i)}
              className="px-2.5 h-6 rounded-md text-[10px] font-semibold flex-shrink-0"
              style={{
                background: activeSport === i ? "var(--p-active-secondary-gradient-color)" : "transparent",
                border:
                  activeSport === i ? "1px solid var(--p-primary)" : "1px solid var(--p-border-and-gradient-bg)",
                color: activeSport === i ? pickContrastText(palette.activeSecondaryGradientColor) : "var(--p-text-secondary-color)",
              }}
            >
              {strings[k]}
            </button>
          ))}
        </div>

        <div className="flex gap-1.5 mb-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {LEAGUE_TABS.slice(0, 3).map((l, i) => (
            <button
              key={l}
              onClick={() => setActiveLeague(i)}
              className="px-2.5 h-6 rounded-full text-[9.5px] font-semibold flex-shrink-0"
              style={{
                background: activeLeague === i ? "var(--p-active-secondary-gradient-color)" : "transparent",
                border:
                  activeLeague === i ? "1px solid var(--p-primary)" : "1px solid var(--p-border-and-gradient-bg)",
                color: activeLeague === i ? pickContrastText(palette.activeSecondaryGradientColor) : "var(--p-text-secondary-color)",
              }}
            >
              ⚽ {l.split(" - ")[0]}
            </button>
          ))}
        </div>

        <div className="flex gap-1.5 mb-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {BET_TYPE_TABS.slice(0, 5).map((b, i) => (
            <button
              key={b}
              onClick={() => setActiveBetType(i)}
              className="px-2.5 h-6 rounded-md text-[9.5px] font-semibold flex-shrink-0"
              style={{
                background: activeBetType === i ? "var(--p-active-secondary-gradient-color)" : "transparent",
                border:
                  activeBetType === i ? "1px solid var(--p-primary)" : "1px solid var(--p-border-and-gradient-bg)",
                color: activeBetType === i ? pickContrastText(palette.activeSecondaryGradientColor) : "var(--p-text-secondary-color)",
              }}
            >
              {b}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {MATCHES.slice(0, 4).map((m, i) => (
            <div
              key={i}
              className="rounded-md p-2.5"
              style={{ background: "var(--p-dark)", border: "1px solid var(--p-border-and-gradient-bg)" }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className="text-[9px] font-semibold"
                  style={{ color: m.live ? "var(--p-lost-color)" : "var(--p-primary)" }}
                >
                  {m.date}
                </span>
                <div
                  className="flex gap-5 text-[9px] font-bold"
                  style={{ color: "var(--p-text-secondary-color)" }}
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
                      style={{ color: "var(--p-light-text-color)" }}
                    >
                      {m.home}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <TeamDot label={m.away} />
                    <span
                      className="text-[10.5px] font-medium truncate"
                      style={{ color: "var(--p-light-text-color)" }}
                    >
                      {m.away}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {m.odds.map((o, j) => (
                    <button
                      key={j}
                      className="w-10 h-10 rounded-md text-[11px] font-bold"
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
    user: "Alex M.",
    initial: "A",
    league: "Premier League",
    status: "PENDING",
    title: "4 Selection Multi",
    stake: "500",
    payout: "8,450",
    pick: { market: "1X2", selection: "Man City Win", odds: "1.85" },
  },
  {
    user: "Jordan K.",
    initial: "J",
    boost: "20% PROFIT BOOST",
    league: "Champions League",
    status: "WON",
    title: "3 Selection Accumulator",
    stake: "100",
    payout: "1,750",
    legs: [
      { market: "1X2", selection: "Arsenal Win", vs: "Arsenal vs Chelsea", odds: "2.10" },
      { market: "O/U", selection: "Over 2.5", vs: "Spurs vs Wolves", odds: "1.65" },
      { market: "1X2", selection: "Liverpool Win", vs: "Liverpool vs Everton", odds: "1.55" },
    ],
  },
  {
    user: "Sam T.",
    initial: "S",
    league: "Bundesliga",
    status: "LIVE",
    title: "Single Bet",
    stake: "200",
    payout: "420",
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
        <ChevronRight className="h-4 w-4 rotate-180" style={{ color: "var(--p-light-text-color)" }} />
        <div
          className="flex-1 flex items-center gap-2 px-3 h-9 rounded-full"
          style={{ background: "var(--p-dark)", border: "1px solid var(--p-border-and-gradient-bg)" }}
        >
          <Search className="h-3.5 w-3.5" style={{ color: "var(--p-text-secondary-color)" }} />
          <span className="text-[10.5px]" style={{ color: "var(--p-text-secondary-color)" }}>
            {strings.SEARCH}
          </span>
        </div>
      </div>

      {/* Popular */}
      <div className="px-3 pt-2 pb-3">
        <div className="text-[11px] font-semibold mb-2" style={{ color: "var(--p-text-secondary-color)" }}>
          {strings.POPULAR}
        </div>
        <div className="flex flex-col items-start gap-1">
          <div
            className="h-12 w-12 rounded-xl grid place-items-center"
            style={{ background: "var(--p-dark)", border: "1px solid var(--p-border-and-gradient-bg)" }}
          >
            <span className="text-[18px] font-black" style={{ color: "var(--p-light-text-color)" }}>
              V
            </span>
          </div>
          <span className="text-[10px]" style={{ color: "var(--p-text-secondary-color)" }}>
            Virtuals
          </span>
        </div>
      </div>

      {/* All Sports */}
      <div className="px-3">
        <div className="text-[14px] font-bold mb-2" style={{ color: "var(--p-light-text-color)" }}>
          {strings.ALL_SPORTS}
        </div>
        <div className="space-y-2 pb-3">
          {ALL_SPORTS_LIST.map((s) => (
            <div
              key={s.name}
              className="flex items-center gap-2.5 px-3 h-11 rounded-xl"
              style={{ background: "var(--p-dark)", border: "1px solid var(--p-border-and-gradient-bg)" }}
            >
              <div
                className="h-6 w-6 rounded-full grid place-items-center text-[12px]"
                style={{ background: "var(--p-active-secondary-gradient-color)", border: "1px solid var(--p-primary)" }}
              >
                <span style={{ color: "var(--p-primary)" }}>{s.icon}</span>
              </div>
              <span
                className="flex-1 text-[11.5px] font-semibold"
                style={{ color: "var(--p-light-text-color)" }}
              >
                {s.name}
              </span>
              <span className="text-[11px] font-medium" style={{ color: "var(--p-text-secondary-color)" }}>
                {s.count}
              </span>
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
    s === "WON"
      ? strings.STATUS_WON
      : s === "LOST"
        ? strings.STATUS_LOST
        : s === "PENDING"
          ? strings.STATUS_PENDING
          : s === "LIVE"
            ? strings.STATUS_LIVE
            : s;
  const statusBg =
    post.status === "PENDING"
      ? "rgba(0,0,0,0.5)"
      : post.status === "LIVE"
        ? "linear-gradient(135deg, var(--p-primary-button), var(--p-primary-button-gradient))"
        : post.status === "WON"
          ? "linear-gradient(135deg, var(--p-won-gradient-1), var(--p-won-gradient-2))"
          : post.status === "LOST"
            ? "var(--p-secondary)"
            : "transparent";

  return (
    <div
      className="rounded-xl p-3 mb-2"
      style={{ background: "var(--p-dark)", border: "1px solid var(--p-border-and-gradient-bg)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div
          className="h-7 w-7 rounded-full grid place-items-center text-[11px] font-black"
          style={{
            background: "linear-gradient(135deg, var(--p-primary-button), var(--p-primary-button-gradient))",
            color: "var(--p-light-text-color)",
          }}
        >
          {post.initial}
        </div>
        <span className="text-[12px] font-bold flex-1" style={{ color: "var(--p-light-text-color)" }}>
          {post.user}
        </span>
        {post.boost && (
          <span
            className="text-[8.5px] font-bold px-2 py-1 rounded-md"
            style={{ background: "rgba(0,0,0,0.4)", color: "var(--p-primary)" }}
          >
            {post.boost}
          </span>
        )}
      </div>

      {/* League + status */}
      {(post.league || post.status) && (
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Trophy className="h-3 w-3 flex-shrink-0" style={{ color: "var(--p-text-secondary-color)" }} />
            <span className="text-[10px] truncate" style={{ color: "var(--p-text-secondary-color)" }}>
              {post.league}
            </span>
          </div>
          {post.status && (
            <span
              className="text-[8.5px] font-black px-2 py-0.5 rounded-full flex items-center gap-1"
              style={{ background: statusBg, color: "var(--p-light-text-color)" }}
            >
              {post.status === "LIVE" && <span className="h-1 w-1 rounded-full bg-white" />}
              {statusLabel(post.status)}
            </span>
          )}
        </div>
      )}

      {/* Title */}
      <div className="text-[14px] font-bold mb-2" style={{ color: "var(--p-light-text-color)" }}>
        {post.title}
      </div>

      {/* Match w/ pick */}
      {post.match && (
        <div className="rounded-lg p-2 mb-2" style={{ background: "rgba(0,0,0,0.25)" }}>
          <div
            className="flex items-center justify-between text-[10px] mb-1"
            style={{ color: "var(--p-text-secondary-color)" }}
          >
            <div className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-full" style={{ background: "var(--p-inactive-button-bg)" }} />
              <span style={{ color: "var(--p-light-text-color)" }}>{post.match.home}</span>
            </div>
            <span style={{ color: "var(--p-primary)" }}>{post.match.date}</span>
            <div className="flex items-center gap-1">
              <span style={{ color: "var(--p-light-text-color)" }}>{post.match.away}</span>
              <span className="h-3 w-3 rounded-full" style={{ background: "var(--p-inactive-button-bg)" }} />
            </div>
          </div>
          {post.match.score && (
            <div className="text-center text-[11px] font-bold" style={{ color: "var(--p-light-text-color)" }}>
              {post.match.score}
            </div>
          )}
          {post.pick && (
            <div
              className="mt-2 flex items-center justify-between rounded-md px-2 py-1.5"
              style={{ background: "var(--p-primary-background-color)", border: "1px solid var(--p-primary)" }}
            >
              <div className="min-w-0">
                <div className="text-[8.5px] font-bold" style={{ color: "var(--p-primary)" }}>
                  {post.pick.market}
                </div>
                <div className="text-[11px] font-bold truncate" style={{ color: "var(--p-light-text-color)" }}>
                  {post.pick.selection}
                </div>
              </div>
              <span className="text-[12px] font-black ml-2" style={{ color: "var(--p-primary)" }}>
                {post.pick.odds}
              </span>
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
                  <div
                    className="text-[8.5px] font-bold mb-0.5"
                    style={{ color: "var(--p-primary)" }}
                  >
                    {leg.market}
                  </div>
                  <div
                    className="text-[11px] font-bold truncate"
                    style={{ color: "var(--p-light-text-color)" }}
                  >
                    {leg.selection}
                  </div>
                  <div className="text-[8.5px] mt-0.5 truncate" style={{ color: "var(--p-text-secondary-color)" }}>
                    <span style={{ color: "var(--p-secondary)" }}>vs</span>{" "}
                    {leg.vs.split(" vs ")[1] ?? leg.vs}
                  </div>
                </div>
                <span className="text-[12px] font-black ml-2" style={{ color: "var(--p-primary)" }}>
                  {leg.odds}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stake/payout */}
      <div
        className="flex items-center justify-between text-[9px] pt-2 border-t"
        style={{ borderColor: "var(--p-border-and-gradient-bg)" }}
      >
        <span style={{ color: "var(--p-text-secondary-color)" }}>{strings.STAKE}</span>
        <span className="font-bold" style={{ color: "var(--p-light-text-color)" }}>
          {currencySymbol} {post.stake}
        </span>
        <span className="font-bold" style={{ color: "var(--p-primary)" }}>
          {currencySymbol} {post.payout}
        </span>
        <span style={{ color: "var(--p-text-secondary-color)" }}>{strings.PAYOUT}</span>
      </div>

      {/* Reactions */}
      <div
        className="flex items-center gap-3 mt-2 pt-2 text-[10px]"
        style={{ color: "var(--p-text-secondary-color)" }}
      >
        <span>♡ 0</span>
        <span>💬 0</span>
        <span style={{ color: "var(--p-primary)" }}>⚡ 0 Rebets</span>
        <span className="ml-auto">⤴</span>
      </div>
    </div>
  );
}

function SocialView({
  socialTab,
  setSocialTab,
  currencySymbol,
}: {
  socialTab: "friends" | "explore";
  setSocialTab: (t: "friends" | "explore") => void;
  currencySymbol: string;
}) {
  const { strings } = useStudio();
  const posts: SocialPost[] = FRIENDS_POSTS;
  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2 flex-shrink-0">
        <div
          className="h-7 w-7 rounded-full grid place-items-center text-[10px] font-black"
          style={{ background: "var(--p-primary)", color: "var(--p-light-text-color)" }}
        >
          ✓
        </div>
        <div
          className="flex items-center gap-1.5 px-2.5 h-6 rounded-full"
          style={{ background: "var(--p-dark)" }}
        >
          <span className="text-[10px] font-bold" style={{ color: "var(--p-light-text-color)" }}>
            {currencySymbol}
          </span>
          <span className="text-[10px] tracking-wider" style={{ color: "var(--p-light-text-color)" }}>
            ****
          </span>
          <Plus className="h-3 w-3" style={{ color: "var(--p-primary)" }} />
          <EyeOff className="h-3 w-3" style={{ color: "var(--p-text-secondary-color)" }} />
        </div>
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4" style={{ color: "var(--p-light-text-color)" }} />
          <MessageCircle className="h-4 w-4" style={{ color: "var(--p-light-text-color)" }} />
        </div>
      </div>

      {/* Friends/Explore tabs */}
      <div className="flex border-b flex-shrink-0" style={{ borderColor: "var(--p-border-and-gradient-bg)" }}>
        {(["friends", "explore"] as const).map((t) => {
          const active = socialTab === t;
          return (
            <button
              key={t}
              onClick={() => setSocialTab(t)}
              className="flex-1 h-9 text-[12px] font-bold relative"
              style={{ color: active ? "var(--p-light-text-color)" : "var(--p-text-secondary-color)" }}
            >
              {t === "friends" ? strings.TAB_FRIENDS : strings.TAB_EXPLORE}
              {active && (
                <span
                  className="absolute bottom-0 left-6 right-6 h-[2px] rounded-full"
                  style={{ background: "var(--p-primary)" }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Posts */}
      <div className="flex-1 min-h-0 overflow-auto px-3 pt-2 pb-2">
        {posts.map((p, i) => (
          <SocialPostCard key={i} post={p} currencySymbol={currencySymbol} />
        ))}
      </div>
    </div>
  );
}

function BetDetailView({ currencySymbol }: { currencySymbol: string }) {
  const { strings } = useStudio();
  return (
    <div className="flex-1 min-h-0 overflow-auto px-3 pt-3 pb-2">
      <div
        className="rounded-xl p-3 mb-2"
        style={{ background: "var(--p-dark)", border: "1px solid var(--p-border-and-gradient-bg)" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Trophy className="h-3 w-3" style={{ color: "var(--p-text-secondary-color)" }} />
            <span className="text-[10px] truncate" style={{ color: "var(--p-text-secondary-color)" }}>
              Premier League, Serie A
            </span>
          </div>
          <span
            className="text-[8.5px] font-black px-2 py-0.5 rounded-full"
            style={{ background: "rgba(0,0,0,0.5)", color: "var(--p-primary)" }}
          >
            {strings.STATUS_PENDING}
          </span>
        </div>

        <div className="flex items-baseline justify-between mb-2">
          <div className="text-[14px] font-black" style={{ color: "var(--p-light-text-color)" }}>
            13 Selection Flex Multi
          </div>
          <div className="text-[12px] font-bold" style={{ color: "var(--p-primary)" }}>
            214.22 ~ 27.46
          </div>
        </div>

        {/* Match */}
        <div className="rounded-lg p-2 mb-2" style={{ background: "rgba(0,0,0,0.25)" }}>
          <div className="flex items-center justify-between text-[10px] mb-1">
            <div className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-full" style={{ background: "var(--p-inactive-button-bg)" }} />
              <span style={{ color: "var(--p-light-text-color)" }}>Crystal Palace</span>
            </div>
            <div className="text-center">
              <div className="text-[8.5px] font-bold" style={{ color: "var(--p-primary)" }}>
                20 APR
              </div>
              <div className="text-[8.5px]" style={{ color: "var(--p-text-secondary-color)" }}>
                9:00 PM
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span style={{ color: "var(--p-light-text-color)" }}>West Ham United</span>
              <span className="h-3 w-3 rounded-full" style={{ background: "var(--p-inactive-button-bg)" }} />
            </div>
          </div>
          <div
            className="mt-2 flex items-center justify-between rounded-md px-2 py-1.5"
            style={{ background: "var(--p-primary-background-color)", border: "1px solid var(--p-primary)" }}
          >
            <div>
              <div className="text-[8.5px] font-bold" style={{ color: "var(--p-primary)" }}>
                Total
              </div>
              <div className="text-[12px] font-black" style={{ color: "var(--p-light-text-color)" }}>
                over 2.5
              </div>
            </div>
            <span className="text-[13px] font-black" style={{ color: "var(--p-primary)" }}>
              1.92
            </span>
          </div>
        </div>

        {/* Pagination dots */}
        <div className="flex items-center justify-center gap-1 mb-2">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--p-primary)" }} />
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className="h-1 w-1 rounded-full"
              style={{ background: "var(--p-inactive-button-bg)" }}
            />
          ))}
        </div>

        {/* Flex Cuts */}
        <div
          className="rounded-lg p-2 mb-2"
          style={{ background: "rgba(0,0,0,0.25)", border: "1px solid var(--p-primary)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className="text-[10px] font-bold flex items-center gap-1"
              style={{ color: "var(--p-primary)" }}
            >
              <Flame className="h-3 w-3" /> {strings.FLEX_CUTS}
            </span>
            <span className="text-[10px] font-bold" style={{ color: "var(--p-primary)" }}>
              1.27 - 3.14
            </span>
          </div>
          <div
            className="grid grid-cols-3 text-[8.5px] font-bold pb-1 border-b"
            style={{ color: "var(--p-text-secondary-color)", borderColor: "var(--p-border-and-gradient-bg)" }}
          >
            <span>{strings.OUTCOME}</span>
            <span>{strings.ODDS_LABEL}</span>
            <span className="text-right">{strings.PAYOUT}</span>
          </div>
          <div className="grid grid-cols-3 text-[10px] py-1.5" style={{ color: "var(--p-light-text-color)" }}>
            <span>12 of 13 correct</span>
            <span>1.27</span>
            <span className="text-right">{currencySymbol} 155.53</span>
          </div>
          <div className="grid grid-cols-3 text-[10px]" style={{ color: "var(--p-light-text-color)" }}>
            <span>13 of 13 correct</span>
            <span>3.14</span>
            <span className="text-right">{currencySymbol} 383.35</span>
          </div>
        </div>

        {/* Stake */}
        <div
          className="flex items-center justify-between text-[9px] pt-1 border-t"
          style={{ borderColor: "var(--p-border-and-gradient-bg)" }}
        >
          <span style={{ color: "var(--p-text-secondary-color)" }}>{strings.STAKE}</span>
          <span className="font-bold" style={{ color: "var(--p-light-text-color)" }}>
            {currencySymbol} 122.00
          </span>
          <span className="font-bold" style={{ color: "var(--p-primary)" }}>
            {currencySymbol} 26135.44
          </span>
          <span style={{ color: "var(--p-text-secondary-color)" }}>{strings.PAYOUT}</span>
        </div>
        <div
          className="flex items-center gap-3 mt-2 text-[10px]"
          style={{ color: "var(--p-text-secondary-color)" }}
        >
          <span>♡ 0</span>
          <span>💬 0</span>
          <span style={{ color: "var(--p-primary)" }}>⚡ 0 Rebets</span>
          <span className="ml-auto">⤴</span>
        </div>
        <div className="text-[8.5px] mt-1" style={{ color: "var(--p-text-secondary-color)" }}>
          an hour ago
        </div>
      </div>

      {/* Second card */}
      <SocialPostCard
        post={{
          user: "Bosseysa",
          initial: "B",
          boost: "20% PROFIT BOOST",
          league: "FA Cup, U21 Professional Development Lea…",
          status: "PENDING",
          title: "9 Selection Multi",
          stake: "36.85",
          payout: "44.03",
        }}
        currencySymbol={currencySymbol}
      />
    </div>
  );
}

/* ─── Main exported component ─────────────────────────────────────────── */

/** Convert a TCMPalette field name (camelCase) to a CSS variable name (--p-kebab-case). */
function fieldNameToCssVar(fieldName: string): string {
  const kebab = fieldName
    .replace(/([A-Z])/g, "-$1")
    .replace(/([0-9]+)/g, "-$1")
    .toLowerCase()
    .replace(/^-/, "");
  return `--p-${kebab}`;
}

/** Generate an inline style object setting all TCMPalette fields as CSS variables. */
function paletteToInlineStyle(
  pal: import("@/lib/tcm-palette").TCMPalette,
  extraStyles?: React.CSSProperties,
): React.CSSProperties {
  const style: Record<string, string> = {};
  for (const [fieldName, value] of Object.entries(pal)) {
    style[fieldNameToCssVar(fieldName)] = value as string;
  }
  return { ...style, ...extraStyles } as React.CSSProperties;
}

const BettingAppPreview = ({ viewMode, readOnly = false }: { viewMode?: "mobile" | "web"; readOnly?: boolean } = {}) => {
  const { palette, appIcons, previewMode, headingFont, strings } = useStudio();
  const isMobile = viewMode !== undefined ? viewMode === "mobile" : previewMode === "mobile";
  const [showModal, setShowModal] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleSimulateNotification = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div
      className="flex flex-col items-center w-full h-full"
      style={paletteToInlineStyle(palette, { fontFamily: headingFont + ", sans-serif" })}
    >
      {/* Toolbar */}
      {!readOnly && (
      <div
        className="flex items-center gap-2 px-4 py-2 w-full flex-shrink-0"
        style={{ background: "var(--p-dark)", borderBottom: "1px solid var(--p-border-and-gradient-bg)" }}
      >
        <button
          onClick={() => setShowModal((v) => !v)}
          className="px-3 h-7 rounded text-[10px] font-semibold"
          style={{ background: "var(--p-primary-button)", color: "var(--p-primary-text-color)" }}
        >
          Show Modal
        </button>
        <button
          onClick={handleSimulateNotification}
          className="px-3 h-7 rounded text-[10px] font-semibold"
          style={{ background: "var(--p-inactive-button-bg)", color: "var(--p-inactive-button-text-primary)" }}
        >
          Simulate Notification
        </button>
      </div>
      )}

      <div className="flex items-center justify-center w-full flex-1 p-4 relative overflow-hidden">
      {/* Toast notification */}
      {showToast && (
        <div
          className="absolute top-4 right-4 z-50 rounded-xl p-3 flex items-start gap-2 shadow-xl"
          style={{
            background: "var(--p-notification-section-bg)",
            border: "1px solid var(--p-border-and-gradient-bg)",
            minWidth: 200,
            maxWidth: 260,
          }}
        >
          <div
            className="h-7 w-7 rounded-full grid place-items-center flex-shrink-0"
            style={{ background: "var(--p-action-icon-box-bg)" }}
          >
            <span style={{ color: "var(--p-won-color)", fontSize: 14 }}>✓</span>
          </div>
          <div>
            <div className="text-[11px] font-bold" style={{ color: "var(--p-light-text-color)" }}>
              Bet placed successfully
            </div>
            <div className="text-[10px] mt-0.5" style={{ color: "var(--p-text-secondary-color)" }}>
              +$42 potential payout
            </div>
          </div>
        </div>
      )}

      {/* Modal overlay */}
      {showModal && (
        <div
          className="absolute inset-0 z-40 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="rounded-xl p-5 shadow-2xl"
            style={{
              background: "var(--p-modal-background)",
              border: "1px solid var(--p-border-and-gradient-bg)",
              minWidth: 240,
              maxWidth: 300,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[14px] font-bold mb-1" style={{ color: "var(--p-light-text-color)" }}>
              Confirm Bet
            </div>
            <div className="text-[11px] mb-3" style={{ color: "var(--p-text-secondary-color)" }}>
              Stake: $25 · Potential Payout: $87.50
            </div>
            <div
              className="mb-3"
              style={{ borderTop: "1px solid var(--p-border-and-gradient-bg)" }}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 h-8 rounded text-[11px] font-semibold"
                style={{ background: "var(--p-inactive-button-bg)", color: "var(--p-inactive-button-text-primary)" }}
              >
                Cancel
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 h-8 rounded text-[11px] font-semibold"
                style={{
                  background: "linear-gradient(135deg, var(--p-primary-button), var(--p-primary-button-gradient))",
                  color: "var(--p-primary-text-color)",
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {isMobile ? (
        <div
          className="relative overflow-hidden rounded-[36px] shadow-2xl"
          style={{
            width: 340,
            height: 700,
            border: "3px solid #1a1a1a",
            background: "var(--p-primary-background-color)",
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
            background: "var(--p-primary-background-color)",
          }}
        >
          <WebPreview appName={strings.APP_NAME} logoUrl={appIcons.appNameLogo} />
        </div>
      )}
      </div>
    </div>
  );
};

export default BettingAppPreview;
