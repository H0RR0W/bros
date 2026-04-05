'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import {
  isAuthenticated,
  apiGetLeaderboard,
  apiGetMyRank,
  leagueToLevel,
  type LeaderboardEntry,
  type MyRank,
} from '@/lib/api';

const LEAGUE_COLORS: Record<string, string> = {
  'Новичок': 'var(--px-gray)',
  'Осведомлённый': 'var(--px-green)',
  'Защитник': 'var(--px-cyan)',
  'Эксперт': 'var(--px-yellow)',
};

const RANK_COLORS = ['var(--px-yellow)', 'var(--px-gray)', '#cd7f32'];

export default function LeaderboardPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<MyRank | null>(null);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(25);

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/'); return; }
    Promise.all([apiGetLeaderboard(limit), apiGetMyRank()])
      .then(([lb, rank]) => { setEntries(lb); setMyRank(rank); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router, limit]);

  return (
    <div className="min-h-screen px-grid-bg flex flex-col" style={{ background: 'var(--px-bg)' }}>
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="px-title" style={{ fontSize: '18px', marginBottom: '8px' }}>
            🏆 <span style={{ color: 'var(--px-yellow)' }}>ТАБЛИЦА</span> ЛИДЕРОВ
          </div>
          <div className="px-text-dim" style={{ fontSize: '9px' }}>
            Рейтинг игроков по набранным очкам
          </div>
        </div>

        {/* My rank card */}
        {myRank && myRank.rank && (
          <div className="px-card mb-6" style={{
            border: '2px solid var(--px-cyan)',
            padding: '16px',
            background: 'rgba(0,229,255,0.05)',
          }}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="px-text-dim" style={{ fontSize: '7px', marginBottom: '4px' }}>ВАШ РЕЙТИНГ</div>
                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '22px', color: 'var(--px-cyan)' }}>
                  #{myRank.rank}
                </div>
              </div>
              <div className="text-center">
                <div className="px-text-dim" style={{ fontSize: '7px', marginBottom: '4px' }}>ОЧКИ</div>
                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '16px', color: 'var(--px-green)' }}>
                  {myRank.total_score}
                </div>
              </div>
              <div className="text-center">
                <div className="px-text-dim" style={{ fontSize: '7px', marginBottom: '4px' }}>ЛИГА</div>
                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '10px', color: LEAGUE_COLORS[myRank.league] ?? 'var(--px-white)' }}>
                  {myRank.league}
                </div>
              </div>
              {myRank.percentile !== null && (
                <div className="text-center">
                  <div className="px-text-dim" style={{ fontSize: '7px', marginBottom: '4px' }}>ТОП</div>
                  <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '14px', color: 'var(--px-yellow)' }}>
                    {myRank.percentile}%
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Table */}
        <div className="px-card" style={{ border: '2px solid var(--px-bg3)', overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '48px 1fr 120px 100px',
            padding: '10px 16px',
            background: 'var(--px-bg3)',
            fontFamily: 'var(--font-pixel)',
            fontSize: '7px',
            color: 'var(--px-gray)',
          }}>
            <span>#</span>
            <span>ИГРОК</span>
            <span style={{ textAlign: 'center' }}>ЛИГА</span>
            <span style={{ textAlign: 'right' }}>ОЧКИ</span>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'var(--font-pixel)', fontSize: '9px', color: 'var(--px-gray)' }}>
              ЗАГРУЗКА...
            </div>
          ) : entries.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'var(--font-pixel)', fontSize: '9px', color: 'var(--px-gray)' }}>
              НЕТ ДАННЫХ
            </div>
          ) : (
            entries.map((entry, i) => {
              const isTop3 = entry.rank <= 3;
              const rankColor = isTop3 ? RANK_COLORS[entry.rank - 1] : 'var(--px-gray)';
              const leagueColor = LEAGUE_COLORS[entry.league] ?? 'var(--px-white)';
              return (
                <div
                  key={entry.user_id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '48px 1fr 120px 100px',
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--px-bg3)',
                    background: isTop3 ? `${rankColor}08` : 'transparent',
                    alignItems: 'center',
                  }}
                >
                  {/* Rank */}
                  <span style={{
                    fontFamily: 'var(--font-pixel)',
                    fontSize: isTop3 ? '12px' : '9px',
                    color: rankColor,
                    textShadow: isTop3 ? `0 0 8px ${rankColor}` : 'none',
                  }}>
                    {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
                  </span>

                  {/* Username + level */}
                  <div className="flex items-center gap-2">
                    <span style={{
                      fontFamily: 'var(--font-pixel)',
                      fontSize: '9px',
                      color: isTop3 ? 'var(--px-white)' : 'var(--px-gray)',
                    }}>
                      {entry.username}
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-pixel)',
                      fontSize: '6px',
                      padding: '2px 5px',
                      border: '1px solid var(--px-bg3)',
                      color: 'var(--px-gray)',
                    }}>
                      LVL {leagueToLevel(entry.league)}
                    </span>
                  </div>

                  {/* League */}
                  <span style={{
                    fontFamily: 'var(--font-pixel)',
                    fontSize: '7px',
                    color: leagueColor,
                    textAlign: 'center',
                  }}>
                    {entry.league}
                  </span>

                  {/* Score */}
                  <span style={{
                    fontFamily: 'var(--font-pixel)',
                    fontSize: '10px',
                    color: 'var(--px-green)',
                    textAlign: 'right',
                  }}>
                    {entry.total_score}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Load more */}
        {!loading && entries.length >= limit && (
          <div className="text-center mt-4">
            <button
              className="px-btn px-btn-outline"
              onClick={() => setLimit(l => l + 25)}
            >
              ЗАГРУЗИТЬ ЕЩЁ
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
