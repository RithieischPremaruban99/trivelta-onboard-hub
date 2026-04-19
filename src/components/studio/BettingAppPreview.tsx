import { useState } from 'react';
import { useStudio } from '@/contexts/StudioContext';
import {
  Bell, Search, Wallet, Home, Trophy, Gamepad2, Compass, User,
  Flame, Radio, ChevronRight, Shield, Crown, Target, Swords, Star,
  TrendingUp, Zap, Heart, Play, Gift, Clock, Users, MessageCircle,
} from 'lucide-react';

/* ─── Static data ──────────────────────────────────────────────────────── */

const liveMatches = [
  { id: 1, league: 'Premier League · MD 24', time: "67'", home: { name: 'Arsenal', abbr: 'ARS' }, away: { name: 'Chelsea', abbr: 'CHE' }, score: '2 - 1', odds: { home: '1.45', draw: '4.50', away: '6.00' } },
  { id: 2, league: 'La Liga · MD 22', time: "52'", home: { name: 'Barcelona', abbr: 'BAR' }, away: { name: 'Real Madrid', abbr: 'RMA' }, score: '1 - 1', odds: { home: '2.30', draw: '3.20', away: '3.10' } },
  { id: 3, league: 'Serie A · MD 20', time: "38'", home: { name: 'AC Milan', abbr: 'MIL' }, away: { name: 'Inter', abbr: 'INT' }, score: '1 - 0', odds: { home: '1.90', draw: '3.40', away: '4.00' } },
];
const upcomingMatches = [
  { id: 4, league: 'Champions League', dateLabel: 'TOMORROW', date: '21:00', home: { name: 'Man City', abbr: 'MCI' }, away: { name: 'Bayern', abbr: 'BAY' }, odds: { home: '2.20', draw: '3.40', away: '3.00' } },
  { id: 5, league: 'Champions League', dateLabel: 'TOMORROW', date: '21:00', home: { name: 'PSG', abbr: 'PSG' }, away: { name: 'Juventus', abbr: 'JUV' }, odds: { home: '1.80', draw: '3.60', away: '4.20' } },
];
const teamColors: Record<string, string> = {
  ARS: '#EF0107', CHE: '#034694', BAR: '#A50044', RMA: '#FEBE10',
  MIL: '#FB090B', INT: '#010E80', MCI: '#6CABDD', BAY: '#DC052D',
  PSG: '#004170', JUV: '#1C1C1C',
};

const casinoGames = [
  { name: 'Lucky Spins', icon: Zap, tag: 'HOT', players: 1243 },
  { name: 'Golden Rush', icon: Crown, tag: 'NEW', players: 892 },
  { name: 'Mega Fortune', icon: Star, tag: 'TOP', players: 2101 },
  { name: 'Diamond Blitz', icon: Gift, tag: 'HOT', players: 756 },
  { name: 'Jackpot City', icon: Trophy, tag: 'LIVE', players: 1567 },
  { name: 'Wild Safari', icon: Flame, tag: 'NEW', players: 432 },
];

const feedPosts = [
  { user: 'Mike_Bets', time: '2m ago', text: 'Arsenal to win @ 1.45 🔥 Easy money!', likes: 34, comments: 12, type: 'bet' },
  { user: 'ProPunter', time: '15m ago', text: 'Barcelona vs Real Madrid — backing the draw. Form says it all.', likes: 89, comments: 28, type: 'analysis' },
  { user: 'LuckyAce', time: '1h ago', text: 'Just hit a 5-fold acca! 🎉 +₦45,000', likes: 156, comments: 43, type: 'win' },
];

const discoveryItems = [
  { title: 'Top Tipsters', desc: 'Follow the best', icon: TrendingUp, count: '2.4k tipsters' },
  { title: 'Bet Challenges', desc: 'Compete & win', icon: Swords, count: '12 active' },
  { title: 'Communities', desc: 'Join groups', icon: Users, count: '340 groups' },
  { title: 'Live Streams', desc: 'Watch & bet', icon: Play, count: '8 live now' },
];

/* ─── Shared sub-components ───────────────────────────────────────────── */

const TeamBadge = ({ abbr, color }: { abbr: string; color: string }) => (
  <div
    className="w-6 h-6 rounded-full flex items-center justify-center text-[7px] font-black tracking-tight border border-white/10 flex-shrink-0"
    style={{ background: color }}
  >
    {abbr}
  </div>
);

const SharedTopSection = ({ appLabels, appIcons }: { appLabels: { signIn: string; currencySymbol: string }; appIcons: { appNameLogo: string | null; topLeftAppIcon: string | null } }) => (
  <>
    <div className="flex items-center justify-between px-4 mt-3">
      <span className="text-[11px] font-medium" style={{ color: 'var(--p-text)' }}>{appLabels.signIn}</span>
      <button
        className="px-4 py-1.5 rounded-full text-[10px] font-bold"
        style={{
          background: 'linear-gradient(135deg, var(--p-btn), var(--p-btn-grad))',
          color: 'var(--p-text)',
          boxShadow: '0 0 10px rgba(0,0,0,0.3)',
        }}
      >
        Create Account
      </button>
    </div>
    <div className="px-4 mt-2">
      <div
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <Shield className="w-3 h-3" style={{ color: 'var(--p-primary)' }} />
        <span className="text-[9px] font-semibold" style={{ color: 'var(--p-primary)' }}>18+ | Responsible Gaming</span>
      </div>
    </div>
  </>
);

const GamificationBanner = () => (
  <div className="px-4 mt-3">
    <div
      className="rounded-xl p-2.5 flex items-center gap-2.5"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, var(--p-btn), var(--p-btn-grad))', opacity: 0.9 }}
      >
        <Crown className="w-4 h-4" style={{ color: 'var(--p-text)' }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold" style={{ color: 'var(--p-text)' }}>Level 12</span>
          <Flame className="w-2.5 h-2.5" style={{ color: 'var(--p-secondary)' }} />
          <span className="text-[9px] font-bold" style={{ color: 'var(--p-secondary)' }}>4-day streak</span>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--p-border1)' }}>
            <div className="h-full rounded-full" style={{ width: '78%', background: 'linear-gradient(to right, var(--p-btn), var(--p-btn-grad))' }} />
          </div>
          <span className="text-[8px]" style={{ color: 'var(--p-muted)' }}>2,340 / 3,000 XP</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <div className="flex items-center gap-0.5">
            <Target className="w-2 h-2" style={{ color: 'var(--p-primary)' }} />
            <span className="text-[8px]" style={{ color: 'var(--p-muted)' }}>2/4 missions</span>
          </div>
          <div className="flex items-center gap-0.5">
            <Trophy className="w-2 h-2" style={{ color: 'var(--p-primary)' }} />
            <span className="text-[8px]" style={{ color: 'var(--p-muted)' }}>3/8 badges</span>
          </div>
        </div>
      </div>
      <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--p-primary)' }} />
    </div>
  </div>
);

/* ─── Tab content ──────────────────────────────────────────────────────── */

const FeedContent = ({ currencySymbol }: { currencySymbol: string }) => (
  <>
    <div className="px-4 mt-3">
      <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {['You', 'Mike', 'Sarah', 'ProP', 'Lucky'].map((name, i) => (
          <div key={name} className="flex flex-col items-center gap-1 flex-shrink-0">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-[9px] font-bold"
              style={{
                border: i === 0 ? '2px dashed rgba(255,255,255,0.15)' : '2px solid var(--p-primary)',
                color: 'var(--p-text)',
                background: i === 0 ? 'transparent' : 'var(--p-border1)',
              }}
            >
              {i === 0 ? '+' : name[0]}
            </div>
            <span className="text-[8px]" style={{ color: 'var(--p-muted)' }}>{name}</span>
          </div>
        ))}
      </div>
    </div>
    <div className="px-4 mt-3 space-y-2">
      {feedPosts.map((post, i) => (
        <div
          key={i}
          className="rounded-xl p-3"
          style={{ background: 'var(--p-border1)', border: '1px solid rgba(255,255,255,0.04)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold"
              style={{ background: 'linear-gradient(135deg, var(--p-btn), var(--p-btn-grad))', color: 'var(--p-text)' }}
            >
              {post.user[0]}
            </div>
            <div className="flex-1">
              <span className="text-[10px] font-bold" style={{ color: 'var(--p-text)' }}>{post.user}</span>
              <span className="text-[8px] ml-1.5" style={{ color: 'var(--p-muted)' }}>{post.time}</span>
            </div>
            {post.type === 'win' && (
              <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: 'rgba(34,197,94,0.15)', color: 'var(--p-won1)' }}>WIN</span>
            )}
          </div>
          <p className="text-[10px] leading-relaxed mb-2" style={{ color: 'var(--p-text)' }}>{post.text}</p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Heart className="w-3 h-3" style={{ color: 'var(--p-muted)' }} />
              <span className="text-[9px]" style={{ color: 'var(--p-muted)' }}>{post.likes}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" style={{ color: 'var(--p-muted)' }} />
              <span className="text-[9px]" style={{ color: 'var(--p-muted)' }}>{post.comments}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
    <div className="px-4 mt-3 mb-4">
      <div className="flex items-center gap-1.5 mb-2">
        <TrendingUp className="w-3.5 h-3.5" style={{ color: 'var(--p-primary)' }} />
        <span className="text-[11px] font-bold" style={{ color: 'var(--p-text)' }}>Trending Bets</span>
      </div>
      <div className="flex gap-2">
        {['Arsenal Win', 'Over 2.5', 'BTTS Yes'].map((bet) => (
          <div
            key={bet}
            className="px-3 py-1.5 rounded-full text-[9px] font-semibold"
            style={{ background: 'var(--p-inactive)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--p-primary)' }}
          >
            {bet}
          </div>
        ))}
      </div>
    </div>
  </>
);

const SportsContent = ({ currencySymbol, activeSportsTab, setActiveSportsTab }: { currencySymbol: string; activeSportsTab: number; setActiveSportsTab: (i: number) => void }) => (
  <>
    {/* Welcome Bonus Banner */}
    <div className="px-4 mt-3">
      <div
        className="rounded-xl p-3 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, var(--p-btn), var(--p-btn-grad))',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <span
              className="text-[8px] font-bold uppercase tracking-wider"
              style={{ color: 'rgba(255,255,255,0.65)' }}
            >
              Welcome Bonus
            </span>
            <p className="text-[15px] font-black mt-0.5 leading-tight" style={{ color: 'var(--p-text)' }}>
              100% up to ₦50,000
            </p>
            <p className="text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.75)' }}>
              First deposit · T&amp;Cs apply
            </p>
            <button
              className="mt-2 px-3 py-1 rounded-lg text-[9px] font-bold"
              style={{ background: 'rgba(255,255,255,0.18)', color: 'var(--p-text)', border: '1px solid rgba(255,255,255,0.25)' }}
            >
              Claim Now
            </button>
          </div>
          <Gift className="w-10 h-10 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.2)' }} />
        </div>
      </div>
    </div>

    {/* BetBuilder / Peer-to-Peer tab bar */}
    <div className="px-4 mt-3">
      <div
        className="flex gap-1 p-1 rounded-xl"
        style={{ background: 'var(--p-border1)' }}
      >
        {['BetBuilder', 'Peer-to-Peer'].map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveSportsTab(i)}
            className="flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all"
            style={{
              background: activeSportsTab === i ? 'linear-gradient(135deg, var(--p-btn), var(--p-btn-grad))' : 'transparent',
              color: activeSportsTab === i ? 'var(--p-text)' : 'var(--p-muted)',
            }}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>

    {/* Sport categories */}
    <div className="grid grid-cols-4 gap-1.5 px-4 mt-3">
      {[
        { icon: Flame, label: 'Top Bets', active: true },
        { icon: Radio, label: 'Live', active: false },
        { icon: Trophy, label: 'All Sports', active: false },
        { icon: Star, label: 'My Bets', active: false },
      ].map((cat) => {
        const Icon = cat.icon;
        return (
          <div
            key={cat.label}
            className="flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border"
            style={{
              background: cat.active ? 'rgba(255,255,255,0.06)' : 'var(--p-border1)',
              borderColor: cat.active ? 'var(--p-primary)' : 'rgba(255,255,255,0.04)',
            }}
          >
            <Icon style={{ color: cat.active ? 'var(--p-primary)' : 'var(--p-muted)', width: 16, height: 16 }} />
            <p className="text-[8px] font-bold text-center" style={{ color: cat.active ? 'var(--p-text)' : 'var(--p-muted)' }}>{cat.label}</p>
          </div>
        );
      })}
    </div>

    {/* Live matches */}
    <div className="px-4 mt-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--p-secondary)' }} />
          <span className="text-[11px] font-bold" style={{ color: 'var(--p-secondary)' }}>LIVE</span>
        </div>
        <div className="flex items-center gap-0.5 text-[10px] font-semibold" style={{ color: 'var(--p-primary)' }}>
          All <ChevronRight className="w-3 h-3" />
        </div>
      </div>
      <div className="space-y-2">
        {liveMatches.map((match) => (
          <div
            key={match.id}
            className="rounded-xl overflow-hidden"
            style={{ background: 'var(--p-border1)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <div className="flex items-center justify-between px-3 py-1.5">
              <span className="text-[8px] font-medium" style={{ color: 'var(--p-muted)' }}>{match.league}</span>
              <div className="flex items-center gap-1">
                <span className="w-1 h-1 rounded-full animate-pulse" style={{ background: 'var(--p-secondary)' }} />
                <span className="text-[8px] font-bold" style={{ color: 'var(--p-secondary)' }}>{match.time}</span>
              </div>
            </div>
            <div className="px-3 pb-2">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <TeamBadge abbr={match.home.abbr} color={teamColors[match.home.abbr] ?? '#444'} />
                  <span className="text-[10px] font-bold" style={{ color: 'var(--p-text)' }}>{match.home.name}</span>
                </div>
                <span className="text-[12px] font-black px-2" style={{ color: 'var(--p-primary)' }}>{match.score}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold" style={{ color: 'var(--p-text)' }}>{match.away.name}</span>
                  <TeamBadge abbr={match.away.abbr} color={teamColors[match.away.abbr] ?? '#444'} />
                </div>
              </div>
              <div className="flex gap-1.5">
                {[
                  { label: '1', value: match.odds.home, active: true },
                  { label: 'X', value: match.odds.draw, active: false },
                  { label: '2', value: match.odds.away, active: false },
                ].map((odd) => (
                  <button
                    key={odd.label}
                    className="flex-1 flex flex-col items-center py-1.5 rounded-lg border transition-all"
                    style={{
                      background: odd.active ? 'var(--p-inactive)' : 'var(--p-border2)',
                      borderColor: odd.active ? 'var(--p-primary)' : 'rgba(255,255,255,0.05)',
                    }}
                  >
                    <span className="text-[7px]" style={{ color: 'var(--p-muted)' }}>{odd.label}</span>
                    <span className="text-[11px] font-bold" style={{ color: 'var(--p-primary)' }}>{odd.value}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Upcoming */}
    <div className="px-4 mt-3 mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold" style={{ color: 'var(--p-text)' }}>Upcoming</span>
        <div className="flex items-center gap-0.5 text-[10px] font-semibold" style={{ color: 'var(--p-primary)' }}>
          View all <ChevronRight className="w-3 h-3" />
        </div>
      </div>
      <div className="space-y-2">
        {upcomingMatches.map((match) => (
          <div
            key={match.id}
            className="rounded-xl p-3"
            style={{ background: 'var(--p-border1)', border: '1px solid rgba(255,255,255,0.04)' }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[8px] font-medium" style={{ color: 'var(--p-muted)' }}>{match.league}</span>
              <div className="flex items-center gap-1">
                <span
                  className="text-[7px] px-1.5 py-0.5 rounded font-semibold"
                  style={{ background: 'var(--p-border2)', color: 'var(--p-muted)' }}
                >
                  {match.dateLabel}
                </span>
                <span className="text-[9px] font-bold" style={{ color: 'var(--p-text)' }}>{match.date}</span>
              </div>
            </div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <TeamBadge abbr={match.home.abbr} color={teamColors[match.home.abbr] ?? '#444'} />
                <span className="text-[10px] font-bold" style={{ color: 'var(--p-text)' }}>{match.home.name}</span>
              </div>
              <span className="text-[9px]" style={{ color: 'var(--p-muted)' }}>vs</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold" style={{ color: 'var(--p-text)' }}>{match.away.name}</span>
                <TeamBadge abbr={match.away.abbr} color={teamColors[match.away.abbr] ?? '#444'} />
              </div>
            </div>
            <div className="flex gap-1.5">
              {[
                { label: '1', value: match.odds.home },
                { label: 'X', value: match.odds.draw },
                { label: '2', value: match.odds.away },
              ].map((odd) => (
                <button
                  key={odd.label}
                  className="flex-1 flex flex-col items-center py-1.5 rounded-lg border"
                  style={{ background: 'var(--p-border2)', borderColor: 'rgba(255,255,255,0.05)' }}
                >
                  <span className="text-[7px]" style={{ color: 'var(--p-muted)' }}>{odd.label}</span>
                  <span className="text-[11px] font-bold" style={{ color: 'var(--p-primary)' }}>{odd.value}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </>
);

const DiscoveryContent = () => (
  <>
    <div className="px-4 mt-3">
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-xl"
        style={{ background: 'var(--p-border1)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <Search className="w-3.5 h-3.5" style={{ color: 'var(--p-muted)' }} />
        <span className="text-[10px]" style={{ color: 'var(--p-muted)' }}>Search tipsters, groups, events…</span>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-2 px-4 mt-3">
      {discoveryItems.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.title}
            className="rounded-xl p-3"
            style={{ background: 'var(--p-border1)', border: '1px solid rgba(255,255,255,0.04)' }}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center mb-2"
              style={{ background: 'var(--p-inactive)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <Icon style={{ color: 'var(--p-primary)', width: 16, height: 16 }} />
            </div>
            <p className="text-[10px] font-bold" style={{ color: 'var(--p-text)' }}>{item.title}</p>
            <p className="text-[8px]" style={{ color: 'var(--p-muted)' }}>{item.desc}</p>
            <span className="text-[8px] font-semibold mt-1 inline-block" style={{ color: 'var(--p-primary)' }}>{item.count}</span>
          </div>
        );
      })}
    </div>
    <div className="px-4 mt-3 mb-4">
      <span className="text-[11px] font-bold" style={{ color: 'var(--p-text)' }}>Popular Tipsters</span>
      <div className="space-y-2 mt-2">
        {['ProPunter', 'BetKing99', 'AccaMaster'].map((name, i) => (
          <div
            key={name}
            className="flex items-center gap-2 p-2.5 rounded-xl"
            style={{ background: 'var(--p-border1)', border: '1px solid rgba(255,255,255,0.04)' }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-bold"
              style={{ background: 'linear-gradient(135deg, var(--p-btn), var(--p-btn-grad))', color: 'var(--p-text)' }}
            >
              {name[0]}
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold" style={{ color: 'var(--p-text)' }}>{name}</p>
              <p className="text-[8px]" style={{ color: 'var(--p-muted)' }}>{78 - i * 5}% win rate · {(1200 + i * 340).toLocaleString()} followers</p>
            </div>
            <button
              className="px-2.5 py-1 rounded-full text-[8px] font-bold"
              style={{ background: 'var(--p-inactive)', color: 'var(--p-primary)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              Follow
            </button>
          </div>
        ))}
      </div>
    </div>
  </>
);

const CasinoContent = () => (
  <>
    <div className="px-4 mt-3">
      <div
        className="rounded-xl p-3 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, var(--p-primary), var(--p-secondary))',
          boxShadow: '0 0 20px rgba(0,0,0,0.5)',
        }}
      >
        <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.7)' }}>Social Casino</span>
        <p className="text-[14px] font-black mt-0.5" style={{ color: 'var(--p-text)' }}>Play &amp; Win Big!</p>
        <p className="text-[9px] mt-1" style={{ color: 'rgba(255,255,255,0.8)' }}>Free coins every day</p>
      </div>
    </div>
    <div className="flex gap-2 px-4 mt-3">
      {['All', 'Slots', 'Table', 'Live'].map((cat, i) => (
        <div
          key={cat}
          className="px-3 py-1.5 rounded-full text-[9px] font-bold"
          style={{
            background: i === 0 ? 'linear-gradient(135deg, var(--p-btn), var(--p-btn-grad))' : 'var(--p-border1)',
            color: i === 0 ? 'var(--p-text)' : 'var(--p-muted)',
          }}
        >
          {cat}
        </div>
      ))}
    </div>
    <div className="grid grid-cols-2 gap-2 px-4 mt-3 mb-4">
      {casinoGames.map((game) => {
        const Icon = game.icon;
        return (
          <div
            key={game.name}
            className="rounded-xl p-3 relative"
            style={{ background: 'var(--p-border1)', border: '1px solid rgba(255,255,255,0.04)' }}
          >
            <span
              className="absolute top-2 right-2 text-[7px] px-1.5 py-0.5 rounded-full font-bold"
              style={{
                background: game.tag === 'HOT' ? 'rgba(239,68,68,0.2)' : game.tag === 'LIVE' ? 'rgba(34,197,94,0.2)' : 'var(--p-inactive)',
                color: game.tag === 'HOT' ? '#ef4444' : game.tag === 'LIVE' ? 'var(--p-won1)' : 'var(--p-primary)',
              }}
            >
              {game.tag}
            </span>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
              style={{ background: 'var(--p-inactive)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <Icon className="w-5 h-5" style={{ color: 'var(--p-primary)' }} />
            </div>
            <p className="text-[10px] font-bold" style={{ color: 'var(--p-text)' }}>{game.name}</p>
            <div className="flex items-center gap-1 mt-1">
              <Users className="w-2.5 h-2.5" style={{ color: 'var(--p-muted)' }} />
              <span className="text-[8px]" style={{ color: 'var(--p-muted)' }}>{game.players.toLocaleString()} playing</span>
            </div>
          </div>
        );
      })}
    </div>
  </>
);

const ProfileContent = ({ currencySymbol }: { currencySymbol: string }) => (
  <>
    <div className="px-4 mt-3">
      <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--p-border1)', border: '1px solid rgba(255,255,255,0.04)' }}>
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-black"
          style={{ background: 'linear-gradient(135deg, var(--p-btn), var(--p-btn-grad))', color: 'var(--p-text)' }}
        >
          J
        </div>
        <div>
          <p className="text-[12px] font-bold" style={{ color: 'var(--p-text)' }}>John Doe</p>
          <p className="text-[9px]" style={{ color: 'var(--p-muted)' }}>@johndoe · Member since 2024</p>
          <div className="flex items-center gap-1 mt-1">
            <Crown className="w-3 h-3" style={{ color: 'var(--p-primary)' }} />
            <span className="text-[9px] font-bold" style={{ color: 'var(--p-primary)' }}>Level 12</span>
          </div>
        </div>
      </div>
    </div>
    <div className="grid grid-cols-3 gap-2 px-4 mt-2">
      {[
        { label: 'Balance', value: `${currencySymbol}1,250` },
        { label: 'Total Bets', value: '342' },
        { label: 'Win Rate', value: '64%' },
      ].map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl p-3 text-center"
          style={{ background: 'var(--p-border1)', border: '1px solid rgba(255,255,255,0.04)' }}
        >
          <p className="text-[12px] font-bold" style={{ color: 'var(--p-primary)' }}>{stat.value}</p>
          <p className="text-[8px] mt-0.5" style={{ color: 'var(--p-muted)' }}>{stat.label}</p>
        </div>
      ))}
    </div>
    <div className="px-4 mt-2 mb-4 space-y-1.5">
      {[
        { icon: Wallet, label: 'Deposit & Withdraw' },
        { icon: Clock, label: 'Betting History' },
        { icon: Star, label: 'Favourites' },
        { icon: Gift, label: 'Bonuses & Rewards' },
        { icon: Shield, label: 'Responsible Gaming' },
        { icon: User, label: 'Account Settings' },
      ].map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className="flex items-center gap-2.5 p-2.5 rounded-xl"
            style={{ background: 'var(--p-border1)', border: '1px solid rgba(255,255,255,0.04)' }}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--p-inactive)' }}>
              <Icon className="w-4 h-4" style={{ color: 'var(--p-primary)' }} />
            </div>
            <span className="text-[10px] font-semibold flex-1" style={{ color: 'var(--p-text)' }}>{item.label}</span>
            <ChevronRight className="w-3.5 h-3.5" style={{ color: 'var(--p-muted)' }} />
          </div>
        );
      })}
    </div>
  </>
);

/* ─── Main component ───────────────────────────────────────────────────── */

const BettingAppPreview = () => {
  const { themeColors, appLabels, previewMode, headingFont, appIcons } = useStudio();
  // Bottom nav: Feed=0, Sports=1, Discovery=2, Casino=3, Profile=4
  const [activeNavTab, setActiveNavTab] = useState(1);
  const [activeSportsTab, setActiveSportsTab] = useState(0);

  const isMobile = previewMode === 'mobile';

  const previewVars = {
    '--p-bg': themeColors.primaryBg,
    '--p-primary': themeColors.primary,
    '--p-secondary': themeColors.secondary,
    '--p-text': themeColors.lightText,
    '--p-muted': themeColors.placeholder,
    '--p-btn': themeColors.primaryButton,
    '--p-btn-grad': themeColors.primaryButtonGradient,
    '--p-inactive': themeColors.inactiveButton,
    '--p-border1': themeColors.headerBorder1,
    '--p-border2': themeColors.headerBorder2,
    '--p-won1': themeColors.wonGradient1,
    '--p-won2': themeColors.wonGradient2,
    '--p-box1': themeColors.boxGradient1,
    '--p-box2': themeColors.boxGradient2,
    '--p-card': themeColors.cardBackground,
    '--p-nav': themeColors.navBarBackground,
    '--p-bottom-nav': themeColors.bottomNavBackground,
    '--p-odds-active': themeColors.oddsButtonActive,
    '--p-odds-inactive': themeColors.oddsButtonInactive,
    '--p-live': themeColors.liveBadge,
    '--p-success': themeColors.successColor,
    '--p-input-bg': themeColors.inputBackground,
    '--p-input-border': themeColors.inputBorder,
    '--p-divider': themeColors.dividerColor,
    fontFamily: headingFont + ', sans-serif',
  } as React.CSSProperties;

  // Nav: Feed, Sports, Discovery, Casino, Profile
  const navItems = [
    { icon: Home, label: appLabels.feed },
    { icon: Trophy, label: appLabels.sportsbook },
    { icon: Compass, label: appLabels.discovery },
    { icon: Gamepad2, label: appLabels.socialCasino },
    { icon: User, label: appLabels.profile },
  ];

  const renderContent = () => {
    switch (activeNavTab) {
      case 0: return (
        <>
          <SharedTopSection appLabels={appLabels} appIcons={appIcons} />
          <GamificationBanner />
          <FeedContent currencySymbol={appLabels.currencySymbol} />
        </>
      );
      case 1: return (
        <>
          <SharedTopSection appLabels={appLabels} appIcons={appIcons} />
          <GamificationBanner />
          <SportsContent
            currencySymbol={appLabels.currencySymbol}
            activeSportsTab={activeSportsTab}
            setActiveSportsTab={setActiveSportsTab}
          />
        </>
      );
      case 2: return (
        <>
          <SharedTopSection appLabels={appLabels} appIcons={appIcons} />
          <DiscoveryContent />
        </>
      );
      case 3: return (
        <>
          <SharedTopSection appLabels={appLabels} appIcons={appIcons} />
          <CasinoContent />
        </>
      );
      case 4: return <ProfileContent currencySymbol={appLabels.currencySymbol} />;
      default: return null;
    }
  };

  return (
    <div className="flex items-center justify-center h-full p-4">
      <div
        className={`relative overflow-hidden shadow-2xl transition-all duration-300 ${
          isMobile
            ? 'w-[340px] h-[700px] rounded-[40px] border-[3px]'
            : 'w-full max-w-[720px] h-[540px] rounded-xl border'
        }`}
        style={{ ...previewVars, background: 'var(--p-bg)', borderColor: 'rgba(255,255,255,0.08)' }}
      >
        {/* Notch */}
        {isMobile && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20">
            <div className="w-[110px] h-[26px] bg-black rounded-b-2xl flex items-center justify-center">
              <div className="w-[52px] h-[4px] rounded-full bg-gray-800" />
            </div>
          </div>
        )}
        {/* Status bar */}
        {isMobile && (
          <div className="flex items-center justify-between px-6 pt-1 pb-0 text-[9px] font-semibold" style={{ color: 'var(--p-text)' }}>
            <span>9:41</span>
            <div className="flex items-center gap-1 opacity-70"><span>▲▲▲</span><span>▌</span></div>
          </div>
        )}

        {/* Scrollable body */}
        <div className={`overflow-y-auto h-full ${isMobile ? 'pb-16' : ''}`} style={{ scrollbarWidth: 'none' }}>

          {/* Sticky top nav bar */}
          <div
            className="sticky top-0 z-10 flex items-center justify-between px-4 py-2.5"
            style={{
              background: 'var(--p-nav, var(--p-bg))',
              borderBottom: '1px solid var(--p-divider)',
            }}
          >
            <div className="flex items-center gap-2">
              {appIcons.appNameLogo ? (
                <img src={appIcons.appNameLogo} alt="Logo" className="h-7 max-w-[88px] rounded object-contain" />
              ) : appIcons.topLeftAppIcon ? (
                <img src={appIcons.topLeftAppIcon} alt="Icon" className="w-8 h-8 rounded-xl object-cover" />
              ) : (
                <>
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-black"
                    style={{ background: 'linear-gradient(135deg, var(--p-btn), var(--p-btn-grad))', color: 'var(--p-text)' }}
                  >
                    {appLabels.appName.charAt(0)}
                  </div>
                  <span className="font-bold text-sm" style={{ color: 'var(--p-text)' }}>
                    <span>{appLabels.appName.slice(0, -3)}</span>
                    <span style={{ color: 'var(--p-primary)' }}>{appLabels.appName.slice(-3)}</span>
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <div className="p-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <Search className="w-3.5 h-3.5" style={{ color: 'var(--p-muted)' }} />
              </div>
              <div className="relative p-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <Bell className="w-3.5 h-3.5" style={{ color: 'var(--p-muted)' }} />
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full" style={{ background: 'var(--p-live, var(--p-secondary))' }} />
              </div>
              <div
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold"
                style={{
                  background: 'linear-gradient(135deg, var(--p-btn), var(--p-btn-grad))',
                  color: 'var(--p-text)',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
                }}
              >
                <Wallet className="w-3 h-3" />
                <span>{appLabels.currencySymbol}1,250</span>
              </div>
            </div>
          </div>

          {renderContent()}
        </div>

        {/* Mobile bottom nav */}
        {isMobile && (
          <div
            className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-around py-1.5 px-1"
            style={{
              background: 'var(--p-bottom-nav, var(--p-bg))',
              backdropFilter: 'blur(16px)',
              borderTop: '1px solid var(--p-divider)',
            }}
          >
            {navItems.map((item, i) => {
              const Icon = item.icon;
              const isActive = i === activeNavTab;
              return (
                <button key={item.label} className="flex flex-col items-center gap-0.5 min-w-[40px]" onClick={() => setActiveNavTab(i)}>
                  <div
                    className="p-1.5 rounded-xl transition-all"
                    style={{
                      background: isActive ? 'linear-gradient(135deg, var(--p-btn), var(--p-btn-grad))' : 'transparent',
                      boxShadow: isActive ? '0 0 10px rgba(0,0,0,0.4)' : 'none',
                    }}
                  >
                    <Icon className="w-4 h-4" style={{ color: isActive ? 'var(--p-text)' : 'var(--p-muted)' }} />
                  </div>
                  <span className="text-[7.5px] font-semibold" style={{ color: isActive ? 'var(--p-primary)' : 'var(--p-muted)' }}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Web layout: sidebar nav + bet slip */}
        {!isMobile && (
          <>
            <div
              className="absolute bottom-0 left-0 z-10 flex items-center gap-1 px-3 py-2"
              style={{
                background: 'var(--p-bg)',
                backdropFilter: 'blur(16px)',
                borderTop: '1px solid var(--p-divider)',
                width: 'calc(100% - 180px)',
              }}
            >
              {navItems.map((item, i) => {
                const Icon = item.icon;
                const isActive = i === activeNavTab;
                return (
                  <button
                    key={item.label}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all"
                    onClick={() => setActiveNavTab(i)}
                    style={{ background: isActive ? 'var(--p-inactive)' : 'transparent' }}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: isActive ? 'var(--p-primary)' : 'var(--p-muted)' }} />
                    <span className="text-[9px] font-semibold" style={{ color: isActive ? 'var(--p-primary)' : 'var(--p-muted)' }}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Bet slip sidebar */}
            <div
              className="absolute right-0 top-0 w-[180px] h-full border-l p-3 overflow-y-auto"
              style={{
                borderColor: 'var(--p-divider)',
                background: 'var(--p-card, rgba(0,0,0,0.4))',
                backdropFilter: 'blur(8px)',
              }}
            >
              <div className="text-[10px] font-bold mb-3" style={{ color: 'var(--p-text)' }}>Bet Slip</div>
              {[
                { label: 'Arsenal to Win', odds: '1.45' },
                { label: 'Barcelona vs Real — Draw', odds: '3.20' },
              ].map((item) => (
                <div key={item.label} className="rounded-lg p-2 mb-2" style={{ background: 'var(--p-border1)' }}>
                  <div className="text-[8px] mb-0.5" style={{ color: 'var(--p-muted)' }}>{item.label}</div>
                  <div className="text-[11px] font-bold" style={{ color: 'var(--p-primary)' }}>{item.odds}</div>
                </div>
              ))}
              <div className="rounded-lg p-2 mb-3" style={{ background: 'var(--p-border2)' }}>
                <div className="text-[8px] mb-1" style={{ color: 'var(--p-muted)' }}>Stake</div>
                <div className="text-[11px] font-semibold" style={{ color: 'var(--p-text)' }}>{appLabels.currencySymbol}500</div>
              </div>
              <div className="flex justify-between text-[9px] mb-1.5" style={{ color: 'var(--p-muted)' }}>
                <span>Total Odds</span>
                <span className="font-bold" style={{ color: 'var(--p-primary)' }}>4.64</span>
              </div>
              <div className="flex justify-between text-[9px] mb-3" style={{ color: 'var(--p-muted)' }}>
                <span>Potential Win</span>
                <span className="font-bold" style={{ color: 'var(--p-won1)' }}>{appLabels.currencySymbol}2,320</span>
              </div>
              <button
                className="w-full py-2 rounded-xl text-[10px] font-bold"
                style={{
                  background: 'linear-gradient(135deg, var(--p-btn), var(--p-btn-grad))',
                  color: 'var(--p-text)',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
                }}
              >
                Place Bet
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BettingAppPreview;
