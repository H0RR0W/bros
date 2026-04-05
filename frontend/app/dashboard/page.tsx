'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import HPBar, { XPBar } from '@/components/HPBar';
import WelcomeModal from '@/components/WelcomeModal';
import { ATTACK_NAMES } from '@/lib/scenarios';
import {
  apiGetMe,
  apiGetStats,
  apiGetHistory,
  apiLogout,
  leagueToLevel,
  isAuthenticated,
  type UserMe,
  type UserStats,
  type SessionHistoryItem,
} from '@/lib/api';

const LOCATION_NAMES: Record<string, string> = {
  office: 'ОПЕРАЦИЯ ОФИС',
  home: 'ОПЕРАЦИЯ ДОМ',
  wifi: 'ОПЕРАЦИЯ WI-FI',
};

const RANKS = ['НОВОБРАНЕЦ', 'СТАЖЁР', 'БОЕЦ', 'АГЕНТ', 'ДЕТЕКТИВ', 'ИНСПЕКТОР', 'СТРАЖ', 'КОМАНДОР', 'МАСТЕР', 'ЭКСПЕРТ', 'ЛЕГЕНДА'];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserMe | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [history, setHistory] = useState<SessionHistoryItem[]>([]);

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/'); return; }

    Promise.all([apiGetMe(), apiGetStats(), apiGetHistory()])
      .then(([me, st, hist]) => {
        setUser(me);
        setStats(st);
        setHistory(hist.sessions.slice(0, 3));
      })
      .catch(() => { apiLogout(); router.push('/'); });
  }, [router]);

  if (!user) {
    return (
      <div className="min-h-screen px-grid-bg flex items-center justify-center" style={{ background: 'var(--px-bg)' }}>
        <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '10px', color: 'var(--px-green)' }}>
          <span className="animate-blink">■</span> ЗАГРУЗКА...
        </div>
      </div>
    );
  }

  const level = leagueToLevel(user.league);
  const nextRank = RANKS[level] ?? 'ЛЕГЕНДА';
  const xpToNext = level * 300;
  const accuracy = stats?.accuracy_percent ?? 0;

  // Progression state
  const isAgent = user.league !== 'Новичок'; // score >= 300
  const homeCompleted = history.some(s => s.location === 'home');

  const attackStats = stats
    ? Object.entries(stats.attacks_by_type).map(([type, total]) => ({ type, total }))
    : [];

  return (
    <div className="min-h-screen px-grid-bg" style={{ background: 'var(--px-bg)' }}>
      <WelcomeModal />
      <Navbar hp={user.hp} xp={user.total_score} level={level} username={user.username} />

      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-6">

        {/* ── TOP ROW ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Player card */}
          <div className="lg:col-span-1 px-card px-border" style={{ padding: '24px' }}>
            <div className="flex items-start gap-4 mb-6">
              <div style={{
                width: '64px', height: '64px',
                border: '3px solid var(--px-green)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '28px', flexShrink: 0,
                boxShadow: '0 0 12px rgba(0,255,65,0.4)',
              }}>🕵️</div>
              <div>
                <div className="px-title" style={{ fontSize: '12px', marginBottom: '4px' }}>{user.username.toUpperCase()}</div>
                <div className="px-badge px-badge-yellow" style={{ marginBottom: '6px' }}>{user.league.toUpperCase()}</div>
                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-gray)' }}>
                  СЛЕД. РАНГ: {nextRank}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <HPBar current={user.hp} max={100} label="БЕЗОПАСНОСТЬ" size="md" />
              <XPBar current={user.total_score % xpToNext} max={xpToNext} level={level} />
            </div>

            <hr className="px-divider-green my-4" />

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'СЕССИЙ', value: stats?.total_sessions ?? 0 },
                { label: 'ТОЧНОСТЬ', value: `${accuracy}%` },
                { label: 'ОТВЕТОВ', value: stats?.total_correct ?? 0 },
                { label: 'ОЧКОВ', value: user.total_score },
              ].map(({ label, value }) => (
                <div key={label} className="px-card" style={{ padding: '10px', textAlign: 'center' }}>
                  <div className="px-subtitle" style={{ fontSize: '14px', marginBottom: '4px' }}>{value}</div>
                  <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '7px', color: 'var(--px-gray)' }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Certificate block */}
            <div style={{
              marginTop: '16px',
              padding: '14px',
              border: `2px ${homeCompleted ? 'solid' : 'dashed'} ${homeCompleted ? 'var(--px-yellow)' : 'var(--px-gray)'}`,
              background: homeCompleted ? 'rgba(255,230,0,0.04)' : 'transparent',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '22px', marginBottom: '6px' }}>
                {homeCompleted ? '🏆' : '🔒'}
              </div>
              <div style={{
                fontFamily: 'var(--font-pixel)', fontSize: '8px',
                color: homeCompleted ? 'var(--px-yellow)' : 'var(--px-gray)',
                marginBottom: homeCompleted ? '10px' : '4px',
              }}>
                {homeCompleted ? 'СЕРТИФИКАТ ДОСТУПЕН' : 'СЕРТИФИКАТ ЗАБЛОКИРОВАН'}
              </div>
              {homeCompleted ? (
                <Link href="/certificate" style={{ textDecoration: 'none' }}>
                  <button className="px-btn" style={{
                    width: '100%', fontSize: '8px',
                    background: 'var(--px-yellow)', color: 'var(--px-bg)',
                  }}>
                    📄 СКАЧАТЬ PDF
                  </button>
                </Link>
              ) : (
                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '7px', color: 'var(--px-gray)' }}>
                  Пройди уровень ДОМ для разблокировки
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="lg:col-span-2 flex flex-col gap-4">

            {/* Progress path */}
            <div className="px-card px-border-cyan" style={{
              padding: '20px',
              background: 'linear-gradient(135deg, var(--px-bg2), rgba(0,229,255,0.05))',
            }}>
              <div className="px-subtitle" style={{ fontSize: '10px', marginBottom: '16px' }}>
                ▶ ПУТЬ ОБУЧЕНИЯ
              </div>
              <div className="flex flex-col gap-3">
                {/* Step 1: Office */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', border: '2px solid var(--px-cyan)', background: 'rgba(0,229,255,0.05)' }}>
                  <span style={{ fontSize: '20px' }}>🏢</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '9px', color: 'var(--px-cyan)', marginBottom: '2px' }}>УРОВЕНЬ 1 — ОФИС</div>
                    <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '7px', color: 'var(--px-gray)' }}>Всегда доступен • Набери 300 очков для разблокировки ДОМа</div>
                  </div>
                  <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-green)' }}>✓ ОТКРЫТ</span>
                </div>

                {/* Step 2: Home */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', border: `2px solid ${isAgent ? 'var(--px-green)' : 'var(--px-bg3)'}`, background: isAgent ? 'rgba(0,255,65,0.03)' : 'transparent' }}>
                  <span style={{ fontSize: '20px', filter: isAgent ? 'none' : 'grayscale(1)' }}>🏠</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '9px', color: isAgent ? 'var(--px-green)' : 'var(--px-gray)', marginBottom: '2px' }}>УРОВЕНЬ 2 — ДОМ</div>
                    <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '7px', color: 'var(--px-gray)' }}>
                      {isAgent ? 'Открыт — пройди для получения сертификата' : `Требуется ранг ОСВЕДОМЛЁННЫЙ (ещё ${300 - user.total_score} очков)`}
                    </div>
                  </div>
                  <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: isAgent ? 'var(--px-green)' : 'var(--px-red)' }}>
                    {isAgent ? '✓ ОТКРЫТ' : '🔒 ЗАКРЫТ'}
                  </span>
                </div>

                {/* Step 3: WiFi */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', border: `2px solid ${homeCompleted ? 'var(--px-yellow)' : 'var(--px-bg3)'}`, background: homeCompleted ? 'rgba(255,230,0,0.03)' : 'transparent' }}>
                  <span style={{ fontSize: '20px', filter: homeCompleted ? 'none' : 'grayscale(1)' }}>📶</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '9px', color: homeCompleted ? 'var(--px-yellow)' : 'var(--px-gray)', marginBottom: '2px' }}>УРОВЕНЬ 3 — WI-FI</div>
                    <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '7px', color: 'var(--px-gray)' }}>
                      {homeCompleted ? 'Открыт — финальное испытание' : 'Требуется прохождение уровня ДОМ'}
                    </div>
                  </div>
                  <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: homeCompleted ? 'var(--px-yellow)' : 'var(--px-red)' }}>
                    {homeCompleted ? '✓ ОТКРЫТ' : '🔒 ЗАКРЫТ'}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 flex-wrap mt-4">
                <Link href="/play/1" className="px-btn px-btn-cyan" style={{ textDecoration: 'none', display: 'inline-block' }}>
                  ▶ НАЧАТЬ
                </Link>
                <Link href="/missions" className="px-btn px-btn-outline" style={{ textDecoration: 'none', display: 'inline-block' }}>
                  ВСЕ МИССИИ
                </Link>
                <Link href="/play/ai" style={{ textDecoration: 'none', display: 'inline-block' }}>
                  <button style={{
                    fontFamily: 'var(--font-pixel)', fontSize: '8px', padding: '8px 14px',
                    background: 'rgba(0,229,255,0.1)', color: 'var(--px-cyan)',
                    border: '2px solid var(--px-cyan)', cursor: 'pointer',
                  }}>
                    ⚡ AI-РЕЖИМ
                  </button>
                </Link>
              </div>
            </div>

            {/* Attack stats */}
            {attackStats.length > 0 && (
              <div className="px-card" style={{ padding: '20px' }}>
                <div className="px-subtitle" style={{ fontSize: '9px', marginBottom: '16px' }}>
                  📊 ВСТРЕЧЕННЫЕ ТИПЫ АТАК
                </div>
                <div className="flex flex-col gap-3">
                  {attackStats.map(({ type, total }) => (
                    <div key={type}>
                      <div className="flex justify-between mb-1">
                        <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-white)' }}>
                          {ATTACK_NAMES[type as keyof typeof ATTACK_NAMES] ?? type}
                        </span>
                        <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-cyan)' }}>
                          {total} раз
                        </span>
                      </div>
                      <div className="hp-bar-track" style={{ height: '10px' }}>
                        <div className="hp-bar-fill" style={{
                          width: `${Math.min(100, total * 10)}%`,
                          background: 'repeating-linear-gradient(90deg, var(--px-cyan) 0px, var(--px-cyan) 8px, #007799 8px, #007799 10px)',
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent activity */}
            <div className="px-card" style={{ padding: '20px' }}>
              <div className="px-subtitle" style={{ fontSize: '9px', marginBottom: '16px' }}>
                🕐 ПОСЛЕДНЯЯ АКТИВНОСТЬ
              </div>
              {history.length === 0 ? (
                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-gray)', textAlign: 'center', padding: '20px' }}>
                  Нет завершённых сессий
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {history.map((a) => (
                    <div key={a.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 12px', gap: '8px',
                      background: 'var(--px-bg)',
                      border: `2px solid ${a.accuracy >= 70 ? 'var(--px-bg3)' : 'rgba(255,230,0,0.2)'}`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                        <span style={{ fontSize: '14px' }}>{a.accuracy >= 70 ? '✅' : '⚠️'}</span>
                        <div>
                          <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-white)' }}>
                            {LOCATION_NAMES[a.location] ?? a.location.toUpperCase()}
                          </div>
                          <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '7px', color: 'var(--px-gray)', marginTop: '2px' }}>
                            {a.date} • {a.correct_count}/{a.scenarios_count} ВЕРНО
                          </div>
                        </div>
                      </div>
                      <div style={{
                        fontFamily: 'var(--font-pixel)', fontSize: '11px',
                        color: a.accuracy >= 70 ? 'var(--px-green)' : 'var(--px-yellow)',
                        textShadow: `0 0 6px ${a.accuracy >= 70 ? 'var(--px-green)' : 'var(--px-yellow)'}`,
                      }}>
                        {a.score}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Tips ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: '🔍', title: 'ПРОВЕРЯЙ ДОМЕНЫ', tip: 'Всегда читай адрес справа налево. corp-bank.ru ≠ corp-bank.ru.evil.com' },
            { icon: '📞', title: 'ПЕРЕЗВАНИВАЙ САМ', tip: 'Получил подозрительный звонок? Повесь трубку. Найди номер банка на карте.' },
            { icon: '🔐', title: 'ВКЛЮЧИ 2FA', tip: 'Двухфакторная аутентификация блокирует 99% атак даже при утечке пароля.' },
          ].map(({ icon, title, tip }) => (
            <div key={title} className="px-card" style={{ padding: '16px', borderTop: '3px solid var(--px-green)' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>{icon}</div>
              <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-green)', marginBottom: '8px' }}>{title}</div>
              <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '7px', color: 'var(--px-gray)', lineHeight: '2' }}>{tip}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
