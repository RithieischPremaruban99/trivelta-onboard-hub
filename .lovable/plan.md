## Goal

Bring the mobile preview (`MobilePreview` in `src/components/studio/BettingAppPreview.tsx`) to the same fidelity level the web preview just reached, so the six uploaded mobile screenshots match 1:1.

## Scope (per uploaded screenshot)

**1. Bottom tab bar — global**
- 5 tabs: home / Sports / Discovery / Casino / Profile.
- Active tab uses `--p-primary` icon + label and a soft circular glow behind the icon.
- Profile tab renders the user's `TN` avatar circle (instead of a generic icon); active state wraps it in a primary-tinted ring.

**2. Top nav (sports/feed/discovery/casino screens)**
- Left: round chat/logo bubble.
- Center: dark wallet pill (`₦  ****  +  eye-off`).
- Right: bell with notification dot, message-circle button.

**3. Profile screen (Screenshot 19.54.54)**
- Header: `ProviderTest` left, settings + bell + chat right.
- Avatar row: large TN circle + Wins / Following / Followers stats with vertical dividers (Following/Followers values in primary color).
- Naira balance card (orange gradient) with `₦ ****`, "Naira" label, eye-off + plus button on the right.
- "Available Bonuses (1)" header.
- Welcome Bonus card: orange gradient, "WELCOME BONUS" title, descriptive subtitle, expand chevron.
- Refer friends card: orange-bordered, icon + copy + "Refer friends" CTA.
- My Bets / My Feed tabs with gradient underline.
- All / Pending / Settled / P2P Bets pill row (All active = orange gradient pill).

**4. Sports landing (Screenshot 19.54.11)**
- Quick tile row: All Sports / Live Spo… / Football / Load Co… / Virtuals / Gamers… (last one in active orange box).
- BetBuilder + Peer-to-Peer dual buttons.
- Welcome bonus banner with chevron.
- "Live & Upcoming" section with Football/Basketball/Tennis sport switch and 3 horizontally-scrolling live cards (with NBA logos: MUR/BAS, CEL/BOS, GUE/DAK).
- Sport tabs (Football/Basketball/Tennis) with active orange underline.
- Football section header with SEE MORE.
- League pills (Premier League active).
- Bet-type pills (1X2 active).

**5. Sports list / matches (Screenshot 19.54.45)**
- Live cards row at top.
- Match cards: live badge, team logos + names, 1X2 odds grid, Stats footer + MORE BETS button (with optional `SGP` badge).

**6. Game Detail (Screenshot 19.54.24)**
- Header: back chevron, "Premier League" title centered.
- LIVE badge left + Scoreboard / Action Tracker segmented switch right.
- Hero with blurred radial glows on left+right team logos, score 1:0, time 2H – 66'.
- Popular / Goals segmented tabs.
- Game Line accordion (open) with 1/X/2 odds grid.
- Collapsible rows: Total, Both teams to score, Double chance, Draw no bet.

**7. Feed / Friends + Explore (Screenshots 19.53.59 & 19.54.04)**
- Friends / Explore top tabs with gradient underline.
- Post card: avatar + handle left, `5% PROFIT BOOST` chip right.
- League line (e.g. "Bundesliga, Serie A") + PENDING badge.
- "N Selection Multi" title + old odds (struck-through) + new odds (primary) + lightning bolt.
- Leg rows: team logo, market label ("Match Winner" / "Total"), pick text, VS in primary, opposing team logo + odds in primary/won color.

## Implementation

All work stays in `src/components/studio/BettingAppPreview.tsx` inside `MobilePreview`. Reuse existing helpers:
- `TeamDot` for football + NBA logos
- `pickContrastText(palette.primary)` for active CTA contrast
- All `--p-*` palette CSS vars (no hard-coded colors)
- Existing `SOCIAL_POSTS`, `MATCHES`, `FOOTBALL_LEAGUES`, `BASKETBALL_LEAGUES`, `TENNIS_TOURNAMENTS`, `LIVE_UPCOMING` data

### Steps (each step ends with a TS check, no business logic touched)

1. **Bottom tab bar** — refactor the existing `MobileBottomNav` block to use 5 tabs with TN-avatar Profile slot + active glow.
2. **Top nav** — wrap shared TopNav into a small inline component (chat bubble / wallet pill / bell+dot / message).
3. **Profile screen (`activeNav === 4`)** — new `renderMobileProfileView()`: header, stats row, Naira card, bonus cards, Refer card, My Bets/My Feed tabs, filter pills, bet cards (reuse profile bet data shape from web).
4. **Sports landing** — quick tile row (with active state), BetBuilder/P2P buttons row, welcome bonus banner, Live & Upcoming sport-switch + horizontal cards.
5. **Sports list polish** — live cards row above league section; Stats + MORE BETS footer with `SGP` badge variant.
6. **Game Detail mobile** — back nav + title, LIVE/Scoreboard/Action Tracker row, hero with two radial glows, Popular/Goals tabs, Game Line open accordion, 4 collapsible market rows.
7. **Feed view** — Friends/Explore tabs, large post cards with PROFIT BOOST chip, "N Selection Multi" header with odds-boost row, leg cards.

### Out of scope

- No backend/data changes. Same palette tokens, same `tcm-strings` keys.
- No new routes. Mobile preview is still the same component switched via the existing device viewport toggle.
- Casino tab keeps its current `CasinoContent variant="mobile"` rendering.

## Verification

After each step: `bunx tsc --noEmit`. Final pass: switch preview viewport to mobile and visually compare each of the 6 uploaded screenshots side-by-side.
