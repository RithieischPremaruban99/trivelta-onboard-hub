export type SportScheduleType = "nba" | "football" | "basketball" | "tennis";

export type NbaMatch = {
  id: string;
  date: string;
  home: string;
  away: string;
  league: string;
  spread: { home: string; away: string };
  moneyline: { home: string; away: string };
  total: { over: string; under: string };
};

export type FootballMatch = {
  id: string;
  date: string;
  home: string;
  away: string;
  odds: [string, string, string];
  live?: boolean;
};

export type FootballLeague = {
  name: string;
  country: string;
  matches: FootballMatch[];
};

export type BetMarketContent =
  | {
      type: "table";
      columns: string[];
      rows: { team: string; values: string[] }[];
      leagueLabel?: string;
    }
  | { type: "placeholder" };

export type BetMarket = {
  id: string;
  title: string;
  hasSGP: boolean;
  defaultExpanded: boolean;
  content: BetMarketContent;
};

export const NBA_BET_TYPES = [
  "Games",
  "Handicap (incl. overtime)",
  "O/U (incl. overtime)",
  "HT/FT Result",
  "Will there be overtime",
  "Odd/even (incl. overtime)",
];

export const FOOTBALL_BET_TYPES = [
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

export const NBA_TOP_TABS = ["Schedule", "Players", "Futures"];
export const FOOTBALL_TOP_TABS = ["Upcoming", "Top Leagues", "All"];
export const GAME_DETAIL_TABS = ["Popular", "Win Quick", "Player Combos", "Halves"];

export const NBA_SCHEDULE: NbaMatch[] = [
  {
    id: "nba-1",
    date: "TOMORROW 1:00 AM",
    home: "Knicks",
    away: "76ers",
    league: "NBA - USA",
    spread: { home: "+1.5 1.89", away: "-1.5 1.89" },
    moneyline: { home: "1.98", away: "1.80" },
    total: { over: "O 214.5 1.89", under: "U 214.5 1.88" },
  },
  {
    id: "nba-2",
    date: "TOMORROW 3:30 AM",
    home: "Spurs",
    away: "Timberwolves",
    league: "NBA - USA",
    spread: { home: "+8.5 1.89", away: "-8.5 1.89" },
    moneyline: { home: "3.50", away: "1.34" },
    total: { over: "O 226.5 1.87", under: "U 226.5 1.91" },
  },
  {
    id: "nba-3",
    date: "TOMORROW 9:00 PM",
    home: "Pistons",
    away: "Cavaliers",
    league: "NBA - USA",
    spread: { home: "+9.5 1.90", away: "-9.5 1.88" },
    moneyline: { home: "3.80", away: "1.28" },
    total: { over: "O 218.5 1.89", under: "U 218.5 1.89" },
  },
  {
    id: "nba-4",
    date: "10 MAY 2:30 AM",
    home: "Thunder",
    away: "Lakers",
    league: "NBA - USA",
    spread: { home: "+2.5 1.90", away: "-2.5 1.88" },
    moneyline: { home: "2.15", away: "1.72" },
    total: { over: "O 220.5 1.88", under: "U 220.5 1.90" },
  },
];

export const FOOTBALL_LEAGUES: FootballLeague[] = [
  {
    name: "Premier League - England",
    country: "England",
    matches: [
      { id: "pl-1", date: "LIVE · Not started", home: "Manchester City", away: "Arsenal FC", odds: ["1.85", "3.55", "4.15"], live: true },
      { id: "pl-2", date: "TOMORROW · 9:00 PM", home: "Crystal Palace", away: "West Ham United", odds: ["2.46", "3.35", "3.10"] },
      { id: "pl-3", date: "21 APR · 9:00 PM", home: "Brighton & Hove Albion", away: "Chelsea FC", odds: ["2.50", "3.75", "2.75"] },
      { id: "pl-4", date: "22 APR · 9:00 PM", home: "AFC Bournemouth", away: "Leeds United", odds: ["2.10", "3.65", "3.60"] },
      { id: "pl-5", date: "22 APR · 9:00 PM", home: "Burnley FC", away: "Manchester City", odds: ["12.00", "7.20", "1.24"] },
      { id: "pl-6", date: "24 APR · 9:00 PM", home: "Sunderland AFC", away: "Nottingham Forest", odds: ["2.90", "3.35", "2.60"] },
      { id: "pl-7", date: "25 APR · 1:30 PM", home: "Fulham FC", away: "Aston Villa", odds: ["2.70", "3.65", "2.60"] },
      { id: "pl-8", date: "25 APR · 4:00 PM", home: "Wolverhampton Wanderers", away: "Tottenham Hotspur", odds: ["4.10", "3.85", "1.90"] },
    ],
  },
  {
    name: "MSFL - Czechia",
    country: "CZ",
    matches: [
      {
        id: "fl-1",
        date: "TODAY 4:30 PM",
        home: "TJ Unie Hlubina",
        away: "FC Zbrojovka Brno B",
        odds: ["2.44", "3.70", "2.38"],
      },
      {
        id: "fl-2",
        date: "TODAY 4:30 PM",
        home: "FK Blansko",
        away: "SK Unicov",
        odds: ["2.60", "3.60", "2.26"],
      },
    ],
  },
  {
    name: "Parva Liga - Bulgaria",
    country: "BG",
    matches: [
      {
        id: "fl-3",
        date: "TODAY 4:30 PM",
        home: "PFC Lokomotiv Plovdiv",
        away: "FC Arda Kardzhali",
        odds: ["2.47", "2.95", "2.80"],
      },
    ],
  },
  {
    name: "Virsliga - Latvia",
    country: "LV",
    matches: [
      {
        id: "fl-4",
        date: "TODAY 4:30 PM",
        home: "BFC Daugavpils",
        away: "Riga FC",
        odds: ["9.20", "5.60", "1.23"],
      },
    ],
  },
  {
    name: "2. Liga - Slovakia",
    country: "SK",
    matches: [
      {
        id: "fl-5",
        date: "TODAY 5:00 PM",
        home: "Slavia TU Kosice",
        away: "FK Inter Bratislava",
        odds: ["1.75", "3.85", "3.75"],
      },
    ],
  },
  {
    name: "MLS Next Pro - USA",
    country: "US",
    matches: [
      {
        id: "fl-6",
        date: "TODAY 5:00 PM",
        home: "Toronto FC II",
        away: "Red Bull New York II",
        odds: ["4.30", "4.00", "1.62"],
      },
    ],
  },
];

export const NBA_GAME_DETAIL_MARKETS: BetMarket[] = [
  {
    id: "game-line",
    title: "Game Line",
    hasSGP: true,
    defaultExpanded: true,
    content: {
      type: "table",
      columns: ["Spread", "Moneyline", "Total"],
      rows: [
        { team: "Knicks", values: ["+1.5 1.89", "1.98", "O 214.5 1.89"] },
        { team: "76ers", values: ["-1.5 1.89", "1.80", "U 214.5 1.88"] },
      ],
      leagueLabel: "NBA - USA · TOMORROW 1:00 AM",
    },
  },
  {
    id: "halftime-fulltime",
    title: "Halftime/fulltime",
    hasSGP: true,
    defaultExpanded: false,
    content: { type: "placeholder" },
  },
  {
    id: "first-point-scorer",
    title: "First Point Scorer (incl. Overtime)",
    hasSGP: true,
    defaultExpanded: false,
    content: { type: "placeholder" },
  },
  {
    id: "1st-half-handicap",
    title: "1st half - handicap",
    hasSGP: true,
    defaultExpanded: false,
    content: { type: "placeholder" },
  },
  {
    id: "overtime",
    title: "Will there be overtime",
    hasSGP: true,
    defaultExpanded: false,
    content: { type: "placeholder" },
  },
];
