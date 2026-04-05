'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { ALL_MISSIONS, ATTACK_NAMES, DIFFICULTY_LABELS, DIFFICULTY_COLORS, type Mission } from '@/lib/scenarios';
import { isAuthenticated, apiGetMe, apiGetHistory, type UserMe, type SessionHistoryItem } from '@/lib/api';

const ENV_ICONS: Record<string, string> = { office: '🏢', home: '🏠', wifi: '📶' };
const ENV_COLORS: Record<string, string> = {
  office: 'var(--px-cyan)',
  home: 'var(--px-green)',
  wifi: 'var(--px-yellow)',
};

function getLockReason(env: string, isAgent: boolean, homeCompleted: boolean): string | null {
  if (env === 'office') return null;
  if (env === 'home') return isAgent ? null : 'Требуется ранг ОСВЕДОМЛЁННЫЙ (300 очков)';
  if (env === 'wifi') return homeCompleted ? null : 'Требуется прохождение уровня ДОМ';
  return null;
}

function MissionCard({ mission, index, isAgent, homeCompleted }: {
  mission: Mission;
  index: number;
  isAgent: boolean;
  homeCompleted: boolean;
}) {
  const lockReason = getLockReason(mission.env, isAgent, homeCompleted);
  const isLocked = !!lockReason;
  const envColor = ENV_COLORS[mission.env];

  return (
    <div style={{
      background: 'var(--px-bg2)',
      border: `3px solid ${isLocked ? 'var(--px-bg3)' : envColor}`,
      boxShadow: isLocked ? 'none' : `0 0 20px ${envColor}22`,
      opacity: isLocked ? 0.65 : 1,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Index badge */}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        background: isLocked ? 'var(--px-bg3)' : envColor,
        padding: '4px 10px',
        fontFamily: 'var(--font-pixel)', fontSize: '10px',
        color: isLocked ? 'var(--px-gray)' : 'var(--px-bg)',
      }}>
        {String(index + 1).padStart(2, '0')}
      </div>

      {/* Lock overlay */}
      {isLocked && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 2,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.55)', gap: '8px',
        }}>
          <span style={{ fontSize: '36px', filter: 'grayscale(1)' }}>🔒</span>
          <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-gray)', textAlign: 'center', padding: '0 20px' }}>
            {lockReason}
          </span>
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '20px 20px 12px', borderBottom: `2px solid ${isLocked ? 'var(--px-bg3)' : envColor}33` }}>
        <div className="flex items-start gap-3">
          <span style={{ fontSize: '32px', filter: isLocked ? 'grayscale(1)' : 'none' }}>
            {ENV_ICONS[mission.env]}
          </span>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: 'var(--font-pixel)', fontSize: '11px',
              color: isLocked ? 'var(--px-gray)' : envColor,
              marginBottom: '4px',
              textShadow: isLocked ? 'none' : `0 0 8px ${envColor}`,
            }}>
              {mission.title}
            </div>
            <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-gray)' }}>
              {mission.subtitle}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '16px 20px' }}>
        <p style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-white)', lineHeight: '2', marginBottom: '16px' }}>
          {mission.description}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
          {mission.attackTypes.map(type => (
            <span key={type} className="px-badge px-badge-gray" style={{ fontSize: '7px' }}>
              ⚡ {ATTACK_NAMES[type]}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between mb-4">
          <span className={`px-badge ${DIFFICULTY_COLORS[mission.difficulty]}`}>
            {DIFFICULTY_LABELS[mission.difficulty]}
          </span>
          <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-gray)' }}>
            {mission.steps.length} ШАГОВ • {mission.completedBy}% ПРОШЛИ
          </span>
        </div>

        {!isLocked && (
          <Link href={`/play/${mission.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
            <button className="px-btn" style={{
              width: '100%',
              background: envColor,
              color: 'var(--px-bg)',
              boxShadow: `4px 4px 0px ${envColor}88`,
              fontSize: '10px',
            }}>
              ▶ НАЧАТЬ МИССИЮ
            </button>
          </Link>
        )}
      </div>
    </div>
  );
}

export default function MissionsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserMe | null>(null);
  const [history, setHistory] = useState<SessionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/'); return; }
    Promise.all([apiGetMe(), apiGetHistory()])
      .then(([me, hist]) => { setUser(me); setHistory(hist.sessions); })
      .catch(() => { router.push('/'); })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen px-grid-bg flex items-center justify-center" style={{ background: 'var(--px-bg)' }}>
        <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '10px', color: 'var(--px-green)' }}>ЗАГРУЗКА...</div>
      </div>
    );
  }

  const isAgent = user ? user.league !== 'Новичок' : false;
  const homeCompleted = history.some(s => s.location === 'home');

  return (
    <div className="min-h-screen px-grid-bg" style={{ background: 'var(--px-bg)' }}>
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="px-title" style={{ fontSize: '16px', marginBottom: '8px' }}>ВЫБОР МИССИИ</h1>
            <p style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-gray)', lineHeight: '2' }}>
              3 окружения • 15 сценариев • 5 типов атак
            </p>
          </div>

          {/* Progression status */}
          <div className="hidden md:flex gap-3">
            {[
              { env: 'office', label: 'ОФИС', unlocked: true },
              { env: 'home', label: 'ДОМ', unlocked: isAgent },
              { env: 'wifi', label: 'WI-FI', unlocked: homeCompleted },
            ].map(({ env, label, unlocked }) => (
              <div key={env} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                padding: '10px 14px',
                background: 'var(--px-bg2)',
                border: `2px solid ${unlocked ? ENV_COLORS[env] : 'var(--px-bg3)'}`,
                opacity: unlocked ? 1 : 0.5,
              }}>
                <span style={{ fontSize: '18px', filter: unlocked ? 'none' : 'grayscale(1)' }}>{ENV_ICONS[env]}</span>
                <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '7px', color: unlocked ? ENV_COLORS[env] : 'var(--px-gray)' }}>{label}</span>
                <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: unlocked ? 'var(--px-green)' : 'var(--px-red)' }}>
                  {unlocked ? 'ОТКРЫТ' : 'ЗАКРЫТ'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Progress hint */}
        {!isAgent && (
          <div style={{
            marginBottom: '20px', padding: '12px 16px',
            border: '2px solid var(--px-yellow)', background: 'rgba(255,230,0,0.04)',
            fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-yellow)',
          }}>
            ⚡ Для разблокировки уровня ДОМ наберите 300 очков на уровне ОФИС (текущий результат: {user?.total_score ?? 0} / 300)
          </div>
        )}
        {isAgent && !homeCompleted && (
          <div style={{
            marginBottom: '20px', padding: '12px 16px',
            border: '2px solid var(--px-green)', background: 'rgba(0,255,65,0.04)',
            fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-green)',
          }}>
            ✓ Ранг ОСВЕДОМЛЁННЫЙ достигнут! Уровень ДОМ разблокирован. Пройдите его для получения сертификата и открытия WI-FI.
          </div>
        )}
        {homeCompleted && (
          <div style={{
            marginBottom: '20px', padding: '12px 16px',
            border: '2px solid var(--px-cyan)', background: 'rgba(0,229,255,0.04)',
            fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-cyan)',
          }}>
            🏆 Уровень ДОМ пройден! Сертификат доступен в <a href="/dashboard" style={{ color: 'var(--px-yellow)' }}>базе</a>. Уровень WI-FI разблокирован.
          </div>
        )}

        {/* Mission grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {ALL_MISSIONS.map((mission, i) => (
            <MissionCard
              key={mission.id}
              mission={mission}
              index={i}
              isAgent={isAgent}
              homeCompleted={homeCompleted}
            />
          ))}
        </div>

        {/* ── AI ZONE ── */}
        <div style={{
          border: '3px solid var(--px-cyan)',
          background: 'linear-gradient(135deg, var(--px-bg2), rgba(0,229,255,0.04))',
          boxShadow: '0 0 30px rgba(0,229,255,0.12), inset 0 0 40px rgba(0,229,255,0.03)',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Animated grid */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.04, pointerEvents: 'none',
            backgroundImage: 'linear-gradient(var(--px-cyan) 1px, transparent 1px), linear-gradient(90deg, var(--px-cyan) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }} />

          <div style={{ position: 'relative', padding: '28px 32px' }}>
            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div style={{
                    padding: '4px 12px',
                    border: '2px solid var(--px-cyan)',
                    background: 'rgba(0,229,255,0.12)',
                    fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-cyan)',
                    letterSpacing: '2px',
                  }}>
                    ⚡ MISTRAL AI
                  </div>
                  <div style={{
                    padding: '4px 10px',
                    border: '2px solid var(--px-green)',
                    background: 'rgba(0,255,65,0.08)',
                    fontFamily: 'var(--font-pixel)', fontSize: '7px', color: 'var(--px-green)',
                  }}>
                    КИЛЛЕР-ФИЧА
                  </div>
                </div>
                <div style={{
                  fontFamily: 'var(--font-pixel)', fontSize: '16px',
                  color: 'var(--px-cyan)',
                  textShadow: '0 0 16px rgba(0,229,255,0.5)',
                  letterSpacing: '3px', marginBottom: '8px',
                }}>
                  РЕЖИМ AI
                </div>
                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-gray)', lineHeight: '2', maxWidth: '500px' }}>
                  Каждый сценарий генерируется нейросетью в реальном времени.
                  Никаких повторений — каждая сессия уникальна.
                  5 случайных типов атак из 12 возможных.
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-3 flex-wrap">
                {[
                  { label: 'ТИПОВ АТАК', value: '12' },
                  { label: 'ШАГОВ', value: '5' },
                  { label: 'ПОВТОРЕНИЙ', value: '0' },
                ].map(({ label, value }) => (
                  <div key={label} style={{
                    textAlign: 'center', padding: '10px 14px',
                    border: '2px solid rgba(0,229,255,0.3)',
                    background: 'rgba(0,229,255,0.05)',
                  }}>
                    <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '18px', color: 'var(--px-cyan)', marginBottom: '4px' }}>{value}</div>
                    <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '6px', color: 'var(--px-gray)' }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature list */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              {[
                { icon: '🧠', title: 'ЖИВАЯ ГЕНЕРАЦИЯ', desc: 'Mistral создаёт сценарий прямо во время игры' },
                { icon: '🎲', title: 'СЛУЧАЙНЫЕ УГРОЗЫ', desc: 'Фишинг, BEC, Evil Twin, Дипфейк — никогда не знаешь что будет' },
                { icon: '🔐', title: 'CWE + OWASP', desc: 'Каждый сценарий привязан к реальным CVE-идентификаторам' },
              ].map(({ icon, title, desc }) => (
                <div key={title} style={{
                  display: 'flex', gap: '10px', padding: '14px',
                  border: '2px solid rgba(0,229,255,0.2)',
                  background: 'rgba(0,0,0,0.2)',
                }}>
                  <span style={{ fontSize: '20px', flexShrink: 0 }}>{icon}</span>
                  <div>
                    <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '8px', color: 'var(--px-cyan)', marginBottom: '4px' }}>{title}</div>
                    <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '7px', color: 'var(--px-gray)', lineHeight: '1.8' }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <Link href="/play/ai" style={{ textDecoration: 'none', display: 'inline-block' }}>
              <button style={{
                fontFamily: 'var(--font-pixel)', fontSize: '11px',
                padding: '14px 32px',
                background: 'var(--px-cyan)', color: 'var(--px-bg)',
                border: 'none', cursor: 'pointer',
                boxShadow: '4px 4px 0px rgba(0,229,255,0.4), 0 0 20px rgba(0,229,255,0.3)',
                letterSpacing: '2px',
              }}>
                ⚡ ЗАПУСТИТЬ AI-РЕЖИМ
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
