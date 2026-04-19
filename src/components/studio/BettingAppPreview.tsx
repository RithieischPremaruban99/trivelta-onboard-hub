import { useState } from 'react';
import { useStudio } from '@/contexts/StudioContext';
import { Bell, Search, Wallet, Home, Trophy, Gamepad2, Compass, User, Flame, Radio, ChevronRight, Shield, Crown, Target, Swords, Star, TrendingUp, Zap, Heart, Play, Gift, Clock, Users, MessageCircle } from 'lucide-react';

/* ─── Static data ─── */
const liveMatches = [
  { id: 1, league: 'Premier League · Matchday 24', time: "67'", home: { name: 'Arsenal', abbr: 'ARS' }, away: { name: 'Chelsea', abbr: 'CHE' }, score: '2 - 1', odds: { home: '1.45', draw: '4.50', away: '6.00' } },
  { id: 2, league: 'La Liga · Matchday 22', time: "52'", home: { name: 'Barcelona', abbr: 'BAR' }, away: { name: 'Real Madrid', abbr: 'RMA' }, score: '1 - 1', odds: { home: '2.30', draw: '3.20', away: '3.10' } },
  { id: 3, league: 'Serie A · Matchday 20', time: "38'", home: { name: 'AC Milan', abbr: 'MIL' }, away: { name: 'Inter Milan', abbr: 'INT' }, score: '1 - 0', odds: { home: '1.90', draw: '3.40', away: '4.00' } },
];
const upcomingMatches = [
  { id: 4, league: 'Champions League', dateLabel: 'TOMORROW', date: '21:00', home: { name: 'Man City', abbr: 'MCI' }, away: { name: 'Bayern', abbr: 'BAY' }, odds: { home: '2.20', draw: '3.40', away: '3.00' } },
  { id: 5, league: 'Champions League', dateLabel: 'TOMORROW', date: '21:00', home: { name: 'PSG', abbr: 'PSG' }, away: { name: 'Juventus', abbr: 'JUV' }, odds: { home: '1.80', draw: '3.60', away: '4.20' } },
];
const teamColors: Record<string, string> = { ARS: '#EF0107', CHE: '#034694', BAR: '#A50044', RMA: '#FEBE10', MIL: '#FB090B', INT: '#010E80', MCI: '#6CABDD', BAY: '#DC052D', PSG: '#004170', JUV: '#000000' };

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
  { user: 'ProPunter', time: '15m ago', text: 'Barcelona vs Real Madrid - backing the draw. Form says it all.', likes: 89, comments: 28, type: 'analysis' },
  { user: 'LuckyAce', time: '1h ago', text: 'Just hit a 5-fold acca! 🎉 +₦45,000', likes: 156, comments: 43, type: 'win' },
];

const discoveryItems = [
  { title: 'Top Tipsters', desc: 'Follow the best', icon: TrendingUp, count: '2.4k tipsters' },
  { title: 'Bet Challenges', desc: 'Compete & win', icon: Swords, count: '12 active' },
  { title: 'Communities', desc: 'Join groups', icon: Users, count: '340 groups' },
  { title: 'Live Streams', desc: 'Watch & bet', icon: Play, count: '8 live now' },
];

const TeamBadge = ({ abbr, color }: { abbr: string; color: string }) => (
  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[8px] font-black tracking-tight border border-white/10 flex-shrink-0" style={{ background: color }}>
    {abbr}
  </div>
);

/* ─── Tab Content Components ─── */

const FeedContent = ({ currencySymbol }: { currencySymbol: string }) => (
  <>
    <div className="px-4 mt-3">
      <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {['Your Story', 'Mike', 'Sarah', 'ProP', 'Lucky'].map((name, i) => (
          <div key={name} className="flex flex-col items-center gap-1 flex-shrink-0">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-[9px] font-bold" style={{
              border: i === 0 ? '2px dashed rgba(255,255,255,0.2)' : '2px solid var(--p-primary)',
              color: 'var(--p-text)', background: i === 0 ? 'transparent' : 'var(--p-border1)'
            }}>
              {i === 0 ? '+' : name[0]}
            </div>
            <span className="text-[8px]" style={{ color: 'var(--p-muted)' }}>{name}</span>
          </div>
        ))}
      </div>
    </div>
    <div className="px-4 mt-3 space-y-2.5">
      {feedPosts.map((post, i) => (
        <div key={i} className="rounded-xl p-3" style={{ background: 'var(--p-border1)', border: '1px solid rgba(255,255,255,0.04)' }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ background: `linear-gradient(135deg, var(--p-primary), var(--p-secondary))`, color: 'var(--p-text)' }}>
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
        {['Arsenal Win', 'Over 2.5', 'BTTS Yes'].map(bet => (
          <div key={bet} className="px-3 py-1.5 rounded-full text-[9px] font-semibold" style={{ background: 'rgba(253,111,39,0.1)', border: '1px solid rgba(253,111,39,0.2)', color: 'var(--p-primary)' }}>
            {bet}
          </div>
        ))}
      </div>
    </div>
  </>
);

const SportsContent = ({ currencySymbol }: { currencySymbol: string }) => (
  <>
    <div className="grid grid-cols-4 gap-1.5 px-4 mt-3">
      {[
        { icon: Flame, label: 'Top Bets', sublabel: 'Popular', glow: true },
        { icon: Gamepad2, label: 'Casino', sublabel: 'Live', glow: false },
        { icon: Radio, label: 'Live', sublabel: 'Now', glow: true },
        { icon: Trophy, label: 'All', sublabel: 'Sports', glow: false },
      ].map((cat) => {
        const Icon = cat.icon;
        return (
          <div key={cat.label} className="flex flex-col items-center gap-1 py-3 px-1.5 rounded-xl border transition-all" style={{
            background: cat.glow ? 'linear-gradient(180deg, rgba(253,111,39,0.12), rgba(0,0,0,0.3))' : 'var(--p-border1)',
            borderColor: cat.glow ? 'rgba(253,111,39,0.25)' : 'rgba(255,255,255,0.05)',
            boxShadow: cat.glow ? '0 0 12px rgba(253,111,39,0.1)' : 'none',
          }}>
            <Icon className="w-4.5 h-4.5" style={{ color: cat.glow ? 'var(--p-primary)' : 'var(--p-muted)', width: 18, height: 18 }} />
            <div className="text-center">
              <p className="text-[9px] font-bold" style={{ color: 'var(--p-text)' }}>{cat.label}</p>
              <p className="text-[8px]" style={{ color: cat.glow ? 'var(--p-primary)' : 'var(--p-muted)' }}>{cat.sublabel}</p>
            </div>
          </div>
        );
      })}
    </div>
    <div className="px-4 mt-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--p-secondary)' }} />
          <span className="text-[11px] font-bold" style={{ color: 'var(--p-secondary)' }}>LIVE</span>
        </div>
        <div className="flex items-center gap-0.5 text-[10px] font-semibold" style={{ color: 'var(--p-primary)' }}>
          All matches <ChevronRight className="w-3 h-3" />
        </div>
      </div>
      <div className="space-y-2">
        {liveMatches.map((match) => (
          <div key={match.id} className="rounded-xl overflow-hidden transition-all" style={{ background: 'linear-gradient(180deg, rgba(253,111,39,0.06), var(--p-bg))', border: '1px solid rgba(253,111,39,0.12)' }}>
            <div className="flex items-center justify-between px-3 py-1.5">
              <span className="text-[9px] font-medium" style={{ color: 'var(--p-muted)' }}>{match.league}</span>
              <div className="flex items-center gap-1">
                <Flame className="w-2.5 h-2.5" style={{ color: 'var(--p-secondary)' }} />
                <span className="text-[9px] font-bold" style={{ color: 'var(--p-secondary)' }}>{match.time}</span>
              </div>
            </div>
            <div className="px-3 pb-1.5">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <TeamBadge abbr={match.home.abbr} color={teamColors[match.home.abbr] || '#444'} />
                  <span className="text-[11px] font-bold" style={{ color: 'var(--p-text)' }}>{match.home.name}</span>
                </div>
                <span className="text-sm font-bold px-2" style={{ color: 'var(--p-primary)' }}>{match.score}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold" style={{ color: 'var(--p-text)' }}>{match.away.name}</span>
                  <TeamBadge abbr={match.away.abbr} color={teamColors[match.away.abbr] || '#444'} />
                </div>
              </div>
              <div className="flex gap-1.5">
                {[{ label: '1', value: match.odds.home }, { label: 'X', value: match.odds.draw }, { label: '2', value: match.odds.away }].map((odd, i) => (
                  <button key={odd.label} className="flex-1 flex flex-col items-center py-1.5 rounded-lg border transition-all" style={{
                    background: i === 0 ? 'rgba(253,111,39,0.12)' : 'var(--p-border1)',
                    borderColor: i === 0 ? 'rgba(253,111,39,0.3)' : 'rgba(255,255,255,0.05)',
                    boxShadow: i === 0 ? '0 0 8px rgba(253,111,39,0.15)' : 'none',
                  }}>
                    <span className="text-[8px]" style={{ color: 'var(--p-muted)' }}>{odd.label}</span>
                    <span className="text-[11px] font-bold" style={{ color: 'var(--p-primary)' }}>{odd.value}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-center py-1 border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              <span className="text-[8px] font-medium" style={{ color: 'var(--p-muted)' }}>+42 markets</span>
            </div>
          </div>
        ))}
      </div>
    </div>
    <div className="px-4 mt-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold" style={{ color: 'var(--p-text)' }}>Upcoming</span>
        <div className="flex items-center gap-0.5 text-[10px] font-semibold" style={{ color: 'var(--p-primary)' }}>
          View all <ChevronRight className="w-3 h-3" />
        </div>
      </div>
      <div className="space-y-2">
        {upcomingMatches.map((match) => (
          <div key={match.id} className="rounded-xl p-3 transition-all" style={{ background: 'var(--p-border1)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-medium" style={{ color: 'var(--p-muted)' }}>{match.league}</span>
              <div className="flex items-center gap-1">
                <span className="text-[8px] px-1.5 py-0.5 rounded font-semibold" style={{ background: 'var(--p-border2)', color: 'var(--p-muted)' }}>{match.dateLabel}</span>
                <span className="text-[9px] font-bold" style={{ color: 'var(--p-text)' }}>{match.date}</span>
              </div>
            </div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <TeamBadge abbr={match.home.abbr} color={teamColors[match.home.abbr] || '#444'} />
                <span className="text-[11px] font-bold" style={{ color: 'var(--p-text)' }}>{match.home.name}</span>
              </div>
              <span className="text-[10px]" style={{ color: 'var(--p-muted)' }}>vs</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold" style={{ color: 'var(--p-text)' }}>{match.away.name}</span>
                <TeamBadge abbr={match.away.abbr} color={teamColors[match.away.abbr] || '#444'} />
              </div>
            </div>
            <div className="flex gap-1.5">
              {[{ label: '1', value: match.odds.home }, { label: 'X', value: match.odds.draw }, { label: '2', value: match.odds.away }].map((odd) => (
                <button key={odd.label} className="flex-1 flex flex-col items-center py-1.5 rounded-lg border transition-all" style={{ background: 'var(--p-border2)', borderColor: 'rgba(255,255,255,0.05)' }}>
                  <span className="text-[8px]" style={{ color: 'var(--p-muted)' }}>{odd.label}</span>
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

const CasinoContent = () => (
  <>
    <div className="px-4 mt-3">
      <div className="rounded-xl p-3 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--p-primary), var(--p-secondary))', boxShadow: '0 0 20px rgba(253,111,39,0.3)' }}>
        <div className="relative z-10">
          <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.7)' }}>Social Casino</span>
          <p className="text-[14px] font-black mt-0.5" style={{ color: 'var(--p-text)' }}>Play & Win Big!</p>
          <p className="text-[9px] mt-1" style={{ color: 'rgba(255,255,255,0.8)' }}>Free coins every day</p>
        </div>
      </div>
    </div>
    <div className="flex gap-2 px-4 mt-3">
      {['All', 'Slots', 'Table', 'Live'].map((cat, i) => (
        <div key={cat} className="px-3 py-1.5 rounded-full text-[9px] font-bold" style={{
          background: i === 0 ? 'linear-gradient(135deg, var(--p-btn), var(--p-btn-grad))' : 'var(--p-border1)',
          color: i === 0 ? 'var(--p-text)' : 'var(--p-muted)',
        }}>
          {cat}
        </div>
      ))}
    </div>
    <div className="grid grid-cols-2 gap-2 px-4 mt-3 mb-4">
      {casinoGames.map((game) => {
        const Icon = game.icon;
        return (
          <div key={game.name} className="rounded-xl p-3 relative" style={{ background: 'var(--p-border1)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <span className="absolute top-2 right-2 text-[7px] px-1.5 py-0.5 rounded-full font-bold" style={{
              background: game.tag === 'HOT' ? 'rgba(239,68,68,0.2)' : game.tag === 'LIVE' ? 'rgba(34,197,94,0.2)' : 'rgba(253,111,39,0.15)',
              color: game.tag === 'HOT' ? '#ef4444' : game.tag === 'LIVE' ? 'var(--p-won1)' : 'var(--p-primary)',
            }}>
              {game.tag}
            </span>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2" style={{ background: 'linear-gradient(135deg, rgba(253,111,39,0.15), rgba(245,131,0,0.05))', border: '1px solid rgba(253,111,39,0.15)' }}>
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

const DiscoveryContent = () => (
  <>
    <div className="px-4 mt-3">
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'var(--p-border1)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <Search className="w-3.5 h-3.5" style={{ color: 'var(--p-muted)' }} />
        <span className="text-[10px]" style={{ color: 'var(--p-muted)' }}>Search tipsters, groups, events...</span>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-2 px-4 mt-3">
      {discoveryItems.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.title} className="rounded-xl p-3" style={{ background: 'var(--p-border1)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-2" style={{ background: 'linear-gradient(135deg, rgba(253,111,39,0.15), rgba(245,131,0,0.05))', border: '1px solid rgba(253,111,39,0.15)' }}>
              <Icon className="w-4.5 h-4.5" style={{ color: 'var(--p-primary)', width: 18, height: 18 }} />
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
          <div key={name} className="flex items-center gap-2 p-2.5 rounded-xl" style={{ background: 'var(--p-border1)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ background: `linear-gradient(135deg, var(--p-primary), var(--p-secondary))`, color: 'var(--p-text)' }}>
              {name[0]}
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold" style={{ color: 'var(--p-text)' }}>{name}</p>
              <p className="text-[8px]" style={{ color: 'var(--p-muted)' }}>{78 - i * 5}% win rate · {1200 + i * 340} followers</p>
            </div>
            <button className="px-2.5 py-1 rounded-full text-[8px] font-bold" style={{ background: 'rgba(253,111,39,0.12)', color: 'var(--p-primary)', border: '1px solid rgba(253,111,39,0.2)' }}>
              Follow
            </button>
          </div>
        ))}
      </div>
    </div>
  </>
);

const ProfileContent = ({ currencySymbol }: { currencySymbol: string }) => (
  <>
    <div className="px-4 mt-3">
      <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--p-border1)', border: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-black" style={{ background: `linear-gradient(135deg, var(--p-primary), var(--p-secondary))`, color: 'var(--p-text)' }}>
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
    <div className="grid grid-cols-3 gap-2 px-4 mt-3">
      {[
        { label: 'Balance', value: `${currencySymbol}1,250` },
        { label: 'Total Bets', value: '342' },
        { label: 'Win Rate', value: '64%' },
      ].map(stat => (
        <div key={stat.label} className="rounded-xl p-3 text-center" style={{ background: 'var(--p-border1)', border: '1px solid rgba(255,255,255,0.04)' }}>
          <p className="text-[12px] font-bold" style={{ color: 'var(--p-primary)' }}>{stat.value}</p>
          <p className="text-[8px] mt-0.5" style={{ color: 'var(--p-muted)' }}>{stat.label}</p>
        </div>
      ))}
    </div>
    <div className="px-4 mt-3 mb-4 space-y-1.5">
      {[
        { icon: Wallet, label: 'Deposit & Withdraw' },
        { icon: Clock, label: 'Betting History' },
        { icon: Star, label: 'Favorites' },
        { icon: Gift, label: 'Bonuses & Rewards' },
        { icon: Shield, label: 'Responsible Gaming' },
        { icon: User, label: 'Account Settings' },
      ].map(item => {
        const Icon = item.icon;
        return (
          <div key={item.label} className="flex items-center gap-2.5 p-2.5 rounded-xl" style={{ background: 'var(--p-border1)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(253,111,39,0.08)' }}>
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

const SharedTopSection = ({ appLabels, appIcons }: any) => (
  <>
    <div className="flex items-center justify-between px-4 mt-3">
      <span className="text-[11px] font-medium" style={{ color: 'var(--p-text)' }}>{appLabels.signIn}</span>
      <button className="px-4 py-1.5 rounded-full text-[10px] font-bold" style={{
        background: 'linear-gradient(135deg, var(--p-btn), var(--p-btn-grad))', color: 'var(--p-text)', boxShadow: '0 0 10px rgba(253,111,39,0.25)',
      }}>
        Create Account
      </button>
    </div>
    <div className="px-4 mt-2">
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{ background: 'rgba(253,111,39,0.08)', border: '1px solid rgba(253,111,39,0.15)' }}>
        <Shield className="w-3 h-3" style={{ color: 'var(--p-primary)' }} />
        <span className="text-[9px] font-semibold" style={{ color: 'var(--p-primary)' }}>18+ | Responsible Gaming</span>
      </div>
    </div>
  </>
);

const GamificationBanner = () => (
  <div className="px-4 mt-3">
    <div className="rounded-xl p-2.5 flex items-center gap-2.5" style={{
      background: 'linear-gradient(135deg, rgba(253,111,39,0.08), rgba(245,131,0,0.04))',
      border: '1px solid rgba(253,111,39,0.2)', boxShadow: '0 0 15px rgba(253,111,39,0.08)',
    }}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, rgba(253,111,39,0.25), rgba(245,131,0,0.12))', border: '1px solid rgba(253,111,39,0.2)' }}>
        <Crown className="w-4 h-4" style={{ color: 'var(--p-primary)' }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold" style={{ color: 'var(--p-text)' }}>Level 12</span>
          <Flame className="w-2.5 h-2.5" style={{ color: 'var(--p-secondary)' }} />
          <span className="text-[9px] font-bold" style={{ color: 'var(--p-secondary)' }}>4-day streak</span>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--p-border1)' }}>
            <div className="h-full rounded-full" style={{ width: '78%', background: 'linear-gradient(to right, var(--p-primary), var(--p-btn-grad))' }} />
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

/* ─── Main Component ─── */
const BettingAppPreview = () => {
  const { themeColors, appLabels, previewMode, headingFont, appIcons } = useStudio();
  const [activeNavTab, setActiveNavTab] = useState(1);

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
    fontFamily: headingFont + ', sans-serif',
  } as React.CSSProperties;

  const navItems = [
    { icon: Home, label: appLabels.feed },
    { icon: Trophy, label: appLabels.sportsbook },
    { icon: Gamepad2, label: appLabels.socialCasino },
    { icon: Compass, label: appLabels.discovery },
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
          <div className="px-4 mt-2">
            <div className="flex items-center justify-center gap-1.5 py-2 rounded-xl" style={{ background: 'rgba(253,111,39,0.05)', border: '1px solid rgba(253,111,39,0.15)' }}>
              <Swords className="w-3.5 h-3.5" style={{ color: 'var(--p-primary)' }} />
              <span className="text-[10px] font-bold" style={{ color: 'var(--p-primary)' }}>Challenge your friends</span>
            </div>
          </div>
          <SportsContent currencySymbol={appLabels.currencySymbol} />
        </>
      );
      case 2: return (
        <>
          <SharedTopSection appLabels={appLabels} appIcons={appIcons} />
          <CasinoContent />
        </>
      );
      case 3: return (
        <>
          <SharedTopSection appLabels={appLabels} appIcons={appIcons} />
          <DiscoveryContent />
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
          isMobile ? 'w-[340px] h-[700px] rounded-[40px] border-[3px]' : 'w-full max-w-[720px] h-[540px] rounded-xl border'
        }`}
        style={{ ...previewVars, background: 'var(--p-bg)', borderColor: 'rgba(255,255,255,0.1)' }}
      >
        {isMobile && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20">
            <div className="w-[120px] h-[28px] bg-black rounded-b-2xl flex items-center justify-center">
              <div className="w-[60px] h-[4px] rounded-full bg-gray-700" />
            </div>
          </div>
        )}
        {isMobile && (
          <div className="flex items-center justify-between px-6 pt-1.5 pb-0.5 text-[9px] font-semibold" style={{ color: 'var(--p-text)' }}>
            <span>9:41</span>
            <div className="flex items-center gap-1"><span>📶</span><span>🔋</span></div>
          </div>
        )}

        <div className={`overflow-y-auto h-full ${isMobile ? 'pb-16' : ''}`} style={{ scrollbarWidth: 'none' }}>
          <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2.5 transition-colors" style={{
            background: 'linear-gradient(180deg, var(--p-bg), rgba(0,0,0,0.95))', borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div className="flex items-center gap-2">
              {appIcons.appNameLogo ? (
                /* Wide logo (1792×1024) — use contain so it isn't cropped */
                <img src={appIcons.appNameLogo} alt="Logo" className="h-7 max-w-[96px] rounded object-contain" style={{ background: 'transparent' }} />
              ) : appIcons.topLeftAppIcon ? (
                /* Square icon (1024×1024) */
                <img src={appIcons.topLeftAppIcon} alt="Icon" className="w-8 h-8 rounded-xl object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black" style={{ background: 'linear-gradient(135deg, var(--p-primary), var(--p-secondary))', color: 'var(--p-text)' }}>
                  {appLabels.appName.charAt(0)}
                </div>
              )}
              <span className="font-bold text-sm" style={{ color: 'var(--p-text)' }}>
                <span>{appLabels.appName.slice(0, -3)}</span>
                <span style={{ color: 'var(--p-primary)' }}>{appLabels.appName.slice(-3)}</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="p-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <Search className="w-3.5 h-3.5" style={{ color: 'var(--p-muted)' }} />
              </div>
              <div className="relative p-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <Bell className="w-3.5 h-3.5" style={{ color: 'var(--p-muted)' }} />
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full" style={{ background: 'var(--p-primary)' }} />
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold" style={{
                background: 'linear-gradient(135deg, var(--p-btn), var(--p-btn-grad))', color: 'var(--p-text)', boxShadow: '0 0 12px rgba(253,111,39,0.3)',
              }}>
                <Wallet className="w-3 h-3" />
                <span>{appLabels.currencySymbol}1,250</span>
              </div>
            </div>
          </div>

          {renderContent()}
        </div>

        {isMobile && (
          <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-around py-2 px-1" style={{
            background: 'rgba(8,8,11,0.95)', backdropFilter: 'blur(16px)', borderTop: '1px solid rgba(255,255,255,0.06)',
          }}>
            {navItems.map((item, i) => {
              const Icon = item.icon;
              const isActive = i === activeNavTab;
              return (
                <button key={item.label} className="flex flex-col items-center gap-0.5" onClick={() => setActiveNavTab(i)}>
                  <div className="p-1.5 rounded-xl transition-all" style={{
                    background: isActive ? 'linear-gradient(135deg, var(--p-btn), var(--p-btn-grad))' : 'transparent',
                    boxShadow: isActive ? '0 0 10px rgba(253,111,39,0.3)' : 'none',
                  }}>
                    <Icon className="w-4 h-4" style={{ color: isActive ? 'var(--p-text)' : 'var(--p-muted)' }} />
                  </div>
                  <span className="text-[8px] font-semibold" style={{ color: isActive ? 'var(--p-primary)' : 'var(--p-muted)' }}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {!isMobile && (
          <>
            <div className="absolute bottom-0 left-0 z-10 flex items-center gap-1 px-3 py-2" style={{
              background: 'rgba(8,8,11,0.95)', backdropFilter: 'blur(16px)', borderTop: '1px solid rgba(255,255,255,0.06)',
              width: 'calc(100% - 180px)',
            }}>
              {navItems.map((item, i) => {
                const Icon = item.icon;
                const isActive = i === activeNavTab;
                return (
                  <button key={item.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all" onClick={() => setActiveNavTab(i)}
                    style={{ background: isActive ? 'rgba(253,111,39,0.12)' : 'transparent' }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: isActive ? 'var(--p-primary)' : 'var(--p-muted)' }} />
                    <span className="text-[9px] font-semibold" style={{ color: isActive ? 'var(--p-primary)' : 'var(--p-muted)' }}>{item.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="absolute right-0 top-0 w-[180px] h-full border-l p-3 overflow-y-auto" style={{
              borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
            }}>
              <div className="text-[10px] font-bold mb-3" style={{ color: 'var(--p-text)' }}>Bet Slip</div>
              <div className="rounded-lg p-2 mb-2" style={{ background: 'var(--p-border1)' }}>
                <div className="text-[8px] mb-0.5" style={{ color: 'var(--p-muted)' }}>Arsenal to Win</div>
                <div className="text-[11px] font-bold" style={{ color: 'var(--p-primary)' }}>1.45</div>
              </div>
              <div className="rounded-lg p-2 mb-2" style={{ background: 'var(--p-border1)' }}>
                <div className="text-[8px] mb-0.5" style={{ color: 'var(--p-muted)' }}>Barcelona vs Real Madrid - Draw</div>
                <div className="text-[11px] font-bold" style={{ color: 'var(--p-primary)' }}>3.20</div>
              </div>
              <div className="rounded-lg p-2 mb-3" style={{ background: 'var(--p-border2)' }}>
                <div className="text-[8px] mb-1" style={{ color: 'var(--p-muted)' }}>Stake</div>
                <div className="text-[11px] font-semibold" style={{ color: 'var(--p-text)' }}>{appLabels.currencySymbol}500</div>
              </div>
              <div className="flex justify-between text-[9px] mb-2" style={{ color: 'var(--p-muted)' }}>
                <span>Total Odds</span>
                <span className="font-bold" style={{ color: 'var(--p-primary)' }}>4.64</span>
              </div>
              <div className="flex justify-between text-[9px] mb-3" style={{ color: 'var(--p-muted)' }}>
                <span>Potential Win</span>
                <span className="font-bold" style={{ color: 'var(--p-won1)' }}>{appLabels.currencySymbol}2,320</span>
              </div>
              <button className="w-full py-2 rounded-xl text-[10px] font-bold transition-all" style={{
                background: 'linear-gradient(135deg, var(--p-btn), var(--p-btn-grad))', color: 'var(--p-text)', boxShadow: '0 0 15px rgba(253,111,39,0.3)',
              }}>
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
