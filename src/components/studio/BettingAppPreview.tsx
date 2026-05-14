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
import React, { useState, useMemo, useEffect } from "react";
import { useStudio } from "@/contexts/StudioContext";
import type { TCMStrings } from "@/lib/tcm-strings";
import { SportsListing } from "./BettingAppPreview/SportsListing";
import { GameDetail } from "./BettingAppPreview/GameDetail";
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
  Settings,
  Copy,
  Wallet,
  Info,
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


export function pickContrastText(rgbaStr: string): string {
  const m = rgbaStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return "var(--p-light-text-color)";

  const r = +m[1], g = +m[2], b = +m[3];

  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

  // Saturation check: saturated mid-luminance colors (orange, red, lime, cyan)
  // look better with white even if technically bright enough for black
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max === 0 ? 0 : (max - min) / max;

  // Only use black on light AND desaturated backgrounds (white/cream/pastel)
  if (lum > 0.65 && saturation < 0.4) {
    return "rgba(0,0,0,1)";
  }

  if (lum > 0.78) {
    return "rgba(0,0,0,1)";
  }

  return "var(--p-light-text-color)";
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
  { icon: CircleDot, strKey: "TILE_FOOTBALL" as const, nav: 1 },
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
  "Liga Portugal - Portugal",
  "Eredivisie - Netherlands",
];
const BET_TYPE_TABS = [
  "1X2",
  "Over/Under",
  "Double chance",
  "GG/NG",
  "1st half O/U",
  "Handicap",
  "Anytime goalscorer",
  "Total corners",
  "Total bookings",
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

/* ─────────── KMK Entertainment override (MyBet.Africa demo) ─────────── */
const KMK_CLIENT_ID = "8e1aee03-7a76-4ad8-a336-6a8a1dae9fc0";

const MYBET_OVERRIDES: React.CSSProperties = {
  ["--p-primary" as any]: "#22B14C",
  ["--p-primary-button" as any]: "#22B14C",
  ["--p-primary-button-gradient" as any]: "#1A8E3D",
  ["--p-secondary" as any]: "#F5C518",
  ["--p-active-secondary-gradient-color" as any]: "#22B14C",
  ["--p-primary-background-color" as any]: "#0A0F14",
  ["--p-dark" as any]: "#11161E",
  ["--p-modal-background" as any]: "#161D27",
  ["--p-dark-container-background" as any]: "#11161E",
  ["--p-border-and-gradient-bg" as any]: "#252D3A",
  ["--p-border-color" as any]: "#252D3A",
  ["--p-light-text-color" as any]: "#FFFFFF",
  ["--p-text-secondary-color" as any]: "#A0A8B5",
  ["--p-primary-text-color" as any]: "#000000",
  ["--p-free-bet-background" as any]: "rgba(245,197,24,0.18)",
  ["--p-box-gradient-color-end" as any]: "#1A8E3D",
  ["--p-won-color" as any]: "#22B14C",
  ["--p-won-gradient-1" as any]: "#22B14C",
  ["--p-won-gradient-2" as any]: "#1A8E3D",
  ["--p-lost-color" as any]: "#E8202A",
  ["--p-vs-color" as any]: "#A0A8B5",
  ["--p-inactive-button-bg" as any]: "#252D3A",
};

const MYBET_MATCHES: Match[] = [
  { date: "TODAY · 5:00 PM", home: "Asante Kotoko", away: "Hearts of Oak", odds: ["2.10", "3.20", "3.40"], live: false },
  { date: "TODAY · 7:00 PM", home: "Aduana Stars", away: "Medeama SC", odds: ["1.85", "3.50", "4.10"], live: false },
  { date: "LIVE · 67'", home: "Dreams FC", away: "Bechem United", odds: ["1.95", "3.30", "3.80"], live: true },
  { date: "TOMORROW · 4:00 PM", home: "Berekum Chelsea", away: "Karela United", odds: ["2.40", "3.10", "2.90"], live: false },
  { date: "TOMORROW · 6:00 PM", home: "Legon Cities", away: "King Faisal", odds: ["2.20", "3.20", "3.10"], live: false },
  { date: "10 MAY · 4:00 PM", home: "Accra Lions", away: "Nsoatreman FC", odds: ["1.75", "3.60", "4.50"], live: false },
];

const MYBET_LIVE_UPCOMING = [
  { live: true, code: "GPL", home: "ASA", away: "HOA", odds: null },
  { live: true, code: "GPL", home: "ADU", away: "MED", odds: null },
  { live: true, code: "GPL", home: "DRE", away: "BEC", odds: "1.95" },
  { live: false, code: "GFA Cup", home: "BER", away: "KAR", odds: "2.40" },
  { live: false, code: "CAF CL", home: "ASA", away: "MAM", odds: "2.10" },
  { live: false, code: "CAF Conf", home: "MED", away: "ASE", odds: "1.85" },
];

const MYBET_BET_SLIPS: BetSlip[] = [
  { team: "Asante Kotoko", odds: "2.10", status: "WON", stake: "5000", payout: "10500" },
  { team: "Aduana Stars", odds: "1.85", status: "PENDING", stake: "2500", payout: "4625" },
  { team: "Dreams FC", odds: "3.30", status: "LOST", stake: "1000", payout: "0" },
  { team: "Hearts of Oak", odds: "3.40", status: "WON", stake: "3000", payout: "10200" },
];

const MYBET_STRINGS_OVERRIDES = {
  WELCOME_BONUS_PROMO: "GET A 100% BONUS UP TO GH₵2,000",
  WELCOME_BONUS_BODY_WEB: "Enjoy a 100% welcome bonus on your first deposit and double your starting stake.",
  WELCOME_BONUS_BODY_MOBILE: "100% welcome bonus up to GH₵2,000",
  CURRENCY_SYMBOL: "GH₵",
};

const MYBET_LEAGUE_TABS = [
  "GPL - Ghana",
  "GFA Cup",
  "CAF CL",
  "CAF Conf",
  "Premier League - England",
  "LaLiga - Spain",
];

function MyBetWordmark({ size = 18 }: { size?: number }) {
  return (
    <div className="flex flex-col items-start mr-3 select-none leading-none">
      <div className="flex items-baseline gap-0" style={{ fontSize: size }}>
        <span className="font-black italic" style={{ color: "#F5C518" }}>my</span>
        <span className="font-black italic" style={{ color: "#FFFFFF" }}>bet.</span>
        <span className="font-black italic" style={{ color: "#22B14C" }}>africa</span>
      </div>
      {size >= 36 && (
        <div
          className="font-bold tracking-[0.18em] mt-[2px]"
          style={{ fontSize: Math.max(6, Math.round(size * 0.34)), color: "#FFFFFF" }}
        >
          HOME OF BETTING
        </div>
      )}
    </div>
  );
}

// NOTE: These 8 fixtures duplicate FOOTBALL_LEAGUES[0] (Premier League).
// Match IDs pl-1..pl-8 in sports-data.ts mirror this array's index order.
// When clicking a card, we navigate to detail using pl-${i + 1}.
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

type BetSlipStatus = "WON" | "LOST" | "PENDING";
type BetSlip = { team: string; odds: string; status: BetSlipStatus; stake: string; payout: string; };

const BET_SLIPS: BetSlip[] = [
  { team: "Brentford FC", odds: "2.16", status: "LOST", stake: "100", payout: "0" },
  { team: "Tottenham Hotspur", odds: "2.85", status: "PENDING", stake: "10", payout: "28.50" },
  { team: "Brighton & Hove Albion", odds: "1.64", status: "WON", stake: "55", payout: "243.71" },
  { team: "Liverpool FC", odds: "1.90", status: "WON", stake: "150", payout: "285" },
  { team: "Arsenal", odds: "2.10", status: "LOST", stake: "50", payout: "0" },
  { team: "Man United", odds: "2.30", status: "PENDING", stake: "20", payout: "46" },
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
  // GPL — Ghana Premier League (full names + 3-letter codes)
  "Asante Kotoko": 693, "ASA": 693,
  "Hearts of Oak": 685, "HOA": 685,
  "Aduana Stars": 689, "ADU": 689,
  "Medeama SC": 687, "MED": 687,
  "Dreams FC": 690, "DRE": 690,
  "Bechem United": 688, "BEC": 688,
  "Berekum Chelsea": 691, "BER": 691,
  "Karela United": 694, "KAR": 694,
  "Legon Cities": 692, "LEG": 692,
  "King Faisal": 695, "KFB": 695,
  "Accra Lions": 696, "ACL": 696,
  "Nsoatreman FC": 697, "NSO": 697,
  "Mamelodi Sundowns": 1027, "MAM": 1027,
  "ASEC Mimosas": 1018, "ASE": 1018,
  // Czech MSFL
  "TJ Unie Hlubina": 8364, "FC Zbrojovka Brno B": 5705,
  "FK Blansko": 8392, "SK Unicov": 8400,
  // Bulgaria Parva Liga
  "PFC Lokomotiv Plovdiv": 765, "FC Arda Kardzhali": 779,
  // Latvia Virsliga
  "BFC Daugavpils": 3287, "Riga FC": 3286,
  // Slovakia 2. Liga
  "Slavia TU Kosice": 3552, "FK Inter Bratislava": 3549,
  // MLS Next Pro
  "Toronto FC II": 22043, "Red Bull New York II": 22041,
};

// Football league badges via api-sports CDN
const LEAGUE_LOGO_IDS: Record<string, number> = {
  "Premier League": 39, "Premier League - England": 39,
  "LaLiga": 140, "LaLiga - Spain": 140,
  "Bundesliga": 78, "Bundesliga - Germany": 78,
  "Serie A": 135, "Serie A - Italy": 135,
  "Ligue 1": 61, "Ligue 1 - France": 61,
  "Liga Portugal": 94, "Liga Portugal - Portugal": 94,
  "Eredivisie": 88, "Eredivisie - Netherlands": 88,
  "MSFL": 346, "MSFL - Czechia": 346,
  "Parva Liga": 172, "Parva Liga - Bulgaria": 172,
  "Virsliga": 365, "Virsliga - Latvia": 365,
  "2. Liga": 502, "2. Liga - Slovakia": 502,
  "MLS Next Pro": 909, "MLS Next Pro - USA": 909,
  "GPL": 286, "GPL - Ghana": 286,
  "GFA Cup": 287,
  "CAF CL": 12, "CAF Champions League": 12,
  "CAF Conf": 20, "CAF Confederation Cup": 20,
};

const leagueLogoUrl = (name: string): string | null => {
  const id = LEAGUE_LOGO_IDS[name];
  return id ? `https://media.api-sports.io/football/leagues/${id}.png` : null;
};

const LeagueLogo = ({ label, size = 12 }: { label: string; size?: number }) => {
  const url = leagueLogoUrl(label);
  if (!url) return <span style={{ fontSize: size }}>⚽</span>;
  return (
    <img
      src={url}
      alt={label}
      className="object-contain flex-shrink-0"
      style={{ height: size, width: size }}
    />
  );
};

// NBA team logos via ESPN CDN (official team logos, public)
const NBA_LOGO_ABBR: Record<string, string> = {
  "Knicks": "ny", "New York Knicks": "ny",
  "76ers": "phi", "Philadelphia 76ers": "phi",
  "Spurs": "sa", "San Antonio Spurs": "sa",
  "Timberwolves": "min", "Minnesota Timberwolves": "min",
  "Pistons": "det", "Detroit Pistons": "det",
  "Cavaliers": "cle", "Cleveland Cavaliers": "cle",
  "Thunder": "okc", "Oklahoma City Thunder": "okc",
  "Lakers": "lal", "Los Angeles Lakers": "lal",
  "Celtics": "bos", "Warriors": "gs", "Bucks": "mil", "Heat": "mia",
  "Nets": "bkn", "Bulls": "chi", "Suns": "phx", "Nuggets": "den",
  "Mavericks": "dal", "Rockets": "hou", "Clippers": "lac", "Grizzlies": "mem",
  "Hawks": "atl", "Hornets": "cha", "Magic": "orl", "Wizards": "wsh",
  "Raptors": "tor", "Pacers": "ind", "Pelicans": "no", "Kings": "sac",
  "Trail Blazers": "por", "Jazz": "utah",
};

const teamLogoUrl = (name: string): string | null => {
  const footballId = TEAM_LOGO_IDS[name];
  if (footballId) return `https://media.api-sports.io/football/teams/${footballId}.png`;
  const nbaAbbr = NBA_LOGO_ABBR[name];
  if (nbaAbbr) return `https://a.espncdn.com/i/teamlogos/nba/500/${nbaAbbr}.png`;
  return null;
};

export const TeamDot = ({ label, size = 16 }: { label: string; size?: number }) => {
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

function getStatusPillStyle(status: string): React.CSSProperties {
  switch (status) {
    case "WON":  return { background: "var(--p-won-color)",  border: "none", color: "var(--p-dark)" };
    case "LOST": return { background: "var(--p-lost-color)", border: "none", color: "#fff" };
    case "PENDING": return { background: "transparent", border: "1px solid var(--p-primary)", color: "var(--p-primary)" };
    default:     return { background: "transparent", border: "1px solid var(--p-text-secondary-color)", color: "var(--p-text-secondary-color)" };
  }
}

function getStatusOddsColor(status: string): string {
  switch (status) {
    case "WON":  return "var(--p-won-color)";
    case "LOST": return "var(--p-lost-color)";
    case "PENDING": return "var(--p-primary)";
    default: return "var(--p-light-text-color)";
  }
}

function betStatusStyle(status: BetSlipStatus) {
  return {
    cardBg: "var(--p-modal-background)",
    cardBorder: "1px solid var(--p-border-and-gradient-bg)",
    pillStyle: getStatusPillStyle(status),
    oddsColor: getStatusOddsColor(status),
    payoutColor: status === "WON" ? "var(--p-payout-won-color, var(--p-won-color))" : "var(--p-light-text-color)",
  };
}

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

/* ─── LIVE MATCH DATA ─────────────────────────────────────────────────── */

type LiveSoccerMatch = {
  id: string;
  league: string;
  home: string;
  away: string | null;
  homeScore: number | null;
  awayScore: number | null;
  statusText: string;
  odds: string[];
  suspended: boolean;
};

type LiveRacketMatch = {
  id: string;
  league: string;
  playerA: { name: string; flag: string };
  playerB: { name: string; flag: string };
  scoreA: string;
  scoreB: string;
  statusText: string;
  spreadOdds: string[] | null;
  moneylineOdds: string[] | null;
  totalOdds: string[] | null;
  suspended: boolean;
  lockedColumns?: string[];
};

const LIVE_SOCCER: LiveSoccerMatch[] = [
  { id: "live-soc-1", league: "2nd Division - Vietnam", home: "Phu Dong FC", away: "Tre Bd Ha Noi", homeScore: 1, awayScore: 0, statusText: "Halftime", odds: ["1.65", "3.15", "5.40"], suspended: false },
  { id: "live-soc-2", league: "Premier League - Russia", home: "FK Akron Tolyatti", away: "FK Rostov", homeScore: null, awayScore: null, statusText: "Not started", odds: ["3.15", "3.20", "2.20"], suspended: false },
  { id: "live-soc-3", league: "Premier League SRL", home: "Tottenham Hotspur SRL", away: "Chelsea SRL", homeScore: 0, awayScore: 1, statusText: "2H-45'", odds: ["5.10", "3.30", "1.70"], suspended: false },
];

const LIVE_TENNIS: LiveRacketMatch[] = [
  { id: "live-ten-1", league: "WTA Rome, Italy Women Singles", playerA: { name: "Cirstea, Sorana", flag: "🇷🇴" }, playerB: { name: "Noskova, Linda", flag: "🇨🇿" }, scoreA: "1", scoreB: "0", statusText: "2-1 : 0-0", spreadOdds: ["-6.5/1.90", "+6.5/1.80"], moneylineOdds: ["1.04", "8.50"], totalOdds: ["O 17.5/1.75", "U 17.5/1.95"], suspended: false },
  { id: "live-ten-2", league: "WTA Rome, Italy Women Doubles", playerA: { name: "Bucsa C / Melichar-Ma...", flag: "🇪🇸" }, playerB: { name: "Maleckova J / Skoch M", flag: "🇨🇿" }, scoreA: "1", scoreB: "0", statusText: "2-2 : 15-15", spreadOdds: null, moneylineOdds: ["1.08", "6.50"], totalOdds: ["O 18.5/2.55", "U 18.5/1.45"], suspended: true },
];

const LIVE_TABLE_TENNIS: LiveRacketMatch[] = [
  { id: "live-tt-1", league: "TT Cup - International", playerA: { name: "Krenek, Tomas", flag: "🇨🇿" }, playerB: { name: "Benes, Radek", flag: "🇨🇿" }, scoreA: "2", scoreB: "2", statusText: "7-6", spreadOdds: null, moneylineOdds: null, totalOdds: ["O 97.5/1.50", "U 97.5/2.35"], suspended: true },
  { id: "live-tt-2", league: "TT Cup - International", playerA: { name: "Stapor, Dawid", flag: "🇵🇱" }, playerB: { name: "Wloszek, Sylwester", flag: "🇵🇱" }, scoreA: "0", scoreB: "0", statusText: "3-2", spreadOdds: ["-3.5/1.80", "+3.5/1.90"], moneylineOdds: ["1.57", "2.25"], totalOdds: null, suspended: false, lockedColumns: ["total"] },
];

/* ─── WEB VERSION ─────────────────────────────────────────────────────── */

const WebPreview = React.memo(function WebPreview({ appName, logoUrl, currencySymbol, clientId }: { appName: string; logoUrl?: string | null; currencySymbol?: string; clientId?: string }) {
  const { strings: rawStrings, palette, previewFocusField, sportCategories } = useStudio();
  const activeSports = sportCategories.filter(s => s.enabled).map(s => ({ name: s.name, count: s.count, flag: s.emoji }));
  const isKMK = clientId === KMK_CLIENT_ID;
  const strings = isKMK ? { ...rawStrings, ...MYBET_STRINGS_OVERRIDES } : rawStrings;
  const effectiveMatches = isKMK ? MYBET_MATCHES : MATCHES;
  const effectiveLiveUpcoming = isKMK ? MYBET_LIVE_UPCOMING : LIVE_UPCOMING;
  const effectiveBetSlips = isKMK ? MYBET_BET_SLIPS : BET_SLIPS;
  const effectiveLeagueTabs = isKMK ? MYBET_LEAGUE_TABS : LEAGUE_TABS;
  const effectiveCurrencySymbol = isKMK ? "GH₵" : (currencySymbol ?? "₦");
  const effectiveCurrencyName = isKMK ? "Ghana Cedi" : "Naira";
  const effectiveAppName = isKMK ? "MyBet.Africa" : appName;
  const [activeNav, setActiveNav] = useState(1); // 0=Feed, 1=Sports, 2=Discovery, 3=Casino, 4=P2P
  const [activeSportSidebar, setActiveSportSidebar] = useState(0);
  const [activeSoccerTab, setActiveSoccerTab] = useState(0);
  const [activeLeague, setActiveLeague] = useState(0);
  const [activeBetType, setActiveBetType] = useState(0);
  const [activeSportRow, setActiveSportRow] = useState(0);
  const [webMyBetsMainTab, setWebMyBetsMainTab] = useState(0); // 0=My Bets, 1=My Feed
  const [webMyBetsFilter, setWebMyBetsFilter] = useState(0); // 0=All, 1=Pending, 2=Settled, 3=P2P
  const [webFeedTab, setWebFeedTab] = useState(0); // 0=Friends, 1=Explore
  const [matchDiscoveryBannerDismissed, setMatchDiscoveryBannerDismissed] = useState(false);
  const [sportsViewMode, setSportsViewMode] = useState<"main" | "schedule" | "detail" | "live">("main");
  const [liveActiveSportTab, setLiveActiveSportTab] = useState(0); // 0=Soccer, 1=Table Tennis, 2=Tennis
  const [selectedSportSchedule, setSelectedSportSchedule] = useState<"nba" | "football" | "tennis">("football");
  const [selectedMatchId, setSelectedMatchId] = useState<{ id: string; home: string; away: string; date: string; league: string; odds: string[] } | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [profileMainTab, setProfileMainTab] = useState(0); // 0=My Bets, 1=My Feed
  const [profileBetsFilter, setProfileBetsFilter] = useState(0); // 0=All, 1=Pending, 2=Settled, 3=P2P

  // Auto-navigate preview to relevant view when Quick Edit field is focused
  useEffect(() => {
    if (!previewFocusField) return;
    const WEB_FIELD_TO_NAV: Record<string, number> = {
      primary: 1, primaryButton: 1,       activeSecondaryGradientColor: 1, dark: 1, darkContainerBackground: 1,
      lightTextColor: 1, textSecondaryColor: 1, wonColor: 1, lostColor: 1,
      payoutWonColor: 1, borderAndGradientBg: 1, inactiveButtonBg: 1,
      inactiveTabUnderline: 1, boxGradientColorStart: 1, boxGradientColorEnd: 1,
      primaryBackgroundColor: 0, navbarLabel: 0,       secondary: 1, modalBackground: 1,
    };
    // Don't navigate for locked background fields
    const LOCKED = new Set(["primaryBackgroundColor","dark","darkContainerBackground","modalBackground"]);
    if (LOCKED.has(previewFocusField)) return;
    const nav = WEB_FIELD_TO_NAV[previewFocusField];
    if (nav !== undefined) { setActiveNav(nav); setSportsViewMode("main"); }
  }, [previewFocusField]);

  const statusLabel = (s: string) =>
    s === "WON" ? strings.STATUS_WON
    : s === "LOST" ? strings.STATUS_LOST
    : strings.STATUS_PENDING;

  const NAV = [
    { icon: Home, label: strings.FEED },
    { icon: Trophy, label: strings.SPORTSBOOK },
    { icon: Compass, label: strings.DISCOVERY },
    { icon: Gamepad2, label: strings.CASINO },
    { icon: Swords, label: strings.PEER_TO_PEER_NAV },
  ];

  /* Right panel - BetCorrect "My Bets Panel" */
  const renderRightPanel = () => {
    const rightBets = [
      {
        kind: "simple" as const,
        score: "1:2",
        odds: "2.70",
        market: "Correct match score",
        status: "LOST" as const,
        stake: "200",
        payout: "0",
        home: "1win",
        away: "Team Nemesis",
        date: "7 MAY",
        time: "2:04 PM",
        id: "b982857c-8dc6-4d57-97f8...",
        timestamp: "5/7/2026, 4:45:45 PM",
      },
      {
        kind: "basketball" as const,
        score: "Detroit Pistons (...",
        odds: "2.01",
        market: "1st half · handicap",
        status: "WON" as const,
        stake: "1000",
        payout: "2010",
        rows: [
          { team: "Orlando Magic",   q: [22, 27, 15, 30, 94] },
          { team: "Detroit Pistons", q: [20, 40, 23, 33, 116] },
        ],
        id: "09df0304-3c54-4ebd...",
        timestamp: "5/2/2026, 8:11:23 PM",
      },
      {
        kind: "multi" as const,
        score: "19 Leg ...",
        odds: "Multi Odds",
        market: "draw · 4.20",
        marketSub: "1x2",
        status: "PENDING" as const,
        stake: "",
        payout: "",
        legs: [
          { home: "Arsenal FC",     homeScores: [1, 0, 1], away: "Atletico Madrid", awayScores: [0, 0, 0] },
        ],
        id: "",
        timestamp: "",
        rows: undefined as undefined | { team: string; q: number[] }[],
        home: undefined as string | undefined,
        away: undefined as string | undefined,
        date: undefined as string | undefined,
        time: undefined as string | undefined,
      },
      {
        kind: "basketball" as const,
        score: "Orlando Magic",
        odds: "5.20",
        market: "Winner (incl. overtime)",
        status: "LOST" as const,
        stake: "",
        payout: "",
        rows: [
          { team: "Orlando Magic",   q: [26, 34, 19, 30, 10] },
          { team: "Detroit Pistons", q: [0, 0, 0, 0, 0] },
        ],
        id: "",
        timestamp: "",
      },
    ];

    const statusBadge = (status: "WON" | "LOST" | "PENDING") => {
      const styles: Record<string, React.CSSProperties> = {
        WON:     { background: "var(--p-won-color)",  color: "rgba(0,0,0,0.85)", border: "none" },
        LOST:    { background: "var(--p-lost-color)", color: "rgba(255,255,255,0.93)", border: "none" },
        PENDING: { background: "transparent", border: "1px solid var(--p-primary)", color: "var(--p-primary)" },
      };
      return (
        <span
          className="text-[8px] font-bold px-2 py-0.5 rounded flex-shrink-0"
          style={styles[status] ?? styles.PENDING}
        >
          {status}
        </span>
      );
    };

    const filtered = webMyBetsFilter === 0 ? rightBets
      : webMyBetsFilter === 1 ? rightBets.filter(b => b.status === "PENDING")
      : webMyBetsFilter === 2 ? rightBets.filter(b => b.status === "WON" || b.status === "LOST")
      : [];

    return (
      <aside
        className="w-[290px] border-l flex flex-col flex-shrink-0"
        style={{ borderColor: "var(--p-border-and-gradient-bg)", background: "var(--p-dark)" }}
      >
        {/* Header */}
        <div
          className="px-3 py-2 border-b flex-shrink-0"
          style={{ borderColor: "var(--p-border-and-gradient-bg)" }}
        >
          <div className="text-[12px] font-bold" style={{ color: "var(--p-light-text-color)" }}>
            My Bets Panel
          </div>
        </div>

        {/* Tabs */}
        <div
          className="flex border-b flex-shrink-0"
          style={{ borderColor: "var(--p-border-and-gradient-bg)" }}
        >
          {["All", "PENDING", "Settled", "P2P Bets"].map((t, i) => (
            <button
              key={t}
              onClick={() => setWebMyBetsFilter(i)}
              className="flex-1 h-8 relative text-[8.5px] font-semibold"
              style={{ color: webMyBetsFilter === i ? "var(--p-light-text-color)" : "var(--p-text-secondary-color)" }}
            >
              {t}
              {webMyBetsFilter === i && (
                <span
                  className="absolute bottom-0 left-1 right-1 h-[2px] rounded-full"
                  style={{ background: "var(--p-primary)" }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Bet cards */}
        <div className="flex-1 overflow-auto px-2 py-2 space-y-2">
          {filtered.length === 0 && webMyBetsFilter === 3 && (
            <div className="text-center py-6 text-[9px]" style={{ color: "var(--p-text-secondary-color)" }}>
              {strings.NO_P2P_BETS}
            </div>
          )}
          {filtered.map((b, idx) => {
            const statusC = b.status === "WON" ? "var(--p-won-color)" : b.status === "LOST" ? "var(--p-lost-color)" : "var(--p-primary)";
            return (
              <div
                key={idx}
                className="rounded-lg overflow-hidden"
                style={{ background: "var(--p-modal-background)", border: "1px solid var(--p-border-and-gradient-bg)" }}
              >
                <div className="p-2.5">
                  {/* Score + odds + status */}
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[10px] font-bold" style={{ color: "var(--p-light-text-color)" }}>{b.score}</span>
                        {b.kind !== "multi" && (
                          <>
                            <span className="text-[9px]" style={{ color: "var(--p-text-secondary-color)" }}>|</span>
                            <span className="text-[10px] font-bold" style={{ color: "var(--p-primary)" }}>{b.odds}</span>
                          </>
                        )}
                        {b.kind === "multi" && (
                          <span className="text-[9px] font-bold" style={{ color: "var(--p-primary)" }}>| {b.odds}</span>
                        )}
                      </div>
                      <div className="text-[8.5px] mt-0.5" style={{ color: statusC }}>{b.market}</div>
                      {(b as any).marketSub && (
                        <div className="text-[8px]" style={{ color: "var(--p-text-secondary-color)" }}>{(b as any).marketSub}</div>
                      )}
                    </div>
                    {statusBadge(b.status)}
                  </div>

                  {/* Stake / payout */}
                  {b.stake && (
                    <div
                      className="flex items-center justify-between text-[8.5px] py-1.5 border-y"
                      style={{ borderColor: "var(--p-border-and-gradient-bg)" }}
                    >
                      <span style={{ color: "var(--p-text-secondary-color)" }}>STAKE</span>
                      <span className="font-bold" style={{ color: "var(--p-light-text-color)" }}>
                        {effectiveCurrencySymbol} {b.stake}
                      </span>
                      <span style={{ color: "var(--p-text-secondary-color)" }}>|</span>
                      <span className="font-bold" style={{ color: b.status === "WON" ? "var(--p-won-color)" : "var(--p-light-text-color)" }}>
                        {effectiveCurrencySymbol} {b.payout}
                      </span>
                      <span style={{ color: "var(--p-text-secondary-color)" }}>PAYOUT</span>
                    </div>
                  )}

                  {/* Simple bet — home/away team row */}
                  {b.kind === "simple" && (b as any).home && (
                    <div className="flex items-center justify-between mt-2 text-[8px]">
                      <div className="flex items-center gap-1 min-w-0">
                        <div className="h-5 w-5 rounded-full grid place-items-center flex-shrink-0" style={{ background: "var(--p-inactive-button-bg)" }}>
                          <CircleDot className="h-2.5 w-2.5" style={{ color: "var(--p-text-secondary-color)" }} />
                        </div>
                        <span className="truncate" style={{ color: "var(--p-light-text-color)" }}>{(b as any).home}</span>
                      </div>
                      <div className="text-center flex-shrink-0 mx-1">
                        <div className="font-bold" style={{ color: "var(--p-primary)" }}>{(b as any).date}</div>
                        <div style={{ color: "var(--p-text-secondary-color)" }}>{(b as any).time}</div>
                      </div>
                      <div className="flex items-center gap-1 min-w-0 justify-end">
                        <span className="truncate" style={{ color: "var(--p-light-text-color)" }}>{(b as any).away}</span>
                        <div className="h-5 w-5 rounded-full grid place-items-center flex-shrink-0" style={{ background: "var(--p-inactive-button-bg)" }}>
                          <CircleDot className="h-2.5 w-2.5" style={{ color: "var(--p-text-secondary-color)" }} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Basketball quarter grid */}
                  {b.kind === "basketball" && (b as any).rows && (
                    <div className="mt-2">
                      <div
                        className="grid text-[7.5px] gap-x-0.5 mb-0.5"
                        style={{ gridTemplateColumns: "1fr repeat(5, 22px)", color: "var(--p-text-secondary-color)" }}
                      >
                        <span />
                        {["1","2","3","4","T"].map(q => (
                          <span key={q} className="text-center font-semibold">{q}</span>
                        ))}
                      </div>
                      {(b as any).rows.map((row: { team: string; q: number[] }) => (
                        <div
                          key={row.team}
                          className="grid items-center gap-x-0.5 py-0.5"
                          style={{ gridTemplateColumns: "1fr repeat(5, 22px)" }}
                        >
                          <div className="flex items-center gap-1 min-w-0">
                            <TeamDot label={row.team} size={13} />
                            <span className="text-[8px] font-semibold truncate" style={{ color: "var(--p-light-text-color)" }}>
                              {row.team}
                            </span>
                          </div>
                          {row.q.map((n, qi) => (
                            <span
                              key={qi}
                              className="text-center text-[8px]"
                              style={{
                                color: qi === row.q.length - 1 ? "var(--p-light-text-color)" : "var(--p-text-secondary-color)",
                                fontWeight: qi === row.q.length - 1 ? 700 : 400,
                              }}
                            >
                              {n || ""}
                            </span>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Multi-leg bet legs */}
                  {b.kind === "multi" && (b as any).legs && (
                    <div className="mt-2 space-y-1">
                      {(b as any).legs.map((leg: any, li: number) => (
                        <div key={li} className="rounded p-1.5" style={{ background: "var(--p-dark)" }}>
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1 min-w-0">
                              <TeamDot label={leg.home} size={12} />
                              <span className="text-[8px] font-semibold truncate" style={{ color: "var(--p-light-text-color)" }}>{leg.home}</span>
                            </div>
                            {leg.homeScores && (
                              <div className="flex gap-1 text-[7.5px] font-semibold flex-shrink-0" style={{ color: "var(--p-text-secondary-color)" }}>
                                {leg.homeScores.map((s: number, si: number) => <span key={si}>{s}</span>)}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-1 mt-0.5">
                            <div className="flex items-center gap-1 min-w-0">
                              <TeamDot label={leg.away} size={12} />
                              <span className="text-[8px] font-semibold truncate" style={{ color: "var(--p-light-text-color)" }}>{leg.away}</span>
                            </div>
                            {leg.awayScores && (
                              <div className="flex gap-1 text-[7.5px] font-semibold flex-shrink-0" style={{ color: "var(--p-text-secondary-color)" }}>
                                {leg.awayScores.map((s: number, si: number) => <span key={si}>{s}</span>)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ID + timestamp */}
                  {(b as any).id && (
                    <div
                      className="flex items-center justify-between mt-2 pt-1.5 border-t text-[7px]"
                      style={{ borderColor: "var(--p-border-and-gradient-bg)", color: "var(--p-text-secondary-color)" }}
                    >
                      <span className="font-mono truncate max-w-[120px]">{(b as any).id}</span>
                      <span className="flex-shrink-0 ml-1">{(b as any).timestamp}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </aside>
    );
  };

  /* Empty betslip panel — used for Feed/Discovery views */
  const renderBetslipPanel = () => {
    const primaryText = pickContrastText(palette.primary);
    return (
      <aside
        className="w-[230px] border-l flex flex-col flex-shrink-0"
        style={{ borderColor: "var(--p-border-and-gradient-bg)", background: "var(--p-dark)" }}
      >
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-5 py-8">
          <div
            className="h-11 w-11 rounded-full grid place-items-center"
            style={{ background: "color-mix(in oklab, var(--p-primary) 15%, transparent)" }}
          >
            <Zap className="h-5 w-5" style={{ color: "var(--p-primary)" }} />
          </div>
          <div
            className="text-[12px] font-semibold text-center"
            style={{ color: "var(--p-light-text-color)" }}
          >
            Betslip is empty
          </div>
          <button
            onClick={() => setActiveNav(1)}
            className="w-full h-10 rounded-lg text-[12px] font-bold"
            style={{ background: "var(--p-primary)", color: primaryText }}
          >
            Make Bets
          </button>
        </div>
      </aside>
    );
  };

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
                          {effectiveCurrencySymbol}{post.stake}
                        </span>
                      </div>
                      <div className="text-[8.5px]">
                        <span style={{ color: "var(--p-text-secondary-color)" }}>{strings.PAYOUT} </span>
                        <span className="font-bold" style={{ color: "var(--p-light-text-color)" }}>
                          {effectiveCurrencySymbol}{post.payout}
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
        {renderBetslipPanel()}
      </div>
    );
  };


  const renderSportsSidebar = () => {
    const sportIcons: Record<string, { color: string; emoji: string }> = {
      [strings.SOCCER]:            { color: "#22c55e", emoji: "⚽" },
      [strings.BASKETBALL]:        { color: "#f97316", emoji: "🏀" },
      [strings.TENNIS]:            { color: "#84cc16", emoji: "🎾" },
      [strings.VOLLEYBALL]:        { color: "#a855f7", emoji: "🏐" },
      [strings.TABLE_TENNIS]:      { color: "#06b6d4", emoji: "🏓" },
      [strings.ICE_HOCKEY]:        { color: "#60a5fa", emoji: "🏒" },
      [strings.AMERICAN_FOOTBALL]: { color: "#d97706", emoji: "🏈" },
      [strings.RUGBY]:             { color: "#ef4444", emoji: "🏉" },
      "Golf":                      { color: "#34d399", emoji: "⛳" },
      "Darts":                     { color: "#f43f5e", emoji: "🎯" },
      "Boxing":                    { color: "#e11d48", emoji: "🥊" },
      "Cricket":                   { color: "#eab308", emoji: "🏏" },
      "Baseball":                  { color: "#0ea5e9", emoji: "⚾" },
    };

    return (
      <aside
        className="w-[250px] border-r flex flex-col flex-shrink-0"
        style={{ borderColor: "var(--p-border-and-gradient-bg)", background: "var(--p-dark)" }}
      >
        <div className="px-3 py-2.5">
          <div
            className="flex items-center gap-2 px-2.5 h-8 rounded-md"
            style={{
              background: "var(--p-dark-container-background)",
              border: "1px solid var(--p-border-and-gradient-bg)",
            }}
          >
            <Search className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "var(--p-text-secondary-color)" }} />
            <span className="text-[10px]" style={{ color: "var(--p-text-secondary-color)" }}>
              {strings.SEARCH}
            </span>
          </div>
        </div>
        <div
          className="px-3 pb-1.5 text-[10px] font-bold"
          style={{ color: "var(--p-light-text-color)" }}
        >
          {strings.ALL_SPORTS}
        </div>
        <div className="flex-1 overflow-auto px-2 pb-2">
          {activeSports.map((s, i) => {
            const active = activeSportSidebar === i;
            const icon = sportIcons[s.name] ?? { color: "var(--p-primary)", emoji: "🏆" };
            return (
              <button
                key={s.name}
                onClick={() => {
                  setActiveSportSidebar(i);
                  if (s.name === strings.BASKETBALL) {
                    setSelectedSportSchedule("nba");
                    setSportsViewMode("schedule");
                  } else if (s.name === strings.SOCCER) {
                    setSelectedSportSchedule("football");
                    setSportsViewMode("schedule");
                  } else if (s.name === strings.TENNIS) {
                    setSelectedSportSchedule("tennis");
                    setSportsViewMode("schedule");
                  }
                }}
                className="w-full flex items-center gap-2.5 px-2 h-9 rounded-md mb-0.5 text-left transition-colors"
                style={{
                  background: active ? "color-mix(in oklab, var(--p-primary) 12%, transparent)" : "transparent",
                }}
              >
                <span
                  className="h-6 w-6 rounded-full grid place-items-center flex-shrink-0 text-[13px]"
                  style={{
                    background: active ? icon.color : `${icon.color}28`,
                    boxShadow: active ? `0 0 0 1px ${icon.color}60` : "none",
                  }}
                >
                  {icon.emoji}
                </span>
                <span
                  className="flex-1 text-[11px] font-medium"
                  style={{ color: active ? "var(--p-light-text-color)" : "var(--p-light-text-color)" }}
                >
                  {s.name}
                </span>
                <span
                  className="text-[10px] font-semibold"
                  style={{ color: "var(--p-text-secondary-color)" }}
                >
                  {s.count}
                </span>
                <ChevronDown
                  className="h-3 w-3 flex-shrink-0"
                  style={{ color: "var(--p-text-secondary-color)" }}
                />
              </button>
            );
          })}
        </div>
      </aside>
    );
  };

  /* Live view helper components */
  const LockIcon = () => (
    <svg viewBox="0 0 24 24" width="12" height="12" style={{ flexShrink: 0 }}>
      <path d="M12 17a2 2 0 100-4 2 2 0 000 4zm6-6V8a6 6 0 10-12 0v3H4v11h16V11h-2zm-9-3a3 3 0 116 0v3H9V8z" fill="var(--p-suspended-odds-lock-color, var(--p-text-secondary-color))" />
    </svg>
  );

  const LivePill = ({ statusText }: { statusText: string }) => (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 5px", borderRadius: 3, background: "color-mix(in oklab, var(--p-live-pill-bg, var(--p-primary)) 14%, transparent)", border: "1px solid var(--p-live-pill-border, var(--p-primary))", fontSize: 7.5, fontWeight: 700 }}>
      <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--p-live-pill-dot, var(--p-primary))", flexShrink: 0 }} />
      <span style={{ color: "var(--p-live-pill-text, var(--p-primary))" }}>LIVE</span>
      <span style={{ color: "var(--p-light-text-color)", fontWeight: 600 }}>{statusText}</span>
    </div>
  );

  const OddsBtn = ({ label, suspended }: { label: string; suspended: boolean }) => (
    suspended ? (
      <div className="flex items-center justify-center rounded" style={{ minWidth: 40, height: 22, background: "var(--p-suspended-odds-bg, var(--p-dark-container-background))", border: "1px solid var(--p-border-and-gradient-bg)" }}>
        <LockIcon />
      </div>
    ) : (
      <button className="rounded text-[8px] font-bold" style={{ minWidth: 40, height: 22, background: "var(--p-dark-container-background)", border: "1px solid var(--p-border-and-gradient-bg)", color: "var(--p-primary)" }}>
        {label}
      </button>
    )
  );

  const renderLiveView = () => {
    const SPORT_TABS = [
      { label: `Soccer (${LIVE_SOCCER.length})`, data: LIVE_SOCCER, type: "soccer" as const },
      { label: `Table Tennis (${LIVE_TABLE_TENNIS.length})`, data: LIVE_TABLE_TENNIS, type: "racket" as const },
      { label: `Tennis (${LIVE_TENNIS.length})`, data: LIVE_TENNIS, type: "racket" as const },
    ];
    const activeTab = SPORT_TABS[liveActiveSportTab];

    return (
      <div className="flex-1 min-h-0 flex">
        {renderSportsSidebar()}
        <main className="flex-1 min-w-0 overflow-auto">
          <div className="px-3 py-2">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <button onClick={() => setSportsViewMode("main")} className="flex items-center gap-1 text-[9px]" style={{ color: "var(--p-text-secondary-color)" }}>
                  <ChevronLeft className="h-3 w-3" /> Back
                </button>
                <div className="flex items-center gap-1.5">
                  <Radio className="h-4 w-4" style={{ color: "var(--p-primary)" }} />
                  <span className="text-[16px] font-black" style={{ color: "var(--p-primary)" }}>Live</span>
                </div>
              </div>
              <button className="flex items-center gap-1 text-[9px] px-2 py-1 rounded" style={{ background: "var(--p-dark-container-background)", border: "1px solid var(--p-border-and-gradient-bg)", color: "var(--p-text-secondary-color)" }}>
                <Filter className="h-3 w-3" /> Filter
              </button>
            </div>

            {/* Sport tabs */}
            <div className="flex gap-0 mb-3 border-b" style={{ borderColor: "var(--p-border-and-gradient-bg)" }}>
              {SPORT_TABS.map((tab, i) => (
                <button
                  key={tab.label}
                  onClick={() => setLiveActiveSportTab(i)}
                  className="px-3 h-8 text-[9px] font-semibold relative flex-shrink-0"
                  style={{ color: liveActiveSportTab === i ? "var(--p-primary)" : "var(--p-text-secondary-color)" }}
                >
                  {tab.label}
                  {liveActiveSportTab === i && <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full" style={{ background: "var(--p-primary)" }} />}
                </button>
              ))}
            </div>

            {/* League blocks */}
            {activeTab.type === "soccer" ? (
              (activeTab.data as LiveSoccerMatch[]).map((m) => (
                <div key={m.id} className="mb-3 rounded-md overflow-hidden" style={{ border: "1px solid var(--p-border-and-gradient-bg)" }}>
                  {/* League header */}
                  <div className="flex items-center justify-between px-2 py-1.5" style={{ background: "var(--p-dark-container-background)" }}>
                    <div className="flex items-center gap-1.5">
                      <Volleyball className="h-3 w-3" style={{ color: "var(--p-primary)" }} />
                      <span className="text-[8.5px] font-semibold" style={{ color: "var(--p-light-text-color)" }}>{m.league}</span>
                    </div>
                    <span className="text-[8px] font-bold" style={{ color: "var(--p-primary)" }}>SEE MORE →</span>
                  </div>
                  {/* Sub-tabs */}
                  <div className="flex gap-0 px-2 py-1" style={{ borderBottom: "1px solid var(--p-border-and-gradient-bg)" }}>
                    {["Games", "Spreads", "Totals"].map((st, si) => (
                      <span key={st} className="text-[8px] px-2 py-0.5 rounded-sm font-semibold" style={{ background: si === 0 ? "var(--p-active-secondary-gradient-color)" : "transparent", color: si === 0 ? "var(--p-primary)" : "var(--p-text-secondary-color)" }}>{st}</span>
                    ))}
                  </div>
                  {/* Match card */}
                  <div className="px-2 py-2" style={{ background: "var(--p-modal-background)" }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <LivePill statusText={m.statusText} />
                        <div className="mt-1.5 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <TeamDot label={m.home} />
                            <span className="text-[9px] font-medium" style={{ color: "var(--p-light-text-color)" }}>{m.home}</span>
                            {m.homeScore !== null && <span className="ml-auto text-[9px] font-bold" style={{ color: "var(--p-live-score-color, var(--p-primary))" }}>{m.homeScore}</span>}
                          </div>
                          {m.away && (
                            <div className="flex items-center gap-1.5">
                              <TeamDot label={m.away} />
                              <span className="text-[9px] font-medium" style={{ color: "var(--p-light-text-color)" }}>{m.away}</span>
                              {m.awayScore !== null && <span className="ml-auto text-[9px] font-bold" style={{ color: "var(--p-live-score-color, var(--p-primary))" }}>{m.awayScore}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        {m.odds.map((o, j) => <OddsBtn key={j} label={o} suspended={m.suspended} />)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-1.5" style={{ borderTop: "1px solid var(--p-border-and-gradient-bg)" }}>
                      <span className="text-[8px] font-semibold" style={{ color: "var(--p-primary)" }}>STATS</span>
                      <span className="text-[8px] font-semibold" style={{ color: "var(--p-primary)" }}>MORE BETS +</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              (activeTab.data as LiveRacketMatch[]).map((m) => (
                <div key={m.id} className="mb-3 rounded-md overflow-hidden" style={{ border: "1px solid var(--p-border-and-gradient-bg)" }}>
                  {/* League header */}
                  <div className="flex items-center justify-between px-2 py-1.5" style={{ background: "var(--p-dark-container-background)" }}>
                    <div className="flex items-center gap-1.5">
                      <Target className="h-3 w-3" style={{ color: "var(--p-primary)" }} />
                      <span className="text-[8.5px] font-semibold" style={{ color: "var(--p-light-text-color)" }}>{m.league}</span>
                    </div>
                    <span className="text-[8px] font-bold" style={{ color: "var(--p-primary)" }}>SEE MORE →</span>
                  </div>
                  {/* Sub-tabs */}
                  <div className="flex gap-0 px-2 py-1" style={{ borderBottom: "1px solid var(--p-border-and-gradient-bg)" }}>
                    {["Games", "Spreads", "Totals"].map((st, si) => (
                      <span key={st} className="text-[8px] px-2 py-0.5 rounded-sm font-semibold" style={{ background: si === 0 ? "var(--p-active-secondary-gradient-color)" : "transparent", color: si === 0 ? "var(--p-primary)" : "var(--p-text-secondary-color)" }}>{st}</span>
                    ))}
                  </div>
                  {/* Match card */}
                  <div className="px-2 py-2" style={{ background: "var(--p-modal-background)" }}>
                    {/* Column headers */}
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex-1" />
                      <div className="flex gap-1 text-[7.5px] font-bold" style={{ color: "var(--p-text-secondary-color)" }}>
                        <span style={{ minWidth: 50, textAlign: "center" }}>Spread</span>
                        <span style={{ minWidth: 50, textAlign: "center" }}>Moneyline</span>
                        <span style={{ minWidth: 50, textAlign: "center" }}>Total</span>
                      </div>
                    </div>
                    <LivePill statusText={m.statusText} />
                    {/* Player rows */}
                    {[{ player: m.playerA, score: m.scoreA }, { player: m.playerB, score: m.scoreB }].map((row, ri) => (
                      <div key={ri} className="flex items-center justify-between mt-1.5">
                        <div className="flex items-center gap-1 flex-1 min-w-0">
                          <span className="text-[11px]">{row.player.flag}</span>
                          <span className="text-[8.5px] font-medium truncate" style={{ color: "var(--p-light-text-color)" }}>{row.player.name}</span>
                          <span className="ml-auto text-[9px] font-bold flex-shrink-0 mr-2" style={{ color: "var(--p-live-score-color, var(--p-primary))" }}>{row.score}</span>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          {/* Spread */}
                          <OddsBtn label={m.spreadOdds?.[ri] ?? "—"} suspended={m.suspended || !m.spreadOdds || (m.lockedColumns?.includes("spread") ?? false)} />
                          {/* Moneyline */}
                          <OddsBtn label={m.moneylineOdds?.[ri] ?? "—"} suspended={m.suspended || !m.moneylineOdds || (m.lockedColumns?.includes("moneyline") ?? false)} />
                          {/* Total */}
                          <OddsBtn label={m.totalOdds?.[ri] ?? "—"} suspended={m.suspended || !m.totalOdds || (m.lockedColumns?.includes("total") ?? false)} />
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center justify-between mt-2 pt-1.5" style={{ borderTop: "1px solid var(--p-border-and-gradient-bg)" }}>
                      <span className="text-[8px] font-semibold" style={{ color: "var(--p-primary)" }}>STATS</span>
                      <span className="text-[8px] font-semibold" style={{ color: "var(--p-primary)" }}>MORE BETS +</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
        {renderRightPanel()}
      </div>
    );
  };

  /* Sports view (nav index 1) - 3-column layout */
  const renderSportsView = () => {
    if (sportsViewMode === "live") return renderLiveView();

    if (sportsViewMode === "schedule") {
      return (
        <div className="flex-1 min-h-0 flex">
          {renderSportsSidebar()}
          <SportsListing
            sport={selectedSportSchedule}
            onMatchClick={(id, home, away, date, league, odds) => {
              if (selectedSportSchedule === "tennis") return;
              setSelectedMatchId({ id, home: home ?? "Home", away: away ?? "Away", date: date ?? "TOMORROW", league: league ?? "Premier League", odds: odds ?? ["1.80", "3.50", "4.00"] });
              setSportsViewMode("detail");
            }}
            onBack={() => setSportsViewMode("main")}
            palette={palette}
            strings={strings}
            pickContrastText={pickContrastText}
            TeamDot={TeamDot}
          />
          {renderRightPanel()}
        </div>
      );
    }

    if (sportsViewMode === "detail" && selectedMatchId && (selectedSportSchedule === "nba" || selectedSportSchedule === "football")) {
      return (
        <div className="flex-1 min-h-0 flex">
          {renderSportsSidebar()}
          <GameDetail
            matchId={selectedMatchId.id}
            matchData={selectedMatchId}
            sport={selectedSportSchedule as "nba" | "football"}
            onBack={() => setSportsViewMode("schedule")}
            palette={palette}
            strings={strings}
            pickContrastText={pickContrastText}
            TeamDot={TeamDot}
          />
          {renderRightPanel()}
        </div>
      );
    }

    return (
    <div className="flex-1 min-h-0 flex">
      {renderSportsSidebar()}

      {/* Center content */}
      <main className="flex-1 min-w-0 overflow-auto">
        <div className="px-3 py-2">
          {/* Quick tiles - BetCorrect style */}
          <div className="flex gap-2 mb-3">
            {QUICK_TILE_ICONS.map((t) => {
              const Icon = t.icon;
              const active = activeNav === t.nav && !(t.strKey === "TILE_LIVE_SPORTS" && (sportsViewMode as string) !== "live");
              return (
                <button
                  key={t.strKey}
                  onClick={() => {
                    setActiveNav(t.nav);
                    if (t.strKey === "TILE_LIVE_SPORTS") setSportsViewMode("live");
                  }}
                  className="flex flex-col items-center justify-center gap-1.5 w-[68px] h-[68px] rounded-xl flex-shrink-0 transition-all"
                  style={{
                    background: "var(--p-dark)",
                    border: active ? "1.5px solid var(--p-primary)" : "1px solid var(--p-border-and-gradient-bg)",
                  }}
                >
                  <span
                    className="h-8 w-8 rounded-full grid place-items-center"
                    style={{
                      background: active
                        ? "color-mix(in oklab, var(--p-primary) 20%, transparent)"
                        : "var(--p-dark-container-background)",
                    }}
                  >
                    <Icon
                      className="h-4 w-4"
                      style={{ color: active ? "var(--p-primary)" : "var(--p-light-text-color)" }}
                    />
                  </span>
                  <span
                    className="text-[8px] font-medium text-center leading-tight px-1"
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
              onClick={() => { setActiveNav(1); setSportsViewMode("main"); }}
              className="h-9 rounded-md flex items-center gap-2 px-3 text-[10px] font-bold"
              style={{
                background: "var(--p-dark)",
                border: "1px solid var(--p-border-and-gradient-bg)",
                color: "var(--p-light-text-color)",
              }}
            >
              <span
                className="text-[8px] font-black px-1.5 py-0.5 rounded flex-shrink-0"
                style={{ background: "var(--p-primary)", color: pickContrastText(palette.primary) }}
              >
                SGP
              </span>
              <span className="flex-1 text-center">{strings.BETBUILDER}</span>
            </button>
            <button
              onClick={() => setActiveNav(4)}
              className="h-9 rounded-md flex items-center gap-2 px-3 text-[10px] font-bold"
              style={{
                background: "var(--p-dark)",
                border: "1px solid var(--p-border-and-gradient-bg)",
                color: "var(--p-light-text-color)",
              }}
            >
              <span
                className="text-[8px] font-black px-1.5 py-0.5 rounded flex-shrink-0"
                style={{ background: "var(--p-secondary)", color: pickContrastText(palette.secondary || palette.primary) }}
              >
                VS
              </span>
              <span className="flex-1 text-center">{strings.PEER_TO_PEER_BTN}</span>
            </button>
          </div>

          {/* Welcome Bonus Banner — BetCorrect style */}
          <div
            className="rounded-xl mb-3 relative overflow-hidden flex items-center"
            style={{
              background: `linear-gradient(115deg, var(--p-box-gradient-color-start, color-mix(in oklab, var(--p-primary) 80%, black)) 0%, color-mix(in oklab, var(--p-primary) 50%, black) 60%, color-mix(in oklab, var(--p-box-gradient-color-end, var(--p-secondary)) 60%, black) 100%)`,
              minHeight: 72,
            }}
          >
            <div className="px-4 py-3 flex-1 min-w-0">
              <div
                className="text-[8px] font-bold tracking-wider mb-0.5 opacity-80"
                style={{ color: pickContrastText(palette.primaryButton) }}
              >
                GET A <span className="text-[10px]">100%</span> BONUS ON YOUR
              </div>
              <div
                className="text-[11px] font-black leading-tight"
                style={{ color: pickContrastText(palette.primaryButton) }}
              >
                FIRST DEPOSIT
              </div>
              <div
                className="text-[8px] mt-1 opacity-75"
                style={{ color: pickContrastText(palette.primaryButton) }}
              >
                {strings.WELCOME_BONUS_BODY_WEB}
              </div>
            </div>
            {/* Decorative right area */}
            <div
              className="w-16 h-full flex-shrink-0 flex items-center justify-center opacity-30"
              style={{ fontSize: 36 }}
            >
              🎁
            </div>
          </div>


          {/* Live & upcoming */}
          <div className="text-[12px] font-bold mb-1.5" style={{ color: "var(--p-light-text-color)" }}>
            {strings.LIVE_AND_UPCOMING_GAMES}
          </div>
          <div className="flex gap-1.5 mb-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {[
              { key: "SOCCER" as const, live: true, color: "#ef4444" },
              { key: "BASKETBALL" as const, live: false, color: "" },
              { key: "TENNIS" as const, live: true, color: "#22c55e" },
              { label: strings.TABLE_TENNIS, live: true, color: "#ef4444" },
              { label: strings.VOLLEYBALL, live: false, color: "" },
              { label: "Baseball", live: false, color: "" },
              { label: "Boxing", live: true, color: "#ef4444" },
              { label: strings.RUGBY, live: false, color: "" },
              { label: "Cricket", live: false, color: "" },
              { label: "Darts", live: false, color: "" },
            ].map((tab, i) => {
              const label = (tab as any).key ? strings[(tab as any).key as "SOCCER" | "BASKETBALL" | "TENNIS"] : (tab as any).label;
              const active = activeSportRow === i;
              return (
                <button
                  key={i}
                  onClick={() => setActiveSportRow(i)}
                  className="flex items-center gap-1 px-2.5 h-6 rounded text-[9px] font-semibold flex-shrink-0 whitespace-nowrap"
                  style={{
                    background: active ? "color-mix(in oklab, var(--p-primary) 14%, transparent)" : "transparent",
                    border: active ? "1px solid var(--p-primary)" : "1px solid var(--p-border-and-gradient-bg)",
                    color: active ? "var(--p-light-text-color)" : "var(--p-text-secondary-color)",
                  }}
                >
                  {tab.live && (
                    <span
                      className="h-2 w-2 rounded-full flex-shrink-0"
                      style={{ background: tab.color || "var(--p-lost-color)" }}
                    />
                  )}
                  {label}
                </button>
              );
            })}
          </div>

          {/* Live row */}
          <div className="grid grid-cols-6 gap-1.5 mb-3">
            {effectiveLiveUpcoming.map((m, i) => (
              <div
                key={i}
                className="rounded-md p-1.5"
                style={{ background: "var(--p-dark)", border: "1px solid var(--p-border-and-gradient-bg)" }}
              >
                <LiveDot />
                <div className="flex items-center gap-1 mt-1 truncate" style={{ color: "var(--p-text-secondary-color)" }}>
                  <LeagueLogo label={m.code} size={10} />
                  <span className="text-[8px] truncate">{m.code}</span>
                </div>
                <div className="flex items-center justify-between mt-1 gap-1">
                  <div className="flex items-center gap-1 min-w-0">
                    <TeamDot label={m.home} size={10} />
                    <span className="text-[9px] font-bold truncate" style={{ color: "var(--p-light-text-color)" }}>
                      {m.home}
                    </span>
                  </div>
                  {m.odds && (
                    <span className="text-[8px] flex-shrink-0" style={{ color: "var(--p-text-secondary-color)" }}>
                      {m.odds}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 min-w-0">
                  <TeamDot label={m.away} size={10} />
                  <span className="text-[9px] font-bold truncate" style={{ color: "var(--p-light-text-color)" }}>
                    {m.away}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Sport section tabs */}
          <div
            className="flex border-b mb-2"
            style={{ borderColor: "var(--p-border-and-gradient-bg)" }}
          >
            {["Football", strings.BASKETBALL, strings.TENNIS, "Table Tennis"].map(
              (t, i) => (
                <button
                  key={t}
                  onClick={() => setActiveSoccerTab(i)}
                  className="px-4 h-9 text-[11px] font-semibold relative"
                  style={{
                    color: activeSoccerTab === i ? "var(--p-light-text-color)" : "var(--p-text-secondary-color)",
                  }}
                >
                  {t}
                  {activeSoccerTab === i && (
                    <span
                      className="absolute bottom-0 left-2 right-2 h-[2.5px] rounded-full"
                      style={{ background: "var(--p-primary)" }}
                    />
                  )}
                </button>
              ),
            )}
          </div>

          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span style={{ fontSize: 14 }}>⚽</span>
              <span className="text-[12px] font-bold" style={{ color: "var(--p-light-text-color)" }}>
                Football
              </span>
            </div>
            <button
              onClick={() => { setSelectedSportSchedule("football"); setSportsViewMode("schedule"); }}
              className="text-[9px] font-semibold flex items-center gap-0.5"
              style={{ color: "var(--p-primary)" }}
            >
              {strings.SEE_MORE} <ChevronRight className="h-2.5 w-2.5" />
            </button>
          </div>

          {/* League pills */}
          <div className="flex gap-1.5 mb-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {effectiveLeagueTabs.map((l, i) => (
              <button
                key={l}
                onClick={() => setActiveLeague(i)}
                className="px-2.5 h-7 rounded-full text-[9px] font-semibold flex-shrink-0 inline-flex items-center gap-1.5"
                style={{
                  background: activeLeague === i ? "var(--p-primary)" : "transparent",
                  border: activeLeague === i ? "none" : "1px solid var(--p-border-and-gradient-bg)",
                  color: activeLeague === i ? pickContrastText(palette.primary) : "var(--p-text-secondary-color)",
                }}
              >
                <LeagueLogo label={l} size={13} /> {l}
              </button>
            ))}
          </div>

          {/* Bet type pills */}
          <div className="flex gap-1.5 mb-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {BET_TYPE_TABS.map((b, i) => (
              <button
                key={b}
                onClick={() => setActiveBetType(i)}
                className="px-2.5 h-7 rounded text-[9px] font-semibold flex-shrink-0"
                style={{
                  background: activeBetType === i ? "var(--p-primary)" : "transparent",
                  border: activeBetType === i ? "none" : "1px solid var(--p-border-and-gradient-bg)",
                  color: activeBetType === i ? pickContrastText(palette.primary) : "var(--p-text-secondary-color)",
                }}
              >
                {b}
              </button>
            ))}
          </div>

          {/* Match cards (2-column grid) */}
          <div className="grid grid-cols-2 gap-2">
            {effectiveMatches.map((m, i) => (
              <div
                key={i}
                className="rounded-md p-2.5 cursor-pointer transition-all"
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
                onClick={() => {
                  setSelectedMatchId({
                    id: `web-${i}`,
                    home: m.home,
                    away: m.away,
                    date: m.date,
                    league: isKMK ? "GPL - Ghana" : "Premier League - England",
                    odds: m.odds,
                  });
                  setSelectedSportSchedule("football");
                  setSportsViewMode("detail");
                }}
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
                    <div className="flex items-center gap-1.5 mb-1.5">
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
                        className="w-9 h-9 rounded text-[10px] font-bold"
                        style={{
                          background: "var(--p-dark-container-background)",
                          border: "1px solid var(--p-border-and-gradient-bg)",
                          color: "var(--p-primary)",
                        }}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <span
                    className="text-[8px] font-semibold flex items-center gap-1"
                    style={{ color: "var(--p-text-secondary-color)" }}
                  >
                    {strings.STATS} <span style={{ fontSize: 9 }}>📊</span>
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedMatchId({ id: `web-${i}`, home: m.home, away: m.away, date: m.date, league: isKMK ? "GPL - Ghana" : "Premier League - England", odds: m.odds }); setSelectedSportSchedule("football"); setSportsViewMode("detail"); }}
                    className="text-[8px] font-semibold flex items-center gap-0.5"
                    style={{ color: "var(--p-primary)" }}
                  >
                    <span
                      className="text-[7px] font-black px-1 py-[1px] rounded mr-0.5"
                      style={{ background: "var(--p-primary)", color: pickContrastText(palette.primary) }}
                    >
                      SGP
                    </span>
                    {strings.MORE_BETS} <ChevronRight className="h-2 w-2" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {renderRightPanel()}
    </div>
    );
  };

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
              onClick={() => setActiveNav(1)}
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

        {renderBetslipPanel()}
      </div>
    );
  };

  /* Profile view (clicking the TN avatar) */
  const renderProfileView = () => {
    const primaryText = pickContrastText(palette.primary);
    const handle = effectiveAppName.slice(0, 2).toUpperCase();
    const top5Casino = [
      { name: "Aviator", image: imgAviator },
      { name: "Crazy Chicken", image: imgFortuneSpin },
      { name: "England League", image: imgWildTiger },
      { name: "Golden Boat", image: imgRoyalRiches },
      { name: "Bario Jet", image: imgRocketLaunch },
    ];
    const profileBets = [
      {
        kind: "tennis" as const,
        score: "1:2",
        odds: "2.70",
        market: "Correct match score",
        status: "LOST" as const,
        stake: "200",
        payout: "0",
        date: "7 MAY",
        time: "2:04 PM",
        league: "1win",
        away: "Team Nemesis",
        id: "b982857c-8dc6-4d57-97f8-545d88e73b91-od",
        timestamp: "5/7/2026, 4:45:45 PM",
        rows: undefined as undefined | { team: string; q: number[] }[],
        legs: undefined as undefined | { home: string; away: string }[],
      },
      {
        kind: "basketball" as const,
        score: "Detroit Pistons (-6.5)",
        odds: "2.01",
        market: "1st half - handicap",
        status: "WON" as const,
        stake: "1000",
        payout: "2010",
        rows: [
          { team: "Orlando Magic", q: [22, 27, 15, 30, 94] },
          { team: "Detroit Pistons", q: [20, 40, 23, 33, 116] },
        ],
        id: "09df0304-3c54-4ebd-bf93-f71203761b01",
        timestamp: "5/2/2026, 8:11:23 PM",
        date: "", time: "", league: "", away: "",
        legs: undefined as undefined | { home: string; away: string }[],
      },
      {
        kind: "multi" as const,
        score: "19 Leg …",
        odds: "Multi Odds",
        market: "draw  4.20",
        status: "PENDING" as const,
        stake: "",
        payout: "",
        legs: [{ home: "Arsenal FC", away: "Atletico Madrid" }],
        id: "",
        timestamp: "",
        date: "", time: "", league: "", away: "",
        rows: undefined as undefined | { team: string; q: number[] }[],
      },
    ];
    const transactions = [
      { kind: "bet", title: "Made a bet", date: "May 7, 4:45 PM", amount: "- 200.00", color: "neutral" as const },
      { kind: "casino", title: "Casino bet placement", date: "May 4, 9:15 PM", amount: "- 50.00", color: "neutral" as const },
      { kind: "casino", title: "Casino bet win", date: "May 4, 9:14 PM", amount: "+ 85.00", color: "win" as const },
      { kind: "casino", title: "Casino bet placement", date: "May 4, 9:14 PM", amount: "- 50.00", color: "neutral" as const },
      { kind: "naira", title: "Naira bet win", date: "May 4, 12:18 AM", amount: "+ 2,010.00", color: "win" as const },
      { kind: "bet", title: "Made a bet", date: "May 2, 8:11 PM", amount: "- 1,000.00", color: "neutral" as const },
      { kind: "rejected", title: "Bet rejected", date: "May 2, 5:36 PM", amount: "+ 1,000.00", color: "win" as const },
      { kind: "bet", title: "Made a bet", date: "May 2, 5:36 PM", amount: "- 1,000.00", color: "neutral" as const },
    ];

    return (
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* LEFT — profile sidebar */}
        <aside
          className="w-[230px] border-r flex flex-col flex-shrink-0 overflow-auto"
          style={{ borderColor: "var(--p-border-and-gradient-bg)", background: "var(--p-dark)" }}
        >
          <div className="px-3 py-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold" style={{ color: "var(--p-light-text-color)" }}>
                {effectiveAppName}
              </span>
              <div className="flex items-center gap-1">
                <button
                  className="h-6 w-6 rounded-md grid place-items-center"
                  style={{ background: "var(--p-modal-background)", border: "1px solid var(--p-border-and-gradient-bg)", color: "var(--p-text-secondary-color)" }}
                >
                  <Share2 className="h-3 w-3" />
                </button>
                <button
                  className="h-6 w-6 rounded-md grid place-items-center"
                  style={{ background: "var(--p-modal-background)", border: "1px solid var(--p-border-and-gradient-bg)", color: "var(--p-text-secondary-color)" }}
                >
                  <Settings className="h-3 w-3" />
                </button>
              </div>
            </div>

            <div className="flex flex-col items-center pt-1">
              <div
                className="h-16 w-16 rounded-full grid place-items-center text-[18px] font-bold"
                style={{
                  background: "color-mix(in oklab, var(--p-primary) 22%, transparent)",
                  border: "1px solid color-mix(in oklab, var(--p-primary) 45%, transparent)",
                  color: "var(--p-primary)",
                }}
              >
                {handle}
              </div>
              <div className="mt-2 text-[11px] font-semibold" style={{ color: "var(--p-light-text-color)" }}>
                Testing Name
              </div>
            </div>

            <div className="flex justify-between text-center pt-1">
              {[
                { label: "Wins", val: "90", color: "var(--p-light-text-color)" },
                { label: strings.FOLLOWING, val: "23", color: "var(--p-primary)" },
                { label: strings.FOLLOWERS, val: "46", color: "var(--p-primary)" },
              ].map((s) => (
                <div key={s.label} className="flex-1">
                  <div className="text-[8px]" style={{ color: "var(--p-text-secondary-color)" }}>{s.label}</div>
                  <div className="text-[14px] font-bold" style={{ color: s.color }}>{s.val}</div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-semibold" style={{ color: "var(--p-light-text-color)" }}>
                  Available Bonuses
                </span>
                <span
                  className="grid place-items-center h-3.5 min-w-3.5 px-1 rounded-full text-[8px] font-bold"
                  style={{ background: "var(--p-primary)", color: primaryText }}
                >
                  1
                </span>
              </div>
              <button onClick={() => setActiveNav(4)} className="text-[8px] font-semibold flex items-center gap-0.5" style={{ color: "var(--p-primary)" }}>
                All Bonuses <ChevronRight className="h-2.5 w-2.5" />
              </button>
            </div>

            <div
              className="rounded-lg p-2.5 relative overflow-hidden"
              style={{
                border: "1px solid color-mix(in oklab, var(--p-primary) 35%, transparent)",
                background: "linear-gradient(135deg, color-mix(in oklab, var(--p-primary) 14%, transparent) 0%, color-mix(in oklab, var(--p-primary) 4%, transparent) 100%)",
              }}
            >
              <div className="text-[10px] font-bold leading-tight" style={{ color: "var(--p-light-text-color)" }}>
                GET A <span style={{ color: "var(--p-primary)" }}>100%</span> BONUS ON YOUR FIRST DEPOSIT
              </div>
              <div className="text-[8px] mt-1.5 leading-snug" style={{ color: "var(--p-text-secondary-color)" }}>
                Enjoy 100% welcome bonus on your first deposit and double your starting stake.
              </div>
              <div className="absolute right-1.5 bottom-1.5 opacity-60">
                <Ticket className="h-6 w-6" style={{ color: "var(--p-primary)" }} />
              </div>
            </div>

            <div
              className="rounded-lg p-3 text-center"
              style={{
                border: "1px solid color-mix(in oklab, var(--p-primary) 35%, transparent)",
                background: "linear-gradient(135deg, color-mix(in oklab, var(--p-primary) 8%, transparent) 0%, transparent 100%)",
              }}
            >
              <div
                className="h-7 w-7 mx-auto rounded-full grid place-items-center mb-1.5"
                style={{ background: "color-mix(in oklab, var(--p-primary) 20%, transparent)", color: "var(--p-primary)" }}
              >
                <Users className="h-3.5 w-3.5" />
              </div>
              <div className="text-[8px] font-semibold leading-tight" style={{ color: "var(--p-primary)" }}>
                Refer your friends and build your network
                <div style={{ color: "var(--p-text-secondary-color)" }}>1 friend at a time!</div>
              </div>
              <button
                className="mt-2 w-full h-6 rounded text-[9px] font-bold"
                style={{ background: "var(--p-primary)", color: primaryText }}
              >
                {strings.REFER_FRIENDS}
              </button>
            </div>

            <div className="pt-1">
              <div className="text-[10px] font-bold mb-1.5" style={{ color: "var(--p-light-text-color)" }}>
                Top 5 Casino Games
              </div>
              <div className="grid grid-cols-5 gap-1">
                {top5Casino.map((g) => (
                  <div
                    key={g.name}
                    className="aspect-square rounded-md overflow-hidden"
                    style={{ border: "1px solid var(--p-border-and-gradient-bg)" }}
                  >
                    <img src={g.image} alt={g.name} className="h-full w-full object-cover" loading="lazy" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* CENTER — bets list */}
        <main className="flex-1 min-w-0 overflow-auto" style={{ background: "var(--p-primary-background-color)" }}>
          <div className="flex border-b" style={{ borderColor: "var(--p-border-and-gradient-bg)" }}>
            {[strings.TAB_MY_BETS, strings.TAB_MY_FEED].map((t, i) => (
              <button
                key={t}
                onClick={() => setProfileMainTab(i)}
                className="flex-1 h-10 relative text-[12px] font-semibold"
                style={{ color: profileMainTab === i ? "var(--p-light-text-color)" : "var(--p-text-secondary-color)" }}
              >
                {t}
                {profileMainTab === i && (
                  <span
                    className="absolute bottom-0 left-1/4 right-1/4 h-[2px] rounded-full"
                    style={{ background: "var(--p-primary)" }}
                  />
                )}
              </button>
            ))}
          </div>

          {profileMainTab === 0 && (
            <div className="px-4 py-3 space-y-3">
              <div className="flex gap-2">
                {[strings.FILTER_ALL, "PENDING", strings.FILTER_SETTLED, strings.FILTER_P2P].map((label, i) => {
                  const active = profileBetsFilter === i;
                  return (
                    <button
                      key={label}
                      onClick={() => setProfileBetsFilter(i)}
                      className="flex-1 h-9 rounded-md text-[11px] font-bold"
                      style={{
                        background: active
                          ? "linear-gradient(135deg, var(--p-active-secondary-gradient-color, var(--p-primary)), var(--p-primary))"
                          : "var(--p-modal-background)",
                        color: active ? primaryText : "var(--p-text-secondary-color)",
                        border: active ? "none" : "1px solid var(--p-border-and-gradient-bg)",
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {profileBets.map((b, idx) => {
                const isWon = b.status === "WON";
                const isLost = b.status === "LOST";
                const badgeColor = isWon ? "var(--p-won-color)" : isLost ? "var(--p-lost-color)" : "var(--p-secondary)";
                return (
                  <div
                    key={idx}
                    className="rounded-lg overflow-hidden"
                    style={{ background: "var(--p-modal-background)", border: "1px solid var(--p-border-and-gradient-bg)" }}
                  >
                    <div className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 text-[12px]">
                            <span className="font-bold" style={{ color: "var(--p-light-text-color)" }}>{b.score}</span>
                            <span style={{ color: "var(--p-text-secondary-color)" }}>|</span>
                            <span className="font-bold" style={{ color: "var(--p-primary)" }}>{b.odds}</span>
                          </div>
                          <div className="text-[10px] mt-0.5" style={{ color: "var(--p-primary)" }}>
                            {b.market}
                          </div>
                        </div>
                        <span
                          className="text-[9px] font-bold px-2 py-0.5 rounded"
                          style={{
                            border: `1px solid ${badgeColor}`,
                            color: badgeColor,
                            background: "transparent",
                          }}
                        >
                          {b.status}
                        </span>
                      </div>

                      {b.stake !== "" && (
                        <div className="flex items-center justify-between text-[10px] py-1.5 border-y" style={{ borderColor: "var(--p-border-and-gradient-bg)" }}>
                          <span style={{ color: "var(--p-text-secondary-color)" }}>STAKE</span>
                          <span className="font-bold" style={{ color: "var(--p-light-text-color)" }}>{effectiveCurrencySymbol} {b.stake}</span>
                          <span style={{ color: "var(--p-text-secondary-color)" }}>|</span>
                          <span className="font-bold" style={{ color: isWon ? "var(--p-won-color)" : "var(--p-light-text-color)" }}>{effectiveCurrencySymbol} {b.payout}</span>
                          <span style={{ color: "var(--p-text-secondary-color)" }}>PAYOUT</span>
                        </div>
                      )}

                      {b.kind === "tennis" && (
                        <div
                          className="mt-2 flex items-center justify-between rounded-md p-2"
                          style={{ background: "var(--p-dark)" }}
                        >
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full grid place-items-center" style={{ background: "var(--p-inactive-button-bg)" }}>
                              <CircleDot className="h-3 w-3" style={{ color: "var(--p-light-text-color)" }} />
                            </div>
                            <span className="text-[10px] font-semibold" style={{ color: "var(--p-light-text-color)" }}>{b.league}</span>
                          </div>
                          <div className="text-center">
                            <div className="text-[8px] font-bold" style={{ color: "var(--p-primary)" }}>{b.date}</div>
                            <div className="text-[9px]" style={{ color: "var(--p-text-secondary-color)" }}>{b.time}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-semibold" style={{ color: "var(--p-light-text-color)" }}>{b.away}</span>
                            <div className="h-6 w-6 rounded-full grid place-items-center" style={{ background: "var(--p-inactive-button-bg)" }}>
                              <CircleDot className="h-3 w-3" style={{ color: "var(--p-light-text-color)" }} />
                            </div>
                          </div>
                        </div>
                      )}

                      {b.kind === "basketball" && b.rows && (
                        <div className="mt-2">
                          <div className="grid grid-cols-[1fr_repeat(5,28px)] text-[9px] gap-1 mb-1" style={{ color: "var(--p-text-secondary-color)" }}>
                            <span></span>
                            {["1", "2", "3", "4", "T"].map((q) => (
                              <span key={q} className="text-center font-semibold">{q}</span>
                            ))}
                          </div>
                          {b.rows.map((row) => (
                            <div key={row.team} className="grid grid-cols-[1fr_repeat(5,28px)] items-center gap-1 py-1">
                              <div className="flex items-center gap-2">
                                <TeamDot label={row.team} size={16} />
                                <span className="text-[10px] font-semibold" style={{ color: "var(--p-light-text-color)" }}>{row.team}</span>
                              </div>
                              {row.q.map((n, qi) => (
                                <span key={qi} className="text-center text-[10px]" style={{ color: qi === row.q.length - 1 ? "var(--p-light-text-color)" : "var(--p-text-secondary-color)", fontWeight: qi === row.q.length - 1 ? 700 : 400 }}>{n}</span>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}

                      {b.kind === "multi" && b.legs && (
                        <div className="mt-2 space-y-1">
                          {b.legs.map((leg, li) => (
                            <div key={li} className="flex items-center justify-between rounded-md p-2" style={{ background: "var(--p-dark)" }}>
                              <div className="flex items-center gap-2">
                                <TeamDot label={leg.home} size={16} />
                                <span className="text-[10px] font-semibold" style={{ color: "var(--p-light-text-color)" }}>{leg.home}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-semibold" style={{ color: "var(--p-light-text-color)" }}>{leg.away}</span>
                                <TeamDot label={leg.away} size={16} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {b.id && (
                        <div className="flex items-center justify-between mt-2 pt-2 border-t text-[8px]" style={{ borderColor: "var(--p-border-and-gradient-bg)", color: "var(--p-text-secondary-color)" }}>
                          <span className="font-mono">{b.id}</span>
                          <span>{b.timestamp}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {profileMainTab === 1 && (
            <div className="px-4 py-3 space-y-2">
              {SOCIAL_POSTS.map((p, i) => (
                <div key={i} className="rounded-lg p-3" style={{ background: "var(--p-modal-background)", border: "1px solid var(--p-border-and-gradient-bg)" }}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-7 w-7 rounded-full grid place-items-center text-[10px] font-bold" style={{ background: "var(--p-primary)", color: primaryText }}>{p.avatar}</div>
                    <div>
                      <div className="text-[11px] font-bold" style={{ color: "var(--p-light-text-color)" }}>{p.user}</div>
                      <div className="text-[9px]" style={{ color: "var(--p-text-secondary-color)" }}>{p.action} · {p.time}</div>
                    </div>
                  </div>
                  <div className="text-[10px]" style={{ color: "var(--p-primary)" }}>{p.bet}</div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* RIGHT — wallet & transactions */}
        <aside
          className="w-[270px] border-l flex flex-col flex-shrink-0 overflow-auto"
          style={{ borderColor: "var(--p-border-and-gradient-bg)", background: "var(--p-dark)" }}
        >
          <div className="px-3 py-3 space-y-3">
            <div className="text-[13px] font-bold" style={{ color: "var(--p-light-text-color)" }}>Naira</div>

            <button
              className="w-full h-9 rounded-md flex items-center justify-center gap-2 text-[12px] font-bold"
              style={{
                background: "linear-gradient(135deg, var(--p-active-secondary-gradient-color, var(--p-primary)), var(--p-primary))",
                color: primaryText,
              }}
            >
              <span>{currencySymbol ?? effectiveCurrencySymbol}</span>
              <span>{effectiveCurrencyName}</span>
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-1 text-[9px]" style={{ color: "var(--p-text-secondary-color)" }}>
                <span>Total balance</span>
                <Info className="h-2.5 w-2.5" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[20px] font-bold" style={{ color: "var(--p-light-text-color)" }}>{currencySymbol ?? effectiveCurrencySymbol}</span>
                <span className="text-[20px] font-bold" style={{ color: "var(--p-light-text-color)" }}>---</span>
                <EyeOff className="h-3 w-3" style={{ color: "var(--p-text-secondary-color)" }} />
              </div>
              <div className="text-[9px]" style={{ color: "var(--p-text-secondary-color)" }}>
                Withdrawable Balance: <span style={{ color: "var(--p-primary)" }}>{currencySymbol ?? effectiveCurrencySymbol} 17,886.76</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setActiveNav(4)}
                className="h-9 rounded-md text-[11px] font-bold"
                style={{
                  background: "var(--p-modal-background)",
                  border: "1px solid var(--p-border-and-gradient-bg)",
                  color: "var(--p-light-text-color)",
                }}
              >
                Withdraw
              </button>
              <button
                onClick={() => setActiveNav(4)}
                className="h-9 rounded-md text-[11px] font-bold"
                style={{
                  background: "linear-gradient(135deg, var(--p-active-secondary-gradient-color, var(--p-primary)), var(--p-primary))",
                  color: primaryText,
                }}
              >
                Deposit
              </button>
            </div>

            <div className="text-[12px] font-bold pt-1" style={{ color: "var(--p-light-text-color)" }}>Transactions history</div>

            <div className="space-y-2">
              {transactions.map((t, i) => {
                const Icon = t.kind === "naira" || t.kind === "rejected" ? Trophy : Dice5;
                return (
                  <div key={i} className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-md grid place-items-center flex-shrink-0" style={{ background: "var(--p-modal-background)", border: "1px solid var(--p-border-and-gradient-bg)", color: "var(--p-text-secondary-color)" }}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 text-[10px] font-semibold truncate" style={{ color: "var(--p-light-text-color)" }}>
                        {t.title}
                        <Copy className="h-2.5 w-2.5" style={{ color: "var(--p-text-secondary-color)" }} />
                      </div>
                      <div className="text-[8px]" style={{ color: "var(--p-text-secondary-color)" }}>{t.date}</div>
                    </div>
                    <span
                      className="text-[10px] font-bold whitespace-nowrap"
                      style={{ color: t.color === "win" ? "var(--p-won-color)" : "var(--p-light-text-color)" }}
                    >
                      {t.amount}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
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
          {isKMK ? (
            <MyBetWordmark size={22} />
          ) : logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-8 mr-3 object-contain max-w-[140px]" />
          ) : (
            <div
              className="h-8 w-8 rounded-full grid place-items-center mr-3 text-[11px] font-black"
              style={{ background: "var(--p-primary)", color: "var(--p-light-text-color)" }}
            >
              {effectiveAppName.slice(0, 1)}
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
                style={{ color: active ? "var(--p-primary)" : "var(--p-navbar-label, var(--p-text-secondary-color))" }}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="text-[10px] font-semibold">{n.label}</span>
                {active && (
                  <span
                    className="absolute -bottom-[6px] left-2 right-2 h-[2px] rounded-full"
                    style={{ background: "var(--p-inactive-tab-underline, var(--p-primary))" }}
                  />
                )}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          {/* Wallet pill */}
          <div className="flex items-center gap-1 h-7 px-2 rounded-md text-[10px] font-semibold"
            style={{ background: "var(--p-modal-background)", border: "1px solid var(--p-border-and-gradient-bg)", color: "var(--p-light-text-color)" }}>
            <span>{currencySymbol ?? effectiveCurrencySymbol}</span>
            <span>---</span>
            <EyeOff className="h-3 w-3" style={{ color: "var(--p-text-secondary-color)" }} />
          </div>
          {/* Plus / Deposit */}
          <button onClick={() => setActiveNav(4)} className="h-7 w-7 rounded-md grid place-items-center"
            style={{ background: "var(--p-primary)", color: pickContrastText(palette.primary) }}>
            <Plus className="h-3.5 w-3.5" />
          </button>
          {/* Bell with notification dot */}
          <button onClick={() => setActiveNav(4)} className="h-7 w-7 rounded-md grid place-items-center relative"
            style={{ background: "var(--p-modal-background)", border: "1px solid var(--p-border-and-gradient-bg)", color: "var(--p-light-text-color)" }}>
            <Bell className="h-3.5 w-3.5" />
            <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full" style={{ background: "var(--p-primary)" }}></span>
          </button>
          {/* Chat */}
          <button onClick={() => setActiveNav(2)} className="h-7 w-7 rounded-md grid place-items-center"
            style={{ background: "var(--p-modal-background)", border: "1px solid var(--p-border-and-gradient-bg)", color: "var(--p-light-text-color)" }}>
            <MessageCircle className="h-3.5 w-3.5" />
          </button>
          {/* User avatar */}
          <button
            onClick={() => setShowProfile((v) => !v)}
            className="h-7 w-7 rounded-full grid place-items-center text-[10px] font-bold cursor-pointer transition-transform hover:scale-105"
            style={{
              background: showProfile ? "var(--p-primary)" : "var(--p-primary)",
              color: pickContrastText(palette.primary),
              boxShadow: showProfile ? "0 0 0 2px var(--p-primary-background-color), 0 0 0 3px var(--p-primary)" : "none",
            }}
          >
            {effectiveAppName.slice(0, 2).toUpperCase()}
          </button>
        </div>
      </div>

      {/* View switcher */}
      {showProfile ? renderProfileView() : (
        <>
          {activeNav === 0 && renderFeedView()}
          {activeNav === 1 && renderSportsView()}
          {activeNav === 2 && renderWebDiscoveryView()}
          {activeNav === 3 && (
            <div className="flex-1 min-h-0 flex">
              <CasinoContent variant="web" />
              {renderRightPanel()}
            </div>
          )}
          {activeNav === 4 && renderP2PView()}
        </>
      )}
    </div>
  );
});

/* ─── MOBILE VERSION ──────────────────────────────────────────────────── */

const MobilePreview = React.memo(function MobilePreview({
  appName,
  currencySymbol,
  logoUrl,
  clientId,
}: {
  appName: string;
  currencySymbol: string;
  logoUrl?: string | null;
  clientId?: string;
}) {
  const isKMK = clientId === KMK_CLIENT_ID;
  const effectiveMatches = isKMK ? MYBET_MATCHES : MATCHES;
  const effectiveBetSlips = isKMK ? MYBET_BET_SLIPS : BET_SLIPS;
  const effectiveLeagueTabs = isKMK ? MYBET_LEAGUE_TABS : LEAGUE_TABS;
  const effectiveCurrencySymbol = isKMK ? "GH₵" : currencySymbol;
  const effectiveCurrencyName = isKMK ? "Ghana Cedi" : "Naira";
  const effectiveAppName = isKMK ? "MyBet.Africa" : appName;
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
  const [mobileMatchId, setMobileMatchId] = useState<{ id: string; home: string; away: string; date: string; league: string; odds: string[] } | null>(null);
  const [mobileLiveView, setMobileLiveView] = useState(false);
  const [mobileLiveActiveSportTab, setMobileLiveActiveSportTab] = useState(0);

  const { strings: rawStrings, palette, previewFocusField } = useStudio();
  const strings = isKMK ? { ...rawStrings, ...MYBET_STRINGS_OVERRIDES } : rawStrings;

  // Auto-navigate preview to the most relevant view when a Quick Edit field is focused
  const FIELD_TO_NAV: Record<string, { nav: number; liveView?: boolean; profileTab?: number }> = {
    primary:                      { nav: 1 },
    primaryButton:                { nav: 0 },  // BetBuilder button on Home
    primaryButtonGradient:        { nav: 0 },
    secondary:                    { nav: 0 },  // P2P button gradient on Home (most visible)
    activeSecondaryGradientColor: { nav: 1 },
    primaryBackgroundColor:       { nav: 0 },
    dark:                         { nav: 1 },
    darkContainerBackground:      { nav: 1 },
    modalBackground:              { nav: 4 },
    lightTextColor:               { nav: 1 },
    textSecondaryColor:           { nav: 1 },
    navbarLabel:                  { nav: 0 },
    wonColor:                     { nav: 4 },
    lostColor:                    { nav: 4 },
    payoutWonColor:               { nav: 4 },
    borderAndGradientBg:          { nav: 1 },
    inactiveButtonBg:             { nav: 1 },
    inactiveTabUnderline:         { nav: 1 },
    boxGradientColorStart:        { nav: 0 },
    boxGradientColorEnd:          { nav: 0 },
    notificationSectionBg:        { nav: 4 },
  };

  useEffect(() => {
    if (!previewFocusField) return;
    // Don't navigate for locked background fields
    const LOCKED = new Set(["primaryBackgroundColor","dark","darkContainerBackground","modalBackground"]);
    if (LOCKED.has(previewFocusField)) return;
    const target = FIELD_TO_NAV[previewFocusField];
    if (!target) return;
    setMobileMatchId(null);
    setMobileLiveView(false);
    setActiveNav(target.nav);
    if (target.liveView) setMobileLiveView(true);
  }, [previewFocusField]);
  const statusLabel = (s: string) =>
    s === "WON" ? strings.STATUS_WON
    : s === "LOST" ? strings.STATUS_LOST
    : strings.STATUS_PENDING;

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
      {isKMK ? (
        <MyBetWordmark size={13} />
      ) : logoUrl ? (
        <img src={logoUrl} alt="Logo" className="h-8 object-contain max-w-[110px]" />
      ) : (
        <div
          className="h-8 w-8 rounded-full grid place-items-center text-[11px] font-black"
          style={{ background: "var(--p-primary)", color: "var(--p-light-text-color)" }}
        >
          {effectiveAppName.slice(0, 1)}
        </div>
      )}
      <div
        className="flex items-center gap-1.5 px-2.5 h-6 rounded-full"
        style={{ background: "var(--p-dark)" }}
      >
        <span className="text-[10px] font-bold" style={{ color: "var(--p-light-text-color)" }}>
          {effectiveCurrencySymbol}
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
      {/* Quick tiles — 6 tiles matching BetCorrect mobile */}
      <div className="grid grid-cols-6 gap-1.5 px-3 mb-2 flex-shrink-0">
        {[
          { icon: LayoutGrid, label: strings.ALL_SPORTS, nav: 1 },
          { icon: Radio,       label: strings.TILE_LIVE_SPORTS.replace(" Sports", ""), nav: 1, live: true },
          { icon: CircleDot,   label: "Football", nav: 1 },
          { icon: Code2,       label: "Load Co...", nav: 2 },
          { icon: Clapperboard, label: strings.TILE_VIRTUALS, nav: 3 },
          { icon: Joystick,    label: "Gamers...", nav: 3 },
        ].map((t, idx) => {
          const Icon = t.icon;
          const active = activeNav === t.nav && idx > 0;
          return (
            <button
              key={idx}
              onClick={() => {
                setActiveNav(t.nav);
                if (t.live) setMobileLiveView(true);
              }}
              className="flex flex-col items-center justify-center gap-0.5 h-[60px] rounded-xl"
              style={{
                background: "var(--p-dark)",
                border: active ? "1.5px solid var(--p-primary)" : "1px solid var(--p-border-and-gradient-bg)",
              }}
            >
              <span
                className="h-7 w-7 rounded-full grid place-items-center"
                style={{ background: "var(--p-dark-container-background)" }}
              >
                <Icon
                  className="h-3.5 w-3.5"
                  style={{ color: active ? "var(--p-primary)" : "var(--p-light-text-color)" }}
                />
              </span>
              <span
                className="text-[7px] font-medium leading-none px-0.5 text-center truncate w-full"
                style={{ color: active ? "var(--p-primary)" : "var(--p-text-secondary-color)" }}
              >
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex-1 min-h-0 overflow-auto px-3 pb-2">
        {/* BetBuilder / P2P — orange filled on mobile (matches BetCorrect app) */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            onClick={() => setActiveNav(1)}
            className="h-11 rounded-xl flex items-center justify-center gap-2 text-[11px] font-bold"
            style={{
              background: "linear-gradient(135deg, var(--p-primary), color-mix(in oklab, var(--p-primary) 70%, var(--p-secondary)))",
              color: pickContrastText(palette.primary),
            }}
          >
            <Flame className="h-4 w-4 flex-shrink-0" />
            {strings.BETBUILDER}
          </button>
          <button
            onClick={() => setActiveNav(2)}
            className="h-11 rounded-xl flex items-center justify-center gap-2 text-[11px] font-bold"
            style={{
              background: "linear-gradient(135deg, var(--p-secondary), var(--p-primary))",
              color: pickContrastText(palette.primary),
            }}
          >
            <span
              className="text-[9px] font-black px-1.5 py-0.5 rounded flex-shrink-0"
              style={{ background: "rgba(0,0,0,0.3)", color: pickContrastText(palette.secondary || palette.primary) }}
            >
              VS
            </span>
            {strings.PEER_TO_PEER_BTN}
          </button>
        </div>
        {/* Welcome Bonus Banner — matches BetCorrect mobile exactly */}
        <div
          className="rounded-xl mb-3 relative overflow-hidden"
          style={{
            background: `linear-gradient(125deg, var(--p-box-gradient-color-start, color-mix(in oklab, var(--p-primary) 85%, black)) 0%, color-mix(in oklab, var(--p-primary) 55%, var(--p-box-gradient-color-end, var(--p-secondary))) 100%)`,
            border: "1px solid color-mix(in oklab, var(--p-primary) 60%, transparent)",
          }}
        >
          <div className="px-4 py-3">
            <div
              className="text-[13px] font-black tracking-wide"
              style={{ color: pickContrastText(palette.primaryButton) }}
            >
              WELCOME BONUS
            </div>
            <div
              className="text-[10px] mt-1 leading-snug opacity-90"
              style={{ color: pickContrastText(palette.primaryButton) }}
            >
              {strings.WELCOME_BONUS_BODY_MOBILE}
            </div>
            <div
              className="mt-2.5 h-6 w-6 rounded-full grid place-items-center"
              style={{ background: "rgba(0,0,0,0.25)" }}
            >
              <ChevronDown className="h-3.5 w-3.5" style={{ color: pickContrastText(palette.primaryButton) }} />
            </div>
          </div>
        </div>
        {/* Featured matches */}
        <div className="text-[12px] font-bold mb-1.5" style={{ color: "var(--p-light-text-color)" }}>
          {strings.LIVE_AND_UPCOMING}
        </div>
        <div className="space-y-2">
          {effectiveMatches.slice(0, 3).map((m, i) => {
            const k0 = `home-${i}-0`;
            const k1 = `home-${i}-1`;
            const k2 = `home-${i}-2`;
            return (
              <div
                key={i}
                onClick={() => setMobileMatchId({
                  id: `home-${i}`,
                  home: m.home,
                  away: m.away,
                  date: m.date,
                  league: isKMK ? "GPL - Ghana" : "Premier League - England",
                  odds: m.odds,
                })}
                className="rounded-md p-2.5 cursor-pointer transition-opacity hover:opacity-90"
                style={{ background: "var(--p-dark)", border: "1px solid var(--p-border-and-gradient-bg)" }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    {m.live ? (
                      <span
                        className="inline-flex items-center gap-1 px-1.5 py-[2px] rounded text-[8px] font-bold"
                        style={{ background: "rgba(239,68,68,0.15)", color: "var(--p-lost-color)" }}
                      >
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--p-lost-color)" }} />
                        LIVE
                      </span>
                    ) : null}
                    <span
                      className="text-[9px] font-semibold"
                      style={{ color: m.live ? "var(--p-primary)" : "var(--p-primary)" }}
                    >
                      {m.date}
                    </span>
                  </div>
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
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="text-[10.5px] font-medium truncate"
                          style={{ color: "var(--p-light-text-color)" }}
                        >
                          {m.home}
                        </span>
                        {m.live && (
                          <span
                            className="text-[8px] font-bold px-1 py-[1px] rounded flex-shrink-0"
                            style={{ background: "var(--p-dark-container-background)", color: "var(--p-primary)" }}
                          >
                            1:0
                          </span>
                        )}
                      </div>
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
                          className="w-10 h-10 rounded text-[11px] font-bold transition-colors"
                          style={{
                            background: sel ? "var(--p-primary)" : "var(--p-dark-container-background)",
                            border: sel ? "none" : "1px solid var(--p-border-and-gradient-bg)",
                            color: sel ? pickContrastText(palette.primary) : "var(--p-primary)",
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

  /* Mobile live view helpers */
  const MobileLockIcon = () => (
    <svg viewBox="0 0 24 24" width="10" height="10" style={{ flexShrink: 0 }}>
      <path d="M12 17a2 2 0 100-4 2 2 0 000 4zm6-6V8a6 6 0 10-12 0v3H4v11h16V11h-2zm-9-3a3 3 0 116 0v3H9V8z" fill="var(--p-suspended-odds-lock-color, var(--p-text-secondary-color))" />
    </svg>
  );

  const MobileLivePill = ({ statusText }: { statusText: string }) => (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "1.5px 4px", borderRadius: 3, background: "color-mix(in oklab, var(--p-live-pill-bg, var(--p-primary)) 14%, transparent)", border: "1px solid var(--p-live-pill-border, var(--p-primary))", fontSize: 7, fontWeight: 700 }}>
      <span style={{ width: 3.5, height: 3.5, borderRadius: "50%", background: "var(--p-live-pill-dot, var(--p-primary))", flexShrink: 0 }} />
      <span style={{ color: "var(--p-live-pill-text, var(--p-primary))" }}>LIVE</span>
      <span style={{ color: "var(--p-light-text-color)", fontWeight: 600 }}>{statusText}</span>
    </div>
  );

  const MobileOddsBtn = ({ label, suspended }: { label: string; suspended: boolean }) => (
    suspended ? (
      <div className="flex items-center justify-center rounded" style={{ minWidth: 34, height: 20, background: "var(--p-suspended-odds-bg, var(--p-dark-container-background))", border: "1px solid var(--p-border-and-gradient-bg)" }}>
        <MobileLockIcon />
      </div>
    ) : (
      <button className="rounded text-[7.5px] font-bold" style={{ minWidth: 34, height: 20, background: "var(--p-dark-container-background)", border: "1px solid var(--p-border-and-gradient-bg)", color: "var(--p-primary)" }}>
        {label}
      </button>
    )
  );

  const renderMobileLiveView = () => {
    const MOBILE_SPORT_TABS = [
      { label: "Soccer", count: 8,  data: LIVE_SOCCER,        type: "soccer" as const, icon: "⚽" },
      { label: "Basketball", count: 2, data: [] as typeof LIVE_SOCCER, type: "soccer" as const, icon: "🏀" },
      { label: "Table Tennis", count: 5, data: LIVE_TABLE_TENNIS, type: "racket" as const, icon: "🏓" },
      { label: "Tennis", count: 3, data: LIVE_TENNIS, type: "racket" as const, icon: "🎾" },
    ];
    const activeTab = MOBILE_SPORT_TABS[mobileLiveActiveSportTab];

    // Live league groups for soccer
    const liveLeagues = [
      {
        name: "Vtora Liga - Bulgaria",
        icon: "⚽",
        matches: [
          { id: "live-bg-1", home: "PFK Sportist Svoge", away: "FC Pirin Blagoevgrad", score: "0:0", status: "Halftime", odds: ["2.35", "2.25", "3.90"], suspended: false },
          { id: "live-bg-2", home: "PFC Ludogorets Raz...", away: "Gorna Oryahovitsa",   score: "2:0", status: "Halftime", odds: ["1.06", "7.50", "27.00"], suspended: false },
          { id: "live-bg-3", home: "PFC Minyor Pernik",  away: "PFC CSKA Sofia II",    score: "1:2", status: "Halftime", odds: ["8.75", "3.45", "1.40"], suspended: false },
        ],
      },
    ];

    return (
      <>
        {/* Live header */}
        <div
          className="flex items-center justify-between px-4 h-12 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--p-border-and-gradient-bg)" }}
        >
          <button onClick={() => setMobileLiveView(false)} className="h-8 w-8 grid place-items-center" style={{ color: "var(--p-light-text-color)" }}>
            <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
          </button>
          <div className="flex items-center gap-1.5">
            <Radio className="h-4 w-4" style={{ color: "var(--p-primary)" }} />
            <span className="text-[15px] font-bold" style={{ color: "var(--p-light-text-color)" }}>Live</span>
          </div>
          <button
            onClick={() => setMobileLiveActiveSportTab((mobileLiveActiveSportTab + 1) % 4)}
            className="h-8 w-8 grid place-items-center"
            style={{ color: "var(--p-primary)" }}
          >
            <Filter className="h-4 w-4" />
          </button>
        </div>

        {/* Sport tabs with counts — underline active */}
        <div
          className="flex border-b flex-shrink-0 overflow-x-auto px-2"
          style={{ borderColor: "var(--p-border-and-gradient-bg)", scrollbarWidth: "none" }}
        >
          {MOBILE_SPORT_TABS.map((tab, i) => {
            const active = mobileLiveActiveSportTab === i;
            return (
              <button
                key={tab.label}
                onClick={() => setMobileLiveActiveSportTab(i)}
                className="flex items-center gap-1 px-3 h-10 text-[11px] font-semibold relative flex-shrink-0 whitespace-nowrap"
                style={{ color: active ? "var(--p-light-text-color)" : "var(--p-text-secondary-color)" }}
              >
                <span style={{ fontSize: 13 }}>{tab.icon}</span>
                {tab.label}
                <span
                  className="text-[9px] font-bold px-1 py-[1px] rounded ml-0.5"
                  style={{ background: "color-mix(in oklab, var(--p-primary) 20%, transparent)", color: "var(--p-primary)" }}
                >
                  {tab.count}
                </span>
                {active && (
                  <span
                    className="absolute bottom-0 left-2 right-2 h-[2.5px] rounded-full"
                    style={{ background: "var(--p-primary)" }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Games filter pill */}
        <div className="px-3 py-2 flex-shrink-0">
          <button
            className="px-5 py-2 rounded-full text-[11px] font-bold"
            style={{
              background: "linear-gradient(135deg, var(--p-primary-button), var(--p-primary-button-gradient, var(--p-primary)))",
              color: pickContrastText(palette.primary),
            }}
          >
            Games
          </button>
        </div>

        {/* Live match cards grouped by league */}
        <div className="flex-1 min-h-0 overflow-auto px-3 pb-3 space-y-3">
          {(mobileLiveActiveSportTab === 0 ? liveLeagues : []).map((league) => (
            <div key={league.name}>
              {/* League header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span style={{ fontSize: 14 }}>{league.icon}</span>
                  <span className="text-[12px] font-bold" style={{ color: "var(--p-light-text-color)" }}>{league.name}</span>
                </div>
                <button
                  onClick={() => setMobileLiveView(false)}
                  className="text-[9px] font-bold flex items-center gap-0.5"
                  style={{ color: "var(--p-primary)" }}
                >
                  SEE MORE <ChevronRight className="h-3 w-3" />
                </button>
              </div>

              {/* Match cards */}
              {league.matches.map((m) => (
                <div
                  key={m.id}
                  className="rounded-xl mb-2 overflow-hidden"
                  style={{ background: "var(--p-dark)", border: "1px solid var(--p-border-and-gradient-bg)" }}
                >
                  {/* Live pill + status + 1/X/2 headers */}
                  <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="inline-flex items-center gap-1 px-1.5 py-[2px] rounded text-[8px] font-bold"
                        style={{ background: "rgba(239,68,68,0.18)", color: "var(--p-lost-color)" }}
                      >
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--p-lost-color)" }} />
                        LIVE
                      </span>
                      <span className="text-[10px] font-semibold" style={{ color: "var(--p-primary)" }}>{m.status}</span>
                    </div>
                    <div className="flex gap-[44px] text-[10px] font-bold mr-1" style={{ color: "var(--p-text-secondary-color)" }}>
                      <span>1</span><span>X</span><span>2</span>
                    </div>
                  </div>

                  {/* Teams + odds */}
                  <div className="flex items-center px-3 pb-2.5 gap-2">
                    <div className="flex-1 min-w-0 space-y-1.5">
                      {/* Home team with score badge */}
                      <div className="flex items-center gap-1.5">
                        <TeamDot label={m.home} size={18} />
                        <span className="text-[11px] font-medium truncate" style={{ color: "var(--p-light-text-color)" }}>{m.home}</span>
                        <span
                          className="text-[8px] font-bold px-1.5 py-[1px] rounded ml-1 flex-shrink-0"
                          style={{ background: "var(--p-dark-container-background)", color: "var(--p-primary)" }}
                        >
                          {m.score}
                        </span>
                      </div>
                      {/* Away team */}
                      <div className="flex items-center gap-1.5">
                        <TeamDot label={m.away} size={18} />
                        <span className="text-[11px] font-medium truncate" style={{ color: "var(--p-light-text-color)" }}>{m.away}</span>
                      </div>
                    </div>
                    {/* Odds buttons */}
                    <div className="flex gap-1.5 flex-shrink-0">
                      {m.odds.map((o, j) => (
                        <button
                          key={j}
                          className="w-[44px] h-[44px] rounded-lg text-[11px] font-bold"
                          style={{
                            background: "var(--p-dark-container-background)",
                            border: "1px solid var(--p-border-and-gradient-bg)",
                            color: "var(--p-primary)",
                          }}
                        >
                          {o}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Stats / MORE BETS footer */}
                  <div
                    className="flex items-center justify-between px-3 py-2"
                    style={{ borderTop: "1px solid var(--p-border-and-gradient-bg)" }}
                  >
                    <span
                      className="text-[9px] font-semibold flex items-center gap-1"
                      style={{ color: "var(--p-text-secondary-color)" }}
                    >
                      Stats <span style={{ fontSize: 10 }}>📊</span>
                    </span>
                    <button
                      onClick={() => setMobileMatchId({ id: m.id, home: m.home, away: m.away, date: `LIVE · ${m.status}`, league: "Live Sports", odds: m.odds })}
                      className="text-[9px] font-semibold flex items-center gap-0.5"
                      style={{ color: "var(--p-primary)" }}
                    >
                      MORE BETS <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* Racket sports (Tennis/TT) */}
          {(mobileLiveActiveSportTab === 2 || mobileLiveActiveSportTab === 3) && (
            <div>
              {(mobileLiveActiveSportTab === 2 ? LIVE_TABLE_TENNIS : LIVE_TENNIS).map((m) => (
                <div
                  key={m.id}
                  className="rounded-xl mb-2 overflow-hidden"
                  style={{ background: "var(--p-dark)", border: "1px solid var(--p-border-and-gradient-bg)" }}
                >
                  <div className="px-3 pt-2.5 pb-1 flex items-center justify-between">
                    <span className="text-[9px] truncate" style={{ color: "var(--p-text-secondary-color)" }}>{m.league}</span>
                    <span className="text-[8px] font-bold" style={{ color: "var(--p-primary)" }}>SEE MORE &gt;</span>
                  </div>
                  <div className="px-3 pb-2.5">
                    {[m.playerA, m.playerB].map((p, pi) => (
                      <div key={pi} className="flex items-center gap-2 mb-1">
                        <span style={{ fontSize: 13 }}>{p.flag}</span>
                        <span className="text-[11px] font-medium flex-1" style={{ color: "var(--p-light-text-color)" }}>{p.name}</span>
                        <MobileOddsBtn label={m.moneylineOdds?.[pi] ?? "—"} suspended={m.suspended} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </>
    );
  };
  /* Sports view (nav 1) */
  const renderSportsView = () => {
    if (mobileLiveView) return renderMobileLiveView();
    return (
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
                style={{ background: "var(--p-inactive-tab-underline, var(--p-primary))" }}
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
              onClick={() => setMobileSportsTab(0)}
              className="h-11 rounded-xl flex items-center justify-center gap-2 text-[11px] font-bold"
              style={{
                background: "linear-gradient(135deg, var(--p-primary), color-mix(in oklab, var(--p-primary) 70%, var(--p-secondary)))",
                color: pickContrastText(palette.primary),
              }}
            >
              <Flame className="h-4 w-4 flex-shrink-0" />
              {strings.BETBUILDER}
            </button>
            <button
              onClick={() => setActiveNav(2)}
              className="h-11 rounded-xl flex items-center justify-center gap-2 text-[11px] font-bold"
              style={{
                background: "linear-gradient(135deg, var(--p-secondary), var(--p-primary))",
                color: pickContrastText(palette.primary),
              }}
            >
              <span
                className="text-[9px] font-black px-1.5 py-0.5 rounded flex-shrink-0"
                style={{ background: "rgba(0,0,0,0.3)", color: pickContrastText(palette.secondary || palette.primary) }}
              >
                VS
              </span>
              {strings.PEER_TO_PEER_BTN}
            </button>
          </div>

          <div className="text-[12px] font-bold mb-1.5" style={{ color: "var(--p-light-text-color)" }}>
            {strings.LIVE_AND_UPCOMING}
          </div>

          {/* Live & Upcoming sport filter — filled pill active, text+emoji inactive */}
          <div className="flex gap-2 mb-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {[
              { label: "Football",     emoji: "⚽" },
              { label: "Basketball",   emoji: "" },
              { label: "Tennis",       emoji: "🎾" },
              { label: "Table Tennis", emoji: "🏓" },
            ].map((tab, i) => {
              const active = activeSport === i;
              return (
                <button
                  key={tab.label}
                  onClick={() => setActiveSport(i)}
                  className="px-3 h-7 rounded-full text-[10px] font-semibold flex-shrink-0 flex items-center gap-1"
                  style={{
                    background: active ? "var(--p-primary)" : "transparent",
                    border: "none",
                    color: active ? pickContrastText(palette.primary) : "var(--p-text-secondary-color)",
                    fontWeight: active ? 700 : 500,
                  }}
                >
                  {tab.label}
                  {tab.emoji && <span style={{ fontSize: 12 }}>{tab.emoji}</span>}
                </button>
              );
            })}
          </div>

          {/* League pills */}
          <div className="flex gap-1.5 mb-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {effectiveLeagueTabs.slice(0, 3).map((l, i) => (
              <button
                key={l}
                onClick={() => setActiveLeague(i)}
                className="px-2.5 h-6 rounded-full text-[9.5px] font-semibold flex-shrink-0 inline-flex items-center gap-1"
                style={{
                  background: activeLeague === i ? "var(--p-primary)" : "transparent",
                  border: activeLeague === i ? "none" : "1px solid var(--p-border-and-gradient-bg)",
                  color: activeLeague === i ? pickContrastText(palette.primary) : "var(--p-text-secondary-color)",
                }}
              >
                <LeagueLogo label={l} size={12} /> {l.split(" - ")[0]}
              </button>
            ))}
          </div>

          {/* Bet type pills */}
          <div className="flex gap-1.5 mb-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {BET_TYPE_TABS.slice(0, 5).map((b, i) => (
              <button
                key={b}
                onClick={() => setActiveBetType(i)}
                className="px-2.5 h-6 rounded text-[9.5px] font-semibold flex-shrink-0"
                style={{
                  background: activeBetType === i ? "var(--p-primary)" : "transparent",
                  border: activeBetType === i ? "none" : "1px solid var(--p-border-and-gradient-bg)",
                  color: activeBetType === i ? pickContrastText(palette.primary) : "var(--p-text-secondary-color)",
                }}
              >
                {b}
              </button>
            ))}
          </div>

          {/* Match cards */}
          <div className="space-y-2">
            {effectiveMatches.slice(0, 4).map((m, i) => {
              const k0 = `sports-${i}-0`;
              const k1 = `sports-${i}-1`;
              const k2 = `sports-${i}-2`;
              return (
                <div
                  key={i}
                  onClick={() => setMobileMatchId({
                    id: `match-${i}`,
                    home: m.home,
                    away: m.away,
                    date: m.date,
                    league: isKMK ? "GPL - Ghana" : "Premier League - England",
                    odds: m.odds,
                  })}
                  className="rounded-md p-2.5 cursor-pointer transition-colors hover:opacity-90"
                  style={{ background: "var(--p-dark)", border: "1px solid var(--p-border-and-gradient-bg)" }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      {m.live ? (
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-[2px] rounded text-[8px] font-bold"
                          style={{ background: "rgba(239,68,68,0.15)", color: "var(--p-lost-color)" }}
                        >
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--p-lost-color)" }} />
                          LIVE
                        </span>
                      ) : null}
                      <span
                        className="text-[9px] font-semibold"
                        style={{ color: "var(--p-primary)" }}
                      >
                        {m.date}
                      </span>
                    </div>
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
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="text-[10.5px] font-medium truncate"
                            style={{ color: "var(--p-light-text-color)" }}
                          >
                            {m.home}
                          </span>
                          {m.live && (
                            <span
                              className="text-[8px] font-bold px-1 py-[1px] rounded flex-shrink-0"
                              style={{ background: "var(--p-dark-container-background)", color: "var(--p-primary)" }}
                            >
                              1:0
                            </span>
                          )}
                        </div>
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
                            onClick={(e) => { e.stopPropagation(); toggleOdd(key); }}
                            className="w-10 h-10 rounded text-[11px] font-bold transition-colors"
                            style={{
                              background: sel ? "var(--p-primary)" : "var(--p-dark-container-background)",
                              border: sel ? "none" : "1px solid var(--p-border-and-gradient-bg)",
                              color: sel ? pickContrastText(palette.primary) : "var(--p-primary)",
                            }}
                          >
                            {m.odds[j]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {/* Stats / MORE BETS footer */}
                  <div
                    className="flex items-center justify-between mt-2 pt-2"
                    style={{ borderTop: "1px solid var(--p-border-and-gradient-bg)" }}
                  >
                    <span className="text-[9px] font-semibold flex items-center gap-1" style={{ color: "var(--p-text-secondary-color)" }}>
                      Stats <span style={{ fontSize: 10 }}>📊</span>
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setMobileMatchId({ id: `sports-${i}`, home: m.home, away: m.away, date: m.date, league: isKMK ? "GPL - Ghana" : "Premier League - England", odds: m.odds }); }}
                      className="text-[9px] font-semibold flex items-center gap-0.5"
                      style={{ color: "var(--p-primary)" }}
                    >
                      <span className="text-[7px] font-black px-1 py-[1px] rounded mr-0.5" style={{ background: "var(--p-primary)", color: pickContrastText(palette.primary) }}>SGP</span>
                      MORE BETS <ChevronRight className="h-3 w-3" />
                    </button>
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
            {getSportsSidebar(strings).map((s, idx) => (
              <button
                key={s.name}
                onClick={() => {
                  setMobileSportsTab(0);
                  setActiveSport(idx < 3 ? idx : 0);
                }}
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
  };

  /* Discovery view (nav 2) — feed-style parlay posts mirroring web */
  const renderDiscoveryView = () => {
    const primaryText = pickContrastText(palette.primary);
    const leagues = [
      { code: "MLB", icon: "⚾" },
      { code: "NHL", icon: "🏒" },
      { code: "NBA", icon: "🏀" },
      { code: "MMA", icon: "🥊" },
      { code: "Soccer", icon: "⚽" },
      { code: "MLS", icon: "🥅" },
      { code: "TT", icon: "🏓" },
    ];
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
          { type: "Handicap", pick: "Philadelphia Phillies (-1)", odds: "+109", home: "Philadelphia Phillies", away: "Miami Marlins" },
        ],
        stake: "0.5",
        payout: "75.27",
        time: "14s ago",
      },
      {
        user: "ChampagnePogi",
        league: "NBA",
        legCount: 2,
        odds: "+210",
        status: "PENDING",
        legs: [
          { type: "Handicap", pick: "Toronto Raptors (+10.5)", odds: "-159", home: "Toronto Raptors", away: "Cleveland Cavaliers" },
          { type: "Handicap", pick: "Boston Celtics (-4.5)", odds: "-110", home: "Boston Celtics", away: "Miami Heat" },
        ],
        stake: "5",
        payout: "15.50",
        time: "3m ago",
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
          { type: "1x2", pick: "Bayern", odds: "-180", home: "Bayern", away: "Borussia Dortmund" },
        ],
        stake: "10",
        payout: "95.00",
        time: "2h ago",
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
      <>
        {renderTopBar()}
        <div className="flex-1 min-h-0 overflow-auto px-3 pb-3">
          {/* Header */}
          <div className="flex items-center justify-between my-2">
            <div className="flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5" style={{ color: "var(--p-primary)" }} />
              <span className="text-[12px] font-bold" style={{ color: "var(--p-light-text-color)" }}>
                For you
              </span>
            </div>
            <Filter className="h-3.5 w-3.5" style={{ color: "var(--p-text-secondary-color)" }} />
          </div>

          {/* League tiles row */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2" style={{ scrollbarWidth: "none" }}>
            {leagues.map((l, i) => {
              const active = i === 0;
              return (
                <div
                  key={l.code}
                  className="flex flex-col items-center justify-center flex-shrink-0 rounded-lg"
                  style={{
                    width: 52,
                    height: 52,
                    background: "var(--p-dark)",
                    border: `1px solid ${active ? "var(--p-primary)" : "var(--p-border-and-gradient-bg)"}`,
                  }}
                >
                  <span className="text-[16px] leading-none">{l.icon}</span>
                  <span className="text-[8px] mt-0.5" style={{ color: "var(--p-text-secondary-color)" }}>
                    {l.code}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Posts */}
          <div className="space-y-2.5">
            {posts.map((p, idx) => {
              const ss = statusStyle(p.status);
              return (
                <div
                  key={idx}
                  className="rounded-lg overflow-hidden"
                  style={{ background: "var(--p-dark)", border: "1px solid var(--p-border-and-gradient-bg)" }}
                >
                  {/* User header */}
                  <div
                    className="flex items-center justify-between px-2.5 py-1.5"
                    style={{ borderBottom: "1px solid var(--p-border-and-gradient-bg)" }}
                  >
                    <div className="flex items-center gap-1.5">
                      <div
                        className="h-5 w-5 rounded-full grid place-items-center text-[8px] font-bold"
                        style={{ background: "var(--p-primary)", color: primaryText }}
                      >
                        {p.user.slice(0, 1).toUpperCase()}
                      </div>
                      <span className="text-[10px] font-semibold" style={{ color: "var(--p-light-text-color)" }}>
                        {p.user}
                      </span>
                    </div>
                    <span
                      className="text-[8px] font-bold px-1.5 py-0.5 rounded italic"
                      style={{ background: ss.bg, color: ss.color }}
                    >
                      {statusLabelText(p.status)}
                    </span>
                  </div>

                  {/* League + Multi title */}
                  <div className="px-2.5 pt-2">
                    <div className="flex items-center gap-1 mb-0.5">
                      <Trophy className="h-2.5 w-2.5" style={{ color: "var(--p-text-secondary-color)" }} />
                      <span className="text-[8px]" style={{ color: "var(--p-text-secondary-color)" }}>
                        {p.league}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold" style={{ color: "var(--p-light-text-color)" }}>
                        {p.legCount} Leg Parlay
                      </span>
                      <span className="text-[11px] font-bold" style={{ color: oddsColor(p.odds) }}>
                        {p.odds}
                      </span>
                    </div>
                  </div>

                  {/* Legs */}
                  <div className="px-2.5 space-y-1.5">
                    {p.legs.map((leg, li) => (
                      <div
                        key={li}
                        className="rounded-md px-2 py-1.5"
                        style={{
                          background: "var(--p-primary-background-color)",
                          border: "1px solid var(--p-border-and-gradient-bg)",
                        }}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="min-w-0">
                            <div className="text-[7px] font-semibold mb-0.5" style={{ color: "var(--p-primary)" }}>
                              {leg.type}
                            </div>
                            <div className="text-[9px] font-bold" style={{ color: "var(--p-light-text-color)" }}>
                              {leg.pick}
                            </div>
                          </div>
                          <span
                            className="text-[9px] font-bold ml-1.5 flex-shrink-0"
                            style={{ color: oddsColor(leg.odds) }}
                          >
                            {leg.odds}
                          </span>
                        </div>
                        <div
                          className="flex items-center justify-between text-[7px]"
                          style={{ color: "var(--p-text-secondary-color)" }}
                        >
                          <div className="flex items-center gap-1 min-w-0 flex-1">
                            <TeamDot label={leg.home} size={12} />
                            <span className="truncate">{leg.home}</span>
                          </div>
                          <span className="px-1.5" style={{ color: "var(--p-vs-color)" }}>VS</span>
                          <div className="flex items-center gap-1 min-w-0 flex-1 justify-end">
                            <span className="truncate text-right">{leg.away}</span>
                            <TeamDot label={leg.away} size={12} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {p.legCount > p.legs.length && (
                    <div className="px-2.5 py-1.5 text-center">
                      <span className="text-[9px] font-semibold" style={{ color: "var(--p-primary)" }}>
                        Show all {p.legCount} legs ›
                      </span>
                    </div>
                  )}

                  {/* Stake / payout */}
                  <div
                    className="flex items-center justify-between px-2.5 py-1.5"
                    style={{ borderTop: "1px solid var(--p-border-and-gradient-bg)" }}
                  >
                    <div>
                      <div className="text-[7px] font-bold" style={{ color: "var(--p-text-secondary-color)" }}>
                        PICK AMOUNT
                      </div>
                      <div className="flex items-center gap-1">
                        <Flame className="h-2 w-2" style={{ color: "var(--p-primary)" }} />
                        <span className="text-[9px] font-bold" style={{ color: "var(--p-light-text-color)" }}>
                          {p.stake}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[7px] font-bold" style={{ color: "var(--p-text-secondary-color)" }}>
                        PAYOUT
                      </div>
                      <div className="flex items-center gap-1 justify-end">
                        <Flame className="h-2 w-2" style={{ color: "var(--p-primary)" }} />
                        <span className="text-[9px] font-bold" style={{ color: "var(--p-light-text-color)" }}>
                          {p.payout}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div
                    className="flex items-center justify-between px-2.5 py-1.5"
                    style={{ borderTop: "1px solid var(--p-border-and-gradient-bg)" }}
                  >
                    <div className="flex items-center gap-2.5" style={{ color: "var(--p-text-secondary-color)" }}>
                      <Heart className="h-3 w-3" />
                      <MessageCircle className="h-3 w-3" />
                      <ArrowLeftRight className="h-3 w-3" />
                      <span className="text-[8px] ml-0.5">{p.time}</span>
                    </div>
                    <Share2 className="h-3 w-3" style={{ color: "var(--p-text-secondary-color)" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </>
    );
  };

  /* Casino view (nav 3) */
  const renderCasinoView = () => (
    <>
      {renderTopBar()}
      <CasinoContent variant="mobile" />
    </>
  );

  /* Profile view (nav 4) */
  const renderProfileView = () => {
    const primaryText = pickContrastText(palette.primary);
    const handle = effectiveAppName.slice(0, 2).toUpperCase();
    return (
    <>
      {/* Profile header strip */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 flex-shrink-0">
        <span className="text-[14px] font-bold" style={{ color: "var(--p-light-text-color)" }}>
          {effectiveAppName}
        </span>
        <div className="flex items-center gap-3">
          <Settings className="h-4 w-4" style={{ color: "var(--p-light-text-color)" }} />
          <div className="relative">
            <Bell className="h-4 w-4" style={{ color: "var(--p-light-text-color)" }} />
            <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full" style={{ background: "var(--p-primary)" }} />
          </div>
          <MessageCircle className="h-4 w-4" style={{ color: "var(--p-light-text-color)" }} />
        </div>
      </div>

      {/* Avatar + stats row */}
      <div className="flex items-center gap-3 px-4 pb-3 flex-shrink-0">
        <div
          className="h-14 w-14 rounded-full grid place-items-center text-[16px] font-bold flex-shrink-0"
          style={{
            background: "color-mix(in oklab, var(--p-primary) 22%, transparent)",
            border: "1px solid color-mix(in oklab, var(--p-primary) 45%, transparent)",
            color: "var(--p-primary)",
          }}
        >
          {handle}
        </div>
        <div className="flex flex-1 items-center justify-between divide-x" style={{ borderColor: "var(--p-border-and-gradient-bg)" }}>
          {[
            { label: "Wins", val: "90", c: "var(--p-light-text-color)" },
            { label: strings.FOLLOWING, val: "23", c: "var(--p-primary)" },
            { label: strings.FOLLOWERS, val: "46", c: "var(--p-primary)" },
          ].map((s, idx) => (
            <div key={s.label} className={`flex-1 ${idx > 0 ? "pl-2" : ""}`}>
              <div className="text-[10px]" style={{ color: "var(--p-text-secondary-color)" }}>{s.label}</div>
              <div className="text-[15px] font-bold" style={{ color: s.c }}>{s.val}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto">
        {/* Naira balance card */}
        <div className="px-3 pb-2">
          <div
            className="rounded-lg px-3 py-2.5 flex items-center justify-between"
            style={{
              background: "linear-gradient(135deg, var(--p-active-secondary-gradient-color, var(--p-primary)), var(--p-primary))",
              color: primaryText,
              border: "1px solid var(--p-primary)",
            }}
          >
            <div>
              <div className="flex items-center gap-1.5 text-[14px] font-bold">
                <span>{currencySymbol ?? effectiveCurrencySymbol}</span>
                <span className="tracking-widest">****</span>
              </div>
              <div className="text-[11px] font-semibold mt-0.5">{effectiveCurrencyName}</div>
            </div>
            <div className="flex items-center gap-2">
              <EyeOff className="h-4 w-4" />
              <button className="h-6 w-6 rounded-full grid place-items-center" style={{ background: "rgba(0,0,0,0.4)", color: "#fff" }}>
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Available Bonuses header */}
        <div className="px-3 pt-1 pb-2 flex items-center gap-1.5">
          <span className="text-[12px] font-bold" style={{ color: "var(--p-light-text-color)" }}>Available Bonuses</span>
          <span
            className="grid place-items-center h-4 min-w-4 px-1 rounded-full text-[9px] font-bold"
            style={{ background: "var(--p-primary)", color: primaryText }}
          >
            1
          </span>
        </div>

        {/* Welcome Bonus card */}
        <div className="px-3 pb-2">
          <div
            className="rounded-lg p-3"
            style={{
              background: "linear-gradient(135deg, var(--p-primary-button, var(--p-primary)), var(--p-box-gradient-color-end, var(--p-primary)))",
              border: "1px solid var(--p-primary)",
            }}
          >
            <div className="text-[14px] font-black" style={{ color: pickContrastText(palette.primaryButton ?? palette.primary) }}>
              WELCOME BONUS
            </div>
            <div className="text-[11px] mt-1 leading-snug" style={{ color: pickContrastText(palette.primaryButton ?? palette.primary) }}>
              Get a Free Sportsbook Pick or Enjoy 50% More…For Casino Games
            </div>
            <div
              className="mt-2 h-6 w-6 rounded-full grid place-items-center"
              style={{ background: "rgba(0,0,0,0.4)" }}
            >
              <ChevronDown className="h-3.5 w-3.5" style={{ color: "#fff" }} />
            </div>
          </div>
        </div>

        {/* Refer friends card */}
        <div className="px-3 pb-3">
          <div
            className="rounded-lg p-2.5 flex items-center gap-2"
            style={{
              border: "1px solid color-mix(in oklab, var(--p-primary) 35%, transparent)",
              background: "linear-gradient(135deg, color-mix(in oklab, var(--p-primary) 8%, transparent) 0%, transparent 100%)",
            }}
          >
            <div
              className="h-8 w-8 rounded-full grid place-items-center flex-shrink-0"
              style={{ background: "color-mix(in oklab, var(--p-primary) 20%, transparent)", color: "var(--p-primary)" }}
            >
              <Users className="h-4 w-4" />
            </div>
            <div className="flex-1 text-[10px] font-semibold leading-tight text-center" style={{ color: "var(--p-primary)" }}>
              Refer your friends and build your network<span style={{ color: "var(--p-text-secondary-color)" }}>1friend at a time!</span>
            </div>
            <button
              onClick={() => setActiveNav(2)}
              className="h-8 px-3 rounded-md text-[10px] font-bold flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, var(--p-active-secondary-gradient-color, var(--p-primary)), var(--p-primary))",
                color: primaryText,
              }}
            >
              Refer friends
            </button>
          </div>
        </div>

        {/* My Bets / My Feed tabs */}
        <div className="flex border-b" style={{ borderColor: "var(--p-border-and-gradient-bg)" }}>
          {[strings.TAB_MY_BETS, strings.TAB_MY_FEED].map((t, i) => (
            <button
              key={t}
              onClick={() => setMobileProfileTab(i)}
              className="flex-1 h-10 text-[13px] font-semibold relative"
              style={{ color: mobileProfileTab === i ? "var(--p-light-text-color)" : "var(--p-text-secondary-color)" }}
            >
              {t}
              {mobileProfileTab === i && (
                <span
                  className="absolute bottom-0 left-1/4 right-1/4 h-[2px] rounded-full"
                  style={{ background: "linear-gradient(90deg, var(--p-primary), var(--p-active-secondary-gradient-color, var(--p-primary)))" }}
                />
              )}
            </button>
          ))}
        </div>

        {mobileProfileTab === 0 && (
          <>
            {/* Filter tabs — underline style matching BetCorrect */}
            <div
              className="flex border-b"
              style={{ borderColor: "var(--p-border-and-gradient-bg)" }}
            >
              {["All", "PENDING", "Settled", "P2P Bets"].map((label, i) => {
                const active = mobileMyBetsFilter === i;
                return (
                  <button
                    key={label}
                    onClick={() => setMobileMyBetsFilter(i)}
                    className="flex-1 h-9 relative text-[9px] font-semibold"
                    style={{ color: active ? "var(--p-light-text-color)" : "var(--p-text-secondary-color)" }}
                  >
                    {label}
                    {active && (
                      <span
                        className="absolute bottom-0 left-1 right-1 h-[2px] rounded-full"
                        style={{ background: "var(--p-primary)" }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="px-3 py-3 space-y-2">
              {/* BetCorrect-style bet cards — same data as web right panel */}
              {[
                { score: "1:2", odds: "2.70", market: "Correct match score", status: "LOST" as const, stake: "200", payout: "0" },
                { score: "Detroit Pistons (...", odds: "2.01", market: "1st half · handicap", status: "WON" as const, stake: "1000", payout: "2010" },
                { score: "19 Leg ...", odds: "Multi Odds", market: "draw · 4.20", status: "PENDING" as const, stake: "", payout: "" },
                { score: "Orlando Magic", odds: "5.20", market: "Winner (incl. overtime)", status: "LOST" as const, stake: "", payout: "" },
              ].filter((b) =>
                mobileMyBetsFilter === 0 ? true
                : mobileMyBetsFilter === 1 ? b.status === "PENDING"
                : mobileMyBetsFilter === 2 ? b.status !== "PENDING"
                : false
              ).map((b, idx) => {
                const statusC = b.status === "WON" ? "var(--p-won-color)" : b.status === "LOST" ? "var(--p-lost-color)" : "var(--p-primary)";
                const badgeBg = b.status === "WON" ? "var(--p-won-color)" : b.status === "LOST" ? "var(--p-lost-color)" : "transparent";
                const badgeBorder = b.status === "PENDING" ? `1px solid var(--p-primary)` : "none";
                const badgeColor = b.status === "WON" ? "rgba(0,0,0,0.85)" : b.status === "LOST" ? "rgba(255,255,255,0.93)" : "var(--p-primary)";
                return (
                  <div
                    key={idx}
                    className="rounded-lg overflow-hidden"
                    style={{ background: "var(--p-modal-background)", border: "1px solid var(--p-border-and-gradient-bg)" }}
                  >
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-[11px] font-bold" style={{ color: "var(--p-light-text-color)" }}>{b.score}</span>
                            <span className="text-[10px]" style={{ color: "var(--p-text-secondary-color)" }}>|</span>
                            <span className="text-[11px] font-bold" style={{ color: "var(--p-primary)" }}>{b.odds}</span>
                          </div>
                          <div className="text-[9px] mt-0.5" style={{ color: statusC }}>{b.market}</div>
                        </div>
                        <span
                          className="text-[9px] font-bold px-2 py-0.5 rounded flex-shrink-0"
                          style={{ background: badgeBg, border: badgeBorder, color: badgeColor }}
                        >
                          {b.status}
                        </span>
                      </div>
                      {b.stake && (
                        <div
                          className="flex items-center justify-between text-[9px] py-1.5 border-y"
                          style={{ borderColor: "var(--p-border-and-gradient-bg)" }}
                        >
                          <span style={{ color: "var(--p-text-secondary-color)" }}>STAKE</span>
                          <span className="font-bold" style={{ color: "var(--p-light-text-color)" }}>
                            {effectiveCurrencySymbol} {b.stake}
                          </span>
                          <span style={{ color: "var(--p-text-secondary-color)" }}>|</span>
                          <span className="font-bold" style={{ color: b.status === "WON" ? "var(--p-won-color)" : "var(--p-light-text-color)" }}>
                            {effectiveCurrencySymbol} {b.payout}
                          </span>
                          <span style={{ color: "var(--p-text-secondary-color)" }}>PAYOUT</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {mobileMyBetsFilter === 3 && (
                <div className="text-center py-6 text-[10px]" style={{ color: "var(--p-text-secondary-color)" }}>
                  {strings.NO_P2P_BETS}
                </div>
              )}
            </div>
          </>
        )}
        {mobileProfileTab === 1 && (
          <div className="px-3 py-3 space-y-2">
            {SOCIAL_POSTS.map((p, i) => (
              <div key={i} className="rounded-md p-2.5" style={{ background: "var(--p-modal-background)", border: "1px solid var(--p-border-and-gradient-bg)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-7 w-7 rounded-full grid place-items-center text-[10px] font-bold" style={{ background: "var(--p-primary)", color: primaryText }}>{p.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold" style={{ color: "var(--p-light-text-color)" }}>{p.user}</div>
                    <div className="text-[9px]" style={{ color: "var(--p-text-secondary-color)" }}>{p.action} · {p.time}</div>
                  </div>
                </div>
                <div className="text-[10px]" style={{ color: "var(--p-primary)" }}>{p.bet}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
    );
  };


  return (
    <div
      className="w-full h-full flex flex-col text-[11px] overflow-hidden"
      style={{ background: "var(--p-primary-background-color)", color: "var(--p-light-text-color)" }}
    >
      {/* View switcher */}
      {mobileMatchId ? (
        <GameDetail
          matchId={mobileMatchId.id}
          matchData={mobileMatchId}
          sport="football"
          onBack={() => setMobileMatchId(null)}
          palette={palette}
          strings={strings}
          pickContrastText={pickContrastText}
          TeamDot={TeamDot}
        />
      ) : (
        <>
          {activeNav === 0 && renderHomeView()}
          {activeNav === 1 && renderSportsView()}
          {activeNav === 2 && renderDiscoveryView()}
          {activeNav === 3 && renderCasinoView()}
          {activeNav === 4 && renderProfileView()}
        </>
      )}

      {/* Bet Slip bar — floats above bottom nav when odds selected */}
      {selectedOdds.size > 0 && !mobileMatchId && (
        <div
          className="flex items-center gap-3 px-4 py-2.5 flex-shrink-0"
          style={{
            background: "var(--p-dark-container-background)",
            borderTop: "1px solid var(--p-border-and-gradient-bg)",
          }}
        >
          <div
            className="h-8 w-8 rounded-full grid place-items-center text-[12px] font-black flex-shrink-0"
            style={{ background: "var(--p-primary)", color: pickContrastText(palette.primary) }}
          >
            {selectedOdds.size}
          </div>
          <span className="text-[13px] font-bold flex-1" style={{ color: "var(--p-light-text-color)" }}>
            Bet slip
          </span>
          <div className="text-right">
            <div className="text-[10px]" style={{ color: "var(--p-text-secondary-color)" }}>
              {selectedOdds.size} Leg{selectedOdds.size > 1 ? "s" : ""}
            </div>
            <div className="text-[9px]" style={{ color: "var(--p-text-secondary-color)" }}>
              ₦ 10.00 pays{" "}
              <span className="font-bold" style={{ color: "var(--p-light-text-color)" }}>
                ₦ {(10 * 1.83).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

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
          const isProfile = i === 4;
          const labels = ["home", strings.SPORTSBOOK, strings.DISCOVERY, strings.CASINO, "Profile"];
          const handle = effectiveAppName.slice(0, 2).toUpperCase();
          return (
            <button
              key={n.label}
              onClick={() => { setMobileMatchId(null); setActiveNav(i); }}
              className="flex flex-col items-center justify-center gap-0.5 h-14 relative"
            >
              {isProfile ? (
                <div
                  className="h-7 w-7 rounded-full grid place-items-center text-[10px] font-bold transition-all"
                  style={{
                    background: active
                      ? "linear-gradient(135deg, var(--p-active-secondary-gradient-color, var(--p-primary)), var(--p-primary))"
                      : "color-mix(in oklab, var(--p-primary) 20%, transparent)",
                    color: active ? pickContrastText(palette.primary) : "var(--p-primary)",
                    boxShadow: active ? "0 0 0 1px var(--p-primary)" : "none",
                  }}
                >
                  {handle}
                </div>
              ) : (
                <div
                  className="h-7 w-7 rounded-full grid place-items-center transition-all"
                  style={{
                    background: active
                      ? "color-mix(in oklab, var(--p-primary) 22%, transparent)"
                      : "transparent",
                  }}
                >
                  <Icon
                    className="h-4 w-4"
                    style={{ color: active ? "var(--p-primary)" : "var(--p-text-secondary-color)" }}
                  />
                </div>
              )}
              <span
                className="text-[9px] font-medium"
                style={{ color: active ? "var(--p-primary)" : "var(--p-navbar-label, var(--p-text-secondary-color))" }}
              >
                {labels[i]}
              </span>
            </button>
          );
        })}
      </div>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
});

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
  matches,
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
  matches: typeof MATCHES;
}) {
  const { strings, palette } = useStudio();
  return (
    <>
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2 flex-shrink-0">
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="h-8 object-contain max-w-[110px]" />
        ) : (
          <div
            className="h-8 w-8 rounded-full grid place-items-center text-[11px] font-black"
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
              background: palette.secondary ? "var(--p-secondary)" : "var(--p-active-secondary-gradient-color)",
              border: "1px solid var(--p-primary)",
              color: palette.secondary ? pickContrastText(palette.secondary) : pickContrastText(palette.activeSecondaryGradientColor),
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
          <div className="text-[12px] font-black" style={{ color: pickContrastText(palette.primaryButton) }}>
            {strings.WELCOME_BONUS_PROMO}
          </div>
          <div className="text-[9.5px] mt-1 leading-tight" style={{ color: pickContrastText(palette.primaryButton) }}>
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
              className="px-2.5 h-6 rounded-full text-[9.5px] font-semibold flex-shrink-0 inline-flex items-center gap-1"
              style={{
                background: activeLeague === i ? "var(--p-primary)" : "transparent",
                border: activeLeague === i ? "none" : "1px solid var(--p-border-and-gradient-bg)",
                color: activeLeague === i ? pickContrastText(palette.primary) : "var(--p-text-secondary-color)",
              }}
            >
              <LeagueLogo label={l} size={12} /> {l.split(" - ")[0]}
            </button>
          ))}
        </div>

        <div className="flex gap-1.5 mb-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {BET_TYPE_TABS.slice(0, 5).map((b, i) => (
            <button
              key={b}
              onClick={() => setActiveBetType(i)}
              className="px-2.5 h-6 rounded text-[9.5px] font-semibold flex-shrink-0"
              style={{
                background: activeBetType === i ? "var(--p-primary)" : "transparent",
                border: activeBetType === i ? "none" : "1px solid var(--p-border-and-gradient-bg)",
                color: activeBetType === i ? pickContrastText(palette.primary) : "var(--p-text-secondary-color)",
              }}
            >
              {b}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {matches.slice(0, 4).map((m, i) => (
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
                      className="w-10 h-10 rounded text-[11px] font-bold"
                      style={{
                        background: "var(--p-dark-container-background)",
                        border: "1px solid var(--p-border-and-gradient-bg)",
                        color: "var(--p-primary)",
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
  oldOdds?: string;
  match?: { home: string; away: string; date: string; score?: string };
  pick?: { market: string; selection: string; odds: string };
  legs?: Array<{ market: string; selection: string; home: string; away: string; odds: string }>;
  stake: string;
  payout: string;
}

const FRIENDS_POSTS: SocialPost[] = [
  {
    user: "adriano",
    initial: "A",
    boost: "5% PROFIT BOOST",
    league: "Bundesliga, Serie A",
    status: "PENDING",
    title: "4 Selection Multi",
    oldOdds: "4.93",
    stake: "500",
    payout: "2,565",
    legs: [
      { market: "Match Winner", selection: "TSG Hoffenheim", home: "TSG Hoffenheim", away: "Werder Bremen", odds: "1.55" },
      { market: "Match Winner", selection: "Bayern Munich",  home: "VFL Wolfsburg",  away: "Bayern Munich",  odds: "1.59" },
      { market: "Match Winner", selection: "Juventus Turin", home: "US Lecce",        away: "Juventus Turin", odds: "1.44" },
      { market: "Match Winner", selection: "Manchester City",home: "Manchester City", away: "Brentford FC",   odds: "1.39" },
    ],
  },
  {
    user: "Ikharia1",
    initial: "I",
    boost: "3% PROFIT BOOST",
    league: "Premier League, LaLiga",
    status: "PENDING",
    title: "11 Selection Multi",
    oldOdds: "4.56",
    stake: "200",
    payout: "934",
    legs: [
      { market: "Total", selection: "under 4.5", home: "Crystal Palace",    away: "Everton FC",      odds: "1.14" },
      { market: "Total", selection: "over 1.5",  home: "Nottingham Forest", away: "Newcastle United", odds: "1.24" },
      { market: "Total", selection: "under 4.5", home: "Burnley FC",        away: "Aston Villa",     odds: "1.18" },
      { market: "Total", selection: "over 0.5",  home: "RCD Mallorca",      away: "Villarreal CF",   odds: "1.04" },
    ],
  },
];

function AllSportsView() {
  const { strings, palette } = useStudio();
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
                <span style={{ color: pickContrastText(palette.activeSecondaryGradientColor) }}>{s.icon}</span>
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
  const { strings, palette } = useStudio();
  const primaryText = pickContrastText(palette.primary);

  // boosted odds = total of all leg odds multiplied (simplified display)
  const boostedOdds = post.legs
    ? post.legs.reduce((acc, l) => acc * parseFloat(l.odds), 1).toFixed(2)
    : null;
  const displayOdds = boostedOdds ?? (post.pick?.odds ?? "");

  return (
    <div
      className="rounded-xl mb-3 overflow-hidden"
      style={{ background: "var(--p-dark)", border: "1px solid var(--p-border-and-gradient-bg)" }}
    >
      {/* Header row: avatar + username + boost badge */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <div
          className="h-8 w-8 rounded-full grid place-items-center text-[11px] font-black flex-shrink-0 overflow-hidden"
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
            className="text-[8px] font-bold px-2 py-1 rounded-md flex-shrink-0"
            style={{ background: "var(--p-modal-background)", color: "var(--p-light-text-color)" }}
          >
            {post.boost}
          </span>
        )}
      </div>

      {/* League + status row */}
      <div className="flex items-center justify-between px-3 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <CircleDot className="h-3 w-3 flex-shrink-0" style={{ color: "var(--p-text-secondary-color)" }} />
          <span className="text-[10px] truncate" style={{ color: "var(--p-text-secondary-color)" }}>
            {post.league}
          </span>
        </div>
        {post.status && (
          <span
            className="text-[8.5px] font-black px-2.5 py-1 rounded-full flex-shrink-0"
            style={{
              background: post.status === "PENDING" ? "var(--p-primary)"
                : post.status === "WON" ? "var(--p-won-color)"
                : post.status === "LOST" ? "var(--p-lost-color)"
                : "var(--p-primary)",
              color: post.status === "WON" ? "rgba(0,0,0,0.85)" : primaryText,
            }}
          >
            {post.status}
          </span>
        )}
      </div>

      {/* Title + odds row */}
      <div className="flex items-baseline justify-between px-3 mb-2.5">
        <div className="text-[14px] font-black" style={{ color: "var(--p-light-text-color)" }}>
          {post.title}
        </div>
        <div className="flex items-center gap-1.5">
          {post.oldOdds && (
            <span
              className="text-[12px] line-through"
              style={{ color: "var(--p-text-secondary-color)" }}
            >
              {post.oldOdds}
            </span>
          )}
          <span className="text-[14px] font-black" style={{ color: "var(--p-light-text-color)" }}>
            {displayOdds}
          </span>
          <Zap className="h-3.5 w-3.5" style={{ color: "var(--p-primary)" }} />
        </div>
      </div>

      {/* Leg cards — BetCorrect exact format */}
      {post.legs && post.legs.length > 0 && (
        <div className="px-3 space-y-2 mb-2">
          {post.legs.map((leg, i) => (
            <div
              key={i}
              className="rounded-xl p-2.5"
              style={{ background: "var(--p-primary-background-color)", border: "1px solid var(--p-border-and-gradient-bg)" }}
            >
              {/* Top row: team logo + market + selection + odds */}
              <div className="flex items-start gap-2 mb-1.5">
                <div
                  className="h-7 w-7 rounded-lg grid place-items-center flex-shrink-0"
                  style={{ background: "color-mix(in oklab, var(--p-primary) 20%, transparent)" }}
                >
                  <TeamDot label={leg.home} size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] font-semibold" style={{ color: "var(--p-primary)" }}>
                    {leg.market}
                  </div>
                  <div className="text-[11px] font-bold" style={{ color: "var(--p-light-text-color)" }}>
                    {leg.selection}
                  </div>
                </div>
                <span className="text-[12px] font-black flex-shrink-0" style={{ color: "var(--p-primary)" }}>
                  {leg.odds}
                </span>
              </div>
              {/* VS row: home team | VS | away team */}
              <div className="flex items-center justify-between text-[9px]">
                <div className="flex items-center gap-1 min-w-0 flex-1">
                  <TeamDot label={leg.home} size={13} />
                  <span className="truncate" style={{ color: "var(--p-light-text-color)" }}>{leg.home}</span>
                </div>
                <span
                  className="mx-2 flex-shrink-0 text-[8px] font-bold"
                  style={{ color: "var(--p-secondary)" }}
                >
                  VS
                </span>
                <div className="flex items-center gap-1 min-w-0 flex-1 justify-end">
                  <span className="truncate" style={{ color: "var(--p-light-text-color)" }}>{leg.away}</span>
                  <TeamDot label={leg.away} size={13} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Single pick (non-multi) */}
      {post.pick && !post.legs && (
        <div
          className="mx-3 rounded-xl p-2.5 mb-2"
          style={{ background: "var(--p-primary-background-color)", border: "1px solid var(--p-border-and-gradient-bg)" }}
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <div className="text-[9px] font-semibold" style={{ color: "var(--p-primary)" }}>
                {post.pick.market}
              </div>
              <div className="text-[12px] font-bold" style={{ color: "var(--p-light-text-color)" }}>
                {post.pick.selection}
              </div>
            </div>
            <span className="text-[14px] font-black ml-2" style={{ color: "var(--p-primary)" }}>
              {post.pick.odds}
            </span>
          </div>
        </div>
      )}

      {/* Stake / payout + actions */}
      <div
        className="flex items-center justify-between px-3 py-2 border-t"
        style={{ borderColor: "var(--p-border-and-gradient-bg)" }}
      >
        <span style={{ fontSize: 11, color: "var(--p-text-secondary-color)" }}>
          {strings.STAKE}
        </span>
        <span className="font-bold text-[11px]" style={{ color: "var(--p-light-text-color)" }}>
          {currencySymbol} {post.stake}
        </span>
        <span className="font-bold text-[11px]" style={{ color: "var(--p-light-text-color)" }}>
          {currencySymbol} {post.payout}
        </span>
        <span style={{ fontSize: 11, color: "var(--p-text-secondary-color)" }}>
          {strings.PAYOUT}
        </span>
      </div>

      {/* Reaction row */}
      <div
        className="flex items-center gap-4 px-3 pb-2.5 text-[11px]"
        style={{ color: "var(--p-text-secondary-color)" }}
      >
        <Heart className="h-4 w-4" />
        <MessageCircle className="h-4 w-4" />
        <ArrowLeftRight className="h-4 w-4" />
        <span className="ml-auto">
          <Share2 className="h-4 w-4" />
        </span>
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
  const posts: SocialPost[] = socialTab === "explore" ? [
    {
      user: "Ikharia1",
      initial: "I",
      boost: "3% PROFIT BOOST",
      league: "Premier League, LaLiga",
      status: "PENDING",
      title: "11 Selection Multi",
      oldOdds: "4.56",
      stake: "200",
      payout: "934",
      legs: [
        { market: "Total", selection: "under 4.5", home: "Crystal Palace",    away: "Everton FC",      odds: "1.14" },
        { market: "Total", selection: "over 1.5",  home: "Nottingham Forest", away: "Newcastle United", odds: "1.24" },
        { market: "Total", selection: "under 4.5", home: "Burnley FC",        away: "Aston Villa",     odds: "1.18" },
        { market: "Total", selection: "over 0.5",  home: "RCD Mallorca",      away: "Villarreal CF",   odds: "1.04" },
      ],
    },
  ] : FRIENDS_POSTS;
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

const BettingAppPreview = ({ viewMode, readOnly = false, clientId }: { viewMode?: "mobile" | "web"; readOnly?: boolean; clientId?: string } = {}) => {
  const { palette, appIcons, previewMode, headingFont, strings } = useStudio();
  const isMobile = viewMode !== undefined ? viewMode === "mobile" : previewMode === "mobile";
  const isKMK = clientId === KMK_CLIENT_ID;
  const effectiveStrings = isKMK ? { ...strings, ...MYBET_STRINGS_OVERRIDES } : strings;
  const effectiveAppName = isKMK ? "MyBet.Africa" : strings.APP_NAME;
  const [showModal, setShowModal] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const paletteStyle = useMemo(
    () => ({
      ...paletteToInlineStyle(palette, { fontFamily: headingFont + ", sans-serif" }),
      ...(isKMK ? MYBET_OVERRIDES : {}),
    }),
    [palette, headingFont, isKMK],
  );

  const handleSimulateNotification = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div
      className="flex flex-col items-center w-full h-full overflow-hidden"
      style={paletteStyle}
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
          style={{ background: "var(--p-primary-button)", color: pickContrastText(palette.primaryButton) }}
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
            width: "min(340px, calc((100vh - 220px) * 340 / 700))",
            height: "min(700px, calc(100vh - 220px))",
            aspectRatio: "340 / 700",
            border: "3px solid #1a1a1a",
            background: "var(--p-primary-background-color)",
            flexShrink: 0,
          }}
        >
          <MobilePreview
            appName={effectiveAppName}
            currencySymbol={effectiveStrings.CURRENCY_SYMBOL}
            logoUrl={appIcons.appNameLogo}
            clientId={clientId}
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
          <WebPreview appName={effectiveAppName} logoUrl={appIcons.appNameLogo} currencySymbol={effectiveStrings.CURRENCY_SYMBOL} clientId={clientId} />
        </div>
      )}
      </div>
    </div>
  );
};

export default BettingAppPreview;
